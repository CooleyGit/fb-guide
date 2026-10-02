import { useEffect, useRef } from "react";
import { useMotionValueEvent } from "motion/react";
import type { Caption } from "../../types";
import { SPEED_OPTIONS, usePlayback } from "../../anim/playback";
import { PHASE_LABELS, PHASE_ORDER } from "../../anim/interpolate";
import { PauseIcon, PlayIcon, ReplayIcon } from "../plays/icons";

/** In-field transport: play/pause (replays the same play when done), a refresh
 * that randomizes a new rep, and the speed toggle. */
export function FieldTransport({ onRestart }: { onRestart?: () => void }) {
  const { progress, isPlaying, play, pause, replay, seek, speed, setSpeed, reduced } = usePlayback();

  const onPlay = () => {
    if (isPlaying) {
      pause();
      return;
    }
    if (reduced) {
      seek(progress.get() >= 1 ? 0 : 1);
      return;
    }
    if (progress.get() >= 1) replay();
    else play();
  };

  const onRefresh = () => {
    onRestart?.();
    if (reduced) seek(0);
    else replay();
  };

  return (
    <div className="field-transport" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="transport-icon primary"
        onClick={onPlay}
        aria-label={isPlaying ? "Pause" : reduced ? "Show the play" : "Play"}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button type="button" className="transport-icon" onClick={onRefresh} aria-label="New rep">
        <ReplayIcon />
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
  );
}

function PhaseChips() {
  const { phase, seekPhase } = usePlayback();
  return (
    <div className="phase-chips" role="group" aria-label="Play phases">
      {PHASE_ORDER.map((p) => (
        <button
          key={p}
          type="button"
          className="phase-chip"
          data-phase={p}
          aria-pressed={phase === p}
          onClick={() => seekPhase(p)}
        >
          <span className="phase-dot" aria-hidden="true" />
          {PHASE_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

/** Below-field scrubber + phase chips. */
export function PlaybackScrubber() {
  const { progress, seek } = usePlayback();
  const scrubRef = useRef<HTMLInputElement>(null);
  const dragging = useRef(false);

  useMotionValueEvent(progress, "change", (v) => {
    if (!dragging.current && scrubRef.current) {
      scrubRef.current.value = String(Math.round(v * 1000));
    }
  });
  useEffect(() => {
    if (scrubRef.current) scrubRef.current.value = String(Math.round(progress.get() * 1000));
  }, [progress]);

  return (
    <div className="playback-scrubber">
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
