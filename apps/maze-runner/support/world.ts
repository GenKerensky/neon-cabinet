/* eslint-disable @typescript-eslint/no-explicit-any */
import { setWorldConstructor } from "@cucumber/cucumber";
import { BrowserWorld } from "@neon-cabinet/browser-test-runner";

class MazeRunnerWorld extends BrowserWorld {
  constructor(options: any) {
    super();
    this.gameUrl = options.parameters?.gameUrl ?? "http://localhost:4200";
    this.screenshotDir = options.parameters?.screenshotDir ?? "test-results";
  }
}

setWorldConstructor(MazeRunnerWorld);
/* eslint-enable @typescript-eslint/no-explicit-any */
