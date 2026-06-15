import { describe, expect, it, vi } from "vitest";
import {
  FADE_DURATION_MS,
  FADE_IN_COMPLETE_EVENT,
  FADE_OUT_COMPLETE_EVENT,
  fadeInScene,
  launchSceneWithFade,
  resumeSceneWithFade,
  startSceneWithFade,
  type FadeSceneLike,
} from "../../src/game/utils/sceneTransitions";

function createScene(options: {
  withCamera: boolean;
  order: string[];
  scheduled?: Array<() => void>;
  resumedScene?: FadeSceneLike;
}) {
  const handlers: Record<string, () => void> = {};
  const registryStore = new Map<string, unknown>();
  const scheduled = options.scheduled ?? [];

  const camera = options.withCamera
    ? {
        fadeIn: vi.fn(
          (durationMs: number, red: number, green: number, blue: number) => {
            options.order.push(`fadeIn:${durationMs}:${red}:${green}:${blue}`);
          },
        ),
        fadeOut: vi.fn(
          (durationMs: number, red: number, green: number, blue: number) => {
            options.order.push(`fadeOut:${durationMs}:${red}:${green}:${blue}`);
          },
        ),
        once: vi.fn((eventName: string, callback: () => void) => {
          handlers[eventName] = callback;
        }),
      }
    : undefined;

  const scene = {
    cameras: {
      main: camera,
    },
    registry: {
      get: vi.fn((key: string) => registryStore.get(key)),
      set: vi.fn((key: string, value: unknown) => {
        registryStore.set(key, value);
      }),
    },
    scene: {
      start: vi.fn((key: string, _data?: unknown) => {
        options.order.push(`start:${key}`);
      }),
      launch: vi.fn((key: string, _data?: unknown) => {
        options.order.push(`launch:${key}`);
      }),
      pause: vi.fn(() => {
        options.order.push("pause");
      }),
      resume: vi.fn((key: string) => {
        options.order.push(`resume:${key}`);
      }),
      stop: vi.fn((key: string) => {
        options.order.push(`stop:${key}`);
      }),
      get: vi.fn(() => options.resumedScene),
    },
    time: {
      delayedCall: vi.fn((_delayMs: number, callback: () => void) => {
        scheduled.push(callback);
      }),
    },
  } as FadeSceneLike;

  return { handlers, registryStore, scheduled, scene };
}

function flushScheduledCallbacks(callbacks: Array<() => void>): void {
  for (const callback of callbacks) {
    callback();
  }
}

describe("fadeInScene", () => {
  it("runs the fade-in path and clears transitionState on completion", () => {
    const order: string[] = [];
    const { handlers, registryStore, scene } = createScene({
      withCamera: true,
      order,
    });

    fadeInScene(scene);

    expect(registryStore.get("transitionState")).toBe("fading-in");
    expect(order).toEqual([`fadeIn:${FADE_DURATION_MS}:0:0:0`]);

    handlers[FADE_IN_COMPLETE_EVENT]();

    expect(registryStore.get("transitionState")).toBe("idle");
  });

  it("falls back to idle immediately when fade methods are unavailable", () => {
    const order: string[] = [];
    const { scene, registryStore } = createScene({
      withCamera: false,
      order,
    });

    fadeInScene(scene, 120);

    expect(order).toEqual([]);
    expect(registryStore.get("transitionState")).toBe("idle");
  });
});

describe("startSceneWithFade", () => {
  it("fades out before stopping scenes and starting the target", () => {
    const order: string[] = [];
    const { handlers, registryStore, scheduled, scene } = createScene({
      withCamera: true,
      order,
    });

    startSceneWithFade(
      scene,
      "Game",
      { score: 10 },
      { stop: ["Title", "Pause"] },
    );

    expect(registryStore.get("transitionState")).toBe("fading-out");
    expect(order).toEqual([`fadeOut:${FADE_DURATION_MS}:0:0:0`]);

    handlers[FADE_OUT_COMPLETE_EVENT]();
    flushScheduledCallbacks(scheduled);

    expect(order).toEqual([
      `fadeOut:${FADE_DURATION_MS}:0:0:0`,
      "stop:Title",
      "stop:Pause",
      "start:Game",
    ]);
    expect(scene.scene.start).toHaveBeenCalledWith("Game", { score: 10 });
    expect(scene.scene.stop).toHaveBeenNthCalledWith(1, "Title");
    expect(scene.scene.stop).toHaveBeenNthCalledWith(2, "Pause");
  });

  it("starts immediately when fade support is missing", () => {
    const order: string[] = [];
    const { registryStore, scene } = createScene({
      withCamera: false,
      order,
    });

    startSceneWithFade(scene, "Game", undefined, { stop: ["Title"] });

    expect(order).toEqual(["stop:Title", "start:Game"]);
    expect(registryStore.get("transitionState")).toBe("fading-out");
  });
});

describe("launchSceneWithFade", () => {
  it("pauses the current scene before launching the target", () => {
    const order: string[] = [];
    const { handlers, registryStore, scheduled, scene } = createScene({
      withCamera: true,
      order,
    });

    launchSceneWithFade(scene, "GameOver", { score: 99 });

    expect(registryStore.get("transitionState")).toBe("fading-out");
    expect(order).toEqual([`fadeOut:${FADE_DURATION_MS}:0:0:0`]);

    handlers[FADE_OUT_COMPLETE_EVENT]();
    flushScheduledCallbacks(scheduled);

    expect(order).toEqual([
      `fadeOut:${FADE_DURATION_MS}:0:0:0`,
      "pause",
      "launch:GameOver",
    ]);
    expect(scene.scene.pause).toHaveBeenCalledTimes(1);
    expect(scene.scene.launch).toHaveBeenCalledWith("GameOver", { score: 99 });
  });

  it("launches immediately when fade support is missing", () => {
    const order: string[] = [];
    const { scene } = createScene({
      withCamera: false,
      order,
    });

    launchSceneWithFade(scene, "GameOver", { score: 99 });

    expect(order).toEqual(["pause", "launch:GameOver"]);
  });
});

describe("resumeSceneWithFade", () => {
  it("resumes the requested scene, stops the paused scene, and fades the resumed scene in", () => {
    const order: string[] = [];
    const resumedOrder: string[] = [];
    const { handlers, registryStore, scheduled, scene } = createScene({
      withCamera: true,
      order,
      resumedScene: createScene({
        withCamera: true,
        order: resumedOrder,
      }).scene,
    });

    resumeSceneWithFade(scene, "Game", "Pause");

    expect(registryStore.get("transitionState")).toBe("fading-out");
    expect(order).toEqual([`fadeOut:${FADE_DURATION_MS}:0:0:0`]);

    handlers[FADE_OUT_COMPLETE_EVENT]();
    flushScheduledCallbacks(scheduled);

    expect(order).toEqual([
      `fadeOut:${FADE_DURATION_MS}:0:0:0`,
      "resume:Game",
      "stop:Pause",
    ]);
    expect(resumedOrder).toEqual([`fadeIn:${FADE_DURATION_MS}:0:0:0`]);
    expect(scene.scene.resume).toHaveBeenCalledWith("Game");
    expect(scene.scene.stop).toHaveBeenCalledWith("Pause");
  });

  it("resumes and stops immediately when fade support is missing", () => {
    const order: string[] = [];
    const { scene } = createScene({
      withCamera: false,
      order,
    });

    resumeSceneWithFade(scene, "Game", "Pause");

    expect(order).toEqual(["resume:Game", "stop:Pause"]);
  });
});
