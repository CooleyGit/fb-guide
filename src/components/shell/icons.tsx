// Simple inline icons (currentColor), used in the navigation and shell.
export function PlaysIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
export function PracticeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
      <rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.6" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.6" />
      <line x1="8" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
export function LearnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
      <path
        d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v13c-3-1-6-1-8 1-2-2-5-2-8-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <line x1="12" y1="6" x2="12" y2="19" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
export function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
