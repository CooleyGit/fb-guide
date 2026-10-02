import { useEffect, useRef, useState } from "react";
import { useAppState } from "../../state/AppState";
import type { FieldView, MotionPref } from "../../state/storage";
import { REFERENCES } from "../../data/references";

const MOTION_OPTIONS: { value: MotionPref; label: string }[] = [
  { value: "system", label: "Match my device" },
  { value: "full", label: "Full animation" },
  { value: "reduced", label: "Reduced motion (step through)" },
];

const VIEW_OPTIONS: { value: FieldView; label: string }[] = [
  { value: "detail", label: "Readable detail (centered on SS)" },
  { value: "fit", label: "Whole field" },
  { value: "focus", label: "Focus on the SS edge" },
];

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, setPreference, clearAllData } = useAppState();
  const prefs = state.preferences;
  const dialogRef = useRef<HTMLDivElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="settings-overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Settings and help"
        tabIndex={-1}
      >
        <div className="settings-head">
          <h2>Settings &amp; help</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <fieldset className="settings-group">
          <legend>Motion</legend>
          {MOTION_OPTIONS.map((o) => (
            <label key={o.value} className="radio-row">
              <input
                type="radio"
                name="motion"
                checked={prefs.motion === o.value}
                onChange={() => setPreference({ motion: o.value })}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="settings-group">
          <legend>Default field view</legend>
          {VIEW_OPTIONS.map((o) => (
            <label key={o.value} className="radio-row">
              <input
                type="radio"
                name="fieldView"
                checked={prefs.fieldView === o.value}
                onChange={() => setPreference({ fieldView: o.value })}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </fieldset>

        <section className="settings-group">
          <h3>Which way is the field?</h3>
          <p className="muted">
            Defense is on top; offense is below. Left and right follow the defender facing the offense: your{" "}
            <strong>right</strong> is screen-left and your <strong>left</strong> is screen-right. RIVER means right,
            LASO means left.
          </p>
        </section>

        <section className="settings-group">
          <h3>Coaching references</h3>
          <ul className="reference-list">
            {REFERENCES.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="settings-group">
          <h3>Local study data</h3>
          <p className="muted">
            Favorites, your review queue, and preferences are stored only on this device. No accounts, no scores, no
            cloud sync.
          </p>
          {confirmClear ? (
            <div className="confirm-row">
              <span>Clear favorites, review queue, and preferences?</span>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  clearAllData();
                  setConfirmClear(false);
                }}
              >
                Yes, clear it
              </button>
              <button type="button" className="link-button" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="secondary-button" onClick={() => setConfirmClear(true)}>
              Clear local practice data
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
