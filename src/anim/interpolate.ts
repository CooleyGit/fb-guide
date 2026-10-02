import type { Keyframe, PhaseId, Point } from "../types";
import { READ_T, SNAP_T } from "../data/scenario";

/** Position along a keyframe track at normalized time t (0..1). */
export function positionAt(frames: Keyframe[] | undefined, t: number, fallback: Point): Point {
  if (!frames || frames.length === 0) return fallback;
  if (t <= frames[0]!.t) return { x: frames[0]!.x, y: frames[0]!.y };
  const last = frames[frames.length - 1]!;
  if (t >= last.t) return { x: last.x, y: last.y };
  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i]!;
    const b = frames[i + 1]!;
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t || 1;
      const k = (t - a.t) / span;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
  }
  return { x: last.x, y: last.y };
}

export function phaseOf(t: number): PhaseId {
  if (t < SNAP_T) return "before";
  if (t < READ_T) return "read";
  return "react";
}

/** Seek target (normalized time) for the start of a phase. */
export function phaseSeekTime(phase: PhaseId): number {
  switch (phase) {
    case "before":
      return 0;
    case "read":
      return SNAP_T;
    case "react":
      return READ_T;
  }
}

export const PHASE_LABELS: Record<PhaseId, string> = {
  before: "Before snap",
  read: "Read",
  react: "React",
};

export const PHASE_ORDER: PhaseId[] = ["before", "read", "react"];
