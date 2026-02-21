import type { Scene } from "phaser";
import { TypedEventEmitter } from "@neon-cabinet/typed-event-emitter";

/** Map event names to their payload types (tuple of args) */
export interface BattleTanksEventMap extends Record<string, unknown[]> {
  "current-scene-ready": [Scene];
}

export const EventBus = new TypedEventEmitter<BattleTanksEventMap>();
