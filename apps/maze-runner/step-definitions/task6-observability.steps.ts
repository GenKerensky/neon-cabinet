/* eslint-disable @typescript-eslint/no-explicit-any */
import { Given, Then, When } from "@cucumber/cucumber";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const EVIDENCE_DIR = ".omo/evidence";

const ensureEvidenceDir = () => {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
};

Given("I open the title scene with seed {int}", async function (seed: number) {
  (this as any).seed = seed;
  await (this as any).navigate(`/?seed=${seed}`);
  await (this as any).page.waitForFunction(
    () => (window as any).__PHASER_BRIDGE__ !== undefined,
    { timeout: 10000 },
  );
  await (this as any).page.waitForFunction(
    () => (window as any).__PHASER_BRIDGE__?.scene?.()?.key === "Title",
    { timeout: 10000 },
  );
});

When("I start the game scene through bridge", async function () {
  await (this as any).page.evaluate(() => {
    const bridge = (window as any).__PHASER_BRIDGE__;
    const game = bridge?.game?.();
    const title = game?.scene?.getScene?.("Title");
    title?.scene?.start?.("Game");
  });
});

When("I wait for bridge scene {string}", async function (sceneKey: string) {
  await (this as any).page.evaluate(async (expected: string) => {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const current = (window as any).__PHASER_BRIDGE__?.scene?.()?.key;
      if (current === expected) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`Timed out waiting for scene ${expected}`);
  }, sceneKey);
});

When("I save bridge screenshot as {string}", async function (filename: string) {
  ensureEvidenceDir();
  const dataUrl = await (this as any).page.evaluate(() => {
    return (window as any).__PHASER_BRIDGE__?.screenshot?.() ?? "";
  });

  const outputPath = join(EVIDENCE_DIR, filename);
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  writeFileSync(outputPath, base64, "base64");
});

When("I move player right through scene control", async function () {
  await (this as any).page.evaluate(async () => {
    const bridge = (window as any).__PHASER_BRIDGE__;
    const game = bridge?.game?.();
    const gameScene = game?.scene?.getScene?.("Game");
    gameScene?.player?.setDirection?.(4);
    await new Promise((resolve) => setTimeout(resolve, 250));
  });
});

When("I collect movement and pen state from bridge", async function () {
  const result = await (this as any).page.evaluate(() => {
    const bridge = (window as any).__PHASER_BRIDGE__;
    const scene = bridge?.scene?.()?.key ?? "";
    const state = bridge?.state?.() ?? {};
    return { scene, state };
  });
  (this as any).task6MovementPen = result;
});

Then("I save movement and pen evidence files", async function () {
  ensureEvidenceDir();
  const payload = (this as any).task6MovementPen ?? { scene: "", state: {} };
  const jsonPath = join(EVIDENCE_DIR, "task-6-movement-pen.json");
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const summaryPath = join(EVIDENCE_DIR, "task-6-browser-scenarios.txt");
  const summary = [
    "Task 6 browser scenarios completed.",
    "- Title attract screenshot: .omo/evidence/task-6-title-attract.png",
    "- Game HUD screenshot: .omo/evidence/task-6-game-hud.png",
    "- Movement/pen snapshot: .omo/evidence/task-6-movement-pen.json",
    `- Captured scene: ${payload.scene ?? ""}`,
  ].join("\n");
  writeFileSync(summaryPath, `${summary}\n`, "utf8");
});

/* eslint-enable @typescript-eslint/no-explicit-any */
