import type { OutcomeId, RunDirection } from "../../types";
import { PassIcon, QBRunIcon, RunIcon } from "./icons";

// "At the snap" is gone — Replay already starts before the snap, so the choices
// are the three things that actually happen with the ball.
const OUTCOMES: { id: OutcomeId; label: string; Icon: () => React.ReactNode }[] = [
  { id: "run", label: "Run", Icon: () => <RunIcon /> },
  { id: "pass", label: "Pass", Icon: () => <PassIcon /> },
  { id: "qb", label: "QB run", Icon: () => <QBRunIcon /> },
];

export function PlayVariation({
  outcome,
  onOutcome,
  runDirection,
  onRunDirection,
  showDirection,
}: {
  outcome: OutcomeId;
  onOutcome: (o: OutcomeId) => void;
  runDirection: RunDirection;
  onRunDirection: (d: RunDirection) => void;
  showDirection: boolean;
}) {
  return (
    <div className="play-variation">
      <div className="variation-row">
        <span className="variation-label">The play</span>
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
          <div className="variation-direction" role="radiogroup" aria-label="Run direction">
            <button type="button" role="radio" aria-checked={runDirection === "strong"} className="variation-dir" onClick={() => onRunDirection("strong")}>
              To your edge
            </button>
            <button type="button" role="radio" aria-checked={runDirection === "weak"} className="variation-dir" onClick={() => onRunDirection("weak")}>
              Away from you
            </button>
            <button type="button" className="shuffle" onClick={() => onRunDirection(Math.random() < 0.5 ? "strong" : "weak")} aria-label="Shuffle run direction">
              🎲 Mix it up
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
