import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Hotspot, RunDirection, Scenario, Selection } from "../../types";
import { deriveScenario } from "../../data/scenario";
import { selectionKey, selectionToParams } from "../../state/validation";
import { useAppState } from "../../state/AppState";
import type { FieldView } from "../../state/storage";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { PlaybackProvider, usePlayback } from "../../anim/playback";
import { FieldViewport } from "../field/FieldViewport";
import { FieldViewMenu, type ViewMenuExtra } from "../field/FieldViewMenu";
import { PlayField } from "../field/PlayField";
import { TipPopover, TipSheet } from "../field/Tips";
import { FieldCaption, PlaybackControls } from "../field/PlaybackControls";
import { PlayControls } from "./PlayControls";
import { PlayVariation } from "./PlayVariation";
import { SelectedPlayNotes } from "./SelectedPlayNotes";
import { Toast, useToast } from "../common/Toast";
import { ChevronIcon, CoachIcon, EyeIcon, EyeOffIcon, GhostIcon, LinkIcon, StarIcon } from "./icons";

const SIDE_PILL: Record<Selection["side"], string> = {
  left: "Left hash",
  right: "Right hash",
  middle: "Middle · Laso",
  "middle-right": "Middle · River",
};

export function PlayStudy({
  selection,
  onChange,
  hideAnswers,
  onToggleHide,
  onOpenLesson,
}: {
  selection: Selection;
  onChange: (patch: Partial<Selection>) => void;
  hideAnswers: boolean;
  onToggleHide: () => void;
  onOpenLesson: (lessonId: string) => void;
}) {
  return (
    <PlaybackProvider resetKey={selectionKey(selection) + (hideAnswers ? ":hide" : "")}>
      <PlayStudyInner
        selection={selection}
        onChange={onChange}
        hideAnswers={hideAnswers}
        onToggleHide={onToggleHide}
        onOpenLesson={onOpenLesson}
      />
    </PlaybackProvider>
  );
}

function PlayStudyInner({
  selection,
  onChange,
  hideAnswers,
  onToggleHide,
  onOpenLesson,
}: {
  selection: Selection;
  onChange: (patch: Partial<Selection>) => void;
  hideAnswers: boolean;
  onToggleHide: () => void;
  onOpenLesson: (lessonId: string) => void;
}) {
  const [runDirection, setRunDirection] = useState<RunDirection>("strong");
  const scenario = useMemo(() => deriveScenario(selection, { runDirection }), [selection, runDirection]);
  const { state, setPreference, addFavorite, removeFavorite, isFavorite } = useAppState();
  const prefs = state.preferences;
  const isMobile = useIsMobile();
  const { pause, seek } = usePlayback();

  const [mode, setMode] = useState<FieldView>(prefs.fieldView);
  const [resetSignal, setResetSignal] = useState(0);
  const [openTip, setOpenTip] = useState<Hotspot | null>(null);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  // Selection controls collapse on both desktop and mobile; open by default on
  // desktop, tucked away on phones.
  const [controlsOpen, setControlsOpen] = useState(!isMobile);
  const [toast, showToast] = useToast();
  const invokerRef = useRef<HTMLElement | SVGElement | null>(null);
  const descId = useId();

  // Keep local mode in sync if the stored default changes elsewhere.
  useEffect(() => setMode(prefs.fieldView), [prefs.fieldView]);

  // Closing a tip when the scenario changes avoids stale content.
  useEffect(() => {
    setOpenTip(null);
    setHighlightIds(new Set());
  }, [selection]);

  const favorite = isFavorite(selection);

  const setFieldView = (next: FieldView) => {
    setMode(next);
    setPreference({ fieldView: next });
  };

  const openTipHandler = (hotspot: Hotspot, invoker: HTMLElement | SVGElement | null) => {
    pause();
    invokerRef.current = invoker;
    setOpenTip(hotspot);
    setHighlightIds(new Set());
  };

  const closeTip = () => {
    setOpenTip(null);
    setHighlightIds(new Set());
    invokerRef.current?.focus?.();
  };

  const toggleHighlight = () => {
    if (!openTip?.highlightIds) return;
    setHighlightIds((prev) => (prev.size > 0 ? new Set() : new Set(openTip.highlightIds)));
  };

  const showMoment = () => {
    if (openTip?.cue !== undefined) seek(openTip.cue);
  };

  // Escape + outside click close the open tip.
  useEffect(() => {
    if (!openTip) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTip();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t?.closest(".tip-popover") || t?.closest(".tip-sheet") || t?.closest(".hotspot-pin")) return;
      closeTip();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTip]);

  const copyLink = async () => {
    const params = selectionToParams(selection);
    const url = `${window.location.origin}${import.meta.env.BASE_URL}#/plays?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link to this rep copied");
    } catch {
      showToast(url);
    }
  };

  const toggleFavorite = () => {
    if (favorite) {
      const existing = state.favorites.find((f) => selectionKey(f.selection) === selectionKey(selection));
      if (existing) removeFavorite(existing.id);
      showToast("Removed from favorites");
    } else {
      addFavorite(selection, scenario.scenarioTitle);
      showToast("Saved to favorites");
    }
  };

  const tipProps = openTip
    ? {
        hotspot: openTip,
        canSeek: true,
        highlightOn: highlightIds.size > 0,
        onClose: closeTip,
        onToggleHighlight: toggleHighlight,
        onShowMoment: showMoment,
        onOpenLesson,
      }
    : null;

  const viewExtras: ViewMenuExtra[] = [
    { id: "tips", label: "Tips & pins", icon: <EyeIcon />, active: prefs.tips, onClick: () => setPreference({ tips: !prefs.tips }) },
    { id: "hide", label: hideAnswers ? "Show answers" : "Hide answers", icon: <EyeOffIcon />, active: hideAnswers, onClick: onToggleHide },
    { id: "coach", label: "Coach view", icon: <CoachIcon />, active: prefs.coachView, onClick: () => setPreference({ coachView: !prefs.coachView }) },
    { id: "ghost", label: "SS ghost trail", icon: <GhostIcon />, active: prefs.ghost, onClick: () => setPreference({ ghost: !prefs.ghost }) },
  ];

  const field = (
    <FieldViewport
      scenario={scenario}
      mode={mode}
      describedById={descId}
      resetSignal={resetSignal}
      overlay={
        <>
          <FieldViewMenu
            mode={mode}
            onMode={setFieldView}
            onReset={() => {
              setFieldView("detail");
              setResetSignal((n) => n + 1);
            }}
            extras={viewExtras}
          />
          {tipProps ? isMobile ? <TipSheet {...tipProps} /> : <TipPopover {...tipProps} /> : null}
        </>
      }
    >
      <PlayField
        scenario={scenario}
        hideAnswers={hideAnswers}
        tipsEnabled={prefs.tips}
        coachView={prefs.coachView}
        ghost={prefs.ghost}
        highlightIds={highlightIds}
        openTipId={openTip?.id ?? null}
        onOpenTip={openTipHandler}
      />
    </FieldViewport>
  );

  return (
    <div className="play-study">
      <p id={descId} className="visually-hidden">
        {scenario.textEquivalent}
      </p>
      <div className="scenario-head">
        <h2 className="scenario-title">{scenario.scenarioTitle}</h2>
        <p className="scenario-sub" aria-live="polite">
          {hideAnswers ? "Answers hidden — explain your job, then reveal." : scenario.content.outcomeNote}
        </p>
      </div>

      <div className="selection-summary">
        <div className="summary-pills">
          <span className="chip">{selection.call}</span>
          <span className="chip">{scenario.formationName}</span>
          <span className="chip">{SIDE_PILL[selection.side]}</span>
        </div>
        <button
          type="button"
          className="selection-toggle"
          aria-expanded={controlsOpen}
          onClick={() => setControlsOpen((o) => !o)}
        >
          <ChevronIcon open={controlsOpen} />
          {controlsOpen ? "Hide selection" : "Change selection"}
        </button>
      </div>

      {controlsOpen && (
        <div className="controls-region">
          <PlayControls selection={selection} onChange={onChange} />
        </div>
      )}

      <div className="study-grid">
        <div className="field-column">
          <p className="viewpoint-note">
            Overhead view · defense on top. Your <strong>right</strong> is screen-left; your <strong>left</strong> is
            screen-right.
          </p>
          {field}
          <FieldCaption captions={scenario.captions} />
          <PlayVariation
            outcome={selection.outcome}
            onOutcome={(o) => onChange({ outcome: o })}
            runDirection={runDirection}
            onRunDirection={setRunDirection}
            showDirection={!!scenario.finish}
          />
          <PlaybackControls />
          <p className="effort-note">{scenario.effortNote}</p>
          <div className="field-actions">
            <button type="button" className="action-chip" aria-pressed={favorite} onClick={toggleFavorite}>
              <StarIcon filled={favorite} />
              {favorite ? "Favorited" : "Favorite"}
            </button>
            <button type="button" className="action-chip" onClick={copyLink}>
              <LinkIcon />
              Copy link
            </button>
          </div>
          <TipList
            scenario={scenario}
            hideAnswers={hideAnswers}
            tipsEnabled={prefs.tips}
            onOpen={(h) => openTipHandler(h, null)}
          />
        </div>

        <div className="notes-column">
          <SelectedPlayNotes scenario={scenario} hideAnswers={hideAnswers} onOpenLesson={onOpenLesson} />
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}

/** Accessible, non-SVG equivalent to the field pins. */
function TipList({
  scenario,
  hideAnswers,
  tipsEnabled,
  onOpen,
}: {
  scenario: Scenario;
  hideAnswers: boolean;
  tipsEnabled: boolean;
  onOpen: (hotspot: Hotspot) => void;
}) {
  if (!tipsEnabled) return null;
  const tips = hideAnswers ? scenario.hotspots.filter((h) => !h.revealsAnswer) : scenario.hotspots;
  if (tips.length === 0) return null;
  return (
    <details className="tip-list">
      <summary>Tips for this play ({tips.length})</summary>
      <ul>
        {tips.map((h) => (
          <li key={h.id}>
            <button type="button" className="link-button" onClick={() => onOpen(h)}>
              {h.title}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
