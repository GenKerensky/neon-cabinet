export interface GameTestHarness<TState, TCommands> {
  state: TState;
  commands: TCommands;
  scene: string;
  ready: boolean;
  errors: ErrorCaptureApi;
  seed: number;
  time: TimeControllerApi;
  isTestMode: boolean;
}

export interface TimeControllerApi {
  pause(): void;
  resume(): void;
  setSpeed(multiplier: number): void;
  step(frames: number): Promise<void>;
  stepSync(frames: number): {
    took: number;
    frameTimes: number[];
    hasCallback: boolean;
  };
  waitFor(condition: () => boolean, timeoutMs?: number): Promise<void>;
  advance(frames: number, speed: number): Promise<void>;
  freeze(): { state: unknown };
  onAfterFrame(callback: () => void): void;
  readonly isPaused: boolean;
  readonly speed: number;
  readonly totalFrames: number;
  readonly elapsed: number;
}

export interface DebugOverlayOptions {
  getState: () => unknown;
  getScene: () => string;
  getSeed: () => number;
}

export interface DeterministicModeOptions {
  paramName?: string;
  testParamName?: string;
}

export interface ErrorCaptureApi {
  capture(error: Error): void;
  clear(): void;
  getErrors(): CapturedError[];
  length: number;
}

export interface CapturedError {
  message: string;
  stack?: string;
  timestamp: number;
}
