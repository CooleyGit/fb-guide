import type { Point, Scenario } from "../../types";
import { DESIGN_SCALE, Y } from "../../data/geometry";
import type { FieldView } from "../../state/storage";

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Content bounds in design units (logical * 10) with margin for the rotated
// sideline labels, the hash labels below, and breathing room above the
// "Defense above · offense below" caption.
export const CONTENT: ViewBox = { x: -40, y: -18, w: 1080, h: 1008 };

function d(v: number): number {
  return v * DESIGN_SCALE;
}

/** Fit the content box inside the given aspect ("meet": show everything). */
function fitBox(aspect: number): ViewBox {
  const contentAspect = CONTENT.w / CONTENT.h;
  if (aspect >= contentAspect) {
    // Container wider than content: height is the limiting dimension.
    const h = CONTENT.h;
    const w = h * aspect;
    return { x: CONTENT.x + (CONTENT.w - w) / 2, y: CONTENT.y, w, h };
  }
  const w = CONTENT.w;
  const h = w / aspect;
  return { x: CONTENT.x, y: CONTENT.y + (CONTENT.h - h) / 2, w, h };
}

function clampViewBox(vb: ViewBox): ViewBox {
  // Keep the horizontal window within the content box when it is narrower.
  let x = vb.x;
  if (vb.w <= CONTENT.w) {
    x = Math.max(CONTENT.x, Math.min(CONTENT.x + CONTENT.w - vb.w, vb.x));
  } else {
    x = CONTENT.x + (CONTENT.w - vb.w) / 2;
  }
  let y = vb.y;
  if (vb.h <= CONTENT.h) {
    y = Math.max(CONTENT.y, Math.min(CONTENT.y + CONTENT.h - vb.h, vb.y));
  } else {
    y = CONTENT.y + (CONTENT.h - vb.h) / 2;
  }
  return { x, y, w: vb.w, h: vb.h };
}

/**
 * Compute the base viewBox (before pan) for a view mode.
 * @param aspect container width / height
 */
export function computeViewBox(mode: FieldView, scenario: Scenario, aspect: number): ViewBox {
  if (mode === "fit") return fitBox(aspect);

  const ss = scenario.players.find((p) => p.isSS)!;
  const ssX = d(ss.x);
  const sign = scenario.ssSign;

  if (mode === "focus") {
    // Frame the SS with his key, the strong edge, the LOS, and route space.
    const key = scenario.keyId ? scenario.players.find((p) => p.id === scenario.keyId) : undefined;
    const edgeX = d(scenario.center + sign * 22);
    const xs = [ssX, d(scenario.center + sign * 4), key ? d(key.x) : ssX, edgeX];
    const minX = Math.min(...xs) - 90;
    const maxX = Math.max(...xs) + 90;
    const top = d(22); // route / coverage space above
    const bottom = d(Y.rbOffset); // down to the backfield edge
    const w = Math.max(360, maxX - minX);
    const h = w / aspect;
    const cy = (top + bottom) / 2;
    return clampViewBox({ x: minX, y: cy - h / 2, w, h });
  }

  // detail: readable zoom centered on the SS, including the LOS below. Biased
  // slightly toward the formation so sideline players aren't clipped awkwardly.
  const w = Math.min(CONTENT.w, 740);
  const h = w / aspect;
  const cx = ssX + (d(scenario.center) - ssX) * 0.28;
  const cy = (d(ss.y) + d(Y.los + 6)) / 2;
  return clampViewBox({ x: cx - w / 2, y: cy - h / 2, w, h });
}

/** Apply a horizontal pan (design units) and re-clamp. */
export function applyPan(vb: ViewBox, panX: number): ViewBox {
  return clampViewBox({ ...vb, x: vb.x + panX });
}

/** Max pan magnitude available for the current viewBox (design units). */
export function panRange(vb: ViewBox): number {
  return Math.max(0, (CONTENT.w - vb.w) / 2);
}

export function designPoint(p: Point): Point {
  return { x: d(p.x), y: d(p.y) };
}
