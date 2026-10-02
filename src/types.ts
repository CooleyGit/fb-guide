// Core domain types shared across data, scenario derivation, and UI.

export type CallId = "Power" | "Blitz" | "Zone" | "Man";
export type SideId = "left" | "middle" | "middle-right" | "right";
export type FormationId =
  | "trips"
  | "twins"
  | "pro"
  | "double"
  | "empty"
  | "i"
  | "offset-i"
  | "pistol";
export type OutcomeId = "read" | "run" | "pass" | "qb";
export type PhaseId = "before" | "read" | "react";

export interface Selection {
  call: CallId;
  side: SideId;
  formation: FormationId;
  outcome: OutcomeId;
}

/** Logical football point. x: 0 = defensive-right sideline (screen-left),
 * 100 = defensive-left sideline (screen-right). y: 0 = top (defense deep),
 * 100 = bottom (offensive backfield). One projection maps this to screen. */
export interface Point {
  x: number;
  y: number;
}

export interface Keyframe extends Point {
  /** Normalized timeline position 0..1. */
  t: number;
}

export type PlayerSide = "offense" | "defense";

export type PlayerRole =
  | "OL"
  | "QB"
  | "RB"
  | "FB"
  | "TE"
  | "WR"
  | "slot"
  | "SS"
  | "FS"
  | "WS"
  | "CB"
  | "LB"
  | "DE"
  | "DT";

export interface DerivedPlayer extends Point {
  /** Stable id so markers persist across formation changes. */
  id: string;
  label: string;
  side: PlayerSide;
  role: PlayerRole;
  onLine?: boolean;
  /** Receiver number counted from the sideline inward (1 = widest). */
  no?: number;
  /** Which side of the formation this skill player is on. */
  strongSide?: boolean;
  /** Motion keyframes in logical coordinates (optional). */
  keyframes?: Keyframe[];
  isSS?: boolean;
  isKey?: boolean;
}

export type PathKind = "ss" | "assignment" | "ball" | "ballFlight";

export interface DerivedPath {
  id: string;
  kind: PathKind;
  /** Quadratic control points: [start, control, end]. */
  from: Point;
  control: Point;
  to: Point;
  /** Fraction of the full timeline over which the path is "drawn". */
  phase: PhaseId;
  label?: { text: string; at: Point };
  /** True when the path exposes the defensive answer (hidden in study mode). */
  revealsAnswer: boolean;
}

export interface DerivedZone {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  labelAt: Point;
}

export type HotspotAnchor =
  | "ss"
  | "assigned"
  | "edge"
  | "hash"
  | "no2"
  | "mesh"
  | "coverage";

export interface Hotspot {
  id: string;
  anchor: HotspotAnchor;
  /** Logical point the pin and highlight attach to. */
  at: Point;
  title: string;
  prompt: string;
  explanation: string;
  deeper?: string;
  /** Optional "show this moment" cue (normalized timeline position). */
  cue?: number;
  /** Element ids to emphasize when "Highlight on field" is used. */
  highlightIds?: string[];
  /** True when this tip would reveal the hidden answer (removed in study mode). */
  revealsAnswer: boolean;
  /** Optional related lesson id for a "learn more" link. */
  lessonId?: string;
  /** When false, the tip is reachable from the list but has no on-field pin. */
  pin?: boolean;
}

export interface Caption {
  phase: PhaseId;
  text: string;
}

export interface CoachViewOverlay {
  readKey?: { at: Point; label: string };
  forceEdge?: { from: Point; to: Point; label: string };
  coverage?: DerivedZone;
}

export interface ScenarioContent {
  task: string;
  sideWhy: string;
  roleWhy: string;
  formationWhy: string;
  response: string;
  beginnerEyes: string;
  beginnerMove: string;
  beginnerMistake: string;
  beginnerCheck: string;
  advancedFormation: string;
  advancedCall: string;
  advancedOutcome: string;
  outcomeNote: string;
}

export interface Scenario {
  selection: Selection;
  players: DerivedPlayer[];
  paths: DerivedPath[];
  zone?: DerivedZone;
  ballKeyframes: Keyframe[];
  /** Normalized time at which a thrown ball leaves the QB (pass only). */
  ballFlightFrom?: number;
  ssId: string;
  keyId?: string;
  ssSide: "LEFT" | "RIGHT";
  ssSign: 1 | -1;
  center: number;
  scenarioTitle: string;
  positionText: string;
  content: ScenarioContent;
  hotspots: Hotspot[];
  captions: Caption[];
  textEquivalent: string;
  coachView: CoachViewOverlay;
  formationName: string;
  formationLean: string;
  formationWhy: string;
}
