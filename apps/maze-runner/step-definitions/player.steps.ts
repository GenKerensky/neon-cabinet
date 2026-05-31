/* eslint-disable @typescript-eslint/no-explicit-any */
import { When, Then } from "@cucumber/cucumber";
import { join } from "path";

const initialPositions: Record<string, number> = {};

When("I press {word}", async function (direction: string) {
  const start = Date.now();
  const page = (this as any).page;
  try {
    const state = await page.evaluate((d: string) => {
      const test = (window as any).__TEST__;
      const dirMap: Record<string, number> = {
        UP: 1,
        DOWN: 2,
        LEFT: 3,
        RIGHT: 4,
      };
      test?.commands?.move(dirMap[d.toUpperCase()] ?? 0);
      test?.time?.stepSync(10);
      return test?.state;
    }, direction);
    (this as any).lastState = state;
    console.log(`[PLAYER] Pressed ${direction} in ${Date.now() - start}ms`);
  } catch (e: any) {
    console.log(
      `[PLAYER] Failed to press ${direction} after ${Date.now() - start}ms: ${e.message}`,
    );
    throw e;
  }
});

When(
  "I capture the player position and press {word}",
  async function (direction: string) {
    const start = Date.now();
    const page = (this as any).page;
    try {
      const state = await page.evaluate((d: string) => {
        const test = (window as any).__TEST__;
        // Step a few frames to let player spawn
        test?.time?.stepSync(10);
        // Capture initial position
        const player = test?.state?.player;
        const initX = player?.gridX ?? 0;
        const initY = player?.gridY ?? 0;
        // Convert string to numeric Direction enum: UP=1, DOWN=2, LEFT=3, RIGHT=4
        const dirMap: Record<string, number> = {
          UP: 1,
          DOWN: 2,
          LEFT: 3,
          RIGHT: 4,
        };
        test?.commands?.move(dirMap[d.toUpperCase()] ?? 0);
        test?.time?.stepSync(10);
        return { initX, initY, final: test?.state };
      }, direction);
      initialPositions["player_gridX"] = state.initX;
      initialPositions["player_gridY"] = state.initY;
      (this as any).lastState = state.final;
      console.log(
        `[PLAYER] Captured pos (${state.initX},${state.initY}) and pressed ${direction} in ${Date.now() - start}ms`,
      );
    } catch (e: any) {
      console.log(
        `[PLAYER] Failed after ${Date.now() - start}ms: ${e.message}`,
      );
      throw e;
    }
  },
);

When("the player is killed", async function () {
  const start = Date.now();
  const page = (this as any).page;
  try {
    const state = await page.evaluate(() => {
      const test = (window as any).__TEST__;
      test?.commands?.killPlayer();
      test?.time?.stepSync(10);
      return test?.state;
    });
    (this as any).lastState = state;
    console.log(`[PLAYER] Killed player in ${Date.now() - start}ms`);
  } catch (e: any) {
    console.log(
      `[PLAYER] Failed to kill player after ${Date.now() - start}ms: ${e.message}`,
    );
    throw e;
  }
});

When(
  "the player is killed and {int} frames pass",
  async function (frames: number) {
    const start = Date.now();
    const page = (this as any).page;
    try {
      const state = await page.evaluate((n: number) => {
        const test = (window as any).__TEST__;
        test?.commands?.killPlayer();
        test?.time?.stepSync(n);
        return test?.state;
      }, frames);
      (this as any).lastState = state;
      console.log(
        `[PLAYER] Killed player and stepped ${frames} frames in ${Date.now() - start}ms`,
      );
    } catch (e: any) {
      console.log(
        `[PLAYER] Failed after ${Date.now() - start}ms: ${e.message}`,
      );
      throw e;
    }
  },
);

When("the player is killed and screenshot captured", async function () {
  const start = Date.now();
  const page = (this as any).page;
  const screenshotDir = (this as any).screenshotDir || "test-results";
  try {
    // Kill player and capture canvas as base64 in a single page.evaluate call
    // This avoids context degradation from stepSync
    const result = await page.evaluate(() => {
      const test = (window as any).__TEST__;
      test?.commands?.killPlayer();
      // Capture canvas as base64
      const canvas = document.querySelector("canvas");
      let screenshotData = "";
      if (canvas) {
        try {
          screenshotData = canvas.toDataURL("image/png");
        } catch {
          // ignore
        }
      }
      return { state: test?.state, screenshotData };
    });
    (this as any).lastState = result.state;
    // Save screenshot
    if (result.screenshotData) {
      const fs = await import("fs");
      const filename = `player-death-${Date.now()}.png`;
      const filepath = join(screenshotDir, filename);
      const base64Data = result.screenshotData.replace(
        /^data:image\/png;base64,/,
        "",
      );
      fs.writeFileSync(filepath, base64Data, "base64");
      console.log(`[PLAYER] Screenshot saved to ${filepath}`);
    }
    console.log(
      `[PLAYER] Killed player and captured screenshot in ${Date.now() - start}ms`,
    );
  } catch (e: any) {
    console.log(`[PLAYER] Failed after ${Date.now() - start}ms: ${e.message}`);
    throw e;
  }
});

When("a dot is collected", async function () {
  const state = await (this as any).page.evaluate(() => {
    const test = (window as any).__TEST__;
    test?.commands?.eatDot();
    return test?.state;
  });
  (this as any).lastState = state;
});

When("a power pellet is collected", async function () {
  const state = await (this as any).page.evaluate(() => {
    const test = (window as any).__TEST__;
    test?.commands?.eatPowerPellet();
    return test?.state;
  });
  (this as any).lastState = state;
});

When("all collectibles are cleared", async function () {
  const state = await (this as any).page.evaluate(() => {
    const test = (window as any).__TEST__;
    test?.commands?.clearCollectibles();
    return test?.state;
  });
  (this as any).lastState = state;
});

When(
  "collectibles of type {string} are cleared",
  async function (type: string) {
    const state = await (this as any).page.evaluate((t: string) => {
      const test = (window as any).__TEST__;
      test?.commands?.clearCollectibles(t);
      return test?.state;
    }, type);
    (this as any).lastState = state;
  },
);

Then(
  "the player's gridX should be greater than the initial value",
  async function () {
    const state = (this as any).lastState;
    const gridX = state?.player?.gridX ?? 0;
    const initial = initialPositions["player_gridX"] ?? 0;
    if (gridX <= initial) {
      throw new Error(`Expected player gridX > ${initial} but got ${gridX}`);
    }
  },
);

Then(
  "the player's gridX should be less than the initial value",
  async function () {
    const state = (this as any).lastState;
    const gridX = state?.player?.gridX ?? 0;
    const initial = initialPositions["player_gridX"] ?? 0;
    if (gridX >= initial) {
      throw new Error(`Expected player gridX < ${initial} but got ${gridX}`);
    }
  },
);

Then(
  "the player's gridY should be less than the initial value",
  async function () {
    const state = (this as any).lastState;
    const gridY = state?.player?.gridY ?? 0;
    const initial = initialPositions["player_gridY"] ?? 0;
    if (gridY >= initial) {
      throw new Error(`Expected player gridY < ${initial} but got ${gridY}`);
    }
  },
);

Then(
  "the player's gridY should be greater than the initial value",
  async function () {
    const state = (this as any).lastState;
    const gridY = state?.player?.gridY ?? 0;
    const initial = initialPositions["player_gridY"] ?? 0;
    if (gridY <= initial) {
      throw new Error(`Expected player gridY > ${initial} but got ${gridY}`);
    }
  },
);

When("I capture the player position", async function () {
  const state = (this as any).lastState;
  if (state) {
    initialPositions["player_gridX"] = state.player?.gridX ?? 0;
    initialPositions["player_gridY"] = state.player?.gridY ?? 0;
  }
});

When("the level transition is triggered", async function () {
  const state = await (this as any).page.evaluate(() => {
    const test = (window as any).__TEST__;
    test?.commands?.triggerLevelTransition();
    return test?.state;
  });
  (this as any).lastState = state;
});
/* eslint-enable @typescript-eslint/no-explicit-any */
