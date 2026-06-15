import { GameObjects, Math as PhaserMath, Scene } from "phaser";
import { CRAWL_DURATION_MS, CRAWL_LINES } from "../config/crawl";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../../utils/font";

const MAX_CRAWL_CHARS_PER_LINE = 34;

export class OpeningCrawl extends Scene {
  private hasAdvanced = false;
  private crawlStartedAt = 0;
  private crawlLineObjects: GameObjects.Text[] = [];
  private crawlLineSpacing = 42;
  private crawlStartY = 0;
  private crawlEndY = 0;
  private perspectiveTopY = 0;
  private perspectiveBottomY = 0;

  constructor() {
    super("OpeningCrawl");
  }

  create(): void {
    this.hasAdvanced = false;

    const { width, height } = this.cameras.main;
    const fontFamily = getFontFamily(this);
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    this.crawlStartedAt = this.time.now;
    this.crawlLineObjects = [];
    this.crawlStartY = height * 0.93;
    this.crawlEndY = height * 0.08;
    this.perspectiveTopY = height * 0.1;
    this.perspectiveBottomY = height * 0.9;

    this.addStarfield(width, height);

    const crawlLines = this.buildCrawlLines();
    this.crawlLineSpacing = Math.max(34, Math.min(46, height * 0.06));
    crawlLines.forEach((line, index) => {
      const text = this.add
        .text(width / 2, this.crawlStartY + index * this.crawlLineSpacing, line, {
          fontFamily,
          fontSize: "26px",
          fontStyle: "bold italic",
          align: "center",
          color: "#fff56a",
          stroke: "#6d5c18",
          strokeThickness: 1,
        })
        .setOrigin(0.5, 0.5)
        .setAlpha(0);
      this.crawlLineObjects.push(text);
    });

    this.add
      .text(width / 2, height - 36, "CLICK OR SPACE TO SKIP", {
        fontFamily,
        fontSize: "14px",
        color: "#7be8ff",
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .rectangle(0, 0, width, height * 0.16, 0x020107, 0.8)
      .setOrigin(0, 0)
      .setDepth(2);

    this.time.delayedCall(CRAWL_DURATION_MS, () => this.advance());

    this.input.once("pointerdown", () => this.advance());
    this.input.keyboard?.once("keydown-SPACE", () => this.advance());
    this.input.keyboard?.once("keydown-ENTER", () => this.advance());
    this.input.keyboard?.once("keydown-ESC", () => this.advance());

    EventBus.emit("current-scene-ready", this);
  }

  update(): void {
    if (this.hasAdvanced) return;

    const progress = PhaserMath.Clamp(
      (this.time.now - this.crawlStartedAt) / CRAWL_DURATION_MS,
      0,
      1,
    );
    const scrollRange =
      this.crawlStartY -
      this.crawlEndY +
      this.crawlLineObjects.length * this.crawlLineSpacing;
    const scrollOffset = progress * scrollRange;

    this.crawlLineObjects.forEach((line, index) => {
      const y = this.crawlStartY + index * this.crawlLineSpacing - scrollOffset;
      const depth = PhaserMath.Clamp(
        (y - this.perspectiveTopY) /
          (this.perspectiveBottomY - this.perspectiveTopY),
        0,
        1,
      );
      const topFade = PhaserMath.Clamp((y - this.perspectiveTopY) / 80, 0, 1);
      const bottomFade = PhaserMath.Clamp((this.perspectiveBottomY - y) / 130, 0, 1);
      const scaleY = PhaserMath.Linear(0.18, 1.06, depth);
      const scaleX = PhaserMath.Linear(0.08, 1.42, depth);

      line
        .setY(y)
        .setScale(scaleX, scaleY)
        .setAlpha(topFade * bottomFade)
        .setDepth(1);
    });
  }

  private addStarfield(width: number, height: number): void {
    const stars = this.add.graphics().setDepth(0);
    stars.fillStyle(0xff43d6, 0.35);
    for (let i = 0; i < 36; i += 1) {
      const x = PhaserMath.Between(24, width - 24);
      const y = PhaserMath.Between(18, Math.floor(height * 0.86));
      stars.fillCircle(x, y, PhaserMath.Between(1, 2));
    }
  }

  private buildCrawlLines(): string[] {
    return CRAWL_LINES.flatMap((paragraph, paragraphIndex) => {
      const lines = this.wrapParagraph(paragraph);
      return paragraphIndex < CRAWL_LINES.length - 1 ? [...lines, ""] : lines;
    });
  }

  private wrapParagraph(paragraph: string): string[] {
    return paragraph.split(" ").reduce<string[]>((lines, word) => {
      const lastLine = lines[lines.length - 1];
      if (!lastLine) return [word];
      if (`${lastLine} ${word}`.length <= MAX_CRAWL_CHARS_PER_LINE) {
        return [...lines.slice(0, -1), `${lastLine} ${word}`];
      }
      return [...lines, word];
    }, []);
  }

  private advance(): void {
    if (this.hasAdvanced) return;
    this.hasAdvanced = true;
    this.scene.start("Game");
  }
}
