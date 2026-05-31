export const FADE_DURATION_MS = 250;
export const FADE_FALLBACK_MS = 350;
export const FADE_IN_COMPLETE_EVENT = "camerafadeincomplete";
export const FADE_OUT_COMPLETE_EVENT = "camerafadeoutcomplete";

type FadeCameraLike = {
  fadeIn?: (
    durationMs: number,
    red: number,
    green: number,
    blue: number,
  ) => void;
  fadeOut?: (
    durationMs: number,
    red: number,
    green: number,
    blue: number,
  ) => void;
  once?: (eventName: string, callback: () => void) => void;
};

export type FadeSceneLike = {
  cameras: {
    main?: FadeCameraLike;
  };
  registry: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
  };
  scene: {
    start: (targetKey: string, data?: object) => void;
    launch: (targetKey: string, data?: object) => void;
    pause: (key?: string) => void;
    resume: (key?: string) => void;
    stop: (key?: string) => void;
    get: (key: string) => unknown;
  };
  time?: {
    delayedCall?: (delayMs: number, callback: () => void) => void;
  };
};

export type FadeTransitionOptions = {
  stop?: string[];
  pauseCurrent?: boolean;
  fallbackMs?: number;
  durationMs?: number;
};

function setTransitionState(scene: FadeSceneLike, state: string): void {
  scene.registry.set("transitionState", state);
}

function createCompletionGuard(callback: () => void): () => void {
  let completed = false;

  return () => {
    if (completed) return;
    completed = true;
    callback();
  };
}

function isFadeSceneLike(scene: unknown): scene is FadeSceneLike {
  return (
    typeof scene === "object" &&
    scene !== null &&
    "cameras" in scene &&
    "registry" in scene &&
    "scene" in scene
  );
}

function runFadeOutLifecycle(
  scene: FadeSceneLike,
  durationMs: number,
  fallbackMs: number,
  onComplete: () => void,
): void {
  const camera = scene.cameras.main;
  const fadeOut = camera?.fadeOut;
  const on = camera?.once;

  if (typeof fadeOut !== "function" || typeof on !== "function") {
    onComplete();
    return;
  }

  const complete = createCompletionGuard(onComplete);
  fadeOut.call(camera, durationMs, 0, 0, 0);
  on.call(camera, FADE_OUT_COMPLETE_EVENT, complete);
  scene.time?.delayedCall?.(fallbackMs, complete);
}

export function fadeInScene(
  scene: FadeSceneLike,
  durationMs: number = FADE_DURATION_MS,
): void {
  setTransitionState(scene, "fading-in");

  const camera = scene.cameras.main;
  const fadeIn = camera?.fadeIn;
  const on = camera?.once;

  if (typeof fadeIn !== "function" || typeof on !== "function") {
    setTransitionState(scene, "idle");
    return;
  }

  const complete = createCompletionGuard(() => {
    setTransitionState(scene, "idle");
  });

  fadeIn.call(camera, durationMs, 0, 0, 0);
  on.call(camera, FADE_IN_COMPLETE_EVENT, complete);
}

export function startSceneWithFade(
  scene: FadeSceneLike,
  targetKey: string,
  data?: object,
  options: FadeTransitionOptions = {},
): void {
  const stop = options.stop ?? [];
  const durationMs = options.durationMs ?? FADE_DURATION_MS;
  const fallbackMs = options.fallbackMs ?? FADE_FALLBACK_MS;

  setTransitionState(scene, "fading-out");

  runFadeOutLifecycle(scene, durationMs, fallbackMs, () => {
    for (const key of stop) {
      scene.scene.stop(key);
    }

    scene.scene.start(targetKey, data);
  });
}

export function launchSceneWithFade(
  scene: FadeSceneLike,
  targetKey: string,
  data?: object,
  options: FadeTransitionOptions = {},
): void {
  const durationMs = options.durationMs ?? FADE_DURATION_MS;
  const fallbackMs = options.fallbackMs ?? FADE_FALLBACK_MS;
  const pauseCurrent = options.pauseCurrent ?? true;

  setTransitionState(scene, "fading-out");

  runFadeOutLifecycle(scene, durationMs, fallbackMs, () => {
    if (pauseCurrent) {
      scene.scene.pause();
    }

    scene.scene.launch(targetKey, data);
  });
}

export function resumeSceneWithFade(
  scene: FadeSceneLike,
  resumeKey: string,
  stopKey: string,
  options: FadeTransitionOptions = {},
): void {
  const durationMs = options.durationMs ?? FADE_DURATION_MS;
  const fallbackMs = options.fallbackMs ?? FADE_FALLBACK_MS;

  setTransitionState(scene, "fading-out");

  runFadeOutLifecycle(scene, durationMs, fallbackMs, () => {
    scene.scene.resume(resumeKey);
    scene.scene.stop(stopKey);

    const resumedScene = scene.scene.get(resumeKey);
    if (isFadeSceneLike(resumedScene) && resumedScene.cameras.main) {
      fadeInScene(resumedScene, durationMs);
    }
  });
}
