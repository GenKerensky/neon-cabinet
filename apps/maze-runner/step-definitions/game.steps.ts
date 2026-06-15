/* eslint-disable @typescript-eslint/no-explicit-any */
import { Given, When, Then } from "@cucumber/cucumber";

Given("the game is configured with seed {int}", async function (seed: number) {
  (this as any).seed = seed;
  await (this as any).navigate(`/?test=1&seed=${seed}`);
  await (this as any).page.waitForFunction(
    () => (window as any).__TEST__ !== undefined,
    { timeout: 10000 },
  );
  await (this as any).page.waitForFunction(
    () => (window as any).__TEST__?.ready === true,
    { timeout: 10000 },
  );
});

Given("the game is running at {float}x speed", async function (speed: number) {
  await (this as any).page.evaluate((s: number) => {
    (window as any).__TEST__?.time?.setSpeed(s);
  }, speed);
});

When("I start the game", async function () {
  await (this as any).page.evaluate(() => {
    (window as any).__TEST__?.commands?.start();
  });
});

When("the game is paused", async function () {
  await (this as any).page.evaluate(() => {
    (window as any).__TEST__?.time?.pause();
  });
});

When("the game is resumed", async function () {
  await (this as any).page.evaluate(() => {
    (window as any).__TEST__?.time?.resume();
  });
});

Then("the scene should be {string}", async function (expected: string) {
  const scene = await (this as any).page.evaluate(() => {
    return (window as any).__TEST__?.scene ?? "";
  });
  if (scene !== expected) {
    throw new Error(`Expected scene "${expected}" but got "${scene}"`);
  }
});
/* eslint-enable @typescript-eslint/no-explicit-any */
