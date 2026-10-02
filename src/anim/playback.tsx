import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMotionValue, type MotionValue } from "motion/react";
import type { PhaseId } from "../types";
import { phaseOf, phaseSeekTime } from "./interpolate";
import { useReducedMotion } from "../hooks/useReducedMotion";

// Seconds for a 1x ("Real time") play-through — tuned to feel like a real
// snap-to-whistle rep. Slow-mo stretches it for teaching.
const BASE_DURATION = 2.6;

export type Speed = number;

export const SPEED_OPTIONS: { value: Speed; label: string }[] = [
  { value: 0.4, label: "Slow-mo" },
  { value: 1, label: "Real time" },
];

interface PlaybackValue {
  progress: MotionValue<number>;
  isPlaying: boolean;
  phase: PhaseId;
  speed: Speed;
  reduced: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  replay: () => void;
  seek: (t: number) => void;
  seekPhase: (phase: PhaseId) => void;
  setSpeed: (s: Speed) => void;
}

const PlaybackContext = createContext<PlaybackValue | null>(null);

export function PlaybackProvider({
  resetKey,
  children,
}: {
  resetKey: string;
  children: ReactNode;
}) {
  const progress = useMotionValue(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<PhaseId>("before");
  const [speed, setSpeed] = useState<Speed>(1);
  const reduced = useReducedMotion();

  const rafRef = useRef<number | null>(null);
  const clockRef = useRef<{ t0: number; p0: number } | null>(null);
  const speedRef = useRef<Speed>(speed);
  speedRef.current = speed;

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    clockRef.current = null;
  }, []);

  const pause = useCallback(() => {
    stopRaf();
    setIsPlaying(false);
  }, [stopRaf]);

  const tick = useCallback(
    (now: number) => {
      const clock = clockRef.current;
      if (!clock) return;
      const elapsed = (now - clock.t0) / 1000;
      const next = Math.min(1, clock.p0 + (elapsed * speedRef.current) / BASE_DURATION);
      progress.set(next);
      if (next >= 1) {
        stopRaf();
        setIsPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [progress, stopRaf],
  );

  const play = useCallback(() => {
    if (reduced) {
      // No continuous animation: present the resolved frame.
      progress.set(1);
      setIsPlaying(false);
      return;
    }
    stopRaf();
    const from = progress.get() >= 1 ? 0 : progress.get();
    progress.set(from);
    clockRef.current = { t0: performance.now(), p0: from };
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [reduced, progress, stopRaf, tick]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const replay = useCallback(() => {
    stopRaf();
    progress.set(0);
    if (reduced) {
      setIsPlaying(false);
      return;
    }
    clockRef.current = { t0: performance.now(), p0: 0 };
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [reduced, progress, stopRaf, tick]);

  const seek = useCallback(
    (t: number) => {
      stopRaf();
      setIsPlaying(false);
      progress.set(Math.max(0, Math.min(1, t)));
    },
    [progress, stopRaf],
  );

  const seekPhase = useCallback((p: PhaseId) => seek(phaseSeekTime(p)), [seek]);

  // Keep the phase label in sync without re-rendering on every frame.
  useEffect(() => {
    setPhase(phaseOf(progress.get()));
    const unsub = progress.on("change", (v) => {
      setPhase((prev) => {
        const next = phaseOf(v);
        return next === prev ? prev : next;
      });
    });
    return unsub;
  }, [progress]);

  // Selection change: cancel playback and reset to pre-snap.
  useEffect(() => {
    stopRaf();
    setIsPlaying(false);
    progress.set(0);
  }, [resetKey, stopRaf, progress]);

  // Pause when the tab is backgrounded or the provider unmounts.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopRaf();
    };
  }, [pause, stopRaf]);

  const value = useMemo<PlaybackValue>(
    () => ({
      progress,
      isPlaying,
      phase,
      speed,
      reduced,
      play,
      pause,
      toggle,
      replay,
      seek,
      seekPhase,
      setSpeed,
    }),
    [progress, isPlaying, phase, speed, reduced, play, pause, toggle, replay, seek, seekPhase],
  );

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayback(): PlaybackValue {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("usePlayback must be used within PlaybackProvider");
  return ctx;
}
