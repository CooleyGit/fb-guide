import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionValueEvent } from "motion/react";
import type { Caption } from "../../types";
import { SPEED_OPTIONS, usePlayback } from "../../anim/playback";
import { PHASE_LABELS, PHASE_ORDER } from "../../anim/interpolate";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { PauseIcon, PlayIcon, ReplayIcon } from "../plays/icons";

/** In-field transport: play/pause (replays the same play when done), a refresh
 * that randomizes a new rep, and the speed toggle. */
// Beat to hold on the fresh pre-snap look (the call is "shouted") before it plays.
const REFRESH_HOLD_MS = 1000;

export function FieldTransport({ onRestart, onFocusView }: { onRestart?: () => void; onFocusView?: () => void }) {
  const { progress, isPlaying, play, pause, replay, seek, speed, setSpeed, reduced } = usePlayback();
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [spinN, setSpinN] = useState(0);

  const clearTimers = () => {
    if (holdRef.current) clearTimeout(holdRef.current);
    if (scrollRef.current) clearTimeout(scrollRef.current);
    holdRef.current = null;
    scrollRef.current = null;
  };
  useEffect(() => clearTimers, []);

  const onPlay = () => {
    clearTimers();
    if (isPlaying) {
      pause();
      return;
    }
    onFocusView?.();
    if (reduced) {
      seek(progress.get() >= 1 ? 0 : 1);
      return;
    }
    if (progress.get() >= 1) replay();
    else play();
  };

  const onRefresh = () => {
    onRestart?.();
    seek(0); // reset to pre-snap and hold a beat on the new call
    clearTimers();
    setSpinN((n) => n + 1); // spin the icon while the new text settles
    // Scroll AFTER the spin so the layout above has stabilized — avoids the jump.
    scrollRef.current = setTimeout(() => onFocusView?.(), 360);
    if (!reduced) holdRef.current = setTimeout(() => play(), REFRESH_HOLD_MS);
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
        <span key={spinN} className={`refresh-spin${spinN > 0 ? " spinning" : ""}`}>
          <ReplayIcon />
        </span>
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

function PhaseChips({ trailing }: { trailing?: ReactNode }) {
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
      {trailing}
    </div>
  );
}

/** Below-field scrubber + phase chips (with an optional trailing control). */
export function PlaybackScrubber({ captionToggle }: { captionToggle?: ReactNode }) {
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
      <PhaseChips trailing={captionToggle} />
    </div>
  );
}

/** Desktop: the full inline coaching bubble above the field. */
export function FieldCaption({ captions }: { captions: Caption[] }) {
  const { phase } = usePlayback();
  const isMobile = useIsMobile();
  const caption = captions.find((c) => c.phase === phase);
  if (isMobile || !caption) return null;
  return (
    <p className="field-caption" aria-live="polite">
      {caption.text}
    </p>
  );
}

