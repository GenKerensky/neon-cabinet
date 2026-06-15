/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ScreenshotCheckpoint } from "../core/screenshot";

type StepFn = (this: any, ...args: any[]) => Promise<void>;

interface SupportCode {
  Given: (pattern: string, fn: StepFn) => void;
  When: (pattern: string, fn: StepFn) => void;
  Then: (pattern: string, fn: StepFn) => void;
}

export function registerCommonSteps(
  supportCode: SupportCode,
  screenshotFactory: () => ScreenshotCheckpoint,
): void {
  supportCode.Given(
    "the game is configured with seed {int}",
    async function (seed: number) {
      const world = this as {
        page: {
          goto: (url: string, opts?: unknown) => Promise<void>;
          waitForFunction: (fn: () => boolean, opts?: unknown) => Promise<void>;
        };
        seed: number;
        gameUrl: string;
        navigate: (path: string) => Promise<void>;
      };
      world.seed = seed;
      await world.navigate(`/?test=1&seed=${seed}`);
      await world.page.waitForFunction(
        () => (window as any).__TEST__ !== undefined,
        { timeout: 10000 },
      );
      await world.page.waitForFunction(
        () => (window as any).__TEST__?.ready === true,
        { timeout: 10000 },
      );
    },
  );

  supportCode.Given(
    "the game is running at {float}x speed",
    async function (speed: number) {
      const world = this as {
        page: {
          evaluate: (fn: (s: number) => void, arg: number) => Promise<void>;
        };
      };
      await world.page.evaluate((s: number) => {
        (window as any).__TEST__?.time?.setSpeed(s);
      }, speed);
    },
  );

  supportCode.When("{int} frames pass", async function (frames: number) {
    const world = this as {
      page: {
        evaluate: (
          fn: (f: number) => Promise<void>,
          arg: number,
        ) => Promise<void>;
      };
    };
    await world.page.evaluate((f: number) => {
      return (window as any).__TEST__?.time?.step(f);
    }, frames);
  });

  supportCode.When("the game is paused", async function () {
    const world = this as {
      page: { evaluate: (fn: () => void) => Promise<void> };
    };
    await world.page.evaluate(() => {
      (window as any).__TEST__?.time?.pause();
    });
  });

  supportCode.When("the game is resumed", async function () {
    const world = this as {
      page: { evaluate: (fn: () => void) => Promise<void> };
    };
    await world.page.evaluate(() => {
      (window as any).__TEST__?.time?.resume();
    });
  });

  supportCode.Then("take a screenshot {string}", async function (name: string) {
    const world = this as { page: any; screenshotDir: string };
    const screenshot = screenshotFactory();
    await screenshot.capture(world.page, name);
  });

  supportCode.Then(
    "the state should contain {string}",
    async function (key: string) {
      const world = this as {
        page: {
          evaluate: (
            fn: (k: string) => boolean,
            arg: string,
          ) => Promise<boolean>;
        };
      };
      const hasKey = await world.page.evaluate((k: string) => {
        const state = (window as any).__TEST__?.state;
        return state !== undefined && k in state;
      }, key);
      if (!hasKey) {
        throw new Error(`Expected state to contain key "${key}"`);
      }
    },
  );
}
