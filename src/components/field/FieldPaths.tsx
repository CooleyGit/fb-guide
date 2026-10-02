import { motion, useTransform } from "motion/react";
import type { DerivedPath, DerivedZone, Finish, Keyframe, Point } from "../../types";
import { DESIGN_SCALE } from "../../data/geometry";
import { splinePathData, splinePositionAt } from "../../anim/interpolate";
import { usePlayback } from "../../anim/playback";

const S = DESIGN_SCALE;

function dedupe(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    const prev = out[out.length - 1];
    if (!prev || Math.abs(prev.x - p.x) > 0.01 || Math.abs(prev.y - p.y) > 0.01) out.push(p);
  }
  return out;
}

/** Stable arrowhead markers (ids referenced by paths). */
export function PathDefs() {
  return (
    <defs>
      {(
        [
          ["arrow-ss", "var(--ss)"],
          ["arrow-assignment", "var(--maroon)"],
          ["arrow-ball", "var(--ball)"],
        ] as const
      ).map(([id, fill]) => (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 Z" fill={fill} />
        </marker>
      ))}
    </defs>
  );
}

export function AssignmentPath({
  path,
  dim,
  highlighted,
  showLabel = true,
}: {
  path: DerivedPath;
  dim?: boolean;
  highlighted?: boolean;
  showLabel?: boolean;
}) {
  const marker =
    path.kind === "ss" ? "url(#arrow-ss)" : path.kind === "ball" ? "url(#arrow-ball)" : "url(#arrow-assignment)";
  const d = splinePathData(path.points, S);
  if (!d) return null;
  const cls = ["assignment-path", `kind-${path.kind}`, dim ? "dim" : "", highlighted ? "highlighted" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <g className={cls} aria-hidden="true">
      <path d={d} markerEnd={marker} fill="none" />
      {showLabel && path.label && (
        <text className="answer-label" x={path.label.at.x * S} y={path.label.at.y * S} textAnchor="middle">
          {path.label.text}
        </text>
      )}
    </g>
  );
}

export function CoverageArea({
  zone,
  dim,
  showLabel = true,
}: {
  zone: DerivedZone;
  dim?: boolean;
  showLabel?: boolean;
}) {
  return (
    <g className={`coverage-area${dim ? " dim" : ""}`} aria-hidden="true">
      <rect
        className="zone"
        x={zone.x * S}
        y={zone.y * S}
        width={zone.w * S}
        height={zone.h * S}
        rx={6}
      />
      {showLabel && (
        <text className="answer-label" x={zone.labelAt.x * S} y={zone.labelAt.y * S} textAnchor="middle">
          {zone.label}
        </text>
      )}
    </g>
  );
}

/** Static trajectory the ball travels (gray-blue); the thrown flight is dashed. */
export function BallPath({ frames, flightFrom }: { frames: Keyframe[]; flightFrom?: number }) {
  if (frames.length < 2) return null;
  const carry = dedupe(frames.filter((f) => flightFrom === undefined || f.t <= flightFrom).map((f) => ({ x: f.x, y: f.y })));
  const flight = flightFrom !== undefined ? dedupe(frames.filter((f) => f.t >= flightFrom).map((f) => ({ x: f.x, y: f.y }))) : [];
  const flightPts = flight.map((p) => `${p.x * S},${p.y * S}`).join(" ");
  return (
    <g className="ball-path" aria-hidden="true">
      {carry.length >= 2 && (
        <path d={splinePathData(carry, S)} fill="none" markerEnd={flight.length ? undefined : "url(#arrow-ball)"} />
      )}
      {flight.length >= 2 && (
        <polyline className="flight" points={flightPts} fill="none" markerEnd="url(#arrow-ball)" />
      )}
    </g>
  );
}

/** Impact emphasis where the SS meets the ball carrier (run/qb finish). */
export function FinishBurst({ finish }: { finish: Finish }) {
  const { progress } = usePlayback();
  const opacity = useTransform(progress, [finish.from, finish.from + 0.06, 0.98, 1], [0, 1, 1, 0.9]);
  const scale = useTransform(progress, [finish.from, 1], [0.4, 1.2]);
  return (
    <motion.g
      className={`finish finish-${finish.kind}`}
      transform={`translate(${finish.at.x * S} ${finish.at.y * S})`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <motion.circle className="finish-ring" cx={0} cy={0} r={32} style={{ scale }} />
      <text className="finish-label" x={0} y={-42} textAnchor="middle">
        {finish.label}
      </text>
    </motion.g>
  );
}

export function BallMarker({ frames }: { frames: Keyframe[] }) {
  const { progress } = usePlayback();
  const fallback = { x: frames[0]?.x ?? 50, y: frames[0]?.y ?? 50 };
  const x = useTransform(progress, (t) => splinePositionAt(frames, t, fallback).x * S);
  const y = useTransform(progress, (t) => splinePositionAt(frames, t, fallback).y * S);
  return (
    <motion.g className="ball-marker" style={{ x, y }} aria-hidden="true">
      <ellipse cx={0} cy={0} rx={7} ry={11} transform="rotate(28)" />
      <line className="laces" x1={-3} x2={3} y1={0} y2={0} />
    </motion.g>
  );
}
