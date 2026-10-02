import type { CallId, OutcomeId, Selection, SideId } from "../../types";
import { CALL_ORDER, OUTCOME_LABELS, OUTCOME_ORDER } from "../../data/calls";
import { SIDES, SIDE_ORDER } from "../../data/sides";
import { Segmented } from "./Segmented";
import { FormationPicker } from "./FormationPicker";

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

      <label className="field-select">
        <span>Ball / strength</span>
        <select
          value={selection.side}
          onChange={(e) => onChange({ side: e.target.value as SideId })}
        >
          {SIDE_ORDER.map((s) => (
            <option key={s} value={s}>
              {SIDES[s].option}
            </option>
          ))}
        </select>
      </label>

      <div className="control-block">
        <span className="control-label">Offensive formation</span>
        <FormationPicker value={selection.formation} onChange={(formation) => onChange({ formation })} />
      </div>

      <Segmented<OutcomeId>
        legend="After the snap"
        name="outcome"
        value={selection.outcome}
        onChange={(outcome) => onChange({ outcome })}
        options={OUTCOME_ORDER.map((o) => ({ value: o, label: OUTCOME_LABELS[o] }))}
      />
    </div>
  );
}
