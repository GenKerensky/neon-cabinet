import type { Scene } from "phaser";
import { TypedEventEmitter } from "@neon-cabinet/typed-event-emitter";

export interface MazeRunnerEventMap extends Record<string, unknown[]> {
  "current-scene-ready": [Scene];
}

export const EventBus = new TypedEventEmitter<MazeRunnerEventMap>();
