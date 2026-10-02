import { DESIGN_SCALE, X, Y } from "../../data/geometry";

const D = (v: number) => v * DESIGN_SCALE;

const YARD_ROWS = [18, 30, 42, 54, 66, 78];

/**
 * Static field surface drawn in design coordinates. Defense is on top and
 * offense below; left/right labels follow the defender facing the offense.
 * Lettering stays upright — nothing is mirrored.
 */
export function FootballField() {
  return (
    <g className="field" aria-hidden="true">
      <rect
        className="field-surface"
        x={D(X.leftSideline)}
        y={D(Y.fieldTop)}
        width={D(X.rightSideline - X.leftSideline)}
        height={D(Y.fieldBottom - Y.fieldTop)}
      />

      {/* Yard guide lines */}
      {YARD_ROWS.map((row) => (
        <line
          key={`yard-${row}`}
          className="yard-guide"
          x1={D(X.leftSideline)}
          x2={D(X.rightSideline)}
          y1={D(row)}
          y2={D(row)}
        />
      ))}

      {/* Hash ticks */}
      {YARD_ROWS.map((row) =>
        [X.rightHash, X.leftHash].map((hash) => (
          <line
            key={`tick-${row}-${hash}`}
            className="hash-tick"
            x1={D(hash) - 7}
            x2={D(hash) + 7}
            y1={D(row)}
            y2={D(row)}
          />
        )),
      )}

      {/* Hash guides + sidelines */}
      {[X.rightHash, X.leftHash].map((hash) => (
        <line
          key={`hash-${hash}`}
          className="hash-guide"
          x1={D(hash)}
          x2={D(hash)}
          y1={D(Y.fieldTop)}
          y2={D(Y.fieldBottom)}
        />
      ))}
      {[X.leftSideline, X.rightSideline].map((side) => (
        <line
          key={`side-${side}`}
          className="sideline"
          x1={D(side)}
          x2={D(side)}
          y1={D(Y.fieldTop)}
          y2={D(Y.fieldBottom)}
        />
      ))}

      {/* Line of scrimmage */}
      <line
        className="scrimmage-line"
        x1={D(X.leftSideline)}
        x2={D(X.rightSideline)}
        y1={D(Y.los)}
        y2={D(Y.los)}
      />
      <text className="field-label los-label" x={D(3)} y={D(Y.los) - 6} textAnchor="middle">
        LOS
      </text>

      {/* Orientation + landmark labels (upright). Kept in the top margin so the
          zoomed-in detail view crops it out cleanly rather than clipping it. */}
      <text className="field-label top-label" x={D(50)} y={D(Y.fieldTop) - 26} textAnchor="middle">
        Defense above · offense below
      </text>

      {/* Short yard ticks along each sideline. */}
      {YARD_ROWS.map((row) => (
        <g key={`sidetick-${row}`}>
          <line className="sideline-tick" x1={D(X.leftSideline)} x2={D(X.leftSideline) + 9} y1={D(row)} y2={D(row)} />
          <line className="sideline-tick" x1={D(X.rightSideline) - 9} x2={D(X.rightSideline)} y1={D(row)} y2={D(row)} />
        </g>
      ))}

      {/* Sideline labels, centered vertically on the LOS. Screen-left sideline is
          the defender's RIGHT; screen-right is his LEFT. */}
      <text
        className="boundary-label"
        x={D(X.leftSideline) - 16}
        y={D(Y.los)}
        textAnchor="middle"
        transform={`rotate(-90 ${D(X.leftSideline) - 16} ${D(Y.los)})`}
      >
        YOUR RIGHT SIDELINE
      </text>
      <text
        className="boundary-label"
        x={D(X.rightSideline) + 16}
        y={D(Y.los)}
        textAnchor="middle"
        transform={`rotate(90 ${D(X.rightSideline) + 16} ${D(Y.los)})`}
      >
        YOUR LEFT SIDELINE
      </text>

      <text className="field-label hash-label" x={D(X.rightHash)} y={D(Y.hashLabel)} textAnchor="middle">
        Your right hash
      </text>
      <text className="field-label hash-label" x={D(X.leftHash)} y={D(Y.hashLabel)} textAnchor="middle">
        Your left hash
      </text>
    </g>
  );
}
