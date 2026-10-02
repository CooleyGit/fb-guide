import type { FormationId } from "../../types";
import { FORMATIONS, FORMATION_ORDER, buildOffense } from "../../data/formations";
import { NeutralIcon, PassIcon, RunIcon } from "./icons";

const TENDENCY: Record<"run" | "pass" | "neutral", { word: string; Icon: () => React.ReactNode }> = {
  run: { word: "Run-leaning", Icon: () => <RunIcon size={19} /> },
  pass: { word: "Pass-leaning", Icon: () => <PassIcon size={19} /> },
  neutral: { word: "Balanced", Icon: () => <NeutralIcon size={19} /> },
};

const PREVIEW_W = 120;
const PREVIEW_H = 72;

/** Small, accurate alignment preview built from the real offense generator. */
function MiniFormation({ formation }: { formation: FormationId }) {
  // Use a middle ball with strength to screen-right so previews read consistently.
  const players = buildOffense(formation, 50, 1);
  // Logical coords 0..100 x, ~48..80 y (LOS down to backfield). Map into the box.
  const minY = 46;
  const maxY = 82;
  const sx = (x: number) => (x / 100) * (PREVIEW_W - 10) + 5;
  const sy = (y: number) => ((y - minY) / (maxY - minY)) * (PREVIEW_H - 14) + 7;
  return (
    <svg className="mini-formation" viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`} aria-hidden="true">
      <line className="mini-los" x1={0} x2={PREVIEW_W} y1={sy(48)} y2={sy(48)} />
      {players.map((p) => (
        <rect
          key={p.id}
          className={`mini-dot${p.onLine ? " on-line" : ""}${p.role === "TE" ? " te" : ""}`}
          x={sx(p.x) - 3}
          y={sy(p.y) - 3}
          width={6}
          height={6}
          rx={1}
        />
      ))}
    </svg>
  );
}

export function FormationPicker({
  value,
  onChange,
}: {
  value: FormationId;
  onChange: (f: FormationId) => void;
}) {
  return (
    <div className="formation-picker" role="radiogroup" aria-label="Offensive formation">
      {FORMATION_ORDER.map((id) => {
        const meta = FORMATIONS[id];
        const selected = value === id;
        const t = TENDENCY[meta.tendency];
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`formation-card lean-${meta.tendency}${selected ? " selected" : ""}`}
            onClick={() => onChange(id)}
            title={meta.lean}
          >
            <MiniFormation formation={id} />
            <span className="formation-card-name">{meta.name}</span>
            <span className={`tendency-bar tendency-${meta.tendency}`}>
              {t.Icon()}
              <span className="tendency-word">{t.word}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
