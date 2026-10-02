import { motion, useTransform } from "motion/react";
import type { DerivedPath, DerivedZone, Keyframe } from "../../types";
import { DESIGN_SCALE } from "../../data/geometry";
import { positionAt } from "../../anim/interpolate";
import { usePlayback } from "../../anim/playback";

const S = DESIGN_SCALE;

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
  const d = `M ${path.from.x * S} ${path.from.y * S} Q ${path.control.x * S} ${path.control.y * S} ${
    path.to.x * S
  } ${path.to.y * S}`;
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

/** Static trajectory the ball travels (gray-blue); flight segment is dashed. */
export function BallPath({ frames, flightFrom }: { frames: Keyframe[]; flightFrom?: number }) {
  if (frames.length < 2) return null;
  const carry = frames.filter((f) => flightFrom === undefined || f.t <= flightFrom);
  const flight = flightFrom !== undefined ? frames.filter((f) => f.t >= flightFrom) : [];
  const toPts = (fs: Keyframe[]) => fs.map((f) => `${f.x * S},${f.y * S}`).join(" ");
  return (
    <g className="ball-path" aria-hidden="true">
      {carry.length >= 2 && <polyline points={toPts(carry)} fill="none" markerEnd={flight.length ? undefined : "url(#arrow-ball)"} />}
      {flight.length >= 2 && (
        <polyline className="flight" points={toPts(flight)} fill="none" markerEnd="url(#arrow-ball)" />
      )}
    </g>
  );
}

export function BallMarker({ frames }: { frames: Keyframe[] }) {
  const { progress } = usePlayback();
  const fallback = { x: frames[0]?.x ?? 50, y: frames[0]?.y ?? 50 };
  const x = useTransform(progress, (t) => positionAt(frames, t, fallback).x * S);
  const y = useTransform(progress, (t) => positionAt(frames, t, fallback).y * S);
  return (
    <motion.g className="ball-marker" style={{ x, y }} aria-hidden="true">
      <ellipse cx={0} cy={0} rx={7} ry={11} transform="rotate(28)" />
      <line className="laces" x1={-3} x2={3} y1={0} y2={0} />
    </motion.g>
  );
}
