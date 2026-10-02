import type { DerivedPlayer, FormationId } from "../types";
import { Y, strongSideline, weakSideline } from "./geometry";

export interface FormationMeta {
  id: FormationId;
  /** Short option label used in the picker. */
  option: string;
  name: string;
  lean: string;
  why: string;
  watch: string;
  advanced: string;
  /** True when the QB lines up under center (I / offset-I). */
  underCenter: boolean;
  /** Rough run/pass lean used for the tendency pill. */
  tendency: "run" | "pass" | "neutral";
}

// Content preserved from the baseline guide (formationGuide + formation card).
export const FORMATIONS: Record<FormationId, FormationMeta> = {
  trips: {
    id: "trips",
    option: "Trips 3×1 · one back",
    name: "Shotgun trips 3×1",
    lean: "Neutral · run or pass",
    why: "Three receivers on one side can spread you out, but one back and the QB can still run. Receiver count alone does not tell you the play.",
    watch:
      "Find the inside receivers before the snap. A fast sideways release can signal a screen; a vertical release can threaten your coverage.",
    advanced:
      "Trips can change who handles No. 2 and No. 3. Use the trips check; do not assume ordinary two-receiver rules cover every route.",
    underCenter: false,
    tendency: "neutral",
  },
  twins: {
    id: "twins",
    option: "Balanced 2×2 · one back",
    name: "Shotgun 2×2",
    lean: "Neutral · run or pass",
    why: "Two receivers on each side balance the passing threats. The back can run, block or release.",
    watch:
      "Find the slot on your side. A block is a run/screen clue; a release is a pass clue. Keep watching because either action can be a fake.",
    advanced:
      "A slot can block for a screen while the QB throws. Run-pass options can pair a handoff with a receiver route, so read your assigned key instead of guessing from one player.",
    underCenter: false,
    tendency: "neutral",
  },
  pro: {
    id: "pro",
    option: "Pro set · TE + two backs",
    name: "Pro set · tight end and two backs",
    lean: "Neutral · run or pass",
    why: "The tight end and fullback add blockers, but they can also release for a pass. This example uses a shotgun QB.",
    watch:
      "Locate the TE and lead back. Read the block or release assigned to you. Extra blockers do not mean you can ignore play-action.",
    advanced:
      "The fullback can lead, kick out an edge defender or leak into a route. Your force fit depends on how the end handles the block and where your support is.",
    underCenter: false,
    tendency: "neutral",
  },
  double: {
    id: "double",
    option: "Double TE · two backs",
    name: "Double tight end · two backs",
    lean: "Run-leaning · heavy blocking surface",
    why: "Two attached TEs and two backs give the offense extra blocking options. They can still use play-action. This example uses a shotgun QB.",
    watch:
      "Check both edges. Your TE may block, then release behind you. Stay under control until your read confirms the ball.",
    advanced:
      "A down block by the TE can open space for a puller or kick-out block. Do not dive inside and give up the edge; use your taught leverage and squeeze rules.",
    underCenter: false,
    tendency: "run",
  },
  empty: {
    id: "empty",
    option: "Empty 3×2 · no backs",
    name: "Empty 3×2",
    lean: "Pass-leaning · five receiving threats",
    why: "No running back means more receivers, but the QB can draw, scramble or run a designed keeper.",
    watch:
      "Count the receivers. Do not relax about the run just because the backfield is empty.",
    advanced:
      "No RB changes pressure and coverage checks. A receiver can motion into the backfield; communicate and apply the empty or motion check rather than chasing the movement on your own.",
    underCenter: false,
    tendency: "pass",
  },
  i: {
    id: "i",
    option: "I-formation · TE + two backs",
    name: "I-formation",
    lean: "Run-leaning · lead back behind QB",
    why: "The QB is under center, with a fullback and RB stacked behind him. The offense can lead-block or fake that action and pass.",
    watch:
      "Find the TE and fullback. The lead back is a clue; the ball may go another way. Look for a block versus a release without staring only at the handoff.",
    advanced:
      "The fullback may lead inside, kick out, or release. A guard pulling toward you adds another blocker, but your exact key and reaction come from the call.",
    underCenter: true,
    tendency: "run",
  },
  "offset-i": {
    id: "offset-i",
    option: "Offset I · TE + two backs",
    name: "Offset I",
    lean: "Run-leaning · offset lead blocker",
    why: "The fullback starts to one side of the QB. That helps the offense reach blocks, but does not guarantee the run goes there.",
    watch:
      "Notice the fullback's starting side, then read his movement. Stay ready for counter action and play-action.",
    advanced:
      "The offense can show a strong-side lead and send the ball away. Hold your backside responsibility when the ball leaves you; pursue only after your read tells you to.",
    underCenter: true,
    tendency: "run",
  },
  pistol: {
    id: "pistol",
    option: "Pistol 2×2 · one back",
    name: "Pistol 2×2",
    lean: "Neutral · run or pass",
    why: "The QB takes a short shotgun snap with the RB directly behind him. The back can attack either side.",
    watch:
      "The back's alignment does not pick a run direction. Watch your assigned key and be ready for a keeper after the handoff fake.",
    advanced:
      "The QB/RB exchange can hide who has the ball. An unblocked end can be part of a read play. You handle the responsibility in your call; do not try to tackle both players by guessing.",
    underCenter: false,
    tendency: "neutral",
  },
};

export const FORMATION_ORDER: FormationId[] = [
  "trips",
  "twins",
  "pro",
  "double",
  "empty",
  "i",
  "offset-i",
  "pistol",
];

// Horizontal offsets from the formation center (logical units).
const OL_GUARD = 3.4;
const OL_TACKLE = 6.8;
const TE_OFF = 12;
const SLOT_NO2 = 20;
const TRIPS_NO2 = 25;
const TRIPS_NO3 = 16;

/**
 * Build the 11 offensive players for a formation.
 * @param c    formation center (ball x)
 * @param sign strength direction (+1 toward defender's LEFT, -1 toward RIGHT)
 */
export function buildOffense(
  formation: FormationId,
  c: number,
  sign: 1 | -1,
): DerivedPlayer[] {
  const meta = FORMATIONS[formation];
  const underCenter = meta.underCenter;
  const qbY = underCenter ? Y.qbUnderCenter : Y.qbShotgun;

  // Offensive line (always present, stable ids).
  const players: DerivedPlayer[] = [
    ol("lt", c - OL_TACKLE),
    ol("lg", c - OL_GUARD),
    { id: "c", label: "C", side: "offense", role: "OL", onLine: true, x: c, y: Y.ol },
    ol("rg", c + OL_GUARD),
    ol("rt", c + OL_TACKLE),
    { id: "qb", label: "QB", side: "offense", role: "QB", x: c, y: qbY },
  ];

  const strongSide = strongSideline(sign);
  const weakSide = weakSideline(sign);

  const attachedTE = (id: string, x: number, no: number, strong: boolean) =>
    players.push({
      id,
      label: "TE",
      side: "offense",
      role: "TE",
      onLine: true,
      x,
      y: Y.ol,
      no,
      strongSide: strong,
    });

  const wr = (
    id: string,
    label: string,
    x: number,
    no: number,
    strong: boolean,
    onLine: boolean,
  ) =>
    players.push({
      id,
      label,
      side: "offense",
      role: onLine && !isSlot(no) ? "WR" : "slot",
      onLine,
      x,
      y: onLine ? Y.wrLine : Y.slot,
      no,
      strongSide: strong,
    });

  switch (formation) {
    case "trips": {
      wr("wr-x", "X", weakSide, 1, false, true);
      wr("wr-z", "Z", strongSide, 1, true, true);
      wr("slot-s1", "H", c + sign * TRIPS_NO2, 2, true, false);
      wr("slot-s2", "Y", c + sign * TRIPS_NO3, 3, true, false);
      pushRB(players, c - sign * 8, Y.rbOffset);
      break;
    }
    case "twins": {
      wr("wr-x", "X", weakSide, 1, false, true);
      wr("wr-z", "Z", strongSide, 1, true, true);
      wr("slot-w", "H", c - sign * SLOT_NO2, 2, false, false);
      wr("slot-s", "Y", c + sign * SLOT_NO2, 2, true, false);
      pushRB(players, c - sign * 8, Y.rbOffset);
      break;
    }
    case "pistol": {
      wr("wr-x", "X", weakSide, 1, false, true);
      wr("wr-z", "Z", strongSide, 1, true, true);
      wr("slot-w", "H", c - sign * SLOT_NO2, 2, false, false);
      wr("slot-s", "Y", c + sign * SLOT_NO2, 2, true, false);
      pushRB(players, c, Y.rbDeep);
      break;
    }
    case "empty": {
      wr("wr-x", "X", weakSide, 1, false, true);
      wr("slot-w", "H", c - sign * SLOT_NO2, 2, false, false);
      wr("wr-z", "Z", strongSide, 1, true, true);
      wr("slot-s1", "Y", c + sign * TRIPS_NO2, 2, true, false);
      wr("slot-s2", "R", c + sign * TRIPS_NO3, 3, true, false);
      break; // no RB
    }
    case "pro": {
      attachedTE("te-s", c + sign * TE_OFF, 2, true);
      wr("wr-z", "Z", strongSide, 1, true, false); // flanker off the line
      wr("wr-x", "X", weakSide, 1, false, true); // split end on the line
      pushRB(players, c - sign * 8, Y.rbOffset);
      pushFB(players, c, Y.fb);
      break;
    }
    case "double": {
      attachedTE("te-s", c + sign * TE_OFF, 2, true);
      attachedTE("te-w", c - sign * TE_OFF, 1, false);
      wr("wr-z", "Z", strongSide, 1, true, false); // lone flanker off the line
      pushRB(players, c - sign * 8, Y.rbOffset);
      pushFB(players, c, Y.fb);
      break;
    }
    case "i": {
      attachedTE("te-s", c + sign * TE_OFF, 2, true);
      wr("wr-z", "Z", strongSide, 1, true, false);
      wr("wr-x", "X", weakSide, 1, false, true);
      pushFB(players, c, Y.fb);
      pushRB(players, c, Y.rbDeep);
      break;
    }
    case "offset-i": {
      attachedTE("te-s", c + sign * TE_OFF, 2, true);
      wr("wr-z", "Z", strongSide, 1, true, false);
      wr("wr-x", "X", weakSide, 1, false, true);
      pushFB(players, c + sign * 7, Y.fb);
      pushRB(players, c, Y.rbDeep);
      break;
    }
  }

  return players;
}

function ol(id: string, x: number): DerivedPlayer {
  return { id: `ol-${id}`, label: id.endsWith("t") ? "T" : "G", side: "offense", role: "OL", onLine: true, x, y: Y.ol };
}

function pushRB(players: DerivedPlayer[], x: number, y: number) {
  players.push({ id: "rb", label: "RB", side: "offense", role: "RB", x, y });
}

function pushFB(players: DerivedPlayer[], x: number, y: number) {
  players.push({ id: "fb", label: "FB", side: "offense", role: "FB", x, y });
}

function isSlot(no: number): boolean {
  return no >= 2;
}

/** Count of offensive players reported on the line of scrimmage. */
export function onLineCount(players: DerivedPlayer[]): number {
  return players.filter((p) => p.side === "offense" && p.onLine).length;
}
