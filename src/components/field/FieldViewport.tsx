import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Point, Scenario } from "../../types";
import type { FieldView } from "../../state/storage";
import { applyPan, computeViewBox, panRange, type ViewBox } from "./viewbox";

interface ProjectionValue {
  svgRef: React.RefObject<SVGSVGElement | null>;
  /** Map a design-space point to client (viewport) pixels. */
  project: (p: Point) => Point | null;
  viewBox: ViewBox;
  /** Bumps whenever the visible window changes (pan / resize / mode). */
  version: number;
}

const ProjectionContext = createContext<ProjectionValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useFieldProjection(): ProjectionValue {
  const ctx = useContext(ProjectionContext);
  if (!ctx) throw new Error("useFieldProjection must be used within FieldViewport");
  return ctx;
}

export function FieldViewport({
  scenario,
  mode,
  children,
  overlay,
  describedById,
  resetSignal,
}: {
  scenario: Scenario;
  mode: FieldView;
  children: ReactNode;
  overlay?: ReactNode;
  describedById?: string;
  resetSignal?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [aspect, setAspect] = useState(1.12);
  const [panX, setPanX] = useState(0);
  const [version, setVersion] = useState(0);

  // Observe the container (not the svg) to avoid resize feedback loops.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setAspect((prev) => {
          const next = r.width / r.height;
          return Math.abs(next - prev) < 0.001 ? prev : next;
        });
      }
      setVersion((v) => v + 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseViewBox = useMemo(
    () => computeViewBox(mode, scenario, aspect),
    [mode, scenario, aspect],
  );

  // Reset pan when the window definition changes (or on explicit "Reset view").
  useEffect(() => {
    setPanX(0);
  }, [mode, scenario.selection, aspect, resetSignal]);

  const viewBox = useMemo(() => applyPan(baseViewBox, panX), [baseViewBox, panX]);
  const canPan = panRange(baseViewBox) > 1;

  const project = useCallback((p: Point): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = p.x;
    pt.y = p.y;
    const mapped = pt.matrixTransform(ctm);
    return { x: mapped.x, y: mapped.y };
  }, []);

  // Horizontal drag panning (vertical gestures fall through to page scroll).
  const drag = useRef<{ startX: number; startY: number; startPan: number; active: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (!canPan) return;
    drag.current = { startX: e.clientX, startY: e.clientY, startPan: panX, active: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = containerRef.current;
    if (!d || !el) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.active) {
      if (Math.abs(dx) < 6 || Math.abs(dx) <= Math.abs(dy)) return; // let vertical scroll win
      d.active = true;
      el.setPointerCapture(e.pointerId);
    }
    const rect = el.getBoundingClientRect();
    const designDx = (dx * viewBox.w) / rect.width;
    const range = panRange(baseViewBox);
    setPanX(Math.max(-range, Math.min(range, d.startPan - designDx)));
  };
  const endDrag = (e: React.PointerEvent) => {
    const el = containerRef.current;
    if (drag.current?.active && el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    drag.current = null;
  };

  // Repositioning signal for overlays after layout settles.
  useLayoutEffect(() => {
    setVersion((v) => v + 1);
  }, [viewBox.x, viewBox.y, viewBox.w, viewBox.h]);

  const projection = useMemo<ProjectionValue>(
    () => ({ svgRef, project, viewBox, version }),
    [project, viewBox, version],
  );

  return (
    <ProjectionContext.Provider value={projection}>
      <div
        ref={containerRef}
        className="field-viewport"
        data-can-pan={canPan ? "true" : "false"}
        style={{ touchAction: canPan ? "pan-y" : "auto" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <svg
          ref={svgRef}
          className="field-svg"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby={describedById}
        >
          {children}
        </svg>
        {overlay}
      </div>
    </ProjectionContext.Provider>
  );
}
