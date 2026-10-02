import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { Selection } from "../types";
import { LESSONS, TOPIC_ORDER, lessonById, type Lesson } from "../data/lessons";
import { GLOSSARY } from "../data/glossary";
import { selectionToParams } from "../state/validation";

export function LearnPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const lessonId = params.get("lesson");
  const returnParams = params.get("return");
  const activeLesson = lessonId ? lessonById(lessonId) : undefined;

  const tryOnField = (selection: Selection) =>
    navigate(`/plays?${selectionToParams(selection).toString()}`);

  const q = query.trim().toLowerCase();
  const matchedLessons = useMemo(() => {
    if (!q) return LESSONS;
    return LESSONS.filter((l) =>
      (l.title + " " + l.body.join(" ") + " " + (l.advanced ?? "") + " " + l.topic).toLowerCase().includes(q),
    );
  }, [q]);
  const matchedGlossary = useMemo(() => {
    if (!q) return GLOSSARY;
    return GLOSSARY.filter((g) => (g.term + " " + g.definition).toLowerCase().includes(q));
  }, [q]);

  const noResults = q.length > 0 && matchedLessons.length === 0 && matchedGlossary.length === 0;

  if (activeLesson) {
    return (
      <div className="page learn-page">
        <LessonDetail
          lesson={activeLesson}
          backTo={returnParams ? `/plays?${returnParams}` : "/learn"}
          backLabel={returnParams ? "Back to your play" : "Back to all lessons"}
          onTry={tryOnField}
        />
      </div>
    );
  }

  return (
    <div className="page learn-page">
      <header className="learn-head">
        <h1>Learn</h1>
        <p className="muted">
          Build your football understanding. Search the lessons and vocabulary, or open a topic. “Try it on the field”
          opens a play that shows the idea.
        </p>
        <label className="learn-search">
          <span className="visually-hidden">Search lessons and vocabulary</span>
          <input
            type="search"
            value={query}
            placeholder="Search lessons and words (e.g. force, curl, mesh)"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </header>

      {noResults && (
        <p className="empty-state">
          No lessons or words match “{query}”. Try a simpler word like <strong>force</strong>, <strong>zone</strong>, or{" "}
          <strong>block</strong>.
        </p>
      )}

      {matchedLessons.length > 0 &&
        TOPIC_ORDER.map((topic) => {
          const lessons = matchedLessons.filter((l) => l.topic === topic);
          if (lessons.length === 0) return null;
          return (
            <section key={topic} className="lesson-group">
              <h2>{topic}</h2>
              <ul className="lesson-cards">
                {lessons.map((l) => (
                  <li key={l.id}>
                    <Link className="lesson-card" to={`/learn?lesson=${l.id}`}>
                      <span className="lesson-card-title">{l.title}</span>
                      <span className="lesson-card-preview">{l.body[0]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

      {matchedGlossary.length > 0 && (
        <section className="lesson-group glossary">
          <h2>Football vocabulary</h2>
          <dl className="glossary-list">
            {matchedGlossary.map((g) => (
              <div key={g.term} className="glossary-item">
                <dt>{g.term}</dt>
                <dd>{g.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}

function LessonDetail({
  lesson,
  backTo,
  backLabel,
  onTry,
}: {
  lesson: Lesson;
  backTo: string;
  backLabel: string;
  onTry: (selection: Selection) => void;
}) {
  return (
    <article className="lesson-detail">
      <Link className="link-button back-link" to={backTo}>
        ← {backLabel}
      </Link>
      <span className="section-label">{lesson.topic}</span>
      <h1>{lesson.title}</h1>
      {lesson.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {lesson.advanced && (
        <details>
          <summary>Go deeper</summary>
          <p>{lesson.advanced}</p>
        </details>
      )}
      {lesson.tryScenario && (
        <button type="button" className="primary-button" onClick={() => onTry(lesson.tryScenario!)}>
          {lesson.tryLabel ?? "Try it on the field"} →
        </button>
      )}
    </article>
  );
}
