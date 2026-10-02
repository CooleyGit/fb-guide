import type { SideId } from "../../types";

// Display order reads left-to-right across the field (screen-left = defender's
// right): right hash, middle (River / Laso), left hash.
const ORDER: SideId[] = ["right", "middle-right", "middle", "left"];

const LABELS: Record<SideId, { main: string; note: string }> = {
  right: { main: "Right hash", note: "strength left" },
  "middle-right": { main: "Middle", note: "River · right" },
  middle: { main: "Middle", note: "Laso · left" },
  left: { main: "Left hash", note: "strength right" },
};

/** Mini overhead strip: sidelines, both hashes, and the ball on its spot. */
function HashStrip({ side }: { side: SideId }) {
  const ballX = side === "right" ? 38 : side === "left" ? 62 : 50;
  // Strength arrow for a middle ball: Laso -> defender's left (screen-right),
  // River -> defender's right (screen-left).
  const dir = side === "middle" ? 1 : side === "middle-right" ? -1 : 0;
  return (
    <svg viewBox="0 0 100 30" className="hash-strip" aria-hidden="true">
      <line className="hs-ground" x1={4} x2={96} y1={22} y2={22} />
      <line className="hs-sideline" x1={4} x2={4} y1={13} y2={28} />
      <line className="hs-sideline" x1={96} x2={96} y1={13} y2={28} />
      <line className="hs-hash" x1={38} x2={38} y1={16} y2={27} />
      <line className="hs-hash" x1={62} x2={62} y1={16} y2={27} />
      {dir !== 0 && (
        <path
          className="hs-strength"
          d={`M50 9 H ${50 + dir * 16} M ${50 + dir * 16} 9 l ${-dir * 4} -3 M ${50 + dir * 16} 9 l ${-dir * 4} 3`}
        />
      )}
      <ellipse className="hs-ball" cx={ballX} cy={22} rx={3.4} ry={2.4} />
    </svg>
  );
}

export function BallStrengthPicker({
  value,
  onChange,
}: {
  value: SideId;
  onChange: (side: SideId) => void;
}) {
  return (
    <div className="ball-strength" role="radiogroup" aria-label="Ball and strength">
      {ORDER.map((side) => (
        <button
          key={side}
          type="button"
          role="radio"
          aria-checked={value === side}
          className={`ball-option${value === side ? " selected" : ""}`}
          onClick={() => onChange(side)}
        >
          <HashStrip side={side} />
          <span className="ball-option-main">{LABELS[side].main}</span>
          <span className="ball-option-note">{LABELS[side].note}</span>
        </button>
      ))}
    </div>
  );
}
