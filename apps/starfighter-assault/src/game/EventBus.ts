import { TypedEventEmitter } from "@neon-cabinet/typed-event-emitter";
import type { Scene } from "phaser";

interface GameEvents extends Record<string, unknown[]> {
  "current-scene-ready": [Scene];
}

export const EventBus = new TypedEventEmitter<GameEvents>();
