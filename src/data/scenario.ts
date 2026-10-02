import type {
  Caption,
  CoachViewOverlay,
  DerivedPath,
  DerivedPlayer,
  DerivedZone,
  Hotspot,
  Keyframe,
  Point,
  Scenario,
  ScenarioContent,
  Selection,
} from "../types";
import { CALLS, OUTCOME_GUIDE, OUTCOME_NOTES } from "./calls";
import { FORMATIONS, buildOffense } from "./formations";
import { SIDES } from "./sides";
import { X, Y, sideToCenter, sideToSsSign, ssSideLabel } from "./geometry";

// Timeline phase boundaries (normalized 0..1).
export const SNAP_T = 0.33;
export const READ_T = 0.6;

interface SSAlign {
  x: number;
  y: number;
  leverage: string;
}

/** Quadratic control point between two points with an optional perpendicular bow. */
function quad(from: Point, to: Point, bow = 0): Point {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: mx + (-dy / len) * bow, y: my + (dx / len) * bow };
}

function keyframes(align: Point, mid: Point | null, end: Point): Keyframe[] {
  const frames: Keyframe[] = [
    { t: 0, x: align.x, y: align.y },
    { t: SNAP_T, x: align.x, y: align.y },
  ];
  if (mid) frames.push({ t: READ_T, x: mid.x, y: mid.y });
  frames.push({ t: 1, x: end.x, y: end.y });
  return frames;
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
  /** keyframes attached to specific player ids. */
  playerKeyframes: Record<string, Keyframe[]>;
  coachView: CoachViewOverlay;
  captions: Caption[];
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
  const strongDEId = sign > 0 ? "de-r" : "de-l";
  const strongDE: Point = { x: c + sign * 9, y: Y.dl };

  const ssPos = { x: align.x, y: align.y };
  const meshPoint: Point = { x: c + sign * 2, y: Y.qbShotgun - 2 };

  // ---- Offense / ball development (stimulus). -----------------------------
  const developRun = () => {
    const edge: Point = { x: c + sign * 14, y: Y.los + 2 };
    // Ball: QB -> mesh -> follows carrier to the edge (no teleport back).
    const ball: Keyframe[] = [
      { t: 0, x: qb.x, y: qb.y },
      { t: SNAP_T, x: qb.x, y: qb.y },
      { t: 0.46, x: meshPoint.x, y: meshPoint.y },
      { t: 1, x: edge.x, y: edge.y },
    ];
    if (rb) {
      playerKeyframes["rb"] = keyframes({ x: rb.x, y: rb.y }, meshPoint, edge);
    } else {
      playerKeyframes["qb"] = keyframes({ x: qb.x, y: qb.y }, meshPoint, edge);
    }
    // Key player blocks (run clue): small down movement.
    if (key.side === "offense") {
      playerKeyframes[keyId] = keyframes(
        { x: key.x, y: key.y },
        null,
        { x: key.x - sign * 2, y: Y.ol + 1 },
      );
    }
    return ball;
  };

  const developPass = (): { ball: Keyframe[]; flightFrom: number } => {
    const routeEnd: Point = { x: key.x + sign * 2, y: 27 };
    playerKeyframes[keyId] = keyframes(
      { x: key.x, y: key.y },
      { x: key.x + sign, y: 40 },
      routeEnd,
    );
    const flightFrom = 0.62;
    const ball: Keyframe[] = [
      { t: 0, x: qb.x, y: qb.y },
      { t: flightFrom, x: qb.x, y: qb.y },
      { t: 1, x: routeEnd.x, y: routeEnd.y + 2 },
    ];
    return { ball, flightFrom };
  };

  const developQB = () => {
    const edge: Point = { x: c + sign * 13, y: Y.los + 1 };
    playerKeyframes["qb"] = keyframes({ x: qb.x, y: qb.y }, meshPoint, edge);
    // Receiver still threatens a route (scramble drill): small release.
    if (key.side === "offense") {
      playerKeyframes[keyId] = keyframes(
        { x: key.x, y: key.y },
        null,
        { x: key.x + sign * 2, y: 34 },
      );
    }
    const ball: Keyframe[] = [
      { t: 0, x: qb.x, y: qb.y },
      { t: SNAP_T, x: qb.x, y: qb.y },
      { t: 1, x: edge.x, y: edge.y },
    ];
    return ball;
  };

  // Minimal snap for the "at the snap" read view.
  const snapOnly = (): Keyframe[] => [
    { t: 0, x: c, y: Y.los },
    { t: SNAP_T, x: qb.x, y: qb.y },
    { t: 1, x: meshPoint.x, y: meshPoint.y },
  ];

  let ballKeyframes: Keyframe[];
  let ballFlightFrom: number | undefined;

  if (outcome === "run") {
    ballKeyframes = developRun();
  } else if (outcome === "pass" && call !== "Blitz") {
    const p = developPass();
    ballKeyframes = p.ball;
    ballFlightFrom = p.flightFrom;
  } else if (outcome === "qb") {
    ballKeyframes = developQB();
  } else if (outcome === "pass" && call === "Blitz") {
    // Blitz vs pass: QB tries to throw under pressure.
    const p = developPass();
    ballKeyframes = p.ball;
    ballFlightFrom = p.flightFrom;
  } else {
    ballKeyframes = snapOnly();
  }

  // ---- SS + teammate assignment movement. ---------------------------------
  const addPath = (
    id: string,
    kind: DerivedPath["kind"],
    from: Point,
    to: Point,
    opts: { bow?: number; label?: string; labelAt?: Point; phase?: DerivedPath["phase"]; reveal?: boolean } = {},
  ) => {
    paths.push({
      id,
      kind,
      from,
      control: quad(from, to, opts.bow ?? 0),
      to,
      phase: opts.phase ?? "react",
      label: opts.label ? { text: opts.label, at: opts.labelAt ?? quad(from, to, (opts.bow ?? 0) + 6) } : undefined,
      revealsAnswer: opts.reveal ?? true,
    });
  };

  const setSS = (end: Point, mid: Point | null, label: string, labelAt?: Point, bow = 0) => {
    playerKeyframes["ss"] = keyframes(ssPos, mid, end);
    addPath("ss-path", "ss", ssPos, end, { bow, label, labelAt, reveal: true });
  };

  const isTE = isTEFormation(formation);

  if (call === "Power") {
    if (outcome === "pass") {
      // Power paired with curl/flat coverage in this teaching view.
      const zone = curlFlatZone(align, sign);
      const end: Point = { x: align.x + sign * 3, y: 29 };
      // The zone box already carries the CURL / FLAT label; keep the SS path clean.
      setSS(end, { x: align.x + sign * 2, y: 34 }, "", undefined, 0);
      coachView.coverage = zone;
      captions.push(
        { phase: "before", text: "Power, but stay honest—he can still throw." },
        { phase: "read", text: "He releases—get to your curl/flat and read it." },
        { phase: "react", text: "Break on the throw. Power is not permission to ignore a pass." },
      );
      return { paths, zone, ballKeyframes, ballFlightFrom, playerKeyframes, coachView, captions };
    }
    // Force picture (read / run / qb).
    const forceEnd: Point = { x: c + sign * 16, y: Y.los + 1 };
    setSS(forceEnd, { x: align.x, y: align.y + 3 }, "FORCE", { x: c + sign * 22, y: 40 }, sign * -3);
    // Strong DE spills the runner outside to force.
    const deEnd: Point = { x: c + sign * 12, y: Y.ol };
    playerKeyframes[strongDEId] = keyframes(strongDE, null, deEnd);
    addPath("de-spill", "assignment", strongDE, deEnd, {
      label: "Spill",
      labelAt: { x: c + sign * 9, y: 57 },
      reveal: true,
    });
    // FS fills the alley.
    const fs: Point = { x: c, y: Y.fs };
    const fsEnd: Point = { x: c + sign * 8, y: Y.lb - 1 };
    playerKeyframes["fs"] = keyframes(fs, null, fsEnd);
    addPath("fs-alley", "assignment", fs, fsEnd, {
      label: "Alley",
      labelAt: { x: c + sign * 4, y: 25 },
      bow: sign * 2,
      reveal: true,
    });
    coachView.forceEdge = { from: { x: c + sign * 11, y: Y.los }, to: { x: c + sign * 20, y: Y.los }, label: "Force edge" };
    coachView.readKey = { at: { x: key.x, y: key.y }, label: "Read key" };
    const runCap =
      outcome === "qb"
        ? "He keeps it—close under control and force it back inside."
        : outcome === "run"
          ? "Handoff. Read the block and keep him inside your edge."
          : "At the snap: you are force. Picture turning the run back inside.";
    captions.push(
      { phase: "before", text: "You have the force. Set the edge." },
      { phase: "read", text: "Read the block—squeeze, don't chase." },
      { phase: "react", text: runCap },
    );
    return { paths, zone: undefined, ballKeyframes, ballFlightFrom, playerKeyframes, coachView, captions };
  }

  if (call === "Blitz") {
    const rushEnd: Point = { x: c + sign * 5, y: qb.y - 2 };
    setSS(rushEnd, { x: c + sign * 11, y: Y.los }, outcome === "run" ? "RUSH LANE → RUN FIT" : "EDGE RUSH", { x: align.x, y: align.y - 6 }, sign * -4);
    // End crashes inside.
    const deEnd: Point = { x: c + sign * 8, y: Y.ol };
    playerKeyframes[strongDEId] = keyframes(strongDE, null, deEnd);
    addPath("de-inside", "assignment", strongDE, deEnd, {
      label: "End inside",
      labelAt: { x: c + sign * 6, y: 40 },
      reveal: true,
    });
    coachView.forceEdge = { from: { x: c + sign * 11, y: Y.los }, to: { x: c + sign * 6, y: qb.y - 2 }, label: "Rush lane" };
    captions.push(
      { phase: "before", text: "You are the outside rush. End goes inside." },
      { phase: "read", text: "Attack your lane—stay outside the QB." },
      {
        phase: "react",
        text:
          outcome === "pass"
            ? "If the throw beats you, get your hands up in the lane."
            : outcome === "qb"
              ? "Keep him in the pocket—don't let him escape outside."
              : "Find the ball and close under control.",
      },
    );
    return { paths, zone: undefined, ballKeyframes, ballFlightFrom, playerKeyframes, coachView, captions };
  }

  if (call === "Zone") {
    const zone = curlFlatZone(align, sign);
    coachView.coverage = zone;
    if (outcome === "run") {
      // Run confirmed: leave the drop and fit the edge.
      const fitEnd: Point = { x: c + sign * 15, y: Y.los - 1 };
      setSS(fitEnd, { x: align.x, y: align.y + 3 }, "FIT YOUR EDGE", { x: align.x, y: align.y - 5 }, sign * -3);
      captions.push(
        { phase: "before", text: "You have curl/flat. Read the release." },
        { phase: "read", text: "Run shows—trigger down and fit your edge." },
        { phase: "react", text: "Keep leverage; don't overrun the cutback." },
      );
    } else {
      // read / pass / qb: hold the curl/flat (do NOT run-fit a scramble).
      const dropEnd: Point = { x: align.x + sign * 4, y: 29 };
      // The zone box already carries the CURL / FLAT label.
      setSS(dropEnd, { x: align.x + sign * 2, y: 33 }, "", undefined, 0);
      captions.push(
        { phase: "before", text: "You have curl/flat. Read the release." },
        {
          phase: "read",
          text:
            outcome === "qb"
              ? "He breaks the pocket—stay in your zone, eyes on the routes."
              : "Settle at depth and read the two-receiver combination.",
        },
        {
          phase: "react",
          text:
            outcome === "qb"
              ? "A scrambling QB can still throw. Hold coverage until your run-support rule."
              : "Break on the throw into your area.",
        },
      );
    }
    return { paths, zone, ballKeyframes, ballFlightFrom, playerKeyframes, coachView, captions };
  }

  // ---- Man coverage. ------------------------------------------------------
  const keyPos: Point = { x: key.x, y: key.y };
  coachView.readKey = { at: keyPos, label: "Your man (No. 2)" };
  if (outcome === "run") {
    // Read the block; trigger run support but keep leverage (outside the TE).
    const supportEnd: Point = isTE
      ? { x: c + sign * 14, y: Y.los - 1 }
      : { x: key.x + sign * 2, y: Y.los - 2 };
    setSS(supportEnd, { x: align.x, y: align.y + 3 }, "READ THE BLOCK", { x: align.x, y: align.y - 5 }, sign * -2);
    captions.push(
      { phase: "before", text: isTE ? "You have the tight end—outside leverage." : "You have No. 2 in man." },
      { phase: "read", text: "He blocks—this looks like run. Keep your leverage." },
      { phase: "react", text: "Follow your run-support rule; don't lose the edge." },
    );
  } else if (outcome === "pass") {
    const trailEnd: Point = isTE
      ? { x: key.x + sign * 4, y: 30 }
      : { x: key.x + sign * 2, y: 30 };
    setSS(trailEnd, { x: key.x + sign * 2, y: 39 }, "MATCH No. 2", { x: key.x, y: 22 }, 0);
    captions.push(
      { phase: "before", text: isTE ? "You have the tight end—outside leverage." : "You have No. 2 in man." },
      { phase: "read", text: "He releases—stay with your man." },
      { phase: "react", text: "Run the route with him. Don't peek at the QB." },
    );
  } else if (outcome === "qb") {
    // Scramble: stay in coverage until the run-support rule triggers.
    const stayEnd: Point = isTE
      ? { x: key.x + sign * 4, y: 32 }
      : { x: key.x + sign * 2, y: 32 };
    setSS(stayEnd, { x: key.x + sign * 2, y: 38 }, "STAY ON YOUR MAN", { x: key.x, y: 22 }, 0);
    captions.push(
      { phase: "before", text: isTE ? "You have the tight end—outside leverage." : "You have No. 2 in man." },
      { phase: "read", text: "He breaks the pocket—but stay with your man." },
      { phase: "react", text: "A scrambling QB can still throw. Hold coverage until your rule triggers support." },
    );
  } else {
    // read: match alignment.
    const matchEnd: Point = isTE ? { x: key.x + sign * 5, y: Y.ws } : { x: key.x, y: Y.ws };
    setSS(matchEnd, null, "MATCH No. 2", { x: key.x, y: 22 }, 0);
    captions.push(
      { phase: "before", text: isTE ? "You have the tight end—line up outside him." : "You have No. 2 in man." },
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

export function deriveScenario(selection: Selection): Scenario {
  const { call, side, formation } = selection;
  const c = sideToCenter(side);
  const sign = sideToSsSign(side);
  const ssSide = ssSideLabel(sign);
  const align = ssAlignment(call, formation, c, sign);

  const offense = buildOffense(formation, c, sign);
  const defense = buildDefense(c, sign, align);
  // Power/Blitz read the TE if present, else No. 2 strong; Zone/Man read No. 2.
  const resolvedKeyId = isTEFormation(formation) ? "te-s" : strongNo2Id(formation);

  const motion = buildMotion(selection, c, sign, align, offense, resolvedKeyId);

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
  };
}
