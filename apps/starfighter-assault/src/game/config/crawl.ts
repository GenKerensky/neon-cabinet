export const CRAWL_DURATION_MS = 12_000;

export const CRAWL_LINES = [
  "On the edge of charted space, the dread carrier OBSIDIAN CROWN burns colonies from the void and vanishes before justice can answer.",
  "A bounty has crossed every outlaw channel: destroy the flagship, claim the fortune, end the terror.",
  "One hunter has followed its ion trail through dead systems and shattered moons. The last jump window is closing. The assault begins now.",
] as const;

export function getCrawlText(): string {
  return CRAWL_LINES.join("\n\n");
}
