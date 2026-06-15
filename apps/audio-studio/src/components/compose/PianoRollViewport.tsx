import type { PointerEvent, RefObject, ReactNode } from "react";
import { PianoRollGrid } from "./PianoRollGrid";
import { PianoRollKeys } from "./PianoRollKeys";
import { PianoRollRuler } from "./PianoRollRuler";

export function PianoRollViewport({
  children,
  gridRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  children: ReactNode;
  gridRef: RefObject<HTMLDivElement | null>;
  onPointerDown(event: PointerEvent<HTMLDivElement>): void;
  onPointerMove(event: PointerEvent<HTMLDivElement>): void;
  onPointerUp(event: PointerEvent<HTMLDivElement>): void;
}) {
  return (
    <div className="piano-roll">
      <PianoRollRuler />
      <div
        aria-label="Piano roll note grid"
        className="piano-grid"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        ref={gridRef}
        role="grid"
      >
        <PianoRollKeys />
        <PianoRollGrid />
        {children}
      </div>
    </div>
  );
}
