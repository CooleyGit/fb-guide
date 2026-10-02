import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { OutcomeId } from "../../types";
import { PassIcon, QBRunIcon, RunIcon } from "../plays/icons";

export type DirectionMode = "random" | "strong" | "weak";

const OUTCOMES: { id: OutcomeId; label: string; Icon: (p: { size?: number }) => React.ReactNode }[] = [
  { id: "run", label: "Run", Icon: RunIcon },
  { id: "pass", label: "Pass", Icon: PassIcon },
  { id: "qb", label: "QB run", Icon: QBRunIcon },
];

const DIRECTIONS: { id: DirectionMode; label: string }[] = [
  { id: "random", label: "Random" },
  { id: "strong", label: "To your edge" },
  { id: "weak", label: "Away from you" },
];

const PANEL_WIDTH = 236;

function outcomeMeta(outcome: OutcomeId) {
  return OUTCOMES.find((o) => o.id === outcome) ?? OUTCOMES[0];
}

/**
 * Bottom-right field control for the play variation (what happens after the
 * snap + which way the ball goes). The button shows the current outcome icon;
 * the panel opens up-and-left and is portaled so it is never clipped.
 */
export function PlayMenu({
  outcome,
  onOutcome,
  directionMode,
  onDirectionMode,
  showDirection,
}: {
  outcome: OutcomeId;
  onOutcome: (o: OutcomeId) => void;
  directionMode: DirectionMode;
  onDirectionMode: (d: DirectionMode) => void;
  showDirection: boolean;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; bottom: number; maxHeight: number } | null>(null);
  const current = outcomeMeta(outcome)!;

  const reposition = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    // Open up-and-to-the-right: the panel's left edge aligns with the button so
    // it flows rightward and feels attached. Clamp if it would run off-screen.
    const left = Math.max(8, Math.min(window.innerWidth - PANEL_WIDTH - 8, r.left));
    const bottom = window.innerHeight - r.top + 8;
    setPos({ left, bottom, maxHeight: Math.max(180, r.top - 16) });
  };

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onScrollResize = () => reposition();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
    };
  }, [open]);

  return (
    <div className="play-menu" onPointerDown={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        className={`field-menu-button play-menu-button outcome-${outcome}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Change the play — currently ${current.label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <current.Icon size={22} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            className="field-menu-panel play-menu-panel"
            role="menu"
            aria-label="Change the play"
            style={{ left: pos.left, bottom: pos.bottom, maxHeight: pos.maxHeight }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <p className="field-menu-group">After the snap</p>
            {OUTCOMES.map((o) => (
              <button
                key={o.id}
                type="button"
                role="menuitemradio"
                aria-checked={outcome === o.id}
                className={`field-menu-item outcome-${o.id}`}
                onClick={() => onOutcome(o.id)}
              >
                <o.Icon size={18} />
                <span>{o.label}</span>
              </button>
            ))}
            {showDirection && (
              <>
                <p className="field-menu-group">Ball goes</p>
                {DIRECTIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={directionMode === d.id}
                    className="field-menu-item"
                    onClick={() => onDirectionMode(d.id)}
                  >
                    <span>{d.label}</span>
                  </button>
                ))}
                {directionMode === "random" && <p className="menu-hint">Picks a side each play.</p>}
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
