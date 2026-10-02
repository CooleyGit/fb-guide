import { useAppState } from "../state/AppState";
import { useMediaQuery } from "./useMediaQuery";

/**
 * Effective reduced-motion flag: the user's explicit preference overrides the
 * system setting; "system" defers to prefers-reduced-motion.
 */
export function useReducedMotion(): boolean {
  const { state } = useAppState();
  const system = useMediaQuery("(prefers-reduced-motion: reduce)");
  switch (state.preferences.motion) {
    case "reduced":
      return true;
    case "full":
      return false;
    default:
      return system;
  }
}
