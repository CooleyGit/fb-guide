import type { Selection } from "../types";
import { isValidSelection } from "./validation";

export type FieldView = "fit" | "detail" | "focus";
export type MotionPref = "system" | "reduced" | "full";
export type ThemePref = "light" | "dark";

export interface Favorite {
  id: string;
  selection: Selection;
  title: string;
  createdAt: number;
}

export interface Preferences {
  tips: boolean;
  fieldView: FieldView;
  motion: MotionPref;
  theme: ThemePref;
  coachView: boolean;
  ghost: boolean;
}

export interface PracticeHistory {
  completedReps: number;
  gotIt: number;
  reviewAgain: number;
}

export interface PersistedState {
  version: number;
  preferences: Preferences;
  lastSelection: Selection | null;
  favorites: Favorite[];
  reviewQueue: Selection[];
  practiceHistory: PracticeHistory;
}

export const STORAGE_KEY = "fb-guide.state";
export const SCHEMA_VERSION = 1;

export const DEFAULT_PREFERENCES: Preferences = {
  tips: true,
  fieldView: "fit",
  motion: "system",
  theme: "light",
  coachView: false,
  ghost: true,
};

export const DEFAULT_PERSISTED: PersistedState = {
  version: SCHEMA_VERSION,
  preferences: DEFAULT_PREFERENCES,
  lastSelection: null,
  favorites: [],
  reviewQueue: [],
  practiceHistory: { completedReps: 0, gotIt: 0, reviewAgain: 0 },
};

function safeStorage(): Storage | null {
  try {
    const s = window.localStorage;
    const probe = "__fbg_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

const FIELD_VIEWS: FieldView[] = ["fit", "detail", "focus"];
const MOTION_PREFS: MotionPref[] = ["system", "reduced", "full"];

function sanitizePreferences(input: unknown): Preferences {
  const p = (input ?? {}) as Record<string, unknown>;
  return {
    tips: typeof p.tips === "boolean" ? p.tips : DEFAULT_PREFERENCES.tips,
    fieldView: FIELD_VIEWS.includes(p.fieldView as FieldView)
      ? (p.fieldView as FieldView)
      : DEFAULT_PREFERENCES.fieldView,
    motion: MOTION_PREFS.includes(p.motion as MotionPref)
      ? (p.motion as MotionPref)
      : DEFAULT_PREFERENCES.motion,
    theme: p.theme === "dark" ? "dark" : "light",
    coachView: typeof p.coachView === "boolean" ? p.coachView : DEFAULT_PREFERENCES.coachView,
    ghost: typeof p.ghost === "boolean" ? p.ghost : DEFAULT_PREFERENCES.ghost,
  };
}

function sanitizeFavorite(input: unknown): Favorite | null {
  if (!input || typeof input !== "object") return null;
  const f = input as Record<string, unknown>;
  if (!isValidSelection(f.selection)) return null;
  return {
    id: typeof f.id === "string" ? f.id : crypto.randomUUID(),
    selection: f.selection,
    title: typeof f.title === "string" ? f.title.slice(0, 80) : "Saved rep",
    createdAt: typeof f.createdAt === "number" ? f.createdAt : Date.now(),
  };
}

function sanitizeHistory(input: unknown): PracticeHistory {
  const h = (input ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);
  return {
    completedReps: num(h.completedReps),
    gotIt: num(h.gotIt),
    reviewAgain: num(h.reviewAgain),
  };
}

/** Load persisted state, recovering safely from malformed or outdated data. */
export function loadPersisted(): PersistedState {
  const storage = safeStorage();
  if (!storage) return { ...DEFAULT_PERSISTED };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PERSISTED };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.version !== SCHEMA_VERSION) {
      // Unknown schema: start fresh rather than trusting mismatched shapes.
      return { ...DEFAULT_PERSISTED };
    }
    const favorites = Array.isArray(parsed.favorites)
      ? parsed.favorites.map(sanitizeFavorite).filter((f): f is Favorite => f !== null)
      : [];
    const reviewQueue = Array.isArray(parsed.reviewQueue)
      ? parsed.reviewQueue.filter(isValidSelection)
      : [];
    return {
      version: SCHEMA_VERSION,
      preferences: sanitizePreferences(parsed.preferences),
      lastSelection: isValidSelection(parsed.lastSelection) ? parsed.lastSelection : null,
      favorites,
      reviewQueue,
      practiceHistory: sanitizeHistory(parsed.practiceHistory),
    };
  } catch {
    return { ...DEFAULT_PERSISTED };
  }
}

export function savePersisted(state: PersistedState): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: SCHEMA_VERSION }));
  } catch {
    // Quota or privacy mode: preferences simply won't persist this session.
  }
}

export function clearPersisted(): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
