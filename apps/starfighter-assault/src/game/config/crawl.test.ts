import { describe, expect, it } from "vitest";
import {
  CRAWL_DURATION_MS,
  CRAWL_LINES,
  getCrawlText,
} from "./crawl";

describe("opening crawl config", () => {
  it("keeps the crawl short enough for repeat arcade runs", () => {
    expect(CRAWL_DURATION_MS).toBeGreaterThanOrEqual(10_000);
    expect(CRAWL_DURATION_MS).toBeLessThanOrEqual(15_000);
  });

  it("establishes the bounty hunter motive and capital ship target", () => {
    const text = getCrawlText();
    expect(text).toContain("OBSIDIAN CROWN");
    expect(text.toLowerCase()).toContain("bounty");
    expect(text.toLowerCase()).toContain("hunter");
    expect(text.toLowerCase()).toContain("flagship");
  });

  it("uses three short story beats", () => {
    expect(CRAWL_LINES).toHaveLength(3);
    expect(CRAWL_LINES.every((line) => line.length <= 150)).toBe(true);
  });
});
