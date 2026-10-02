import { useEffect, useRef } from "react";
import { useMotionValueEvent } from "motion/react";
import type { Caption } from "../../types";
import { SPEED_OPTIONS, usePlayback } from "../../anim/playback";
import { PHASE_LABELS, PHASE_ORDER } from "../../anim/interpolate";

export function PhaseChips() {
  const { phase, seekPhase } = usePlayback();
  return (
    <div className="phase-chips" role="group" aria-label="Play phases">
      {PHASE_ORDER.map((p) => (
        <button
          key={p}
          type="button"
          className="phase-chip"
          aria-pressed={phase === p}
          onClick={() => seekPhase(p)}
        >
          {PHASE_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

export function PlaybackControls() {
  const { progress, isPlaying, toggle, replay, seek, speed, setSpeed, reduced } = usePlayback();
  const scrubRef = useRef<HTMLInputElement>(null);
  const dragging = useRef(false);

  // Reflect the motion value into the range input without re-rendering per frame.
  useMotionValueEvent(progress, "change", (v) => {
    if (!dragging.current && scrubRef.current) {
      scrubRef.current.value = String(Math.round(v * 1000));
    }
  });
  useEffect(() => {
    if (scrubRef.current) scrubRef.current.value = String(Math.round(progress.get() * 1000));
  }, [progress]);

  return (
    <div className="playback-controls">
      <div className="transport">
        {!reduced && (
          <button type="button" className="transport-button primary" onClick={toggle} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? "❚❚ Pause" : "▶ Play"}
          </button>
        )}
        <button type="button" className="transport-button" onClick={replay} aria-label="Replay from the start">
          ↻ {reduced ? "Reset" : "Replay"}
        </button>
        {!reduced && (
          <div className="speed-toggle" role="group" aria-label="Playback speed">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                className="speed-button"
                aria-pressed={speed === s.value}
                onClick={() => setSpeed(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <label className="scrubber">
        <span className="visually-hidden">Play progress</span>
        <input
          ref={scrubRef}
          type="range"
          min={0}
          max={1000}
          defaultValue={0}
          aria-label="Play progress"
          onPointerDown={() => (dragging.current = true)}
          onPointerUp={() => (dragging.current = false)}
          onInput={(e) => seek(Number((e.target as HTMLInputElement).value) / 1000)}
        />
      </label>
      <PhaseChips />
    </div>
  );
}

export function FieldCaption({ captions }: { captions: Caption[] }) {
  const { phase } = usePlayback();
  const caption = captions.find((c) => c.phase === phase);
  if (!caption) return null;
  return (
    <p className="field-caption" aria-live="polite">
      {caption.text}
    </p>
  );
}
