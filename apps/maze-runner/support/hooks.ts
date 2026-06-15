import { Before, After } from "@cucumber/cucumber";
import {
  BrowserHooks,
  type BrowserWorld,
} from "@neon-cabinet/browser-test-runner";

let hooks: BrowserHooks;

Before(async function (this: BrowserWorld) {
  hooks = new BrowserHooks(this, false);
  await hooks.before();
});

After(async function () {
  await hooks?.after();
});
