import { useEffect, useRef, useState, type ReactNode } from "react";
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
  { mode: "detail", label: "Readable detail", icon: <DetailIcon /> },
  { mode: "fit", label: "Whole field", icon: <FitIcon /> },
  { mode: "focus", label: "Focus the SS", icon: <FocusIcon /> },
];

/**
 * A single control button in the field's corner that opens zoom/view options.
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
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="field-menu" ref={ref} onPointerDown={(e) => e.stopPropagation()}>
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
      {open && (
        <div className="field-menu-panel" role="menu" aria-label="Field view options">
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
        </div>
      )}
    </div>
  );
}
