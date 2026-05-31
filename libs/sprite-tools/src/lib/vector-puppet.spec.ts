import type * as Phaser from "phaser";
import { describe, it, expect } from "vitest";
import { VectorPuppet } from "./vector-puppet.js";
import { SVGPuppetMetadata } from "./types.js";
import { MockScene } from "./phaser-mocks.js";

describe("VectorPuppet", () => {
  const isPhaserScene = (scene: unknown): scene is Phaser.Scene =>
    typeof scene === "object" &&
    scene !== null &&
    "add" in scene &&
    "tweens" in scene;

  const createPuppet = (
    scene: unknown,
    x: number,
    y: number,
    metadata: SVGPuppetMetadata,
  ) => {
    if (!isPhaserScene(scene)) {
      throw new Error("MockScene is not a Phaser.Scene");
    }

    return new VectorPuppet(scene, x, y, metadata);
  };

  const mustFind = <T>(value: T | undefined, message: string): T => {
    if (value === undefined) {
      throw new Error(message);
    }

    return value;
  };

  const metadata: SVGPuppetMetadata = {
    viewBox: { x: 0, y: 0, width: 100, height: 100 },
    layers: [
      {
        id: "body",
        type: "circle",
        cx: 0,
        cy: 0,
        r: 10,
        animations: [],
        material: {},
      },
    ],
    sockets: [{ id: "socket_laser", x: 10, y: -20, type: "spawn" }],
  };

  it("should register and calculate socket world positions", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, 100, 200, metadata);

    const pos = puppet.getSocketWorldPosition("socket_laser");
    expect(pos.x).toBe(60);
    expect(pos.y).toBe(130);

    puppet.setPosition(300, 400);
    const pos2 = puppet.getSocketWorldPosition("socket_laser");
    expect(pos2.x).toBe(260);
    expect(pos2.y).toBe(330);
  });

  it("setDirection LEFT rotates annotated layer to PI radians", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, 0, 0, {
      viewBox: { x: 0, y: 0, width: 100, height: 100 },
      layers: [
        {
          id: "rot",
          type: "circle",
          cx: 0,
          cy: 0,
          r: 10,
          directionRotation: { RIGHT: 0, DOWN: 90, LEFT: 180, UP: -90 },
          animations: [],
          material: {},
        },
      ],
      sockets: [],
    });

    puppet.setDirection("LEFT");

    const rotTween = mustFind(
      scene.tweenConfigs.find((c) => c.rotation !== undefined),
      "Missing rotation tween",
    );
    expect(rotTween.rotation).toBeCloseTo(Math.PI, 5);
  });

  it("setDirection UP rotates annotated layer to -PI/2 radians", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, 0, 0, {
      viewBox: { x: 0, y: 0, width: 100, height: 100 },
      layers: [
        {
          id: "rot",
          type: "circle",
          cx: 0,
          cy: 0,
          r: 10,
          directionRotation: { RIGHT: 0, DOWN: 90, LEFT: 180, UP: -90 },
          animations: [],
          material: {},
        },
      ],
      sockets: [],
    });

    puppet.setDirection("UP");

    const rotTween = mustFind(
      scene.tweenConfigs.find((c) => c.rotation !== undefined),
      "Missing rotation tween",
    );
    expect(rotTween.rotation).toBeCloseTo(-Math.PI / 2, 5);
  });

  it("uses shortest wrapped rotation target across angle boundaries", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, 0, 0, {
      viewBox: { x: 0, y: 0, width: 100, height: 100 },
      layers: [
        {
          id: "rot",
          type: "circle",
          cx: 0,
          cy: 0,
          r: 10,
          directionRotation: { RIGHT: 10, DOWN: 90, LEFT: 180, UP: -90 },
          animations: [],
          material: {},
        },
      ],
      sockets: [],
    });

    const rotatingLayer = puppet.getLayer("rot");
    if (!rotatingLayer) {
      throw new Error("Missing layer: rot");
    }
    rotatingLayer.rotation = (350 * Math.PI) / 180;

    puppet.setDirection("RIGHT");

    const expected = (370 * Math.PI) / 180;
    expect(rotatingLayer.rotation).toBeCloseTo(expected, 5);
  });

  it("repeated setDirection RIGHT calls do not accumulate rotation", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, 0, 0, {
      viewBox: { x: 0, y: 0, width: 100, height: 100 },
      layers: [
        {
          id: "rot",
          type: "circle",
          cx: 0,
          cy: 0,
          r: 10,
          directionRotation: { RIGHT: 0, DOWN: 90, LEFT: 180, UP: -90 },
          animations: [],
          material: {},
        },
      ],
      sockets: [],
    });

    puppet.setDirection("RIGHT");
    puppet.setDirection("RIGHT");

    const rotatingLayer = puppet.getLayer("rot");
    if (!rotatingLayer) {
      throw new Error("Missing layer: rot");
    }
    expect(rotatingLayer.rotation).toBe(0);
  });

  it("centers rotation pivot for a player-style circle layer", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, 0, 0, {
      viewBox: { x: 0, y: 0, width: 32, height: 32 },
      layers: [
        {
          id: "player-body",
          type: "circle",
          cx: 16,
          cy: 16,
          r: 14,
          directionRotation: { RIGHT: 0, DOWN: 90, LEFT: 180, UP: -90 },
          animations: [],
          material: {},
        },
      ],
      sockets: [],
    });

    puppet.setDirection("LEFT");

    const rotTween = mustFind(
      scene.tweenConfigs.find((c) => c.rotation !== undefined),
      "Missing rotation tween",
    );
    const rotatingLayer = puppet.getLayer("player-body");
    if (!rotatingLayer) {
      throw new Error("Missing layer: player-body");
    }
    const rotatingTarget = Array.isArray(rotTween.targets)
      ? rotTween.targets[0]
      : rotTween.targets;

    expect(rotatingTarget).not.toBe(rotatingLayer);
    expect(rotatingLayer.x).toBe(-16);
    expect(rotatingLayer.y).toBe(-16);
    expect(rotatingTarget.rotation).toBeCloseTo(Math.PI, 5);
    expect(rotatingTarget.x).toBe(16);
    expect(rotatingTarget.y).toBe(16);
  });

  it("centers rotation pivot for a rotating group around the same center", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, 0, 0, {
      viewBox: { x: 0, y: 0, width: 32, height: 32 },
      layers: [
        {
          id: "player-group",
          type: "group",
          directionRotation: { RIGHT: 0, DOWN: 90, LEFT: 180, UP: -90 },
          animations: [],
          material: {},
          children: [
            {
              id: "player-body",
              type: "circle",
              cx: 16,
              cy: 16,
              r: 14,
              animations: [],
              material: {},
            },
          ],
        },
      ],
      sockets: [],
    });

    puppet.setDirection("LEFT");

    const rotTween = mustFind(
      scene.tweenConfigs.find((c) => c.rotation !== undefined),
      "Missing rotation tween",
    );
    const rotatingGroup = puppet.getLayer("player-group");
    if (!rotatingGroup) {
      throw new Error("Missing layer: player-group");
    }
    const rotatingTarget = Array.isArray(rotTween.targets)
      ? rotTween.targets[0]
      : rotTween.targets;

    expect(rotatingTarget).not.toBe(rotatingGroup);
    expect(rotatingGroup.x).toBe(-16);
    expect(rotatingGroup.y).toBe(-16);
    expect(rotatingTarget.x).toBe(16);
    expect(rotatingTarget.y).toBe(16);
  });

  it("does not emit rotation tween for unannotated layers", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, 0, 0, {
      viewBox: { x: 0, y: 0, width: 100, height: 100 },
      layers: [
        {
          id: "plain",
          type: "circle",
          cx: 0,
          cy: 0,
          r: 10,
          animations: [],
          material: {},
        },
      ],
      sockets: [],
    });

    puppet.setDirection("LEFT");

    const rotationTweens = scene.tweenConfigs.filter(
      (c) => c.rotation !== undefined,
    );
    expect(rotationTweens.length).toBe(0);
  });

  it("emits both slide and rotation tweens when both metadata are present", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, 0, 0, {
      viewBox: { x: 0, y: 0, width: 100, height: 100 },
      layers: [
        {
          id: "hybrid",
          type: "circle",
          cx: 0,
          cy: 0,
          r: 10,
          slideRange: 4,
          directionRotation: { RIGHT: 0, DOWN: 90, LEFT: 180, UP: -90 },
          animations: [],
          material: {},
        },
      ],
      sockets: [],
    });

    puppet.setDirection("LEFT");

    const slideTween = mustFind(
      scene.tweenConfigs.find((c) => c.x !== undefined && c.y !== undefined),
      "Missing slide tween",
    );
    const rotationTween = mustFind(
      scene.tweenConfigs.find((c) => c.rotation !== undefined),
      "Missing rotation tween",
    );

    expect(slideTween.x).toBe(-4);
    expect(slideTween.y).toBe(0);
    expect(rotationTween.rotation).toBeCloseTo(Math.PI, 5);
  });

  it("direct chomp annotation in rotation context uses base RIGHT-facing gap", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, 0, 0, {
      viewBox: { x: 0, y: 0, width: 100, height: 100 },
      layers: [
        {
          id: "mouth",
          type: "circle",
          cx: 0,
          cy: 0,
          r: 10,
          directionRotation: { RIGHT: 0, DOWN: 90, LEFT: 180, UP: -90 },
          animations: [{ type: "chomp", frequency: 2, amplitude: 40 }],
          material: {},
        },
      ],
      sockets: [],
    });

    const mouthGraphics = puppet.getLayerDrawable("mouth");
    if (!mouthGraphics) {
      throw new Error("Missing drawable: mouth");
    }
    if (!("arc" in mouthGraphics)) {
      throw new Error("Drawable does not support arc()");
    }
    let capturedStart = 0;
    mouthGraphics.arc = (
      _cx: number,
      _cy: number,
      _r: number,
      start: number,
    ) => {
      capturedStart = start;
      return mouthGraphics;
    };

    puppet.setDirection("LEFT");
    puppet.update(0, 16);

    const mouthRad = (20 * Math.PI) / 180;
    expect(capturedStart).toBeCloseTo(mouthRad / 2, 5);
  });

  it("chomp child inside rotating group uses inherited base RIGHT-facing gap", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, 0, 0, {
      viewBox: { x: 0, y: 0, width: 100, height: 100 },
      layers: [
        {
          id: "rot-group",
          type: "group",
          directionRotation: { RIGHT: 0, DOWN: 90, LEFT: 180, UP: -90 },
          animations: [],
          material: {},
          children: [
            {
              id: "mouth-child",
              type: "circle",
              cx: 0,
              cy: 0,
              r: 10,
              animations: [{ type: "chomp", frequency: 2, amplitude: 40 }],
              material: {},
            },
          ],
        },
      ],
      sockets: [],
    });

    const mouthGraphics = puppet.getLayerDrawable("mouth-child");
    if (!mouthGraphics) {
      throw new Error("Missing drawable: mouth-child");
    }
    if (!("arc" in mouthGraphics)) {
      throw new Error("Drawable does not support arc()");
    }
    let capturedStart = 0;
    mouthGraphics.arc = (
      _cx: number,
      _cy: number,
      _r: number,
      start: number,
    ) => {
      capturedStart = start;
      return mouthGraphics;
    };

    puppet.setDirection("LEFT");
    puppet.update(0, 16);

    const mouthRad = (20 * Math.PI) / 180;
    expect(capturedStart).toBeCloseTo(mouthRad / 2, 5);
  });

  it("unannotated chomp keeps legacy currentDirection gap mapping", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, 0, 0, {
      viewBox: { x: 0, y: 0, width: 100, height: 100 },
      layers: [
        {
          id: "legacy-mouth",
          type: "circle",
          cx: 0,
          cy: 0,
          r: 10,
          animations: [{ type: "chomp", frequency: 2, amplitude: 40 }],
          material: {},
        },
      ],
      sockets: [],
    });

    const mouthGraphics = puppet.getLayerDrawable("legacy-mouth");
    if (!mouthGraphics) {
      throw new Error("Missing drawable: legacy-mouth");
    }
    if (!("arc" in mouthGraphics)) {
      throw new Error("Drawable does not support arc()");
    }
    let capturedStart = 0;
    mouthGraphics.arc = (
      _cx: number,
      _cy: number,
      _r: number,
      start: number,
    ) => {
      capturedStart = start;
      return mouthGraphics;
    };

    puppet.setDirection("LEFT");
    puppet.update(0, 16);

    const mouthRad = (20 * Math.PI) / 180;
    expect(capturedStart).toBeCloseTo(Math.PI + mouthRad / 2, 5);
  });
});
