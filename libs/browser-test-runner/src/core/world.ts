import type { Page, Browser, BrowserContext } from "playwright";

export class BrowserWorld {
  page!: Page;
  browser!: Browser;
  context!: BrowserContext;
  screenshotDir!: string;
  seed = 0;
  gameUrl = "";

  constructor() {
    this.screenshotDir = "test-results";
  }

  async navigate(path: string): Promise<void> {
    const url = new URL(path, this.gameUrl).toString();
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async eval<T>(expression: string): Promise<T> {
    return this.page.evaluate(expression) as Promise<T>;
  }

  async snapshot(): Promise<string> {
    return this.page.evaluate(() => {
      const test = (window as unknown as Record<string, unknown>).__TEST__ as
        | {
            state?: () => unknown;
            scene?: string;
            seed?: number;
          }
        | undefined;
      if (!test?.state) return "";
      const state = test.state();
      const scene = test.scene ?? "";
      const seed = test.seed ?? 0;
      const lines: string[] = [];
      lines.push(`Scene: ${scene}`);
      lines.push(`Seed: ${seed}`);
      if (state && typeof state === "object") {
        for (const [key, value] of Object.entries(
          state as Record<string, unknown>,
        )) {
          if (value !== null && typeof value === "object") {
            lines.push(`${key}:`);
            for (const [k, v] of Object.entries(
              value as Record<string, unknown>,
            )) {
              lines.push(`  ${k}: ${JSON.stringify(v)}`);
            }
          } else {
            lines.push(`${key}: ${JSON.stringify(value)}`);
          }
        }
      }
      return lines.join("\n");
    });
  }
}
