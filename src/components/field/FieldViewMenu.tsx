import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { FieldView } from "../../state/storage";
import { DetailIcon, FitIcon, FocusIcon, ResetIcon, SlidersIcon } from "../plays/icons";

export interface ViewMenuExtra {
  id: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}

const VIEWS: { mode: FieldView; label: string; icon: ReactNode }[] = [
  { mode: "fit", label: "Whole field", icon: <FitIcon /> },
  { mode: "detail", label: "Readable detail", icon: <DetailIcon /> },
  { mode: "focus", label: "Focus the SS", icon: <FocusIcon /> },
];

const PANEL_WIDTH = 212;

/**
 * A single control button in the field's corner that opens zoom/view options.
 * The panel is portaled to the body and positioned with fixed coordinates so
 * it is never clipped by the field's overflow or cropped on small screens.
 * Reused on Plays (with study extras) and Practice (view only).
 */
export function FieldViewMenu({
  mode,
  onMode,
  onReset,
  extras = [],
}: {
  mode: FieldView;
  onMode: (mode: FieldView) => void;
  onReset: () => void;
  extras?: ViewMenuExtra[];
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; maxHeight: number } | null>(null);

  const reposition = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(8, Math.min(window.innerWidth - PANEL_WIDTH - 8, r.right - PANEL_WIDTH));
    const top = r.bottom + 6;
    setPos({ left, top, maxHeight: Math.max(160, window.innerHeight - top - 12) });
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
    <div className="field-menu" onPointerDown={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        className="field-menu-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Field view options"
        onClick={() => setOpen((o) => !o)}
      >
        <SlidersIcon />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            className="field-menu-panel"
            role="menu"
            aria-label="Field view options"
            style={{ left: pos.left, top: pos.top, maxHeight: pos.maxHeight }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <p className="field-menu-group">View</p>
            {VIEWS.map((v) => (
              <button
                key={v.mode}
                type="button"
                role="menuitemradio"
                aria-checked={mode === v.mode}
                className="field-menu-item"
                onClick={() => onMode(v.mode)}
              >
                {v.icon}
                <span>{v.label}</span>
              </button>
            ))}
            <button type="button" role="menuitem" className="field-menu-item" onClick={onReset}>
              <ResetIcon />
              <span>Reset view</span>
            </button>
            {extras.length > 0 && <p className="field-menu-group">Show</p>}
            {extras.map((x) => (
              <button
                key={x.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={x.active}
                className="field-menu-item"
                onClick={x.onClick}
              >
                {x.icon}
                <span>{x.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
