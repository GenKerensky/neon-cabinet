import type { TimeControllerApi } from "./types";
import type { ErrorCapture } from "./errorCapture";

type GameLoopCallback = (time: number, delta: number) => void;

export class TimeController implements TimeControllerApi {
  private game: { loop: { callback: GameLoopCallback } };
  private _isPaused = false;
  private _speed = 1.0;
  private _totalFrames = 0;
  private _elapsed = 0;
  private stepResolve: (() => void) | null = null;
  private stepsRemaining = 0;
  private errorCapture: ErrorCapture;
  private queuedStep: Promise<void> | null = null;
  private afterFrameCallbacks: Array<() => void> = [];
  private realCallback: GameLoopCallback | null = null;

  constructor(
    game: { loop: { callback: GameLoopCallback } },
    errorCapture: ErrorCapture,
  ) {
    this.game = game;
    this.errorCapture = errorCapture;
    this.wrapGameLoop();
  }

  private wrapGameLoop(): void {
    const loop = this.game.loop as unknown as Record<string, unknown>;
    if (!loop) return;

    // Capture the existing callback BEFORE replacing the property —
    // otherwise defineProperty obliterates it and realCallback stays null.
    const existingCallback = loop.callback as GameLoopCallback | undefined;
    this.realCallback = existingCallback ?? null;

    const wrappedCallback: GameLoopCallback = (time: number, delta: number) => {
      if (this._isPaused) {
        if (this.stepsRemaining > 0) {
          this.stepsRemaining--;
          this._totalFrames++;
          this._elapsed += delta * this._speed;
          try {
            this.realCallback?.call(loop, time, delta * this._speed);
          } catch (err) {
            this.errorCapture.capture(
              err instanceof Error ? err : new Error(String(err)),
            );
          }
          if (this.stepsRemaining === 0 && this.stepResolve) {
            this._isPaused = true;
            const resolve = this.stepResolve;
            this.stepResolve = null;
            resolve();
          }
          for (const cb of this.afterFrameCallbacks) cb();
        }
        return;
      }

      this._totalFrames++;
      this._elapsed += delta * this._speed;
      try {
        this.realCallback?.call(loop, time, delta * this._speed);
      } catch (err) {
        this.errorCapture.capture(
          err instanceof Error ? err : new Error(String(err)),
        );
      }
      for (const cb of this.afterFrameCallbacks) cb();
    };

    Object.defineProperty(loop, "callback", {
      configurable: true,
      enumerable: true,
      get: () => wrappedCallback,
      set: (cb: GameLoopCallback) => {
        this.realCallback = cb;
      },
    });
  }

  pause(): void {
    this._isPaused = true;
  }

  resume(): void {
    this._isPaused = false;
  }

  setSpeed(multiplier: number): void {
    this._speed = Math.max(0.01, Math.min(10.0, multiplier));
  }

  stepSync(frames: number): {
    took: number;
    frameTimes: number[];
    hasCallback: boolean;
  } {
    if (frames <= 0)
      return { took: 0, frameTimes: [], hasCallback: !!this.realCallback };
    const delta = 1000 / 60;
    this._isPaused = true;
    const hasCallback = !!this.realCallback;
    const t0 = performance.now();
    const frameTimes: number[] = [];
    for (let i = 0; i < frames; i++) {
      const fi = performance.now();
      this._totalFrames++;
      this._elapsed += delta * this._speed;
      try {
        this.realCallback?.call(
          this.game.loop,
          Date.now(),
          delta * this._speed,
        );
      } catch (err) {
        this.errorCapture.capture(
          err instanceof Error ? err : new Error(String(err)),
        );
      }
      for (const callback of this.afterFrameCallbacks) callback();
      frameTimes.push(+(performance.now() - fi).toFixed(1));
    }
    console.warn(
      `[__TEST__] stepSync(${frames}) hasCb=${hasCallback} took=${+(performance.now() - t0).toFixed(1)}ms frames=[${frameTimes.join(",")}]`,
    );
    return {
      took: +(performance.now() - t0).toFixed(1),
      frameTimes,
      hasCallback,
    };
  }

  step(frames: number): Promise<void> {
    if (this.queuedStep) {
      return this.queuedStep.then(() => this.step(frames));
    }

    return new Promise<void>((resolve) => {
      this._isPaused = true;
      this.stepsRemaining = frames;
      this.stepResolve = resolve;
      this.queuedStep = Promise.resolve();
      this._driveStepChunk(3, () => {
        this.queuedStep = null;
      });
    });
  }

  private _driveStepChunk(chunkSize: number, onDone: () => void): void {
    const loop = this.game.loop as unknown as Record<string, unknown>;
    const delta = 1000 / 60;
    let processed = 0;
    while (this.stepsRemaining > 0 && processed < chunkSize) {
      this.stepsRemaining--;
      this._totalFrames++;
      this._elapsed += delta * this._speed;
      try {
        this.realCallback?.call(loop, Date.now(), delta * this._speed);
      } catch (err) {
        this.errorCapture.capture(
          err instanceof Error ? err : new Error(String(err)),
        );
      }
      for (const cb of this.afterFrameCallbacks) cb();
      processed++;
    }
    if (this.stepsRemaining === 0) {
      this._isPaused = true;
      const resolve = this.stepResolve;
      this.stepResolve = null;
      resolve?.();
      onDone();
    } else {
      // Yield to event loop to let CDP messages process
      setTimeout(() => this._driveStepChunk(chunkSize, onDone), 0);
    }
  }

  waitFor(condition: () => boolean, timeoutMs = 10000): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          if (condition()) {
            this._isPaused = true;
            resolve();
            return;
          }
        } catch (err) {
          this.errorCapture.capture(
            err instanceof Error ? err : new Error(String(err)),
          );
          reject(err);
          return;
        }

        if (Date.now() - startTime >= timeoutMs) {
          this._isPaused = true;
          reject(new Error(`waitFor timed out after ${timeoutMs}ms`));
          return;
        }

        requestAnimationFrame(check);
      };

      this._isPaused = false;
      requestAnimationFrame(check);
    });
  }

  async advance(frames: number, speed: number): Promise<void> {
    const prevSpeed = this._speed;
    this.setSpeed(speed);
    await this.step(frames);
    this.setSpeed(prevSpeed);
  }

  freeze(): { state: unknown } {
    this._isPaused = true;
    return { state: (window as unknown as Record<string, unknown>).__TEST__ };
  }

  onAfterFrame(callback: () => void): void {
    this.afterFrameCallbacks.push(callback);
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get speed(): number {
    return this._speed;
  }

  get totalFrames(): number {
    return this._totalFrames;
  }

  get elapsed(): number {
    return this._elapsed;
  }
}
