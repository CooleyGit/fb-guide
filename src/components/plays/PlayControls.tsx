import type { CallId, Selection } from "../../types";
import { CALL_ORDER } from "../../data/calls";
import { Segmented } from "./Segmented";
import { FormationPicker } from "./FormationPicker";
import { BallStrengthPicker } from "./BallStrengthPicker";

export function PlayControls({
  selection,
  onChange,
}: {
  selection: Selection;
  onChange: (patch: Partial<Selection>) => void;
}) {
  return (
    <div className="play-controls">
      <Segmented<CallId>
        legend="Assignment"
        name="call"
        value={selection.call}
        onChange={(call) => onChange({ call })}
        options={CALL_ORDER.map((c) => ({ value: c, label: c }))}
      />

      <div className="control-block">
        <span className="control-label">Ball &amp; strength</span>
        <BallStrengthPicker value={selection.side} onChange={(side) => onChange({ side })} />
      </div>

      <div className="control-block">
        <span className="control-label">Offensive formation</span>
        <FormationPicker value={selection.formation} onChange={(formation) => onChange({ formation })} />
      </div>
    </div>
  );
}
