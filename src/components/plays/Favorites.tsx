import type { Selection } from "../../types";
import { useAppState } from "../../state/AppState";
import { selectionsEqual } from "../../state/validation";

export function Favorites({
  current,
  onLaunch,
  onPractice,
}: {
  current: Selection;
  onLaunch: (selection: Selection) => void;
  onPractice: (selection: Selection) => void;
}) {
  const { state, removeFavorite } = useAppState();
  const favorites = state.favorites;

  return (
    <section className="favorites" aria-label="Saved reps">
      <h2 className="favorites-head">Saved reps</h2>
      {favorites.length === 0 ? (
        <p className="empty-state">
          No saved reps yet. Tap <strong>☆ Favorite</strong> on a play you want to come back to, then launch or practice
          it from here.
        </p>
      ) : (
        <ul className="favorites-list">
          {favorites.map((f) => (
            <li key={f.id} className={selectionsEqual(f.selection, current) ? "favorite active" : "favorite"}>
              <button type="button" className="favorite-launch" onClick={() => onLaunch(f.selection)}>
                {f.title}
              </button>
              <div className="favorite-actions">
                <button type="button" className="link-button" onClick={() => onPractice(f.selection)}>
                  Practice
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove ${f.title}`}
                  onClick={() => removeFavorite(f.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
