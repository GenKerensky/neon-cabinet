import { setWorldConstructor } from "@cucumber/cucumber";
import type { IWorldOptions } from "@cucumber/cucumber";
import { BrowserWorld } from "@neon-cabinet/browser-test-runner";

class MazeRunnerWorld extends BrowserWorld {
  constructor(options: IWorldOptions) {
    super();
    this.gameUrl = options.parameters?.gameUrl ?? "http://localhost:4200";
    this.screenshotDir = options.parameters?.screenshotDir ?? "test-results";
  }
}

setWorldConstructor(MazeRunnerWorld);
