import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Hotspot, RunDirection, Scenario, Selection } from "../../types";
import { deriveScenario } from "../../data/scenario";
import { selectionKey, selectionToParams } from "../../state/validation";
import { useAppState } from "../../state/AppState";
import type { FieldView } from "../../state/storage";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { PlaybackProvider, usePlayback } from "../../anim/playback";
import { FieldViewport } from "../field/FieldViewport";
import { PlayField } from "../field/PlayField";
import { TipPopover, TipSheet } from "../field/Tips";
import { FieldCaption, PlaybackControls } from "../field/PlaybackControls";
import { PlayControls } from "./PlayControls";
import { SelectedPlayNotes } from "./SelectedPlayNotes";
import { Toast, useToast } from "../common/Toast";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  const field = (
    <FieldViewport
      scenario={scenario}
      mode={mode}
      describedById={descId}
      resetSignal={resetSignal}
      overlay={tipProps ? isMobile ? <TipSheet {...tipProps} /> : <TipPopover {...tipProps} /> : undefined}
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

      {isMobile && (
        <div className="selection-summary">
          <span className="chip">{selection.call}</span>
          <span className="chip">{scenario.formationName}</span>
          <span className="chip">{scenario.scenarioTitle.split(" · ").slice(-1)[0]}</span>
          <button type="button" className="link-button" onClick={() => setDrawerOpen((o) => !o)} aria-expanded={drawerOpen}>
            {drawerOpen ? "Hide selection" : "Change selection"}
          </button>
        </div>
      )}

      {(!isMobile || drawerOpen) && (
        <div className={`controls-region${isMobile ? " drawer" : ""}`}>
          <PlayControls selection={selection} onChange={onChange} />
        </div>
      )}

      <div className="study-grid">
        <div className="field-column">
          <p className="viewpoint-note">
            Overhead view · defense on top. Your <strong>right</strong> is screen-left; your <strong>left</strong> is
            screen-right.
          </p>
          <FieldToolbar
            mode={mode}
            tips={prefs.tips}
            hideAnswers={hideAnswers}
            favorite={favorite}
            coachView={prefs.coachView}
            ghost={prefs.ghost}
            onFit={() => setFieldView(mode === "fit" ? "detail" : "fit")}
            onFocus={() => setFieldView("focus")}
            onReset={() => {
              setFieldView("detail");
              setResetSignal((n) => n + 1);
            }}
            onToggleTips={() => setPreference({ tips: !prefs.tips })}
            onToggleHide={onToggleHide}
            onToggleFavorite={toggleFavorite}
            onCopyLink={copyLink}
            onToggleCoach={() => setPreference({ coachView: !prefs.coachView })}
            onToggleGhost={() => setPreference({ ghost: !prefs.ghost })}
          />
          {field}
          <FieldCaption captions={scenario.captions} />
          <p className="effort-note">{scenario.effortNote}</p>
          <PlaybackControls />
          {scenario.finish && (
            <RunDirectionControl value={runDirection} onChange={setRunDirection} />
          )}
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

function FieldToolbar(props: {
  mode: FieldView;
  tips: boolean;
  hideAnswers: boolean;
  favorite: boolean;
  coachView: boolean;
  ghost: boolean;
  onFit: () => void;
  onFocus: () => void;
  onReset: () => void;
  onToggleTips: () => void;
  onToggleHide: () => void;
  onToggleFavorite: () => void;
  onCopyLink: () => void;
  onToggleCoach: () => void;
  onToggleGhost: () => void;
}) {
  return (
    <div className="field-toolbar">
      <div className="toolbar-primary">
        <button type="button" className="tool" aria-pressed={props.mode === "fit"} onClick={props.onFit}>
          {props.mode === "fit" ? "Zoom to detail" : "Fit field"}
        </button>
        <button type="button" className="tool" aria-pressed={props.mode === "focus"} onClick={props.onFocus}>
          Focus SS
        </button>
        <button type="button" className="tool" onClick={props.onReset}>
          Reset view
        </button>
        <button type="button" className="tool" aria-pressed={props.tips} onClick={props.onToggleTips}>
          Tips {props.tips ? "on" : "off"}
        </button>
        <button type="button" className="tool" aria-pressed={props.hideAnswers} onClick={props.onToggleHide}>
          {props.hideAnswers ? "Show answers" : "Hide answers"}
        </button>
      </div>
      <div className="toolbar-secondary">
        <button type="button" className="tool" aria-pressed={props.favorite} onClick={props.onToggleFavorite}>
          {props.favorite ? "★ Favorited" : "☆ Favorite"}
        </button>
        <button type="button" className="tool" onClick={props.onCopyLink}>
          Copy link
        </button>
        <details className="more-actions">
          <summary className="tool">More</summary>
          <div className="more-panel">
            <button type="button" className="tool" aria-pressed={props.coachView} onClick={props.onToggleCoach}>
              Coach view {props.coachView ? "on" : "off"}
            </button>
            <button type="button" className="tool" aria-pressed={props.ghost} onClick={props.onToggleGhost}>
              SS ghost {props.ghost ? "on" : "off"}
            </button>
          </div>
        </details>
      </div>
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

/** Which way the ball carrier goes, so the SS learns both contain and pursuit. */
function RunDirectionControl({
  value,
  onChange,
}: {
  value: RunDirection;
  onChange: (dir: RunDirection) => void;
}) {
  return (
    <div className="run-direction">
      <span className="rd-label">Ball goes:</span>
      <div className="segmented-track" role="radiogroup" aria-label="Run direction">
        <button type="button" className="segment" aria-checked={value === "strong"} role="radio" onClick={() => onChange("strong")}>
          To your edge
        </button>
        <button type="button" className="segment" aria-checked={value === "weak"} role="radio" onClick={() => onChange("weak")}>
          Away from you
        </button>
      </div>
      <button
        type="button"
        className="shuffle"
        onClick={() => onChange(Math.random() < 0.5 ? "strong" : "weak")}
        aria-label="Shuffle run direction"
      >
        🎲 Mix it up
      </button>
    </div>
  );
}
