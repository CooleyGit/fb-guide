import { REFERENCES, SCOPE_NOTES } from "../../data/references";

export function CoachingReferences() {
  return (
    <footer className="coaching-references">
      <p className="footer-head">
        <strong>Strong Safety · TCU 4-2-5 Defense.</strong> A personal learning guide, not an official team playbook.
        Follow your coaches’ calls, alignment rules, and assignments.
      </p>
      <details>
        <summary>Coaching references &amp; how to use this guide</summary>
        <ul className="reference-list">
          {REFERENCES.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.title}
              </a>
              <span> — {r.note}</span>
            </li>
          ))}
        </ul>
        <ul className="scope-list">
          {SCOPE_NOTES.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </details>
    </footer>
  );
}
