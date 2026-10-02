import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Hotspot } from "../../types";
import { DESIGN_SCALE } from "../../data/geometry";
import { lessonById } from "../../data/lessons";
import { useFieldProjection } from "./FieldViewport";

const S = DESIGN_SCALE;

export function HotspotPins({
  hotspots,
  openId,
  onOpen,
}: {
  hotspots: Hotspot[];
  openId: string | null;
  onOpen: (hotspot: Hotspot, invoker: HTMLElement | SVGElement | null) => void;
}) {
  return (
    <g className="hotspot-pins">
      {hotspots.map((h) => (
        <g
          key={h.id}
          className={`hotspot-pin${openId === h.id ? " open" : ""}`}
          transform={`translate(${h.at.x * S} ${h.at.y * S})`}
          role="button"
          tabIndex={0}
          aria-label={`Tip: ${h.title}`}
          aria-pressed={openId === h.id}
          onClick={(e) => onOpen(h, e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(h, e.currentTarget);
            }
          }}
        >
          <circle className="pin-halo" cx={0} cy={0} r={16} />
          <circle className="pin-dot" cx={0} cy={0} r={11} />
          <text className="pin-glyph" x={0} y={1} textAnchor="middle" dominantBaseline="middle">
            i
          </text>
        </g>
      ))}
    </g>
  );
}

interface TipBodyProps {
  hotspot: Hotspot;
  canSeek: boolean;
  highlightOn: boolean;
  onClose: () => void;
  onToggleHighlight: () => void;
  onShowMoment: () => void;
  onOpenLesson: (lessonId: string) => void;
}

export function TipPopover(props: TipBodyProps) {
  const { project, version } = useFieldProjection();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const client = project(scalePoint(props.hotspot));
    if (!client) return;
    const w = ref.current?.offsetWidth ?? 280;
    const h = ref.current?.offsetHeight ?? 160;
    let left = client.x + 18;
    let top = client.y - h / 2;
    // Keep inside the viewport.
    left = Math.min(window.innerWidth - w - 12, Math.max(12, left));
    top = Math.min(window.innerHeight - h - 12, Math.max(12, top));
    // If it would cover the pin on the right edge, flip to the left.
    if (client.x + 18 + w > window.innerWidth - 12) left = Math.max(12, client.x - w - 18);
    setPos({ left, top });
  }, [project, version, props.hotspot]);

  useEffect(() => {
    closeRef.current?.focus();
  }, [props.hotspot.id]);

  return createPortal(
    <div
      ref={ref}
      className="tip-popover"
      role="dialog"
      aria-label={props.hotspot.title}
      style={pos ? { left: pos.left, top: pos.top } : { visibility: "hidden" }}
    >
      <TipBodyWithCloseRef {...props} closeRef={closeRef} />
    </div>,
    document.body,
  );
}

export function TipSheet(props: TipBodyProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, [props.hotspot.id]);
  return (
    <div className="tip-sheet" role="dialog" aria-label={props.hotspot.title}>
      <TipBodyWithCloseRef {...props} closeRef={closeRef} />
    </div>
  );
}

function TipBodyWithCloseRef(props: TipBodyProps & { closeRef: React.RefObject<HTMLButtonElement | null> }) {
  const { closeRef, ...rest } = props;
  const lesson = rest.hotspot.lessonId ? lessonById(rest.hotspot.lessonId) : undefined;
  return (
    <>
      <div className="tip-header">
        <h3>{rest.hotspot.title}</h3>
        <button ref={closeRef} type="button" className="icon-button" onClick={rest.onClose} aria-label="Close tip">
          ✕
        </button>
      </div>
      <p className="tip-explanation">{rest.hotspot.explanation}</p>
      {rest.hotspot.deeper && <p className="tip-deeper">{rest.hotspot.deeper}</p>}
      <div className="tip-actions">
        {rest.hotspot.highlightIds && rest.hotspot.highlightIds.length > 0 && (
          <button type="button" className="chip-button" aria-pressed={rest.highlightOn} onClick={rest.onToggleHighlight}>
            {rest.highlightOn ? "Clear highlight" : "Highlight on field"}
          </button>
        )}
        {rest.hotspot.cue !== undefined && rest.canSeek && (
          <button type="button" className="chip-button" onClick={rest.onShowMoment}>
            Show this moment
          </button>
        )}
        {lesson && (
          <button type="button" className="chip-button" onClick={() => rest.onOpenLesson(lesson.id)}>
            Learn: {lesson.title}
          </button>
        )}
      </div>
    </>
  );
}

function scalePoint(h: Hotspot) {
  return { x: h.at.x * S, y: h.at.y * S };
}
