import type { SideId } from "../types";

export interface SideMeta {
  id: SideId;
  option: string;
  /** True when the ball is in the middle (FS declares strength). */
  middle: boolean;
  /** FS strength call that applies on a middle ball, if any. */
  fsCall?: "RIVER" | "LASO";
}

export const SIDES: Record<SideId, SideMeta> = {
  left: {
    id: "left",
    option: "Ball On Left Hash · strength right",
    middle: false,
  },
  middle: {
    id: "middle",
    option: "Middle · LASO (left)",
    middle: true,
    fsCall: "LASO",
  },
  "middle-right": {
    id: "middle-right",
    option: "Middle · RIVER (right)",
    middle: true,
    fsCall: "RIVER",
  },
  right: {
    id: "right",
    option: "Ball On Right Hash · strength left",
    middle: false,
  },
};

export const SIDE_ORDER: SideId[] = ["left", "middle", "middle-right", "right"];
