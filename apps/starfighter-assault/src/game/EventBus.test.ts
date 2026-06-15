import type { Scene } from "phaser";
import { describe, expect, it } from "vitest";
import { EventBus } from "./EventBus";

describe("EventBus", () => {
  it("emits the current scene when ready", () => {
    const scene = {} as Scene;
    let receivedScene: Scene | undefined;

    const handleSceneReady = (sceneInstance: Scene) => {
      receivedScene = sceneInstance;
    };

    EventBus.on("current-scene-ready", handleSceneReady);
    EventBus.emit("current-scene-ready", scene);
    EventBus.removeListener("current-scene-ready", handleSceneReady);

    expect(receivedScene).toBe(scene);
  });
});
