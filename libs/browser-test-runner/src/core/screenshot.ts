import type { Page } from "playwright";
import { join } from "path";
import { mkdirSync, writeFileSync } from "fs";

export class ScreenshotCheckpoint {
  private runDir: string;
  private scenarioName: string;
  private seed: number;

  constructor(baseDir: string, scenarioName: string, seed: number) {
    const timestamp = Date.now();
    this.runDir = join(baseDir, `run-${timestamp}`);
    mkdirSync(this.runDir, { recursive: true });
    this.scenarioName = scenarioName;
    this.seed = seed;
  }

  async capture(page: Page, checkpointName: string): Promise<string> {
    const sanitizedScenario = this.scenarioName.replace(/[^a-zA-Z0-9]/g, "-");
    const sanitizedCheckpoint = checkpointName.replace(/[^a-zA-Z0-9]/g, "-");
    const filename = `${sanitizedScenario}-${sanitizedCheckpoint}-seed-${this.seed}-${Date.now()}.png`;
    const filepath = join(this.runDir, filename);

    try {
      const buffer = await page.screenshot({ type: "png" });
      writeFileSync(filepath, buffer);
      return filepath;
    } catch (err) {
      console.error(`Screenshot capture failed: ${err}`);
      return "";
    }
  }

  getRunDir(): string {
    return this.runDir;
  }
}
