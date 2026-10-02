import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Selection } from "../types";
import {
  DEFAULT_PERSISTED,
  clearPersisted,
  loadPersisted,
  savePersisted,
  type Favorite,
  type PersistedState,
  type Preferences,
} from "./storage";
import { selectionsEqual } from "./validation";

type Action =
  | { type: "setPreference"; patch: Partial<Preferences> }
  | { type: "addFavorite"; selection: Selection; title: string }
  | { type: "removeFavorite"; id: string }
  | { type: "setLastSelection"; selection: Selection }
  | { type: "queueReview"; selection: Selection }
  | { type: "unqueueReview"; selection: Selection }
  | { type: "clearReview" }
  | { type: "recordReview"; gotIt: boolean }
  | { type: "clearAll" };

function reducer(state: PersistedState, action: Action): PersistedState {
  switch (action.type) {
    case "setPreference":
      return { ...state, preferences: { ...state.preferences, ...action.patch } };
    case "addFavorite": {
      // Avoid duplicate scenarios; refresh the title if it already exists.
      const existing = state.favorites.find((f) => selectionsEqual(f.selection, action.selection));
      if (existing) {
        return {
          ...state,
          favorites: state.favorites.map((f) =>
            f.id === existing.id ? { ...f, title: action.title } : f,
          ),
        };
      }
      const favorite: Favorite = {
        id: crypto.randomUUID(),
        selection: action.selection,
        title: action.title.slice(0, 80),
        createdAt: Date.now(),
      };
      return { ...state, favorites: [favorite, ...state.favorites] };
    }
    case "removeFavorite":
      return { ...state, favorites: state.favorites.filter((f) => f.id !== action.id) };
    case "setLastSelection":
      return { ...state, lastSelection: action.selection };
    case "queueReview": {
      if (state.reviewQueue.some((s) => selectionsEqual(s, action.selection))) return state;
      return { ...state, reviewQueue: [...state.reviewQueue, action.selection] };
    }
    case "unqueueReview":
      return {
        ...state,
        reviewQueue: state.reviewQueue.filter((s) => !selectionsEqual(s, action.selection)),
      };
    case "clearReview":
      return { ...state, reviewQueue: [] };
    case "recordReview":
      return {
        ...state,
        practiceHistory: {
          completedReps: state.practiceHistory.completedReps + 1,
          gotIt: state.practiceHistory.gotIt + (action.gotIt ? 1 : 0),
          reviewAgain: state.practiceHistory.reviewAgain + (action.gotIt ? 0 : 1),
        },
      };
    case "clearAll":
      return { ...DEFAULT_PERSISTED };
    default:
      return state;
  }
}

interface AppStateValue {
  state: PersistedState;
  setPreference: (patch: Partial<Preferences>) => void;
  addFavorite: (selection: Selection, title: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (selection: Selection) => boolean;
  setLastSelection: (selection: Selection) => void;
  queueReview: (selection: Selection) => void;
  unqueueReview: (selection: Selection) => void;
  clearReview: () => void;
  recordReview: (gotIt: boolean) => void;
  clearAllData: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadPersisted);

  // Persist whenever state changes (error-handled inside savePersisted).
  useEffect(() => {
    savePersisted(state);
  }, [state]);

  const value = useMemo<AppStateValue>(
    () => ({
      state,
      setPreference: (patch) => dispatch({ type: "setPreference", patch }),
      addFavorite: (selection, title) => dispatch({ type: "addFavorite", selection, title }),
      removeFavorite: (id) => dispatch({ type: "removeFavorite", id }),
      isFavorite: (selection) => state.favorites.some((f) => selectionsEqual(f.selection, selection)),
      setLastSelection: (selection) => dispatch({ type: "setLastSelection", selection }),
      queueReview: (selection) => dispatch({ type: "queueReview", selection }),
      unqueueReview: (selection) => dispatch({ type: "unqueueReview", selection }),
      clearReview: () => dispatch({ type: "clearReview" }),
      recordReview: (gotIt) => dispatch({ type: "recordReview", gotIt }),
      clearAllData: () => {
        clearPersisted();
        dispatch({ type: "clearAll" });
      },
    }),
    [state],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
