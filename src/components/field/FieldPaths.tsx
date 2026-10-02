import { motion, useTransform } from "motion/react";
import type { DerivedPath, DerivedZone, Finish, Keyframe, Point } from "../../types";
import { DESIGN_SCALE } from "../../data/geometry";
import { READ_T, SNAP_T } from "../../data/scenario";
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

/** Sample a keyframe track at even time steps between t0..t1 (so revealing a
 * fraction of the drawn line matches the same fraction of elapsed time). */
function sampleTrack(frames: Keyframe[], t0: number, t1: number, n = 16): Point[] {
  const fallback = { x: frames[0]?.x ?? 50, y: frames[0]?.y ?? 50 };
  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    pts.push(splinePositionAt(frames, t0 + (t1 - t0) * (i / n), fallback));
  }
  return pts;
}

/** Heading (deg) of the final sampled segment, for a static arrowhead. */
function endAngle(pts: Point[]): number {
  const b = pts[pts.length - 1]!;
  let a = pts[pts.length - 2] ?? b;
  // Walk back to the last point that differs, so a held tail still has a heading.
  for (let i = pts.length - 2; i >= 0; i--) {
    if (Math.abs(pts[i]!.x - b.x) > 0.01 || Math.abs(pts[i]!.y - b.y) > 0.01) {
      a = pts[i]!;
      break;
    }
  }
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

const ARROW_D = "M 0 0 L -26 -13 L -26 13 Z"; // tip at origin, pointing +x

/**
 * One phase-colored, progressively-drawn segment of a player's path. The stroke
 * reveals from the start as `progress` moves from `from`→`to`; a filled
 * arrowhead fades in at the end as the segment completes.
 */
function RevealSegment({
  pts,
  from,
  to,
  strokeClass,
  arrowClass,
}: {
  pts: Point[];
  from: number;
  to: number;
  strokeClass: string;
  arrowClass: string;
}) {
  const { progress } = usePlayback();
  const dashoffset = useTransform(progress, [from, to], [1, 0]);
  const groupOpacity = useTransform(progress, [from - 0.001, from], [0, 1]);
  const arrowOpacity = useTransform(progress, [to - 0.08, to], [0, 1]);
  const d = splinePathData(pts, S);
  const end = pts[pts.length - 1];
  if (!d || !end) return null;
  const ang = endAngle(pts);
  return (
    <motion.g style={{ opacity: groupOpacity }} aria-hidden="true">
      <motion.path className={strokeClass} d={d} fill="none" pathLength={1} strokeDasharray={1} style={{ strokeDashoffset: dashoffset }} />
      <motion.path
        className={arrowClass}
        d={ARROW_D}
        transform={`translate(${end.x * S} ${end.y * S}) rotate(${ang})`}
        style={{ opacity: arrowOpacity }}
      />
    </motion.g>
  );
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
  frames,
  dim,
  highlighted,
  showLabel = true,
}: {
  path: DerivedPath;
  /** The owning player's keyframes, so the line can draw in sync with them. */
  frames?: Keyframe[];
  dim?: boolean;
  highlighted?: boolean;
  showLabel?: boolean;
}) {
  const { progress } = usePlayback();
  // The route/assignment label fades in once the play is underway.
  const labelOpacity = useTransform(progress, [SNAP_T, READ_T], [0, 1]);
  const cls = ["assignment-path", `kind-${path.kind}`, dim ? "dim" : "", highlighted ? "highlighted" : ""]
    .filter(Boolean)
    .join(" ");
  const isSS = path.kind === "ss";

  // Progressive reveal: nothing before the snap, then the read movement (yellow)
  // and the reaction to the ball (green) draw in sync with the player.
  if (frames && frames.length >= 2) {
    return (
      <g className={cls} aria-hidden="true">
        {isSS ? (
          <>
            <RevealSegment pts={sampleTrack(frames, SNAP_T, READ_T)} from={SNAP_T} to={READ_T} strokeClass="path-seg seg-read" arrowClass="seg-arrow arrow-read" />
            <RevealSegment pts={sampleTrack(frames, READ_T, 1)} from={READ_T} to={1} strokeClass="path-seg seg-react" arrowClass="seg-arrow arrow-react" />
          </>
        ) : (
          <RevealSegment pts={sampleTrack(frames, SNAP_T, 1)} from={SNAP_T} to={1} strokeClass="path-seg seg-assignment" arrowClass="seg-arrow arrow-assignment" />
        )}
        {showLabel && path.label && (
          <motion.text
            className="answer-label"
            x={path.label.at.x * S}
            y={path.label.at.y * S}
            textAnchor="middle"
            style={{ opacity: labelOpacity }}
          >
            {path.label.text}
          </motion.text>
        )}
      </g>
    );
  }

  // Fallback (no timing available): draw the whole line statically.
  const marker = isSS ? "url(#arrow-ss)" : path.kind === "ball" ? "url(#arrow-ball)" : "url(#arrow-assignment)";
  const d = splinePathData(path.points, S);
  if (!d) return null;
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

/** Ball trajectory (gray-blue), revealed as it travels; the thrown flight is a
 * dashed segment that appears when the ball leaves the QB. Hidden pre-snap. */
export function BallPath({ frames, flightFrom }: { frames: Keyframe[]; flightFrom?: number }) {
  const { progress } = usePlayback();
  const carryTo = flightFrom ?? 1;
  const groupOpacity = useTransform(progress, [SNAP_T - 0.001, SNAP_T], [0, 1]);
  const carryOffset = useTransform(progress, [SNAP_T, carryTo], [1, 0]);
  const flightOpacity = useTransform(progress, [carryTo - 0.03, carryTo], [0, 1]);
  if (frames.length < 2) return null;
  const carry = dedupe(frames.filter((f) => flightFrom === undefined || f.t <= flightFrom).map((f) => ({ x: f.x, y: f.y })));
  const flight = flightFrom !== undefined ? dedupe(frames.filter((f) => f.t >= flightFrom).map((f) => ({ x: f.x, y: f.y }))) : [];
  const flightPts = flight.map((p) => `${p.x * S},${p.y * S}`).join(" ");
  const carryD = carry.length >= 2 ? splinePathData(carry, S) : "";
  return (
    <motion.g className="ball-path" style={{ opacity: groupOpacity }} aria-hidden="true">
      {carryD && <motion.path d={carryD} fill="none" pathLength={1} strokeDasharray={1} style={{ strokeDashoffset: carryOffset }} />}
      {flight.length >= 2 && (
        <motion.polyline className="flight" points={flightPts} fill="none" markerEnd="url(#arrow-ball)" style={{ opacity: flightOpacity }} />
      )}
    </motion.g>
  );
}

/** Pre-snap "watch this player" cue: a pulsing ring on your key that fades once
 * the ball is snapped (so you set your eyes before the play develops). */
export function PreSnapRead({ at, label }: { at: Point; label: string }) {
  const { progress } = usePlayback();
  const opacity = useTransform(progress, [0, SNAP_T, READ_T], [1, 1, 0]);
  return (
    <motion.g className="read-hint" transform={`translate(${at.x * S} ${at.y * S})`} style={{ opacity }} aria-hidden="true">
      <circle className="read-hint-ring" cx={0} cy={0} r={34} />
      <text className="read-hint-label" x={0} y={-46} textAnchor="middle">
        {label}
      </text>
    </motion.g>
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
