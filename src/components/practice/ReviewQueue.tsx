import type { Selection } from "../../types";
import { useAppState } from "../../state/AppState";
import { deriveScenario } from "../../data/scenario";

export function ReviewQueue({ onPractice }: { onPractice: (selections: Selection[]) => void }) {
  const { state, unqueueReview, clearReview } = useAppState();
  const queue = state.reviewQueue;

  return (
    <section className="review-queue" aria-label="Review queue">
      <h2>Review queue</h2>
      {queue.length === 0 ? (
        <p className="empty-state">
          Reps you mark <strong>Review again</strong> during practice collect here, so you can come back to the ones
          that need work.
        </p>
      ) : (
        <>
          <div className="review-actions">
            <button type="button" className="primary-button" onClick={() => onPractice(queue)}>
              Practice review reps ({queue.length})
            </button>
            <button type="button" className="link-button" onClick={clearReview}>
              Clear queue
            </button>
          </div>
          <ul className="review-list">
            {queue.map((s) => (
              <li key={`${s.call}-${s.side}-${s.formation}-${s.outcome}`}>
                <span>{deriveScenario(s).scenarioTitle}</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Remove from review queue"
                  onClick={() => unqueueReview(s)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
