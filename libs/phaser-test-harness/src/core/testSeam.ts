import type { GameTestHarness, ErrorCaptureApi } from "./types";
import { TimeController } from "./timeController";
import { DebugOverlay } from "./debugOverlay";
import { DeterministicMode } from "./deterministicMode";
import { ErrorCapture } from "./errorCapture";

interface CreateTestHarnessOptions<TState, TCommands> {
  state: () => TState;
  commands: TCommands;
  deterministicMode?: DeterministicMode;
}

export function createTestHarness<TState, TCommands>(
  game: { loop: { callback: (time: number, delta: number) => void } },
  options: CreateTestHarnessOptions<TState, TCommands>,
): GameTestHarness<TState, TCommands> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const errorCapture = new ErrorCapture();
  const timeController = new TimeController(game, errorCapture);
  const detMode = options.deterministicMode ?? new DeterministicMode();

  const harness: GameTestHarness<TState, TCommands> = {
    get state() {
      return options.state();
    },
    commands: options.commands,
    get scene() {
      return (
        ((window as unknown as Record<string, unknown>).__TEST__scene as
          | string
          | undefined) ?? ""
      );
    },
    ready: false,
    errors: errorCapture as ErrorCaptureApi,
    seed: detMode.seed,
    time: timeController,
    isTestMode: detMode.isDeterministic,
  };

  (window as unknown as Record<string, unknown>).__TEST__ = harness;

  const overlay = new DebugOverlay({
    getState: () => harness.state,
    getScene: () => harness.scene,
    getSeed: () => harness.seed,
  });

  timeController.onAfterFrame(() => overlay.update());

  harness.ready = true;

  return harness;
}

export { TimeController } from "./timeController";
export { DebugOverlay } from "./debugOverlay";
export { DeterministicMode } from "./deterministicMode";
export { ErrorCapture } from "./errorCapture";
export type {
  GameTestHarness,
  TimeControllerApi,
  DebugOverlayOptions,
  DeterministicModeOptions,
  ErrorCaptureApi,
  CapturedError,
} from "./types";
