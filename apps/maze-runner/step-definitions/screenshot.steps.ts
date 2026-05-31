/* eslint-disable @typescript-eslint/no-explicit-any */
import { Then } from "@cucumber/cucumber";
import { ScreenshotCheckpoint } from "@neon-cabinet/browser-test-runner";

Then("take a screenshot {string}", async function (name: string) {
  const world = this as any;
  const scenarioName = world.pickle?.name ?? "unknown";
  const seed = world.seed ?? 0;
  const screenshot = new ScreenshotCheckpoint(
    world.screenshotDir || "test-results",
    scenarioName,
    seed,
  );
  await screenshot.capture(world.page, name);
});
/* eslint-enable @typescript-eslint/no-explicit-any */
