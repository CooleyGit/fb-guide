import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Hotspot, OutcomeId, PassTarget, RunDirection, Scenario, Selection } from "../../types";
import { deriveScenario } from "../../data/scenario";
import { CALL_ORDER } from "../../data/calls";
import { SIDE_ORDER } from "../../data/sides";
import { FORMATION_ORDER, FORMATIONS } from "../../data/formations";
import { selectionKey, selectionToParams } from "../../state/validation";
import { useAppState } from "../../state/AppState";
import type { FieldView } from "../../state/storage";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { PlaybackProvider, usePlayback } from "../../anim/playback";
import { FieldViewport } from "../field/FieldViewport";
import { FieldViewMenu, type ViewMenuExtra } from "../field/FieldViewMenu";
import { PlayField } from "../field/PlayField";
import { TipPopover, TipSheet } from "../field/Tips";
import { FieldCaption, FieldTransport, PlaybackScrubber } from "../field/PlaybackControls";
import { PlayControls } from "./PlayControls";
import { PlayMenu } from "../field/PlayMenu";
import { SelectedPlayNotes } from "./SelectedPlayNotes";
import { Toast, useToast } from "../common/Toast";
import {
  CoachIcon,
  EyeIcon,
  EyeOffIcon,
  GhostIcon,
  InfoIcon,
  LinkIcon,
  NeutralIcon,
  PanelIcon,
  PassIcon,
  PlaybookIcon,
  QBRunIcon,
  RunIcon,
  StarIcon,
  StrategyIcon,
} from "./icons";

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function showsDirection(selection: Selection): boolean {
  return (
    selection.outcome === "run" ||
    selection.outcome === "pass" ||
    (selection.outcome === "qb" && (selection.call === "Power" || selection.call === "Blitz"))
  );
}

const OUTCOME_TEXT: Record<OutcomeId, string> = { read: "At the snap", run: "Run", pass: "Pass", qb: "QB run" };
const OUTCOME_ICON: Record<OutcomeId, (p: { size?: number }) => React.ReactNode> = {
  read: RunIcon,
  run: RunIcon,
  pass: PassIcon,
  qb: QBRunIcon,
};

const PASS_TARGET_TEXT: Record<PassTarget, string> = { curl: "curl", flat: "flat", away: "other side" };

type Tendency = "run" | "pass" | "neutral";
const LEAN_TEXT: Record<Tendency, string> = { run: "Run-leaning", pass: "Pass-leaning", neutral: "Balanced" };
const LEAN_ICON: Record<Tendency, (p: { size?: number }) => React.ReactNode> = {
  run: RunIcon,
  pass: PassIcon,
  neutral: NeutralIcon,
};

/**
 * The RUN/PASS pill. Before the snap you don't know yet, so it shows the
 * formation's lean (grayed). Once the play develops in the read step it
 * resolves to the actual run/pass (and direction) it ended up being.
 */
function OutcomePill({
  outcome,
  direction,
  passTarget,
  showDirection,
  tendency,
}: {
  outcome: OutcomeId;
  direction: RunDirection;
  passTarget: PassTarget;
  showDirection: boolean;
  tendency: Tendency;
}) {
  const { phase } = usePlayback();
  if (phase === "before") {
    const Icon = LEAN_ICON[tendency];
    return (
      <span className="chip outcome-chip lean">
        <Icon size={14} />
        {LEAN_TEXT[tendency]}
      </span>
    );
  }
  const Icon = OUTCOME_ICON[outcome];
  const detail = !showDirection
    ? ""
    : outcome === "pass"
      ? ` · ${PASS_TARGET_TEXT[passTarget]}`
      : ` · ${direction === "strong" ? "to your edge" : "away"}`;
  return (
    <span className={`chip outcome-chip outcome-${outcome}`}>
      <Icon size={14} />
      {OUTCOME_TEXT[outcome]}
      {detail}
    </span>
  );
}

const rollDirection = (): RunDirection => (Math.random() < 0.5 ? "strong" : "weak");

// Weighted outcome for a shuffle: QB keeper/scramble is rare, otherwise the
// formation's lean makes run or pass more likely (balanced = 50/50).
const QB_CHANCE = 0.08;
function rollOutcome(formation: Selection["formation"]): OutcomeId {
  if (Math.random() < QB_CHANCE) return "qb";
  const tendency = FORMATIONS[formation].tendency;
  const runProb = tendency === "run" ? 0.66 : tendency === "pass" ? 0.34 : 0.5;
  return Math.random() < runProb ? "run" : "pass";
}

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
    <PlaybackProvider
      resetKey={`${selection.call}|${selection.side}|${selection.formation}${hideAnswers ? ":hide" : ""}`}
    >
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
  const [runDirection, setRunDirection] = useState<RunDirection>(rollDirection);
  const [passTarget, setPassTarget] = useState<PassTarget>("curl");
  const scenario = useMemo(
    () => deriveScenario(selection, { runDirection, passTarget }),
    [selection, runDirection, passTarget],
  );
  const { state, setPreference, addFavorite, removeFavorite, isFavorite } = useAppState();
  const prefs = state.preferences;
  const isMobile = useIsMobile();
  const { pause, seek, replay, phase } = usePlayback();

  const [mode, setMode] = useState<FieldView>(prefs.fieldView);
  const [resetSignal, setResetSignal] = useState(0);
  // Bumped whenever a new call is made, to re-fire the "shouted call" effect on
  // the Assignment + strength pills.
  const [shoutKey, setShoutKey] = useState(1);
  const [openTip, setOpenTip] = useState<Hotspot | null>(null);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  // Selection controls collapse on both desktop and mobile; open by default on
  // desktop, tucked away on phones.
  const [controlsOpen, setControlsOpen] = useState(!isMobile);
  const [notesOpen, setNotesOpen] = useState(true);
  // Mobile coaching tip: a phase-colored info toggle in the phase-chip row that
  // opens a full-width tip above the effort note. Open by default (passive); the
  // user can toggle it closed.
  const [captionOpen, setCaptionOpen] = useState(true);
  // Lock up to 2 of the 3 dimensions so the shuffle button only reshuffles the
  // rest. (Applies only to the shuffle button, not manual picks.)
  const [locks, setLocks] = useState({ call: false, side: false, formation: false });
  const lockedCount = Number(locks.call) + Number(locks.side) + Number(locks.formation);
  const toggleLock = (key: "call" | "side" | "formation") =>
    setLocks((prev) => {
      const count = Number(prev.call) + Number(prev.side) + Number(prev.formation);
      if (!prev[key] && count >= 2) return prev; // at most two locked
      return { ...prev, [key]: !prev[key] };
    });
  const [toast, showToast] = useToast();
  const currentCaption = scenario.captions.find((c) => c.phase === phase);
  useEffect(() => {
    if (!captionOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCaptionOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [captionOpen]);

  // Picking an outcome / ball direction / pass target plays the new rep. The
  // replay is deferred (via a nonce + layout effect) so it fires AFTER the new
  // scenario has committed — otherwise the first frame can play the old play.
  const [playNonce, setPlayNonce] = useState(0);
  const requestPlay = () => setPlayNonce((n) => n + 1);
  useLayoutEffect(() => {
    if (playNonce === 0) return;
    replay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playNonce]);
  const chooseOutcome = (o: OutcomeId) => {
    onChange({ outcome: o });
    requestPlay();
  };
  const chooseDirection = (d: RunDirection) => {
    setRunDirection(d);
    requestPlay();
  };
  const choosePassTarget = (t: PassTarget) => {
    setPassTarget(t);
    requestPlay();
  };
  // The refresh button shuffles a NEW rep: an outcome weighted by this
  // formation's lean (QB keeper rare), plus a fresh ball direction/target. The
  // play button just replays the current rep.
  const handleRestart = () => {
    onChange({ outcome: rollOutcome(selection.formation) });
    setRunDirection(rollDirection());
    setPassTarget(pick(["curl", "flat", "away"] as const));
    setShoutKey((k) => k + 1);
  };
  // Shuffle the scenario, skipping any locked dimensions, with the outcome
  // weighted by the resulting formation's lean. Lands pre-snap (paused).
  const shuffleSelection = () => {
    const patch: Partial<Selection> = {};
    if (!locks.call) patch.call = pick(CALL_ORDER);
    if (!locks.side) patch.side = pick(SIDE_ORDER);
    const formation = locks.formation ? selection.formation : pick(FORMATION_ORDER);
    if (!locks.formation) patch.formation = formation;
    onChange({ ...patch, outcome: rollOutcome(formation) });
    setRunDirection(rollDirection());
    setPassTarget(pick(["curl", "flat", "away"] as const));
    setShoutKey((k) => k + 1);
  };
  const invokerRef = useRef<HTMLElement | SVGElement | null>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const descId = useId();

  // A shuffle scrolls up to show the new title; play/refresh pull the summary
  // pills near the top to frame the rep. Requested via a nonce so the scroll runs
  // in a layout effect AFTER the new title/sub text has committed — otherwise the
  // changing text height above the target makes it land in the wrong spot.
  const [scrollReq, setScrollReq] = useState<{ to: "top" | "pills"; n: number } | null>(null);
  const scrollToTop = () => setScrollReq((r) => ({ to: "top", n: (r?.n ?? 0) + 1 }));
  const focusPills = () => setScrollReq((r) => ({ to: "pills", n: (r?.n ?? 0) + 1 }));
  useLayoutEffect(() => {
    if (!scrollReq) return;
    const el = scrollReq.to === "top" ? headRef.current : pillsRef.current;
    const id = requestAnimationFrame(() => el?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => cancelAnimationFrame(id);
  }, [scrollReq]);

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
          <div className="field-shuffle" onPointerDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="field-menu-button"
              aria-label="New call — shuffle the assignment, ball, and formation"
              title="New call (shuffle)"
              onClick={() => {
                shuffleSelection();
                scrollToTop();
              }}
            >
              <StrategyIcon size={20} />
            </button>
          </div>
          <FieldViewMenu
            mode={mode}
            onMode={setFieldView}
            onReset={() => {
              setFieldView("fit");
              setResetSignal((n) => n + 1);
            }}
            extras={viewExtras}
          />
          {!isMobile && (
            <div className="notes-toggle" onPointerDown={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="field-menu-button"
                aria-pressed={notesOpen}
                aria-label={notesOpen ? "Hide the notes panel" : "Show the notes panel"}
                title={notesOpen ? "Hide notes panel" : "Show notes panel"}
                onClick={() => setNotesOpen((o) => !o)}
              >
                <PanelIcon />
              </button>
            </div>
          )}
          <PlayMenu
            outcome={selection.outcome}
            onOutcome={chooseOutcome}
            direction={runDirection}
            onDirection={chooseDirection}
            passTarget={passTarget}
            onPassTarget={choosePassTarget}
            showDirection={showsDirection(selection)}
          />
          <FieldTransport onRestart={handleRestart} onFocusView={focusPills} />
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
      <div className="scenario-head" ref={headRef}>
        <h2 className="scenario-title">{scenario.scenarioTitle}</h2>
        <p className="scenario-sub" aria-live="polite">
          {hideAnswers ? "Answers hidden — explain your job, then reveal." : scenario.content.outcomeNote}
        </p>
      </div>

      <div className="selection-summary">
        <div className="summary-pills" ref={pillsRef}>
          <span key={`call-${shoutKey}`} className="chip chip-shout">
            {selection.call}
          </span>
          <span key={`str-${shoutKey}`} className="chip chip-shout">
            {scenario.ssSide === "RIGHT" ? "RIVER" : "LASO"}
          </span>
          <OutcomePill
            outcome={selection.outcome}
            direction={runDirection}
            passTarget={passTarget}
            showDirection={showsDirection(selection)}
            tendency={FORMATIONS[selection.formation].tendency}
          />
        </div>
        <button
          type="button"
          className="selection-toggle"
          aria-expanded={controlsOpen}
          aria-label={controlsOpen ? "Hide selection" : "Change selection"}
          onClick={() => setControlsOpen((o) => !o)}
        >
          <PlaybookIcon size={16} />
          <span className="selection-toggle-text">{controlsOpen ? "Hide selection" : "Change selection"}</span>
          {lockedCount > 0 && <span className="lock-badge" aria-hidden="true" />}
        </button>
      </div>

      {controlsOpen && (
        <div className="controls-region">
          <PlayControls
            selection={selection}
            onChange={onChange}
            locks={locks}
            onToggleLock={toggleLock}
            atLockLimit={lockedCount >= 2}
          />
        </div>
      )}

      <div className={`study-grid${notesOpen ? "" : " notes-hidden"}`}>
        <div className="field-column">
          <FieldCaption captions={scenario.captions} />
          {field}
          <PlaybackScrubber
            captionToggle={
              isMobile && currentCaption ? (
                <button
                  type="button"
                  className={`caption-info${phase !== "before" ? " pulsing" : ""}${captionOpen ? " open" : ""}`}
                  data-phase={phase}
                  aria-expanded={captionOpen}
                  aria-label="Coaching tip"
                  onClick={() => setCaptionOpen((o) => !o)}
                >
                  <InfoIcon size={16} />
                </button>
              ) : undefined
            }
          />
          {isMobile && captionOpen && currentCaption && (
            <p className="caption-pop" data-phase={phase} role="status" aria-live="polite">
              {currentCaption.text}
            </p>
          )}
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

        {notesOpen && (
          <div className="notes-column">
            <SelectedPlayNotes scenario={scenario} hideAnswers={hideAnswers} onOpenLesson={onOpenLesson} />
          </div>
        )}
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
