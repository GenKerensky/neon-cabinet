/* eslint-disable @typescript-eslint/no-explicit-any */
import { Before, After } from "@cucumber/cucumber";
import { BrowserHooks } from "@neon-cabinet/browser-test-runner";

let hooks: BrowserHooks;

Before(async function () {
  hooks = new BrowserHooks(this as any, false);
  await hooks.before();
});

After(async function () {
  await hooks?.after();
});
/* eslint-enable @typescript-eslint/no-explicit-any */
