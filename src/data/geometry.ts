import type { Point, SideId } from "../types";

// ---------------------------------------------------------------------------
// Logical football coordinate system (resolved once, see REACT-HANDOFF.md).
//
//   x: 0   = defensive-RIGHT sideline  -> screen LEFT
//      100 = defensive-LEFT  sideline  -> screen RIGHT
//   y: 0   = top of the view (defense deep)
//      100 = bottom of the view (offensive backfield)
//
// Defense is always on TOP, offense BELOW. Directions follow the defender
// facing the offense: the defender's RIGHT appears on screen-left and their
// LEFT on screen-right. One uniform projection maps logical -> design pixels;
// nothing is mirrored with CSS transforms.
// ---------------------------------------------------------------------------

/** Uniform logical->design scale. Keeps circles circular (no distortion). */
export const DESIGN_SCALE = 10;
export const DESIGN_W = 100 * DESIGN_SCALE; // 1000

export function toDesign(p: Point): Point {
  return { x: p.x * DESIGN_SCALE, y: p.y * DESIGN_SCALE };
}

// Vertical landmarks (logical y).
export const Y = {
  fieldTop: 6,
  fs: 11,
  cb: 24,
  ws: 32,
  lb: 37,
  dl: 43,
  los: 48,
  ol: 52.5,
  wrLine: 51.5,
  slot: 55,
  qbShotgun: 63,
  qbUnderCenter: 58,
  fb: 68,
  rbOffset: 73,
  rbDeep: 79,
  backfield: 73,
  fieldBottom: 90,
  hashLabel: 88,
} as const;

// Horizontal landmarks (logical x).
export const X = {
  leftSideline: 0,
  rightSideline: 100,
  rightHash: 38, // defender's right hash -> screen-left
  leftHash: 62, // defender's left hash  -> screen-right
  center: 50,
  wrInset: 6, // widest receiver, just inside the sideline
} as const;

/** Marker radii in design units. */
export const R = {
  defender: 22, // room for two-letter labels (CB/FS/WS)
  ss: 26,
  offense: 17, // half-size of the offense square (34x34) — more padding around the letter
  pin: 15,
} as const;

/** Ball x for a given side selection (ball spot = formation center). */
export function sideToCenter(side: SideId): number {
  switch (side) {
    case "left":
      return X.leftHash; // ball on defender's LEFT hash -> screen-right
    case "right":
      return X.rightHash; // ball on defender's RIGHT hash -> screen-left
    default:
      return X.center; // middle / middle-right
  }
}

/**
 * Direction from the formation center toward defensive strength (and the SS).
 * +1 shifts toward the defender's LEFT (higher x / screen-right);
 * -1 shifts toward the defender's RIGHT (lower x / screen-left).
 *
 * On a hash, strength is the wide side. On a middle ball the FS declares it:
 * River = right (defender's right), Laso = left (defender's left).
 */
export function sideToSsSign(side: SideId): 1 | -1 {
  // left hash  -> wide side is defender's RIGHT -> toward lower x -> -1
  // right hash -> wide side is defender's LEFT  -> toward higher x -> +1
  // middle (Laso = left) -> defender's LEFT  -> +1
  // middle-right (River = right) -> defender's RIGHT -> -1
  return side === "left" || side === "middle-right" ? -1 : 1;
}

/** "LEFT" or "RIGHT" from the defender's point of view for a strength sign. */
export function ssSideLabel(sign: 1 | -1): "LEFT" | "RIGHT" {
  return sign === 1 ? "LEFT" : "RIGHT";
}

/** Sideline x on the strong (SS) side for a strength sign. */
export function strongSideline(sign: 1 | -1): number {
  return 50 + sign * (50 - X.wrInset); // sign -1 -> 6, +1 -> 94
}

export function weakSideline(sign: 1 | -1): number {
  return 50 - sign * (50 - X.wrInset);
}

export function clampX(x: number): number {
  return Math.max(X.wrInset - 2, Math.min(100 - (X.wrInset - 2), x));
}
