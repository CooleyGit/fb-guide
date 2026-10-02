import type { Keyframe, PhaseId, Point } from "../types";
import { READ_T, SNAP_T } from "../data/scenario";

/** Linear position along a keyframe track at normalized time t (0..1). */
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

function catmull(p0: number, p1: number, p2: number, p3: number, u: number): number {
  const u2 = u * u;
  const u3 = u2 * u;
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
}

/**
 * Smooth (Catmull-Rom) position along keyframes at time t. The marker and its
 * drawn arrow share this curve, so a player always follows its own line.
 */
export function splinePositionAt(frames: Keyframe[] | undefined, t: number, fallback: Point): Point {
  if (!frames || frames.length === 0) return fallback;
  if (frames.length === 1) return { x: frames[0]!.x, y: frames[0]!.y };
  if (t <= frames[0]!.t) return { x: frames[0]!.x, y: frames[0]!.y };
  const last = frames[frames.length - 1]!;
  if (t >= last.t) return { x: last.x, y: last.y };
  let i = 0;
  while (i < frames.length - 1 && !(t >= frames[i]!.t && t <= frames[i + 1]!.t)) i++;
  const p1 = frames[i]!;
  const p2 = frames[i + 1]!;
  const p0 = frames[i - 1] ?? p1;
  const p3 = frames[i + 2] ?? p2;
  const span = p2.t - p1.t || 1;
  const u = (t - p1.t) / span;
  return { x: catmull(p0.x, p1.x, p2.x, p3.x, u), y: catmull(p0.y, p1.y, p2.y, p3.y, u) };
}

/** Build an SVG path "d" through waypoints as a smooth Catmull-Rom spline. */
export function splinePathData(points: Point[], scale = 1): string {
  const pts: Point[] = [];
  for (const p of points) {
    const prev = pts[pts.length - 1];
    if (!prev || Math.abs(prev.x - p.x) > 0.01 || Math.abs(prev.y - p.y) > 0.01) pts.push(p);
  }
  if (pts.length < 2) return "";
  let d = `M ${pts[0]!.x * scale} ${pts[0]!.y * scale}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? pts[i + 1]!;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x * scale} ${c1y * scale} ${c2x * scale} ${c2y * scale} ${p2.x * scale} ${p2.y * scale}`;
  }
  return d;
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
