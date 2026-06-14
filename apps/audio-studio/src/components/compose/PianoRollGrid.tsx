import { PIANO_ROWS, VISIBLE_BEATS } from "./compose-types";

export function PianoRollGrid() {
  return (
    <>
      <div aria-hidden="true" className="piano-row-guides">
        {PIANO_ROWS.map((row) => (
          <span className="piano-row-guide" key={row} />
        ))}
      </div>
      <div aria-hidden="true" className="piano-beat-guides">
        {Array.from({ length: VISIBLE_BEATS + 1 }, (_value, index) => (
          <span
            className={
              index % 4 === 0 ? "piano-beat-column bar" : "piano-beat-column"
            }
            key={index}
          />
        ))}
      </div>
    </>
  );
}
