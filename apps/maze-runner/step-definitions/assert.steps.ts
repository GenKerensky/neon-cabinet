/* eslint-disable @typescript-eslint/no-explicit-any */
import { When, Then } from "@cucumber/cucumber";

const capturedValues: Record<string, number> = {};

const getState = async (world: any) => {
  if (world.lastState) return world.lastState;
  return world.page.evaluate(() => (window as any).__TEST__?.state);
};

Then("the state should contain {string}", async function (key: string) {
  const state = await getState(this as any);
  if (!state || !(key in state)) {
    throw new Error(`Expected state to contain key "${key}"`);
  }
});

Then("the score should be {int}", async function (expected: number) {
  const state = await getState(this as any);
  const score = state?.score ?? -1;
  if (score !== expected) {
    throw new Error(`Expected score ${expected} but got ${score}`);
  }
});

Then("the score should be at least {int}", async function (expected: number) {
  const state = await getState(this as any);
  const score = state?.score ?? -1;
  if (score < expected) {
    throw new Error(`Expected score >= ${expected} but got ${score}`);
  }
});

Then("the lives should be {int}", async function (expected: number) {
  const state = await getState(this as any);
  const lives = state?.lives ?? -1;
  if (lives !== expected) {
    throw new Error(`Expected lives ${expected} but got ${lives}`);
  }
});

Then("the level should be {int}", async function (expected: number) {
  const state = await getState(this as any);
  const level = state?.level ?? -1;
  if (level !== expected) {
    throw new Error(`Expected level ${expected} but got ${level}`);
  }
});

Then(
  "the collectibles count should be less than the initial value",
  async function () {
    const state = await getState(this as any);
    const current = state?.collectibles ?? 0;
    const initial = capturedValues["collectibles"] ?? 0;
    if (current >= initial) {
      throw new Error(`Expected collectibles < ${initial} but got ${current}`);
    }
  },
);

When("I capture the collectibles count", async function () {
  const state = await getState(this as any);
  capturedValues["collectibles"] = state?.collectibles ?? 0;
});
/* eslint-enable @typescript-eslint/no-explicit-any */
