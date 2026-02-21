import type { Scene } from "phaser";
import { TypedEventEmitter } from "@neon-cabinet/typed-event-emitter";

/** Map event names to their payload types (tuple of args) */
export interface SpaceDefenderEventMap extends Record<string, unknown[]> {
  "current-scene-ready": [Scene];
  /** Test-only events */
  "test-event": unknown[];
  "other-event": [];
}

export const EventBus = new TypedEventEmitter<SpaceDefenderEventMap>();
