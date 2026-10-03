import type { CallId, Selection } from "../../types";
import { CALL_ORDER } from "../../data/calls";
import { Segmented } from "./Segmented";
import { FormationPicker } from "./FormationPicker";
import { BallStrengthPicker } from "./BallStrengthPicker";
import { LockIcon, LockOpenIcon } from "./icons";

export type LockKey = "call" | "side" | "formation";
export type Locks = Record<LockKey, boolean>;

const LOCK_LABEL: Record<LockKey, string> = {
  call: "assignment",
  side: "ball & strength",
  formation: "offensive formation",
};

export function PlayControls({
  selection,
  onChange,
  locks,
  onToggleLock,
  atLockLimit,
}: {
  selection: Selection;
  onChange: (patch: Partial<Selection>) => void;
  locks: Locks;
  onToggleLock: (key: LockKey) => void;
  atLockLimit: boolean;
}) {
  const lockButton = (key: LockKey) => {
    const locked = locks[key];
    const disabled = !locked && atLockLimit;
    return (
      <button
        type="button"
        className={`lock-toggle${locked ? " locked" : ""}`}
        aria-pressed={locked}
        aria-label={`${locked ? "Unlock" : "Lock"} ${LOCK_LABEL[key]} (keep it when shuffling)`}
        title={locked ? "Locked — won't shuffle" : disabled ? "Only two can be locked" : "Lock so it won't shuffle"}
        disabled={disabled}
        onClick={() => onToggleLock(key)}
      >
        {locked ? <LockIcon /> : <LockOpenIcon />}
      </button>
    );
  };

  return (
    <div className="play-controls">
      <div className="control-lockable">
        <Segmented<CallId>
          legend="Assignment"
          name="call"
          value={selection.call}
          onChange={(call) => onChange({ call })}
          options={CALL_ORDER.map((c) => ({ value: c, label: c }))}
        />
        {lockButton("call")}
      </div>

      <div className="control-lockable control-block">
        <span className="control-label">Ball &amp; strength</span>
        {lockButton("side")}
        <BallStrengthPicker value={selection.side} onChange={(side) => onChange({ side })} />
      </div>

      <div className="control-lockable control-block">
        <span className="control-label">Offensive formation</span>
        {lockButton("formation")}
        <FormationPicker value={selection.formation} onChange={(formation) => onChange({ formation })} />
      </div>
    </div>
  );
}
