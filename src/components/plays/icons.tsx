// Compact inline icons (currentColor). Run/pass/QB icons are reused across the
// formation tendencies and the play-variation control so the language is consistent.
type IconProps = { size?: number };

const svg = (size: number, children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor">
    {children}
  </svg>
);

// Shared football glyph (pointed ellipse + laces), centered at (cx, cy).
function ball(cx: number, cy: number, l = 5, h = 3.2) {
  return (
    <>
      <path
        d={`M${cx - l} ${cy} Q${cx} ${cy - h} ${cx + l} ${cy} Q${cx} ${cy + h} ${cx - l} ${cy} Z`}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d={`M${cx - 2} ${cy} H${cx + 2}`} strokeWidth="1.1" strokeLinecap="round" />
      <path
        d={`M${cx - 1} ${cy - 1.1} V${cy + 1.1} M${cx + 1} ${cy - 1.1} V${cy + 1.1}`}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </>
  );
}

export function RunIcon({ size = 20 }: IconProps) {
  // Ball driving forward on the ground.
  return svg(
    size,
    <>
      {ball(7, 13)}
      <path d="M13.5 13 H20 M17.5 10.3 L20 13 L17.5 15.7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );
}

export function PassIcon({ size = 20 }: IconProps) {
  // Ball thrown on an arc through the air.
  return svg(
    size,
    <>
      <path d="M3 18 Q9 6 16 8.5" strokeWidth="1.5" strokeDasharray="1.5 3" strokeLinecap="round" />
      <g transform="rotate(-32 16 7)">{ball(16, 7, 4.6, 3)}</g>
    </>,
  );
}

export function QBRunIcon({ size = 20 }: IconProps) {
  // Ball on a scramble / keeper path.
  return svg(
    size,
    <>
      {ball(6, 13)}
      <path d="M12.5 13 C 14 9.5, 15.2 16.5, 17 12.5" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M17 12.5 L14.8 12.5 M17 12.5 L17.6 14.8" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );
}

export function NeutralIcon({ size = 20 }: IconProps) {
  // Ball that could go either way.
  return svg(
    size,
    <>
      {ball(12, 12, 4.4, 2.9)}
      <path
        d="M5.5 12 H2.5 M4 10.6 L2.5 12 L4 13.4 M18.5 12 H21.5 M20 10.6 L21.5 12 L20 13.4"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  );
}

export function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
    >
      <path d="M6 9 L12 15 L18 9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FitIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M4 9 V4 H9 M15 4 H20 V9 M20 15 V20 H15 M9 20 H4 V15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );
}

export function DetailIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <circle cx="11" cy="11" r="6" strokeWidth="2" />
      <path d="M20 20 L16 16 M11 8 V14 M8 11 H14" strokeWidth="2" strokeLinecap="round" />
    </>,
  );
}

export function FocusIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <circle cx="12" cy="12" r="4" strokeWidth="2" />
      <path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22" strokeWidth="2" strokeLinecap="round" />
    </>,
  );
}

export function ResetIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M19 12 A7 7 0 1 1 12 5 L16 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 2 L16 5 L13 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );
}

export function EyeIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M2 12 S6 5 12 5 S22 12 22 12 S18 19 12 19 S2 12 2 12Z" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" strokeWidth="2" />
    </>,
  );
}

export function EyeOffIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M2 12 S6 5 12 5 S22 12 22 12 S18 19 12 19 S2 12 2 12Z" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" strokeWidth="2" />
      <path d="M4 4 L20 20" strokeWidth="2.2" strokeLinecap="round" />
    </>,
  );
}

export function StarIcon({ filled = false, size = 18 }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor">
      <path
        d="M12 3 L14.6 8.6 L20.8 9.3 L16.2 13.4 L17.5 19.5 L12 16.4 L6.5 19.5 L7.8 13.4 L3.2 9.3 L9.4 8.6 Z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LinkIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M9 15 L15 9" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 7 L12 5 A3.5 3.5 0 0 1 19 12 L17 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 17 L12 19 A3.5 3.5 0 0 1 5 12 L7 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );
}

export function MoreIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export function SlidersIcon({ size = 20 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M4 7 H20 M4 12 H20 M4 17 H20" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="2.3" strokeWidth="2" fill="var(--surface)" />
      <circle cx="15" cy="12" r="2.3" strokeWidth="2" fill="var(--surface)" />
      <circle cx="8" cy="17" r="2.3" strokeWidth="2" fill="var(--surface)" />
    </>,
  );
}

export function CoachIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M4 6 H20 V15 H4 Z" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 10 H16 M8 12.5 H13" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 15 L7 19 M15 15 L17 19" strokeWidth="2" strokeLinecap="round" />
    </>,
  );
}

export function PanelIcon({ size = 18 }: IconProps) {
  // Two columns — toggles the side notes panel.
  return svg(
    size,
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
      <path d="M15 5 V19" strokeWidth="2" />
    </>,
  );
}

export function GhostIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor">
      <circle cx="12" cy="11" r="7" strokeWidth="2" strokeDasharray="4 4" />
      <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" stroke="none">
        SS
      </text>
    </svg>
  );
}
