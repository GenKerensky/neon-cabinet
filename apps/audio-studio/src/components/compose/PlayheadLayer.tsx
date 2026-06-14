import { BEAT_WIDTH, LABEL_WIDTH } from "./compose-types";

export function PlayheadLayer({ beat }: { beat: number }) {
  return (
    <span
      aria-hidden="true"
      className="compose-playhead"
      data-testid="compose-playhead"
      style={{
        transform: `translateX(${LABEL_WIDTH + beat * BEAT_WIDTH}px)`,
      }}
    />
  );
}
