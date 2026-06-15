import { PIANO_ROWS } from "./compose-types";

export function PianoRollKeys() {
  return (
    <div className="piano-key-column">
      {PIANO_ROWS.map((row) => (
        <span key={row}>{row}</span>
      ))}
    </div>
  );
}
