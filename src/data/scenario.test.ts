import { describe, expect, it } from "vitest";
import { CALL_ORDER, OUTCOME_ORDER } from "./calls";
import { FORMATION_ORDER, onLineCount } from "./formations";
import { SIDE_ORDER } from "./sides";
import { deriveScenario, isTEFormation } from "./scenario";
import { lessonById } from "./lessons";
import type { Keyframe, Point, Selection, Scenario } from "../types";

function allSelections(): Selection[] {
  const out: Selection[] = [];
  for (const call of CALL_ORDER)
    for (const side of SIDE_ORDER)
      for (const formation of FORMATION_ORDER)
        for (const outcome of OUTCOME_ORDER) out.push({ call, side, formation, outcome });
  return out;
}

const SELECTIONS = allSelections();

function finite(n: number): boolean {
  return typeof n === "number" && Number.isFinite(n);
}

function pointOk(p: Point, pad = 8): boolean {
  return finite(p.x) && finite(p.y) && p.x >= -pad && p.x <= 100 + pad && p.y >= -pad && p.y <= 100 + pad;
}

function allPoints(s: Scenario): Point[] {
  const pts: Point[] = [];
  for (const pl of s.players) {
    pts.push({ x: pl.x, y: pl.y });
    pl.keyframes?.forEach((k: Keyframe) => pts.push({ x: k.x, y: k.y }));
  }
  for (const path of s.paths) pts.push(path.from, path.control, path.to);
  s.ballKeyframes.forEach((k) => pts.push({ x: k.x, y: k.y }));
  if (s.zone) pts.push({ x: s.zone.x, y: s.zone.y });
  return pts;
}

describe("deriveScenario — coverage", () => {
  it("produces 512 base selections (4 x 4 x 8 x 4)", () => {
    expect(SELECTIONS.length).toBe(512);
  });

  it("derives a valid scenario for every selection", () => {
    for (const sel of SELECTIONS) {
      const s = deriveScenario(sel);
      expect(s.selection).toEqual(sel);
      expect(s.ssId).toBe("ss");
    }
  });
});

describe("rosters", () => {
  it("has 11 offense and 11 defense in every scenario", () => {
    for (const sel of SELECTIONS) {
      const s = deriveScenario(sel);
      const offense = s.players.filter((p) => p.side === "offense");
      const defense = s.players.filter((p) => p.side === "defense");
      expect(offense.length, `offense ${JSON.stringify(sel)}`).toBe(11);
      expect(defense.length, `defense ${JSON.stringify(sel)}`).toBe(11);
    }
  });

  it("places exactly seven offensive players on the line", () => {
    for (const sel of SELECTIONS) {
      const s = deriveScenario(sel);
      const offense = s.players.filter((p) => p.side === "offense");
      expect(onLineCount(offense), `on-line ${JSON.stringify(sel)}`).toBe(7);
    }
  });

  it("has exactly one SS marker on defense", () => {
    for (const sel of SELECTIONS) {
      const s = deriveScenario(sel);
      const ss = s.players.filter((p) => p.isSS);
      expect(ss.length).toBe(1);
      expect(ss[0]!.id).toBe("ss");
    }
  });

  it("keeps a WR outside an attached TE off the line (TE not covered up)", () => {
    for (const sel of SELECTIONS.filter((s) => isTEFormation(s.formation))) {
      const s = deriveScenario(sel);
      const te = s.players.find((p) => p.id === "te-s")!;
      const flanker = s.players.find((p) => p.id === "wr-z")!;
      expect(te.onLine, `TE on line ${JSON.stringify(sel)}`).toBe(true);
      expect(flanker.onLine, `flanker off line ${JSON.stringify(sel)}`).toBeFalsy();
    }
  });
});

describe("orientation / side projection", () => {
  it("places the SS on the correct defender side", () => {
    for (const sel of SELECTIONS) {
      const s = deriveScenario(sel);
      const ss = s.players.find((p) => p.isSS)!;
      // left hash + middle-right (River) => strength is defender's RIGHT (screen-left, lower x than center)
      // right hash + middle (Laso)       => strength is defender's LEFT  (screen-right, higher x than center)
      if (sel.side === "left" || sel.side === "middle-right") {
        expect(s.ssSide).toBe("RIGHT");
        expect(ss.x, `SS left of center ${JSON.stringify(sel)}`).toBeLessThan(s.center);
      } else {
        expect(s.ssSide).toBe("LEFT");
        expect(ss.x, `SS right of center ${JSON.stringify(sel)}`).toBeGreaterThan(s.center);
      }
    }
  });

  it("places the ball spot by hash selection", () => {
    expect(deriveScenario({ call: "Man", side: "left", formation: "i", outcome: "read" }).center).toBe(62);
    expect(deriveScenario({ call: "Man", side: "right", formation: "i", outcome: "read" }).center).toBe(38);
    expect(deriveScenario({ call: "Man", side: "middle", formation: "i", outcome: "read" }).center).toBe(50);
    expect(deriveScenario({ call: "Man", side: "middle-right", formation: "i", outcome: "read" }).center).toBe(50);
  });
});

describe("Man leverage on an attached TE", () => {
  it("keeps the SS outside the TE and separated from the DE on both sides", () => {
    const teFormations = SELECTIONS.filter((s) => s.call === "Man" && isTEFormation(s.formation));
    for (const sel of teFormations) {
      const s = deriveScenario(sel);
      const ss = s.players.find((p) => p.isSS)!;
      const te = s.players.find((p) => p.id === "te-s")!;
      const strongDE = s.players.find((p) => p.id === (s.ssSign > 0 ? "de-r" : "de-l"))!;
      // SS is further from center (toward the sideline) than the TE => outside leverage.
      expect(
        Math.abs(ss.x - s.center),
        `SS outside TE ${JSON.stringify(sel)}`,
      ).toBeGreaterThan(Math.abs(te.x - s.center));
      // Visible separation from the DE.
      expect(Math.abs(ss.x - strongDE.x), `SS/DE separation ${JSON.stringify(sel)}`).toBeGreaterThanOrEqual(6);
    }
  });
});

describe("geometry integrity", () => {
  it("has no NaN and keeps points on (or just off) the field", () => {
    for (const sel of SELECTIONS) {
      const s = deriveScenario(sel);
      for (const p of allPoints(s)) {
        expect(pointOk(p), `point ${JSON.stringify(p)} for ${JSON.stringify(sel)}`).toBe(true);
      }
    }
  });

  it("keyframe times are monotonic and within [0,1]", () => {
    for (const sel of SELECTIONS) {
      const s = deriveScenario(sel);
      const checkFrames = (frames: Keyframe[]) => {
        let prev = -1;
        for (const f of frames) {
          expect(f.t).toBeGreaterThanOrEqual(0);
          expect(f.t).toBeLessThanOrEqual(1);
          expect(f.t).toBeGreaterThanOrEqual(prev);
          prev = f.t;
        }
      };
      checkFrames(s.ballKeyframes);
      s.players.forEach((p) => p.keyframes && checkFrames(p.keyframes));
    }
  });
});

describe("outcome agreement", () => {
  it("marks a thrown ball with a flight start only on pass", () => {
    for (const sel of SELECTIONS) {
      const s = deriveScenario(sel);
      if (sel.outcome === "pass") {
        expect(s.ballFlightFrom, `pass flight ${JSON.stringify(sel)}`).toBeGreaterThan(0);
      } else {
        expect(s.ballFlightFrom, `no flight ${JSON.stringify(sel)}`).toBeUndefined();
      }
    }
  });

  it("every hotspot lesson id resolves to a real lesson", () => {
    for (const sel of SELECTIONS) {
      const s = deriveScenario(sel);
      for (const h of s.hotspots) {
        if (h.lessonId) expect(lessonById(h.lessonId), `lesson ${h.lessonId}`).toBeTruthy();
      }
    }
  });

  it("provides captions for all three phases", () => {
    for (const sel of SELECTIONS) {
      const s = deriveScenario(sel);
      const phases = new Set(s.captions.map((c) => c.phase));
      expect(phases.has("before")).toBe(true);
      expect(phases.has("read")).toBe(true);
      expect(phases.has("react")).toBe(true);
    }
  });
});

describe("scrambling QB keeps coverage (no run-fit) in Man and Zone", () => {
  it("keeps the SS at coverage depth on a QB scramble", () => {
    const covQB = SELECTIONS.filter(
      (s) => s.outcome === "qb" && (s.call === "Man" || s.call === "Zone"),
    );
    for (const sel of covQB) {
      const s = deriveScenario(sel);
      const ss = s.players.find((p) => p.isSS)!;
      const end = ss.keyframes?.[ss.keyframes.length - 1];
      expect(end, `SS keyframes ${JSON.stringify(sel)}`).toBeTruthy();
      // Coverage depth stays well above the line of scrimmage (y < 42); a
      // run-fit would drive the SS down toward the LOS (~48).
      expect(end!.y, `SS coverage depth ${JSON.stringify(sel)}`).toBeLessThan(42);
    }
  });
});
