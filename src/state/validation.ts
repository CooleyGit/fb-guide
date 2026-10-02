import type { CallId, FormationId, OutcomeId, SideId, Selection } from "../types";
import { CALL_ORDER, OUTCOME_ORDER } from "../data/calls";
import { FORMATION_ORDER } from "../data/formations";
import { SIDE_ORDER } from "../data/sides";

export const DEFAULT_SELECTION: Selection = {
  call: "Man",
  side: "left",
  formation: "i",
  outcome: "read",
};

export function isCall(v: unknown): v is CallId {
  return typeof v === "string" && (CALL_ORDER as string[]).includes(v);
}
export function isSide(v: unknown): v is SideId {
  return typeof v === "string" && (SIDE_ORDER as string[]).includes(v);
}
export function isFormation(v: unknown): v is FormationId {
  return typeof v === "string" && (FORMATION_ORDER as string[]).includes(v);
}
export function isOutcome(v: unknown): v is OutcomeId {
  return typeof v === "string" && (OUTCOME_ORDER as string[]).includes(v);
}

export function isValidSelection(v: unknown): v is Selection {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return isCall(s.call) && isSide(s.side) && isFormation(s.formation) && isOutcome(s.outcome);
}

/** Build a complete, valid selection from unknown parts, filling gaps safely. */
export function coerceSelection(
  parts: Partial<Record<keyof Selection, unknown>>,
  fallback: Selection = DEFAULT_SELECTION,
): Selection {
  return {
    call: isCall(parts.call) ? parts.call : fallback.call,
    side: isSide(parts.side) ? parts.side : fallback.side,
    formation: isFormation(parts.formation) ? parts.formation : fallback.formation,
    outcome: isOutcome(parts.outcome) ? parts.outcome : fallback.outcome,
  };
}

/** Read a selection from router search params; unknown values fall back safely. */
export function parseSelectionParams(
  params: URLSearchParams,
  fallback: Selection = DEFAULT_SELECTION,
): Selection {
  return coerceSelection(
    {
      call: params.get("call") ?? undefined,
      side: params.get("ball") ?? undefined,
      formation: params.get("formation") ?? undefined,
      outcome: params.get("outcome") ?? undefined,
    },
    fallback,
  );
}

export function selectionToParams(selection: Selection, hideAnswers?: boolean): URLSearchParams {
  const params = new URLSearchParams({
    call: selection.call,
    ball: selection.side,
    formation: selection.formation,
    outcome: selection.outcome,
  });
  if (hideAnswers) params.set("hide", "1");
  return params;
}

export function selectionsEqual(a: Selection, b: Selection): boolean {
  return a.call === b.call && a.side === b.side && a.formation === b.formation && a.outcome === b.outcome;
}

export function selectionKey(s: Selection): string {
  return `${s.call}|${s.side}|${s.formation}|${s.outcome}`;
}
