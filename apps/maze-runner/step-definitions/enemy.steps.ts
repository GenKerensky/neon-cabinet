/* eslint-disable @typescript-eslint/no-explicit-any */
import { When, Then } from "@cucumber/cucumber";

let capturedEnemyPositions: Array<{ x: number; y: number }> = [];

When("I capture the enemy positions", async function () {
  capturedEnemyPositions = await (this as any).page.evaluate(() => {
    const enemies = (window as any).__TEST__?.state?.enemies ?? [];
    return enemies.map((e: any) => ({ x: e.x, y: e.y }));
  });
});

When(
  "an enemy {string} is spawned at grid {int} {int}",
  async function (aiType: string, gridX: number, gridY: number) {
    await (this as any).page.evaluate(
      (args: { aiType: string; gridX: number; gridY: number }) => {
        (window as any).__TEST__?.commands?.spawnEnemyAt(
          args.gridX,
          args.gridY,
          args.aiType,
        );
      },
      { aiType, gridX, gridY },
    );
  },
);

When(
  "the enemy {string} state is set to {string}",
  async function (textureOrId: string, state: string) {
    await (this as any).page.evaluate(
      (args: { textureOrId: string; state: string }) => {
        (window as any).__TEST__?.commands?.setEnemyState(
          args.textureOrId,
          args.state,
        );
      },
      { textureOrId, state },
    );
  },
);

When(
  "the enemy {string} is moved to grid {int} {int}",
  async function (textureOrId: string, gridX: number, gridY: number) {
    const state = await (this as any).page.evaluate(
      (args: { textureOrId: string; gridX: number; gridY: number }) => {
        const test = (window as any).__TEST__;
        test?.commands?.setEnemyAtGrid(
          args.textureOrId,
          args.gridX,
          args.gridY,
        );
        return test?.state;
      },
      { textureOrId, gridX, gridY },
    );
    (this as any).lastState = state;
  },
);

Then("at least one enemy should have moved", async function () {
  const currentPositions = await (this as any).page.evaluate(() => {
    const enemies = (window as any).__TEST__?.state?.enemies ?? [];
    return enemies.map((e: any) => ({ x: e.x, y: e.y }));
  });

  const moved = currentPositions.some(
    (curr: { x: number; y: number }, i: number) => {
      const prev = capturedEnemyPositions[i];
      return prev && (curr.x !== prev.x || curr.y !== prev.y);
    },
  );

  if (!moved) {
    throw new Error("Expected at least one enemy to have moved");
  }
});

Then(
  "the enemy {string} should be in state {string}",
  async function (texture: string, expectedState: string) {
    const enemyState = await (this as any).page.evaluate((t: string) => {
      const enemies = (window as any).__TEST__?.state?.enemies ?? [];
      const enemy = enemies.find((e: any) => e.texture === t);
      return enemy?.state ?? "";
    }, texture);
    if (enemyState !== expectedState) {
      throw new Error(
        `Expected enemy "${texture}" in state "${expectedState}" but got "${enemyState}"`,
      );
    }
  },
);

Then(
  "the enemy {string} should not be in state {string}",
  async function (texture: string, unexpectedState: string) {
    const enemyState = await (this as any).page.evaluate((t: string) => {
      const enemies = (window as any).__TEST__?.state?.enemies ?? [];
      const enemy = enemies.find((e: any) => e.texture === t);
      return enemy?.state ?? "";
    }, texture);
    if (enemyState === unexpectedState) {
      throw new Error(
        `Expected enemy "${texture}" NOT in state "${unexpectedState}"`,
      );
    }
  },
);

Then(
  "the enemy at grid {int} {int} should exist",
  async function (gridX: number, gridY: number) {
    const exists = await (this as any).page.evaluate(
      (args: { gridX: number; gridY: number }) => {
        const enemies = (window as any).__TEST__?.state?.enemies ?? [];
        return enemies.some(
          (e: any) => e.gridX === args.gridX && e.gridY === args.gridY,
        );
      },
      { gridX, gridY },
    );
    if (!exists) {
      throw new Error(
        `Expected enemy at grid (${gridX}, ${gridY}) but none found`,
      );
    }
  },
);

Then(
  "the enemy {string} should be at grid {int} {int}",
  async function (textureOrId: string, expectedX: number, expectedY: number) {
    const match = await (this as any).page.evaluate(
      (args: { textureOrId: string; expectedX: number; expectedY: number }) => {
        const enemies = (window as any).__TEST__?.state?.enemies ?? [];
        const enemy = enemies.find(
          (e: any) =>
            e.texture === args.textureOrId ||
            e.textureName === args.textureOrId,
        );
        if (!enemy) return { found: false, x: -1, y: -1 };
        return { found: true, x: enemy.gridX, y: enemy.gridY };
      },
      { textureOrId, expectedX, expectedY },
    );

    if (!match.found || match.x !== expectedX || match.y !== expectedY) {
      throw new Error(
        `Expected enemy "${textureOrId}" at grid (${expectedX}, ${expectedY}) but got (${match.x}, ${match.y})`,
      );
    }
  },
);

Then(
  "the enemy {string} should arrive at the pen",
  async function (textureOrId: string) {
    const result = await (this as any).page.evaluate((id: string) => {
      const state = (window as any).__TEST__?.state;
      const enemies = state?.enemies ?? [];
      const pen = state?.pen;
      const enemy = enemies.find(
        (e: any) => e.texture === id || e.textureName === id,
      );
      if (!enemy || !pen) {
        return { found: false, atPen: false, state: "" };
      }
      const atPen = enemy.gridX === pen.gridX && enemy.gridY === pen.gridY;
      return { found: true, atPen, state: enemy.state };
    }, textureOrId);

    if (!result.found) {
      throw new Error(`Expected enemy "${textureOrId}" to exist`);
    }
    if (!result.atPen) {
      throw new Error(`Expected enemy "${textureOrId}" to arrive at the pen`);
    }
    if (result.state === "dead") {
      throw new Error(
        `Expected enemy "${textureOrId}" to leave dead state after reaching pen`,
      );
    }
  },
);
/* eslint-enable @typescript-eslint/no-explicit-any */
