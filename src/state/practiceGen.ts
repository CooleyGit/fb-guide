import type { CallId, FormationId, OutcomeId, Selection, SideId } from "../types";
import { CALL_ORDER, OUTCOME_ORDER } from "../data/calls";
import { FORMATION_ORDER } from "../data/formations";
import { SIDE_ORDER } from "../data/sides";
import { selectionsEqual } from "./validation";

export interface PracticeFilter {
  call?: CallId;
  formation?: FormationId;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

// Practice reps start before the snap so the athlete predicts the read; the
// outcome is still varied so reps cover run, pass, and QB keepers.
const PRACTICE_OUTCOMES: OutcomeId[] = OUTCOME_ORDER;

export function randomSelection(filter: PracticeFilter): Selection {
  return {
    call: filter.call ?? pick(CALL_ORDER),
    side: pick(SIDE_ORDER) as SideId,
    formation: filter.formation ?? pick(FORMATION_ORDER),
    outcome: pick(PRACTICE_OUTCOMES),
  };
}

/** A fresh selection that is not identical to the previous rep. */
export function nextSelection(prev: Selection | null, filter: PracticeFilter): Selection {
  let next = randomSelection(filter);
  for (let i = 0; i < 12 && prev && selectionsEqual(next, prev); i++) {
    next = randomSelection(filter);
  }
  return next;
}

export function generateReps(count: number, filter: PracticeFilter): Selection[] {
  const reps: Selection[] = [];
  let prev: Selection | null = null;
  for (let i = 0; i < count; i++) {
    const sel = nextSelection(prev, filter);
    reps.push(sel);
    prev = sel;
  }
  return reps;
}
