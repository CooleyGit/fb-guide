import { useEffect } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent } from "motion/react";
import type { DerivedPlayer } from "../../types";
import { DESIGN_SCALE, R } from "../../data/geometry";
import { positionAt, splinePositionAt } from "../../anim/interpolate";
import { usePlayback } from "../../anim/playback";

const S = DESIGN_SCALE;

export function PlayerMarker({
  player,
  freeze,
  highlighted,
  dim,
  showLabel = true,
  onActivate,
  interactive,
}: {
  player: DerivedPlayer;
  freeze?: boolean;
  highlighted?: boolean;
  dim?: boolean;
  showLabel?: boolean;
  onActivate?: (player: DerivedPlayer) => void;
  interactive?: boolean;
}) {
  const { progress, reduced } = usePlayback();
  const base = { x: player.x, y: player.y };
  const frames = player.keyframes;

  // The marker owns its position so that playback updates it frame-exactly,
  // while a formation/selection change glides it to the new pre-snap spot.
  const first = positionAt(frames, 0, base);
  const mx = useMotionValue(first.x * S);
  const my = useMotionValue(first.y * S);

  // Follow the timeline exactly along the player's own spline (no re-render).
  useMotionValueEvent(progress, "change", (t) => {
    const p = splinePositionAt(frames, freeze ? 0 : t, base);
    mx.set(p.x * S);
    my.set(p.y * S);
  });

  // On selection change (progress is reset to 0), ease to the new alignment.
  useEffect(() => {
    const target = splinePositionAt(frames, freeze ? 0 : progress.get(), base);
    if (progress.get() === 0 && !reduced) {
      const ax = animate(mx, target.x * S, { duration: 0.32, ease: "easeInOut" });
      const ay = animate(my, target.y * S, { duration: 0.32, ease: "easeInOut" });
      return () => {
        ax.stop();
        ay.stop();
      };
    }
    mx.set(target.x * S);
    my.set(target.y * S);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.x, base.y, frames, freeze, reduced]);

  const isOffense = player.side === "offense";
  const r = player.isSS ? R.ss : R.defender;

  const classes = [
    "player",
    isOffense ? "offense" : "defender",
    player.isSS ? "ss" : "",
    player.isKey ? "is-key" : "",
    highlighted ? "highlighted" : "",
    dim ? "dim" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const activate = onActivate ? () => onActivate(player) : undefined;

  return (
    <motion.g
      className={classes}
      style={{ x: mx, y: my }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `${describe(player)} — open tip` : undefined}
      onClick={activate}
      onKeyDown={
        interactive && activate
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                activate();
              }
            }
          : undefined
      }
    >
      {player.isSS && <circle className="ss-focus-ring" cx={0} cy={0} r={r + 8} />}
      {isOffense ? (
        <rect x={-R.offense} y={-R.offense} width={R.offense * 2} height={R.offense * 2} rx={3} />
      ) : (
        <circle cx={0} cy={0} r={r} />
      )}
      {showLabel && (
        <text className="player-label" x={0} y={1} textAnchor="middle" dominantBaseline="middle">
          {player.label}
        </text>
      )}
    </motion.g>
  );
}

/** Faded ghost of the SS pre-snap position, for teaching his movement. */
export function SSGhost({ player }: { player: DerivedPlayer }) {
  const base = positionAt(player.keyframes, 0, { x: player.x, y: player.y });
  return (
    <g className="ss-ghost" aria-hidden="true" transform={`translate(${base.x * S} ${base.y * S})`}>
      <circle cx={0} cy={0} r={R.ss} />
      <text className="player-label" x={0} y={1} textAnchor="middle" dominantBaseline="middle">
        SS
      </text>
    </g>
  );
}

function describe(player: DerivedPlayer): string {
  if (player.isSS) return "Strong safety";
  const roleNames: Record<string, string> = {
    QB: "Quarterback",
    RB: "Running back",
    FB: "Fullback",
    TE: "Tight end",
    WR: "Receiver",
    slot: "Slot receiver",
    CB: "Cornerback",
    FS: "Free safety",
    WS: "Weak safety",
    LB: "Linebacker",
    DE: "Defensive end",
    DT: "Defensive tackle",
    OL: "Offensive lineman",
  };
  return roleNames[player.role] ?? player.label;
}
