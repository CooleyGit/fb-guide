import { useState } from "react";
import type { Scenario } from "../../types";

export function SelectedPlayNotes({
  scenario,
  hideAnswers,
  onOpenLesson,
}: {
  scenario: Scenario;
  hideAnswers: boolean;
  onOpenLesson?: (lessonId: string) => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const c = scenario.content;

  if (hideAnswers) {
    return (
      <section className="selected-notes study-prompt" aria-live="polite">
        <h2>Your turn</h2>
        <p>
          Where do you line up? Who do you read? What is your job on this play—run, pass, or QB keeper? Say your answer
          out loud, then reveal to check yourself.
        </p>
        <p className="muted">Answers are hidden. The offense still shows so you can reason about the play.</p>
      </section>
    );
  }

  const lessonLink = scenario.hotspots.find((h) => h.lessonId)?.lessonId;

  return (
    <section className="selected-notes" aria-live="polite">
      <div className="position-line">{scenario.positionText}</div>
      <p className="outcome-note">{c.outcomeNote}</p>
      <div className="task-card">{c.task}</div>

      <div className="assignment-detail">
        <span className="section-label">This play · your assignment</span>
        <h3>Find your side</h3>
        <p>{c.sideWhy}</p>
        <h3>Your job</h3>
        <p>{c.roleWhy}</p>
        <h3>Read the offense</h3>
        <p>{c.formationWhy}</p>
        <h3>When the ball is snapped</h3>
        <p>{c.response}</p>
      </div>

      <div className="notice-grid">
        <p>
          <strong>Your eyes</strong>
          <span>{c.beginnerEyes}</span>
        </p>
        <p>
          <strong>Your first move</strong>
          <span>{c.beginnerMove}</span>
        </p>
        <p>
          <strong>Easy mistake</strong>
          <span>{c.beginnerMistake}</span>
        </p>
        <p>
          <strong>Check yourself</strong>
          <span>{c.beginnerCheck}</span>
        </p>
      </div>

      <details open={advancedOpen} onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}>
        <summary>Go deeper: this call and formation</summary>
        <p>{c.advancedFormation}</p>
        <p>{c.advancedCall}</p>
        <p>{c.advancedOutcome}</p>
      </details>

      {lessonLink && onOpenLesson && (
        <button type="button" className="link-button" onClick={() => onOpenLesson(lessonLink)}>
          Learn the concepts behind this rep →
        </button>
      )}
    </section>
  );
}
