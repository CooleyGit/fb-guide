import type {
  Caption,
  CoachViewOverlay,
  DerivedPath,
  DerivedPlayer,
  DerivedZone,
  Finish,
  Hotspot,
  Keyframe,
  Point,
  RunDirection,
  Scenario,
  ScenarioContent,
  Selection,
} from "../types";
import { CALLS, OUTCOME_GUIDE, OUTCOME_NOTES } from "./calls";
import { FORMATIONS, buildOffense } from "./formations";
import { SIDES } from "./sides";
import { X, Y, sideToCenter, sideToSsSign, ssSideLabel } from "./geometry";

// Timeline phase boundaries (normalized 0..1). The snap is quick: the ball
// moves almost immediately after Play, then the read and reaction develop.
export const SNAP_T = 0.08;
export const READ_T = 0.4;

// Motion milestones inside the react phase.
const MESH = 0.2;
const HOLE = 0.42;
const BOUNCE = 0.62;
const CAUGHT = 0.86;
const FINISH_FROM = 0.82;

interface SSAlign {
  x: number;
  y: number;
  leverage: string;
}

type TP = [number, number, number]; // [t, x, y]

/** Build keyframes from [t,x,y] tuples (times must be ascending). */
function track(...tps: TP[]): Keyframe[] {
  return tps.map(([t, x, y]) => ({ t, x, y }));
}

/** Hold a player at its start through the snap, then move through the tuples. */
function fromAlign(start: Point, ...tps: TP[]): Keyframe[] {
  return [
    { t: 0, x: start.x, y: start.y },
    { t: SNAP_T, x: start.x, y: start.y },
    ...tps.map(([t, x, y]) => ({ t, x, y })),
  ];
}

/** Drop consecutive duplicate points for a clean drawn line. */
function pathPoints(frames: Keyframe[]): Point[] {
  const pts: Point[] = [];
  for (const f of frames) {
    const prev = pts[pts.length - 1];
    if (!prev || Math.abs(prev.x - f.x) > 0.01 || Math.abs(prev.y - f.y) > 0.01) {
      pts.push({ x: f.x, y: f.y });
    }
  }
  return pts;
}

export function isTEFormation(formation: Selection["formation"]): boolean {
  return (
    formation === "pro" ||
    formation === "double" ||
    formation === "i" ||
    formation === "offset-i"
  );
}

function balancedSurface(formation: Selection["formation"]): boolean {
  return formation === "twins" || formation === "double" || formation === "pistol";
}

/** No. 2 receiver id on the strong side for this formation. */
function strongNo2Id(formation: Selection["formation"]): string {
  if (isTEFormation(formation)) return "te-s";
  if (formation === "twins" || formation === "pistol") return "slot-s";
  return "slot-s1"; // trips, empty
}

function ssAlignment(
  call: Selection["call"],
  formation: Selection["formation"],
  c: number,
  sign: 1 | -1,
): SSAlign {
  const te = isTEFormation(formation);
  if (call === "Man") {
    if (te) {
      // Outside the attached TE (TE at c±12), separated from the DE (c±9).
      return { x: c + sign * 18, y: Y.lb, leverage: "outside leverage on the tight end" };
    }
    // Over No. 2, slot leverage can differ; align just inside the slot.
    const no2 = formation === "twins" || formation === "pistol" ? 20 : 25;
    return { x: c + sign * (no2 - 2), y: Y.ws, leverage: "matched over No. 2" };
  }
  if (call === "Zone") {
    return { x: c + sign * 21, y: Y.ws + 1, leverage: "curl/flat depth" };
  }
  if (call === "Blitz") {
    return { x: c + sign * 18, y: Y.dl, leverage: "edge-rush alignment" };
  }
  // Power: force player on the strong edge, downhill ready.
  return { x: c + sign * 17, y: Y.dl - 1, leverage: "force leverage on the edge" };
}

interface Motion {
  paths: DerivedPath[];
  zone?: DerivedZone;
  ballKeyframes: Keyframe[];
  ballFlightFrom?: number;
  playerKeyframes: Record<string, Keyframe[]>;
  coachView: CoachViewOverlay;
  captions: Caption[];
  finish?: Finish;
}

function curlFlatZone(align: SSAlign, sign: 1 | -1): DerivedZone {
  const lo = sign > 0 ? align.x - 6 : 5;
  const hi = sign > 0 ? 95 : align.x + 6;
  return {
    x: lo,
    y: 26,
    w: hi - lo,
    h: 15,
    label: "CURL / FLAT",
    labelAt: { x: (lo + hi) / 2, y: 23 },
  };
}

function buildMotion(
  selection: Selection,
  c: number,
  sign: 1 | -1,
  align: SSAlign,
  offense: DerivedPlayer[],
  keyId: string,
  runDirection: RunDirection,
): Motion {
  const { call, outcome, formation } = selection;
  const paths: DerivedPath[] = [];
  const playerKeyframes: Record<string, Keyframe[]> = {};
  const captions: Caption[] = [];
  const coachView: CoachViewOverlay = {};

  const byId = (id: string) => offense.find((p) => p.id === id);
  const qb = byId("qb")!;
  const rb = byId("rb");
  const key = byId(keyId)!;
  const isTE = isTEFormation(formation);
  const strongDEId = sign > 0 ? "de-r" : "de-l";
  const strongDE: Point = { x: c + sign * 9, y: Y.dl };
  const align2: Point = { x: align.x, y: align.y };
  const meshPoint: Point = { x: c + sign * 2, y: qb.y - 2 };

  // d = lateral direction the ball carrier actually goes (+ toward SS = strong).
  const d: 1 | -1 = runDirection === "strong" ? sign : ((-sign) as 1 | -1);

  const setSS = (frames: Keyframe[], label?: string, labelAt?: Point) => {
    playerKeyframes["ss"] = frames;
    const pts = pathPoints(frames);
    paths.push({
      id: "ss-path",
      kind: "ss",
      points: pts,
      phase: "react",
      label: label ? { text: label, at: labelAt ?? pts[pts.length - 1]! } : undefined,
      revealsAnswer: true,
    });
  };

  const addAssign = (id: string, frames: Keyframe[], label?: string, labelAt?: Point) => {
    playerKeyframes[id] = frames;
    const pts = pathPoints(frames);
    paths.push({
      id: `${id}-path`,
      kind: "assignment",
      points: pts,
      phase: "react",
      label: label ? { text: label, at: labelAt ?? pts[Math.floor(pts.length / 2)]! } : undefined,
      revealsAnswer: true,
    });
  };

  let ballKeyframes: Keyframe[] = track([0, c, Y.los], [SNAP_T, qb.x, qb.y], [1, meshPoint.x, meshPoint.y]);
  let ballFlightFrom: number | undefined;
  let finish: Finish | undefined;

  const base = (text: string): Caption => ({ phase: "before", text });
  const beforeCap =
    call === "Power"
      ? "You have the force. Set the edge."
      : call === "Blitz"
        ? "You are the outside rush—the end goes inside."
        : call === "Zone"
          ? "You have curl/flat. Read the release."
          : isTE
            ? "You have the tight end—outside leverage."
            : "You have No. 2 in man.";

  // Strong-side contain help (Power) / interior crash (Blitz).
  const addPowerContain = () => {
    addAssign(strongDEId, fromAlign(strongDE, [0.6, c + sign * 12, Y.ol]), "Spill", { x: c + sign * 9, y: 57 });
    addAssign("fs", fromAlign({ x: c, y: Y.fs }, [0.7, c + sign * 8, Y.lb - 1]), "Alley", { x: c + sign * 4, y: 25 });
    coachView.forceEdge = {
      from: { x: c + sign * 11, y: Y.los },
      to: { x: c + sign * 20, y: Y.los },
      label: "Force edge",
    };
  };
  const addBlitzInside = () => {
    addAssign(strongDEId, fromAlign(strongDE, [0.55, c + sign * 8, Y.ol]), "End inside", { x: c + sign * 6, y: 40 });
    coachView.forceEdge = {
      from: { x: c + sign * 11, y: Y.los },
      to: { x: c + sign * 5, y: qb.y - 1 },
      label: "Rush lane",
    };
  };

  // ----- carrier-driven outcomes: run, and Power/Blitz QB keepers ----------
  const carrierOutcome = outcome === "run" || (outcome === "qb" && (call === "Power" || call === "Blitz"));

  if (carrierOutcome) {
    const carrierIsQB = outcome === "qb" || !rb; // empty run => QB draw
    const carrier = carrierIsQB ? qb : rb!;
    const carrierId = carrierIsQB ? "qb" : "rb";
    const start: Point = { x: carrier.x, y: carrier.y };
    const hole: Point = { x: c + d * 5, y: Y.los + 2 };
    const bounce: Point = { x: c + d * 12, y: Y.los - 0.5 };
    const caught: Point =
      d === sign ? { x: c + d * 15, y: Y.los - 2 } : { x: c + d * 16, y: Y.los - 4 };

    const handoff = !carrierIsQB;
    const carrierFrames = handoff
      ? fromAlign(start, [MESH, meshPoint.x, meshPoint.y], [HOLE, hole.x, hole.y], [BOUNCE, bounce.x, bounce.y], [CAUGHT, caught.x, caught.y], [1, caught.x, caught.y])
      : fromAlign(start, [HOLE, hole.x, hole.y], [BOUNCE, bounce.x, bounce.y], [CAUGHT, caught.x, caught.y], [1, caught.x, caught.y]);
    playerKeyframes[carrierId] = carrierFrames;

    ballKeyframes = handoff
      ? track([0, qb.x, qb.y], [SNAP_T, qb.x, qb.y], [MESH, meshPoint.x, meshPoint.y], [HOLE, hole.x, hole.y], [BOUNCE, bounce.x, bounce.y], [CAUGHT, caught.x, caught.y], [1, caught.x, caught.y])
      : track([0, qb.x, qb.y], [SNAP_T, qb.x, qb.y], [HOLE, hole.x, hole.y], [BOUNCE, bounce.x, bounce.y], [CAUGHT, caught.x, caught.y], [1, caught.x, caught.y]);

    // Key player blocks on a strong-side run (the run clue).
    if (d === sign && key.side === "offense" && keyId !== carrierId) {
      playerKeyframes[keyId] = fromAlign({ x: key.x, y: key.y }, [1, key.x - d * 2, Y.ol + 1]);
    }

    const ssLabel =
      call === "Power" ? "FORCE" : call === "Blitz" ? "RUSH & FINISH" : call === "Zone" ? "FIT & FINISH" : "FILL — KEEP LEVERAGE";

    if (d === sign) {
      // Strong side: keep leverage, turn it back inside, meet and finish.
      setSS(
        fromAlign(align2, [HOLE, c + sign * 16, Y.los - 3], [0.68, c + sign * 15, Y.los - 1], [CAUGHT, caught.x, caught.y], [1, caught.x, caught.y]),
        ssLabel,
        { x: c + sign * 21, y: 40 },
      );
    } else {
      // Weak side: proper pursuit angle across the field to cut it off.
      setSS(
        fromAlign(align2, [0.4, c + sign * 10, Y.los - 3], [BOUNCE, c, Y.los - 5], [CAUGHT, caught.x, caught.y], [1, caught.x, caught.y]),
        "PURSUIT ANGLE",
        { x: c, y: Y.los - 9 },
      );
    }

    if (d === sign && call === "Power") addPowerContain();
    if (call === "Blitz") addBlitzInside();
    coachView.readKey = { at: { x: key.x, y: key.y }, label: "Read key" };

    finish = {
      at: caught,
      kind: call === "Blitz" && outcome === "qb" ? "sack" : "tackle",
      label: d === sign ? "WRAP UP" : "RALLY & FINISH",
      from: FINISH_FROM,
    };

    const readCap =
      d === sign
        ? outcome === "qb"
          ? "He keeps it toward you—keep your leverage, stay home."
          : "He bounces it outside—squeeze and keep your edge."
        : "Ball's going away—open your hips and go.";
    const reactCap =
      d === sign
        ? "Turn it back inside, break down, wrap up, and finish."
        : "Take a pursuit angle and run to the ball. Never assume someone else makes the tackle.";
    captions.push(base(beforeCap), { phase: "read", text: readCap }, { phase: "react", text: reactCap });

    return { paths, zone: undefined, ballKeyframes, ballFlightFrom, playerKeyframes, coachView, captions, finish };
  }

  // ----- pass develops: receiver route + ball flight -----------------------
  const developPass = () => {
    const routeEnd: Point = { x: key.x + sign * 2, y: 27 };
    playerKeyframes[keyId] = fromAlign({ x: key.x, y: key.y }, [0.32, key.x + sign, 40], [1, routeEnd.x, routeEnd.y]);
    ballFlightFrom = 0.58;
    ballKeyframes = track(
      [0, qb.x, qb.y],
      [SNAP_T, qb.x, qb.y],
      [ballFlightFrom, qb.x, qb.y],
      [1, routeEnd.x, routeEnd.y + 2],
    );
    return routeEnd;
  };

  if (call === "Power") {
    if (outcome === "pass") {
      const zone = curlFlatZone(align, sign);
      coachView.coverage = zone;
      developPass();
      setSS(fromAlign(align2, [0.5, align.x + sign * 2, 34], [1, align.x + sign * 3, 29]));
      captions.push(
        base("Power, but stay honest—he can still throw."),
        { phase: "read", text: "He releases—get to your curl/flat and read it." },
        { phase: "react", text: "Break on the throw. Power is not permission to ignore a pass." },
      );
      return { paths, zone, ballKeyframes, ballFlightFrom, playerKeyframes, coachView, captions };
    }
    // read: show the base force picture.
    setSS(fromAlign(align2, [0.5, c + sign * 16, Y.los - 1], [1, c + sign * 15, Y.los]), "FORCE", { x: c + sign * 22, y: 40 });
    addPowerContain();
    coachView.readKey = { at: { x: key.x, y: key.y }, label: "Read key" };
    captions.push(
      base("You have the force. Set the edge."),
      { phase: "read", text: "Read the block—squeeze, don't chase." },
      { phase: "react", text: "At the snap: you are force. Picture turning the run back inside." },
    );
    return { paths, zone: undefined, ballKeyframes, ballFlightFrom, playerKeyframes, coachView, captions };
  }

  if (call === "Blitz") {
    const rushEnd: Point = { x: c + sign * 5, y: qb.y - 1 };
    addBlitzInside();
    if (outcome === "pass") {
      developPass();
      setSS(fromAlign(align2, [0.45, c + sign * 11, Y.los], [1, rushEnd.x, rushEnd.y]), "EDGE RUSH", { x: c + sign * 20, y: align.y - 6 });
      captions.push(
        base("You are the outside rush—end goes inside."),
        { phase: "read", text: "Attack your lane—stay outside the QB." },
        { phase: "react", text: "The throw beats you—get your hands up in the lane." },
      );
      return { paths, zone: undefined, ballKeyframes, ballFlightFrom, playerKeyframes, coachView, captions };
    }
    // read: rush picture.
    setSS(fromAlign(align2, [0.5, c + sign * 11, Y.los], [1, rushEnd.x, rushEnd.y]), "EDGE RUSH", { x: c + sign * 20, y: align.y - 6 });
    captions.push(
      base("You are the outside rush—end goes inside."),
      { phase: "read", text: "Attack your lane—stay outside the QB." },
      { phase: "react", text: "Find the ball and close under control." },
    );
    return { paths, zone: undefined, ballKeyframes, ballFlightFrom, playerKeyframes, coachView, captions };
  }

  if (call === "Zone") {
    const zone = curlFlatZone(align, sign);
    coachView.coverage = zone;
    if (outcome === "qb") {
      // Scramble: hold the zone, do NOT run-fit.
      playerKeyframes["qb"] = fromAlign({ x: qb.x, y: qb.y }, [0.5, c + sign * 4, qb.y - 3], [1, c + sign * 9, Y.los + 2]);
      ballKeyframes = track([0, qb.x, qb.y], [SNAP_T, qb.x, qb.y], [0.5, c + sign * 4, qb.y - 3], [1, c + sign * 9, Y.los + 2]);
      setSS(fromAlign(align2, [0.5, align.x + sign * 2, 33], [1, align.x + sign * 3, 30]));
      captions.push(
        base("You have curl/flat. Read the release."),
        { phase: "read", text: "He breaks the pocket—stay in your zone, eyes on the routes." },
        { phase: "react", text: "A scrambling QB can still throw. Hold coverage until your run-support rule." },
      );
    } else {
      // read / pass: drop and read.
      if (outcome === "pass") developPass();
      setSS(fromAlign(align2, [0.5, align.x + sign * 2, 33], [1, align.x + sign * 4, 29]));
      captions.push(
        base("You have curl/flat. Read the release."),
        { phase: "read", text: "Settle at depth and read the two-receiver combination." },
        { phase: "react", text: outcome === "pass" ? "Break on the throw into your area." : "Picture the routes and your break." },
      );
    }
    return { paths, zone, ballKeyframes, ballFlightFrom, playerKeyframes, coachView, captions };
  }

  // ----- Man coverage ------------------------------------------------------
  coachView.readKey = { at: { x: key.x, y: key.y }, label: "Your man (No. 2)" };
  if (outcome === "pass") {
    const routeEnd = developPass();
    const trailEnd: Point = isTE ? { x: routeEnd.x + sign * 4, y: routeEnd.y + 3 } : { x: routeEnd.x + sign * 2, y: routeEnd.y + 3 };
    setSS(fromAlign(align2, [0.4, key.x + sign * 2, 39], [1, trailEnd.x, trailEnd.y]), "MATCH No. 2", { x: key.x, y: 22 });
    captions.push(
      base(beforeCap),
      { phase: "read", text: "He releases—stay with your man." },
      { phase: "react", text: "Run the route with him. Don't peek at the QB." },
    );
  } else if (outcome === "qb") {
    // Scramble: stay with your man, do NOT run-fit.
    playerKeyframes["qb"] = fromAlign({ x: qb.x, y: qb.y }, [0.5, c + sign * 4, qb.y - 3], [1, c + sign * 9, Y.los + 2]);
    ballKeyframes = track([0, qb.x, qb.y], [SNAP_T, qb.x, qb.y], [0.5, c + sign * 4, qb.y - 3], [1, c + sign * 9, Y.los + 2]);
    // The receiver keeps working (scramble drill).
    playerKeyframes[keyId] = fromAlign({ x: key.x, y: key.y }, [1, key.x + sign * 3, 33]);
    setSS(fromAlign(align2, [0.5, key.x + sign * 2, 38], [1, key.x + sign * 3, 32]), "STAY ON YOUR MAN", { x: key.x, y: 22 });
    captions.push(
      base(beforeCap),
      { phase: "read", text: "He breaks the pocket—but stay with your man." },
      { phase: "react", text: "A scrambling QB can still throw. Hold coverage until your rule triggers support." },
    );
  } else {
    // read: match alignment.
    const matchEnd: Point = isTE ? { x: key.x + sign * 5, y: Y.ws } : { x: key.x, y: Y.ws };
    setSS(fromAlign(align2, [1, matchEnd.x, matchEnd.y]), "MATCH No. 2", { x: key.x, y: 22 });
    captions.push(
      base(isTE ? "You have the tight end—line up outside him." : "You have No. 2 in man."),
      { phase: "read", text: "Mirror his first step." },
      { phase: "react", text: "Block means run support; release means stay in coverage." },
    );
  }

  return { paths, zone: undefined, ballKeyframes, ballFlightFrom, playerKeyframes, coachView, captions };
}

function buildDefense(c: number, sign: 1 | -1, align: SSAlign): DerivedPlayer[] {
  const strongSL = 50 + sign * (50 - X.wrInset);
  const weakSL = 50 - sign * (50 - X.wrInset);
  return [
    { id: "cb-strong", label: "CB", side: "defense", role: "CB", x: strongSL, y: Y.cb },
    { id: "cb-weak", label: "CB", side: "defense", role: "CB", x: weakSL, y: Y.cb },
    { id: "fs", label: "FS", side: "defense", role: "FS", x: c, y: Y.fs },
    { id: "ws", label: "WS", side: "defense", role: "WS", x: c - sign * 18, y: Y.ws },
    { id: "lb-w", label: "W", side: "defense", role: "LB", x: c - 5, y: Y.lb },
    { id: "lb-m", label: "M", side: "defense", role: "LB", x: c + 5, y: Y.lb },
    { id: "de-l", label: "E", side: "defense", role: "DE", x: c - 9, y: Y.dl },
    { id: "dt-l", label: "N", side: "defense", role: "DT", x: c - 3, y: Y.dl },
    { id: "dt-r", label: "T", side: "defense", role: "DT", x: c + 3, y: Y.dl },
    { id: "de-r", label: "E", side: "defense", role: "DE", x: c + 9, y: Y.dl },
    { id: "ss", label: "SS", side: "defense", role: "SS", x: align.x, y: align.y, isSS: true },
  ];
}

function shortSide(side: Selection["side"]): string {
  switch (side) {
    case "left":
      return "Ball On Left Hash";
    case "right":
      return "Ball On Right Hash";
    case "middle":
      return "Middle · Laso";
    case "middle-right":
      return "Middle · River";
  }
}

function buildContent(
  selection: Selection,
  ssSide: "LEFT" | "RIGHT",
  sign: 1 | -1,
): ScenarioContent {
  const { call, side, formation, outcome } = selection;
  const callMeta = CALLS[call];
  const fMeta = FORMATIONS[formation];
  const sideMeta = SIDES[side];
  const te = isTEFormation(formation);
  const balanced = balancedSurface(formation);
  const middle = sideMeta.middle;
  const empty = formation === "empty";
  const underCenter = fMeta.underCenter;

  // Task.
  let task = callMeta.task;
  if (call === "Power" && !te) {
    task =
      "Read the blocks, close toward the line, and keep the runner from getting outside you. Stay ready for a pass.";
  }
  if (call === "Man" && te) {
    task =
      "Cover the tight end on your side. Watch his release, and be ready for a block or a block-and-release.";
  }
  task +=
    (balanced && middle ? " Balanced formation: listen for the FS—River is right, Laso is left." : "") +
    (empty ? " No back: watch for a QB run or receiver sweep." : "");

  // Side / strength.
  const ssWord = ssSide.toLowerCase();
  const sideWhy = middle
    ? balanced
      ? `The ball is in the middle and the formation is balanced. Your FS calls strength: River means right; Laso means left. This diagram puts you on the ${ssWord} side (${sideMeta.fsCall}).`
      : `The ball is in the middle. The stronger receiver side puts you ${ssWord} in this diagram.`
    : `The ball is on the ${side} hash. The ${ssWord} side has more room to the sideline. Expect that wide side to be strong, then listen for the FS: River is right; Laso is left. His call confirms your side. Use your assignment and any called adjustment.`;

  // Formation read.
  let formationWhy = fMeta.why;
  if (underCenter) {
    formationWhy =
      formation === "i"
        ? "The QB is under center. The fullback and running back line up behind him. Find the tight end and read your assigned key. The fullback can lead into a gap, kick out an edge defender, or release on play-action."
        : "The QB is under center. The fullback is offset toward the tight end in this example. He can lead, kick out a defender, or go across the formation. His starting side is a clue, not a promise about where the ball goes.";
  }
  if (formation === "pistol") {
    formationWhy =
      "The QB is in a short shotgun, with the running back directly behind him. Two receivers are on each side. The back can attack either direction. Read your key and stay ready for a handoff, keeper, or play-action pass.";
  }

  // Beginner notes.
  const beginnerEyes = fMeta.watch + " Start with the key assigned in your call.";
  const effortTip =
    call === "Blitz"
      ? " If the throw beats your rush, get your hands into the passing lane without losing balance or contain."
      : outcome === "run" || outcome === "qb"
        ? " Work free of the blocker without giving up your assigned edge, then pursue the ball at a useful angle."
        : call === "Man"
          ? " Keep your eyes on your receiver until your coverage rules tell you to react to the ball."
          : " Recognize and communicate your read; don’t let a guess pull you away from your job.";
  const manLead =
    call === "Man"
      ? te
        ? "Your man is the TE. Line up outside him in this example, with space from the defensive end. Keep that outside leverage as you match his release; use any different leverage your coach calls. "
        : "Your man is a slot receiver, so this view widens you toward him. "
      : "";
  const beginnerMove =
    manLead +
    callMeta.move +
    (outcome === "qb" ? " A scrambling QB can still pass. Stay with your coverage until your rule tells you to go." : "") +
    effortTip;

  const beginnerCheck =
    `On ${call} against ${fMeta.name}: who is my key, where is my help, and what do I do ` +
    (outcome === "read"
      ? "if the offense runs or passes?"
      : outcome === "qb"
        ? "if the QB keeps it or scrambles?"
        : `on this ${outcome}?`);

  const advancedOutcome =
    OUTCOME_GUIDE[outcome] +
    (middle && balanced ? " With balanced strength, listen for the FS: River is right; Laso is left." : "");

  const outcomeNote =
    outcome === "read"
      ? "Pick what happens after the snap. Orange arrows show your movement; maroon arrows show other assignments."
      : OUTCOME_NOTES[outcome][call] + (empty && outcome === "run" ? " No RB here: the example shows a QB draw." : "");

  // sign kept for callers that need directional phrasing; referenced here to
  // avoid an unused parameter while keeping the signature expressive.
  void sign;

  return {
    task,
    sideWhy,
    roleWhy: callMeta.role,
    formationWhy,
    response: callMeta.response,
    beginnerEyes,
    beginnerMove,
    beginnerMistake: callMeta.mistake,
    beginnerCheck,
    advancedFormation: fMeta.advanced,
    advancedCall: callMeta.advanced,
    advancedOutcome,
    outcomeNote,
  };
}

function buildHotspots(
  selection: Selection,
  offense: DerivedPlayer[],
  align: SSAlign,
  c: number,
  sign: 1 | -1,
  keyId: string,
  content: ScenarioContent,
): Hotspot[] {
  const { call, formation } = selection;
  const te = isTEFormation(formation);
  const empty = formation === "empty";
  const key = offense.find((p) => p.id === keyId)!;
  const no2 = offense.find((p) => p.id === strongNo2Id(formation))!;
  const qb = offense.find((p) => p.id === "qb")!;
  const rb = offense.find((p) => p.id === "rb");
  const hotspots: Hotspot[] = [];

  // On-field pins stay few and spread out; every tip is still reachable from
  // the "Tips for this play" list, so pin:false tips are list-only.
  hotspots.push({
    id: "hs-ss",
    anchor: "ss",
    at: { x: align.x, y: align.y - 4 },
    title: "Your job",
    prompt: "Your job",
    explanation: CALLS[call].role,
    deeper: CALLS[call].advanced,
    cue: READ_T,
    highlightIds: ["ss"],
    revealsAnswer: true,
    pin: true,
    lessonId: call === "Man" ? "coverage-basics" : call === "Zone" ? "coverage-basics" : "keep-the-edge",
  });

  hotspots.push({
    id: "hs-assigned",
    anchor: "assigned",
    at: { x: key.x, y: key.y - 4 },
    title: "Read this player",
    prompt: te ? "Read the tight end" : "Read this player",
    explanation:
      call === "Man"
        ? "This is your man. Match his release: a block can mean run support; a release means stay in coverage. Don’t turn him loose to peek at the QB."
        : "Read his block or release. A block is a run/screen clue; a release threatens a pass. Neither is proof by itself.",
    deeper: "A block-and-release can look like run before it becomes a route. Keep watching.",
    cue: 0.5,
    highlightIds: [keyId],
    revealsAnswer: true,
    pin: true,
    lessonId: "read-run-or-pass",
  });

  if (call === "Power" || call === "Blitz") {
    hotspots.push({
      id: "hs-edge",
      anchor: "edge",
      at: { x: c + sign * 21, y: Y.los - 2 },
      title: "Own your edge",
      prompt: "Own your edge",
      explanation:
        call === "Blitz"
          ? "You rush the outside edge; the end goes inside. Stay in your lane so the QB can’t escape around you."
          : "Force keeps the runner inside toward your help. Don’t get hooked or chase yourself out of the lane.",
      cue: READ_T,
      highlightIds: ["ss", sign > 0 ? "de-r" : "de-l"],
      revealsAnswer: true,
      pin: false,
      lessonId: "keep-the-edge",
    });
  }

  if (call === "Zone" || call === "Man" || call === "Power") {
    hotspots.push({
      id: "hs-coverage",
      anchor: "coverage",
      at: call === "Man" ? { x: key.x + sign * 4, y: 24 } : { x: align.x + sign * 2, y: 24 },
      title: "Your pass job",
      prompt: "Your pass job",
      explanation: OUTCOME_NOTES.pass[call],
      cue: 0.65,
      highlightIds: call === "Man" ? [keyId, "ss"] : ["ss"],
      revealsAnswer: true,
      pin: true,
      lessonId: "coverage-basics",
    });
  }

  hotspots.push({
    id: "hs-hash",
    anchor: "hash",
    at: { x: c, y: Y.los + 2 },
    title: "Find your side",
    prompt: "Find your side",
    explanation: content.sideWhy,
    revealsAnswer: false,
    pin: true,
    lessonId: "before-the-snap",
  });

  // No. 2 pin only when it is not the same player already pinned as the key.
  if (no2.id !== keyId) {
    hotspots.push({
      id: "hs-no2",
      anchor: "no2",
      at: { x: no2.x, y: no2.y - 4 },
      title: "Count from outside in",
      prompt: "Count from outside in",
      explanation:
        "Count eligible receivers from the sideline inward: No. 1 is widest, No. 2 is next inside. This is No. 2 on your side.",
      revealsAnswer: false,
      pin: false,
      lessonId: "coverage-basics",
    });
  }

  hotspots.push({
    id: "hs-mesh",
    anchor: "mesh",
    at: rb ? { x: (qb.x + rb.x) / 2, y: (qb.y + rb.y) / 2 } : { x: qb.x, y: qb.y + 4 },
    title: "Watch the fake",
    prompt: "Watch the fake",
    explanation: empty
      ? "No running back here, so watch for a QB draw or a receiver sweep. The keeper and a scramble are different reads."
      : "Keeper, handoff, and play-action are different reads. Don’t commit to the mesh-point fake before you see the ball.",
    revealsAnswer: false,
    pin: false,
    lessonId: "read-run-or-pass",
  });

  return hotspots;
}

function effortNoteFor(outcome: Selection["outcome"], runDirection: RunDirection, hasFinish: boolean): string {
  if (hasFinish) {
    return runDirection === "weak"
      ? "The ball went away from you—take a pursuit angle and run to it. Be on every play, no matter where it is on the field."
      : "Run to the ball, wrap up, and finish—every play. Never assume a teammate makes the tackle.";
  }
  if (outcome === "pass" || outcome === "qb") {
    return "Stay disciplined in coverage, then rally to the ball and help finish. Effort on every snap.";
  }
  return "Know your job, trust your read, and run to the ball. Make the effort to be on every play.";
}

export interface ScenarioOptions {
  runDirection?: RunDirection;
}

export function deriveScenario(selection: Selection, opts: ScenarioOptions = {}): Scenario {
  const { call, side, formation, outcome } = selection;
  const c = sideToCenter(side);
  const sign = sideToSsSign(side);
  const ssSide = ssSideLabel(sign);
  const align = ssAlignment(call, formation, c, sign);
  const runDirection: RunDirection = opts.runDirection ?? "strong";

  const offense = buildOffense(formation, c, sign);
  const defense = buildDefense(c, sign, align);
  // Power/Blitz read the TE if present, else No. 2 strong; Zone/Man read No. 2.
  const resolvedKeyId = isTEFormation(formation) ? "te-s" : strongNo2Id(formation);

  const motion = buildMotion(selection, c, sign, align, offense, resolvedKeyId, runDirection);

  // Attach keyframes to players.
  const attach = (players: DerivedPlayer[]) =>
    players.map((p) => {
      const kf = motion.playerKeyframes[p.id];
      const isKey = p.id === resolvedKeyId;
      return kf || isKey ? { ...p, keyframes: kf ?? p.keyframes, isKey: isKey || p.isKey } : p;
    });

  const players = [...attach(offense), ...attach(defense)];

  const content = buildContent(selection, ssSide, sign);
  const hotspots = buildHotspots(selection, offense, align, c, sign, resolvedKeyId, content);

  const sideMeta = SIDES[side];
  const balanced = balancedSurface(formation);
  const positionText = `SS: ${ssSide} · ${
    sideMeta.middle ? (balanced ? "called side" : "formation strength") : "wide side of field"
  }`;

  const keyLabel = (() => {
    const k = offense.find((p) => p.id === resolvedKeyId);
    if (!k) return "your key";
    if (k.role === "TE") return "tight end";
    return `No. ${k.no ?? 2} receiver`;
  })();

  const textEquivalent =
    `Overhead view: defense on top, offense below. You are the strong safety, aligned to your ${ssSide.toLowerCase()} with ${align.leverage}, keying the ${keyLabel}. ` +
    `${content.task}`;

  const scenarioTitle = `${call} · ${FORMATIONS[formation].name} · ${shortSide(side)}`;

  return {
    selection,
    players,
    paths: motion.paths,
    zone: motion.zone,
    ballKeyframes: motion.ballKeyframes,
    ballFlightFrom: motion.ballFlightFrom,
    ssId: "ss",
    keyId: resolvedKeyId,
    ssSide,
    ssSign: sign,
    center: c,
    scenarioTitle,
    positionText,
    content,
    hotspots,
    captions: motion.captions,
    textEquivalent,
    coachView: motion.coachView,
    formationName: FORMATIONS[formation].name,
    formationLean: FORMATIONS[formation].lean,
    formationWhy: content.formationWhy,
    finish: motion.finish,
    runDirection,
    effortNote: effortNoteFor(outcome, runDirection, !!motion.finish),
  };
}
