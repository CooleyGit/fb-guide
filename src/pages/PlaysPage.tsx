import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Selection } from "../types";
import { useAppState } from "../state/AppState";
import { defaultOutcome } from "../data/calls";
import {
  DEFAULT_SELECTION,
  parseSelectionParams,
  selectionToParams,
} from "../state/validation";
import { PlayStudy } from "../components/plays/PlayStudy";
import { Favorites } from "../components/plays/Favorites";

export function PlaysPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { state, setLastSelection } = useAppState();

  const fallback = state.lastSelection ?? DEFAULT_SELECTION;
  const selection = useMemo(() => parseSelectionParams(params, fallback), [params, fallback]);

  const [hideAnswers, setHideAnswers] = useState(() => params.get("hide") === "1");

  // Persist the current rep as the resume point.
  useEffect(() => {
    setLastSelection(selection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.call, selection.side, selection.formation, selection.outcome]);

  const applySelection = useCallback(
    (next: Selection) => {
      setParams(selectionToParams(next, hideAnswers || undefined), { replace: true });
    },
    [setParams, hideAnswers],
  );

  const onChange = useCallback(
    (patch: Partial<Selection>) => {
      const next = { ...selection, ...patch };
      // Changing the call or formation (without explicitly setting an outcome)
      // snaps to the expected play for that combination.
      if (patch.outcome === undefined && (patch.call !== undefined || patch.formation !== undefined)) {
        next.outcome = defaultOutcome(next.call, next.formation);
      }
      applySelection(next);
    },
    [applySelection, selection],
  );

  const onOpenLesson = useCallback(
    (lessonId: string) => {
      const ret = selectionToParams(selection).toString();
      navigate(`/learn?lesson=${lessonId}&return=${encodeURIComponent(ret)}`);
    },
    [navigate, selection],
  );

  const practiceFromFavorite = useCallback(
    (fav: Selection) => {
      navigate(`/practice?seed=${encodeURIComponent(selectionToParams(fav).toString())}`);
    },
    [navigate],
  );

  return (
    <div className="page plays-page">
      <PlayStudy
        selection={selection}
        onChange={onChange}
        hideAnswers={hideAnswers}
        onToggleHide={() => setHideAnswers((h) => !h)}
        onOpenLesson={onOpenLesson}
      />
      <Favorites current={selection} onLaunch={applySelection} onPractice={practiceFromFavorite} />
    </div>
  );
}
