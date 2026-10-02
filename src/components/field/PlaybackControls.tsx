import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMotionValueEvent } from "motion/react";
import type { Caption } from "../../types";
import { SPEED_OPTIONS, usePlayback } from "../../anim/playback";
import { PHASE_LABELS, PHASE_ORDER } from "../../anim/interpolate";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { InfoIcon, PauseIcon, PlayIcon, ReplayIcon } from "../plays/icons";

/** In-field transport: play/pause (replays the same play when done), a refresh
 * that randomizes a new rep, and the speed toggle. */
// Beat to hold on the fresh pre-snap look (the call is "shouted") before it plays.
const REFRESH_HOLD_MS = 1000;

export function FieldTransport({ onRestart, onFocusView }: { onRestart?: () => void; onFocusView?: () => void }) {
  const { progress, isPlaying, play, pause, replay, seek, speed, setSpeed, reduced } = usePlayback();
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHold = () => {
    if (holdRef.current) clearTimeout(holdRef.current);
    holdRef.current = null;
  };
  useEffect(() => clearHold, []);

  const onPlay = () => {
    clearHold();
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
    onFocusView?.();
    seek(0); // reset to pre-snap and hold a beat on the new call
    clearHold();
    if (reduced) return;
    holdRef.current = setTimeout(() => play(), REFRESH_HOLD_MS);
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

/**
 * Mobile: a pulsing info button that lives next to the field-shuffle control.
 * It opens a floating tip (position:fixed, so it isn't clipped by the field and
 * never pushes the field up or down).
 */
export function FieldCaptionInfo({ captions }: { captions: Caption[] }) {
  const { phase } = usePlayback();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ bottom: number; left: number; width: number } | null>(null);
  const caption = captions.find((c) => c.phase === phase);
  // Only draw attention (pulse) once the play is underway/has run; muted pre-snap.
  const played = phase !== "before";

  const reposition = () => {
    const btn = btnRef.current;
    if (!btn) return;
    // Align the bar to the field card and sit it just above the card's top edge.
    const field = (btn.closest(".field-viewport") as HTMLElement | null) ?? btn;
    const r = field.getBoundingClientRect();
    setPos({ bottom: window.innerHeight - r.top + 6, left: r.left, width: r.width });
  };

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open]);

  // Stays locked open once tapped; close with the button again or Escape. (No
  // outside-tap close.)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onMove = () => reposition();
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  if (!isMobile || !caption) return null;

  return (
    <div className="caption-info-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        className={`caption-info${played ? " pulsing" : ""}${open ? " open" : ""}`}
        aria-expanded={open}
        aria-label="Coaching tip"
        onClick={() => setOpen((o) => !o)}
      >
        <InfoIcon size={18} />
      </button>
      {open && pos && (
        <div
          ref={popRef}
          className="caption-pop"
          style={{ bottom: pos.bottom, left: pos.left, width: pos.width }}
          role="status"
          aria-live="polite"
        >
          {caption.text}
        </div>
      )}
    </div>
  );
}
