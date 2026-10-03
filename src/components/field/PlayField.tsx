import type { DerivedPlayer, Hotspot, Scenario } from "../../types";
import { DESIGN_SCALE } from "../../data/geometry";
import { FootballField } from "./FootballField";
import { PlayerMarker, SSGhost } from "./PlayerMarker";
import { AssignmentPath, BallMarker, BallPath, CoverageArea, FinishBurst, PathDefs, PreSnapRead } from "./FieldPaths";
import { HotspotPins } from "./Tips";

const S = DESIGN_SCALE;

/** Players that open a contextual tip when tapped, mapped to a hotspot anchor. */
function hotspotForPlayer(player: DerivedPlayer, scenario: Scenario): Hotspot | undefined {
  const find = (id: string) => scenario.hotspots.find((h) => h.id === id);
  if (player.isSS) return find("hs-ss");
  if (player.id === scenario.keyId) return find("hs-assigned");
  if (player.id === "qb" || player.id === "rb") return find("hs-mesh");
  return undefined;
}

export function PlayField({
  scenario,
  hideAnswers,
  tipsEnabled,
  coachView,
  ghost,
  highlightIds,
  openTipId,
  showLabels = true,
  onOpenTip,
}: {
  scenario: Scenario;
  hideAnswers: boolean;
  tipsEnabled: boolean;
  coachView: boolean;
  ghost: boolean;
  highlightIds: Set<string>;
  openTipId: string | null;
  showLabels?: boolean;
  onOpenTip: (hotspot: Hotspot, invoker: HTMLElement | SVGElement | null) => void;
}) {
  const dimActive = highlightIds.size > 0;
  const isDim = (id: string) => dimActive && !highlightIds.has(id);
  const isHi = (id: string) => dimActive && highlightIds.has(id);

  const visibleHotspots = tipsEnabled
    ? scenario.hotspots.filter((h) => h.pin !== false && !(hideAnswers && h.revealsAnswer))
    : [];

  const offense = scenario.players.filter((p) => p.side === "offense");
  const defense = scenario.players.filter((p) => p.side === "defense");

  // The player your eyes start on (pre-snap read cue).
  const readKey = scenario.players.find((p) => p.id === scenario.keyId);
  const readKeyLabel = readKey ? (readKey.role === "TE" ? "WATCH THE TE" : `WATCH No. ${readKey.no ?? 2}`) : "";

  return (
    <>
      <PathDefs />
      <FootballField />

      {/* Coverage shading (defensive answer). */}
      {!hideAnswers && scenario.zone && (
        <CoverageArea
          zone={scenario.zone}
          dim={isDim("ss")}
          showLabel={showLabels}
          drop={scenario.selection.outcome === "run"}
        />
      )}

      {/* Assignment arrows: read (yellow) → react (green) for the SS, maroon for
          teammates/receiver routes. Each draws in sync with its player. */}
      {scenario.paths
        .filter((p) => !(hideAnswers && p.revealsAnswer))
        .map((p) => {
          const owner = scenario.players.find((pl) => `${pl.id}-path` === p.id);
          return (
            <AssignmentPath
              key={p.id}
              path={p}
              frames={owner?.keyframes}
              dim={p.kind === "ss" ? isDim("ss") : dimActive}
              highlighted={p.kind === "ss" && isHi("ss")}
              showLabel={showLabels && !hideAnswers}
            />
          );
        })}

      {/* Pre-snap: cue your eyes to the key before the play develops. */}
      {!hideAnswers && readKey && <PreSnapRead at={{ x: readKey.x, y: readKey.y }} label={readKeyLabel} />}

      {/* Ball trajectory (hidden in study mode so it can't pre-reveal the play);
          the ball marker still animates when the athlete presses play. */}
      {!hideAnswers && <BallPath frames={scenario.ballKeyframes} flightFrom={scenario.ballFlightFrom} />}

      {/* Pre-snap ghost of the SS. */}
      {ghost && !hideAnswers && <SSGhost player={scenario.players.find((p) => p.isSS)!} />}

      {/* Offense markers (always animate; the stimulus). */}
      {offense.map((p) => {
        const hs = hotspotForPlayer(p, scenario);
        return (
          <PlayerMarker
            key={p.id}
            player={p}
            showLabel={showLabels}
            dim={isDim(p.id)}
            highlighted={isHi(p.id)}
            interactive={tipsEnabled && !!hs && !(hideAnswers && hs.revealsAnswer)}
            onActivate={hs ? () => onOpenTip(hs, null) : undefined}
          />
        );
      })}

      {/* Defense markers (freeze in study mode so motion never reveals the answer). */}
      {defense.map((p) => {
        const hs = hotspotForPlayer(p, scenario);
        const interactive = tipsEnabled && !!hs && !(hideAnswers && hs.revealsAnswer);
        return (
          <PlayerMarker
            key={p.id}
            player={p}
            freeze={hideAnswers}
            showLabel={showLabels}
            dim={isDim(p.id)}
            highlighted={isHi(p.id)}
            interactive={interactive}
            onActivate={hs && interactive ? () => onOpenTip(hs, null) : undefined}
          />
        );
      })}

      <BallMarker frames={scenario.ballKeyframes} />

      {/* Tackle / sack finish — the play ends with the SS making the play. */}
      {scenario.finish && !hideAnswers && <FinishBurst finish={scenario.finish} />}

      {/* Coach view overlays (read key / force edge / coverage outline). */}
      {coachView && !hideAnswers && <CoachOverlays scenario={scenario} />}

      {/* Tappable info pins. */}
      {tipsEnabled && (
        <HotspotPins hotspots={visibleHotspots} openId={openTipId} onOpen={onOpenTip} />
      )}
    </>
  );
}

function CoachOverlays({ scenario }: { scenario: Scenario }) {
  const cv = scenario.coachView;
  return (
    <g className="coach-overlays" aria-hidden="true">
      {cv.readKey && (
        <g className="coach-readkey" transform={`translate(${cv.readKey.at.x * S} ${cv.readKey.at.y * S})`}>
          <circle cx={0} cy={0} r={24} />
          <text x={0} y={-30} textAnchor="middle">
            {cv.readKey.label}
          </text>
        </g>
      )}
      {cv.forceEdge && (
        <g className="coach-forceedge">
          <line
            x1={cv.forceEdge.from.x * S}
            y1={cv.forceEdge.from.y * S}
            x2={cv.forceEdge.to.x * S}
            y2={cv.forceEdge.to.y * S}
          />
          <text
            x={((cv.forceEdge.from.x + cv.forceEdge.to.x) / 2) * S}
            y={cv.forceEdge.from.y * S - 10}
            textAnchor="middle"
          >
            {cv.forceEdge.label}
          </text>
        </g>
      )}
      {cv.coverage && (
        <rect
          className="coach-coverage"
          x={cv.coverage.x * S}
          y={cv.coverage.y * S}
          width={cv.coverage.w * S}
          height={cv.coverage.h * S}
          rx={6}
        />
      )}
    </g>
  );
}
