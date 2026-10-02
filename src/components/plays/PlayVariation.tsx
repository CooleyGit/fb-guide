import type { OutcomeId } from "../../types";
import { PassIcon, QBRunIcon, RunIcon } from "./icons";

export type DirectionMode = "random" | "strong" | "weak";

// "At the snap" is gone — Replay already starts before the snap, so the choices
// are the three things that actually happen with the ball.
const OUTCOMES: { id: OutcomeId; label: string; Icon: () => React.ReactNode }[] = [
  { id: "run", label: "Run", Icon: () => <RunIcon /> },
  { id: "pass", label: "Pass", Icon: () => <PassIcon /> },
  { id: "qb", label: "QB run", Icon: () => <QBRunIcon /> },
];

const DIRECTIONS: { id: DirectionMode; label: string }[] = [
  { id: "random", label: "Random" },
  { id: "strong", label: "To your edge" },
  { id: "weak", label: "Away from you" },
];

export function PlayVariation({
  outcome,
  onOutcome,
  directionMode,
  onDirectionMode,
  showDirection,
}: {
  outcome: OutcomeId;
  onOutcome: (o: OutcomeId) => void;
  directionMode: DirectionMode;
  onDirectionMode: (d: DirectionMode) => void;
  showDirection: boolean;
}) {
  return (
    <div className="play-variation">
      <div className="variation-row">
        <span className="variation-label">After the snap</span>
        <div className="variation-outcomes" role="radiogroup" aria-label="What happens after the snap">
          {OUTCOMES.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={outcome === o.id}
              className="variation-outcome"
              onClick={() => onOutcome(o.id)}
            >
              {o.Icon()}
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      {showDirection && (
        <div className="variation-row">
          <span className="variation-label">Ball goes</span>
          <div className="direction-group">
            <div className="segmented-track" role="radiogroup" aria-label="Run direction">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  role="radio"
                  aria-checked={directionMode === d.id}
                  className="segment"
                  onClick={() => onDirectionMode(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {directionMode === "random" && (
              <span className="direction-hint">Picks a side each time you play — lock one to drill it.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
