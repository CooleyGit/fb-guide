import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { OutcomeId, PassTarget, RunDirection } from "../../types";
import { PassIcon, QBRunIcon, RunIcon } from "../plays/icons";

const OUTCOMES: { id: OutcomeId; label: string; Icon: (p: { size?: number }) => React.ReactNode }[] = [
  { id: "run", label: "Run", Icon: RunIcon },
  { id: "pass", label: "Pass", Icon: PassIcon },
  { id: "qb", label: "QB run", Icon: QBRunIcon },
];

const DIRECTIONS: { id: RunDirection; label: string }[] = [
  { id: "strong", label: "To your edge" },
  { id: "weak", label: "Away from you" },
];

const PASS_TARGETS: { id: PassTarget; label: string }[] = [
  { id: "curl", label: "Curl" },
  { id: "flat", label: "Flat" },
  { id: "away", label: "Other side" },
];

function iconFor(outcome: OutcomeId) {
  return (OUTCOMES.find((o) => o.id === outcome) ?? OUTCOMES[0]!).Icon;
}

/**
 * Bottom-right field control for the play variation (what happens after the
 * snap + which way the ball goes). The button shows the current outcome icon;
 * the panel is portaled and opens up-and-left so it is never clipped. The
 * "Ball goes" column opens to the right of the outcomes.
 */
export function PlayMenu({
  outcome,
  onOutcome,
  direction,
  onDirection,
  passTarget,
  onPassTarget,
  showDirection,
}: {
  outcome: OutcomeId;
  onOutcome: (o: OutcomeId) => void;
  direction: RunDirection;
  onDirection: (d: RunDirection) => void;
  passTarget: PassTarget;
  onPassTarget: (t: PassTarget) => void;
  showDirection: boolean;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ right: number; bottom: number; maxHeight: number } | null>(null);
  const CurrentIcon = iconFor(outcome);

  const reposition = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const right = Math.max(8, window.innerWidth - r.right);
    const bottom = window.innerHeight - r.top + 8;
    setPos({ right, bottom, maxHeight: Math.max(180, r.top - 16) });
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
        aria-label={`Change the play — currently ${outcome}`}
        onClick={() => setOpen((o) => !o)}
      >
        <CurrentIcon size={22} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            className={`field-menu-panel play-menu-panel${showDirection ? " two-col" : ""}`}
            role="menu"
            aria-label="Change the play"
            style={{ right: pos.right, bottom: pos.bottom, maxHeight: pos.maxHeight }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="pm-col">
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
            </div>
            {showDirection && (
              <div className="pm-col pm-col-direction">
                <p className="field-menu-group">Ball goes</p>
                {outcome === "pass"
                  ? PASS_TARGETS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={passTarget === t.id}
                        className="field-menu-item"
                        onClick={() => onPassTarget(t.id)}
                      >
                        <span>{t.label}</span>
                      </button>
                    ))
                  : DIRECTIONS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={direction === d.id}
                        className="field-menu-item"
                        onClick={() => onDirection(d.id)}
                      >
                        <span>{d.label}</span>
                      </button>
                    ))}
                <p className="menu-hint">↻ shuffles a new rep.</p>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
