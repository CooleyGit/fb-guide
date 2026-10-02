import { beforeEach, describe, expect, it } from "vitest";
import {
  coerceSelection,
  DEFAULT_SELECTION,
  isValidSelection,
  parseSelectionParams,
  selectionToParams,
  selectionsEqual,
} from "./validation";
import { loadPersisted, savePersisted, DEFAULT_PERSISTED, STORAGE_KEY } from "./storage";
import { generateReps, nextSelection } from "./practiceGen";
import type { Selection } from "../types";

describe("selection validation", () => {
  it("accepts a well-formed selection and rejects junk", () => {
    expect(isValidSelection({ call: "Man", side: "left", formation: "i", outcome: "pass" })).toBe(true);
    expect(isValidSelection({ call: "Nope", side: "left", formation: "i", outcome: "pass" })).toBe(false);
    expect(isValidSelection(null)).toBe(false);
    expect(isValidSelection("x")).toBe(false);
  });

  it("coerces partial/invalid parts to the fallback", () => {
    const s = coerceSelection({ call: "Zone", side: "nonsense" }, DEFAULT_SELECTION);
    expect(s.call).toBe("Zone");
    expect(s.side).toBe(DEFAULT_SELECTION.side);
    expect(isValidSelection(s)).toBe(true);
  });

  it("round-trips through URL params", () => {
    const sel: Selection = { call: "Blitz", side: "middle-right", formation: "empty", outcome: "qb" };
    const params = selectionToParams(sel);
    expect(parseSelectionParams(params)).toEqual(sel);
  });

  it("recovers from malformed params without throwing", () => {
    const params = new URLSearchParams("call=??&ball=&formation=99&outcome=punt&hide=1");
    const sel = parseSelectionParams(params);
    expect(isValidSelection(sel)).toBe(true);
    expect(selectionsEqual(sel, DEFAULT_SELECTION)).toBe(true);
  });
});

describe("persistence", () => {
  beforeEach(() => localStorage.clear());

  it("returns defaults when nothing is stored", () => {
    expect(loadPersisted()).toEqual(DEFAULT_PERSISTED);
  });

  it("round-trips a saved state", () => {
    const state = {
      ...DEFAULT_PERSISTED,
      lastSelection: { call: "Man", side: "left", formation: "i", outcome: "read" } as Selection,
      favorites: [
        { id: "a", selection: { call: "Zone", side: "right", formation: "twins", outcome: "pass" } as Selection, title: "Zone twins", createdAt: 1 },
      ],
    };
    savePersisted(state);
    expect(loadPersisted()).toEqual(state);
  });

  it("discards malformed persisted data and recovers", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(loadPersisted()).toEqual(DEFAULT_PERSISTED);
  });

  it("drops favorites with invalid selections", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        favorites: [
          { id: "ok", selection: { call: "Man", side: "left", formation: "i", outcome: "read" }, title: "ok" },
          { id: "bad", selection: { call: "???" }, title: "bad" },
        ],
      }),
    );
    const loaded = loadPersisted();
    expect(loaded.favorites).toHaveLength(1);
    expect(loaded.favorites[0]!.id).toBe("ok");
  });

  it("starts fresh on a schema version mismatch", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999, favorites: [{ id: "x" }] }));
    expect(loadPersisted().favorites).toEqual([]);
  });
});

describe("practice generation", () => {
  it("generates the requested number of reps honoring filters", () => {
    const reps = generateReps(5, { call: "Man", formation: "trips" });
    expect(reps).toHaveLength(5);
    for (const r of reps) {
      expect(r.call).toBe("Man");
      expect(r.formation).toBe("trips");
    }
  });

  it("does not immediately repeat the same selection", () => {
    const prev: Selection = { call: "Man", side: "left", formation: "i", outcome: "read" };
    // With a fixed call+formation+ (only side/outcome vary) there are still
    // multiple combinations, so a different rep is reachable.
    for (let i = 0; i < 50; i++) {
      const next = nextSelection(prev, { call: "Man", formation: "i" });
      expect(selectionsEqual(next, prev)).toBe(false);
    }
  });
});
