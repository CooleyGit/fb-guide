import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Selection } from "../types";
import { useAppState } from "./AppState";
import { generateReps, type PracticeFilter } from "./practiceGen";

type Review = "gotIt" | "reviewAgain";

export interface PracticeRep {
  selection: Selection;
  review?: Review;
}

export interface PracticeSession {
  reps: PracticeRep[];
  index: number;
  revealed: boolean;
  mode: "normal" | "review";
}

interface PracticeValue {
  session: PracticeSession | null;
  start: (count: number, filter: PracticeFilter, seed?: Selection) => void;
  startReview: (selections: Selection[]) => void;
  reveal: () => void;
  mark: (review: Review) => void;
  next: () => void;
  end: () => void;
  current: PracticeRep | null;
  completed: number;
  isLast: boolean;
  finished: boolean;
}

const PracticeContext = createContext<PracticeValue | null>(null);

export function PracticeProvider({ children }: { children: ReactNode }) {
  const { recordReview, queueReview, unqueueReview } = useAppState();
  const [session, setSession] = useState<PracticeSession | null>(null);

  const value = useMemo<PracticeValue>(() => {
    const current = session && session.index < session.reps.length ? session.reps[session.index]! : null;
    const completed = session ? session.reps.filter((r) => r.review).length : 0;
    const isLast = session ? session.index >= session.reps.length - 1 : false;
    const finished = session ? session.index >= session.reps.length : false;

    const start = (count: number, filter: PracticeFilter, seed?: Selection) => {
      const generated = generateReps(count, filter);
      const reps: PracticeRep[] = seed
        ? [{ selection: seed }, ...generated.slice(0, Math.max(0, count - 1)).map((s) => ({ selection: s }))]
        : generated.map((s) => ({ selection: s }));
      setSession({ reps, index: 0, revealed: false, mode: "normal" });
    };

    const startReview = (selections: Selection[]) => {
      if (selections.length === 0) return;
      setSession({ reps: selections.map((s) => ({ selection: s })), index: 0, revealed: false, mode: "review" });
    };

    const reveal = () => setSession((s) => (s ? { ...s, revealed: true } : s));

    const mark = (review: Review) => {
      if (!current) return;
      // Side effects run once, outside the state updater.
      recordReview(review === "gotIt");
      if (review === "reviewAgain") queueReview(current.selection);
      else unqueueReview(current.selection);
      setSession((s) =>
        s ? { ...s, reps: s.reps.map((r, i) => (i === s.index ? { ...r, review } : r)) } : s,
      );
    };

    const next = () =>
      setSession((s) => {
        if (!s) return s;
        const nextIndex = Math.min(s.index + 1, s.reps.length);
        return { ...s, index: nextIndex, revealed: false };
      });

    const end = () => setSession(null);

    return { session, start, startReview, reveal, mark, next, end, current, completed, isLast, finished };
  }, [session, recordReview, queueReview, unqueueReview]);

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePractice(): PracticeValue {
  const ctx = useContext(PracticeContext);
  if (!ctx) throw new Error("usePractice must be used within PracticeProvider");
  return ctx;
}
