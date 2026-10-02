import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { CallId, FormationId, Selection } from "../types";
import { CALL_ORDER } from "../data/calls";
import { FORMATIONS, FORMATION_ORDER } from "../data/formations";
import { deriveScenario } from "../data/scenario";
import { parseSelectionParams, selectionKey } from "../state/validation";
import { usePractice } from "../state/Practice";
import type { PracticeFilter } from "../state/practiceGen";
import { PlaybackProvider } from "../anim/playback";
import { FieldViewport } from "../components/field/FieldViewport";
import { FieldViewMenu } from "../components/field/FieldViewMenu";
import { PlayField } from "../components/field/PlayField";
import { FieldTransport, PlaybackScrubber } from "../components/field/PlaybackControls";
import type { FieldView } from "../state/storage";
import { SelectedPlayNotes } from "../components/plays/SelectedPlayNotes";
import { ReviewQueue } from "../components/practice/ReviewQueue";

const REP_CHOICES = [3, 5, 8];

export function PracticePage() {
  const { session, start, startReview, reveal, mark, next, end, current, finished } = usePractice();
  const [params, setParams] = useSearchParams();

  // Seed a session from a favorite ("Practice" button on Plays).
  useEffect(() => {
    const seed = params.get("seed");
    if (seed && !session) {
      const parsed = parseSelectionParams(new URLSearchParams(seed));
      start(5, {}, parsed);
    }
    if (seed) {
      params.delete("seed");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) {
    return (
      <div className="page practice-page">
        <PracticeConfig onStart={start} />
        <ReviewQueue onPractice={startReview} />
      </div>
    );
  }

  if (finished) {
    return (
      <div className="page practice-page">
        <PracticeSummary onReviewAgain={startReview} onDone={end} />
      </div>
    );
  }

  const rep = current!;
  return (
    <div className="page practice-page">
      <PracticeRep
        key={session.index}
        selection={rep.selection}
        revealed={session.revealed}
        position={session.index + 1}
        total={session.reps.length}
        mode={session.mode}
        onReveal={reveal}
        onMark={mark}
        onNext={next}
        onEnd={end}
      />
    </div>
  );
}

function PracticeConfig({
  onStart,
}: {
  onStart: (count: number, filter: PracticeFilter) => void;
}) {
  const [call, setCall] = useState<CallId | "">("");
  const [formation, setFormation] = useState<FormationId | "">("");
  const [reps, setReps] = useState(5);

  return (
    <section className="practice-config">
      <h1>Practice</h1>
      <p className="muted">
        Short reps that start with the answers hidden. Say your alignment, your key, and your job before you reveal.
      </p>
      <div className="config-grid">
        <label className="field-select">
          <span>Assignment</span>
          <select value={call} onChange={(e) => setCall(e.target.value as CallId | "")}>
            <option value="">Any assignment</option>
            {CALL_ORDER.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field-select">
          <span>Formation</span>
          <select value={formation} onChange={(e) => setFormation(e.target.value as FormationId | "")}>
            <option value="">Any formation</option>
            {FORMATION_ORDER.map((f) => (
              <option key={f} value={f}>
                {FORMATIONS[f].name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="rep-count">
          <legend>Reps</legend>
          <div className="segmented-track">
            {REP_CHOICES.map((n) => (
              <button
                key={n}
                type="button"
                className="segment"
                aria-pressed={reps === n}
                onClick={() => setReps(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <button
        type="button"
        className="primary-button"
        onClick={() => onStart(reps, { call: call || undefined, formation: formation || undefined })}
      >
        Start session
      </button>
      <p className="muted small">Self-review only — reps you record are your own study notes, not a coach-verified score.</p>
    </section>
  );
}

function PracticeRep({
  selection,
  revealed,
  position,
  total,
  mode,
  onReveal,
  onMark,
  onNext,
  onEnd,
}: {
  selection: Selection;
  revealed: boolean;
  position: number;
  total: number;
  mode: "normal" | "review";
  onReveal: () => void;
  onMark: (review: "gotIt" | "reviewAgain") => void;
  onNext: () => void;
  onEnd: () => void;
}) {
  const scenario = useMemo(() => deriveScenario(selection), [selection]);
  const [view, setView] = useState<FieldView>("fit");
  const [resetSignal, setResetSignal] = useState(0);

  return (
    <section className="practice-rep">
      <div className="rep-head">
        <span className="rep-progress">
          {mode === "review" ? "Review" : "Rep"} {position} of {total}
        </span>
        <button type="button" className="link-button" onClick={onEnd}>
          End session
        </button>
      </div>

      <h2 className="scenario-title">{scenario.scenarioTitle}</h2>

      <PlaybackProvider resetKey={selectionKey(selection) + (revealed ? ":r" : ":h")}>
        <FieldViewport
          scenario={scenario}
          mode={view}
          resetSignal={resetSignal}
          overlay={
            <>
              <FieldViewMenu
                mode={view}
                onMode={setView}
                onReset={() => {
                  setView("fit");
                  setResetSignal((n) => n + 1);
                }}
              />
              <FieldTransport />
            </>
          }
        >
          <PlayField
            scenario={scenario}
            hideAnswers={!revealed}
            tipsEnabled={!revealed}
            coachView={false}
            ghost={false}
            highlightIds={new Set()}
            openTipId={null}
            onOpenTip={() => {}}
          />
        </FieldViewport>
        <PlaybackScrubber />
      </PlaybackProvider>

      {!revealed ? (
        <div className="rep-prompt">
          <p>
            <strong>Your turn.</strong> Say it out loud:
          </p>
          <ul>
            <li>Where do you align, and on which side?</li>
            <li>Who is your key?</li>
            <li>What is your job on a run, a pass, and a QB keeper?</li>
          </ul>
          <button type="button" className="primary-button" onClick={onReveal}>
            Reveal the answer
          </button>
        </div>
      ) : (
        <div className="rep-review">
          <SelectedPlayNotes scenario={scenario} hideAnswers={false} />
          <div className="self-review">
            <p>How did you do? (Self-review — your own notes, not a score.)</p>
            <div className="self-review-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  onMark("gotIt");
                  onNext();
                }}
              >
                Got it
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  onMark("reviewAgain");
                  onNext();
                }}
              >
                Review again
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PracticeSummary({
  onReviewAgain,
  onDone,
}: {
  onReviewAgain: (selections: Selection[]) => void;
  onDone: () => void;
}) {
  const { session } = usePractice();
  if (!session) return null;
  const gotIt = session.reps.filter((r) => r.review === "gotIt").length;
  const reviewAgain = session.reps.filter((r) => r.review === "reviewAgain");

  return (
    <section className="practice-summary">
      <h1>Session complete</h1>
      <p className="summary-line">
        {session.reps.length} reps · {gotIt} marked “Got it” · {reviewAgain.length} marked “Review again”.
      </p>
      {reviewAgain.length > 0 ? (
        <>
          <h2>Come back to these</h2>
          <ul className="review-list">
            {reviewAgain.map((r) => (
              <li key={selectionKey(r.selection)}>{deriveScenario(r.selection).scenarioTitle}</li>
            ))}
          </ul>
          <button type="button" className="primary-button" onClick={() => onReviewAgain(reviewAgain.map((r) => r.selection))}>
            Practice review reps
          </button>
        </>
      ) : (
        <p className="muted">Nice work—nothing flagged for review this time.</p>
      )}
      <button type="button" className="secondary-button" onClick={onDone}>
        Done
      </button>
    </section>
  );
}
