import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../../utils/font";
import { createTitleAttractState, type TitleAttractState } from "./TitleAttract";

const FRAME_BLUE = 0x23d9ff;
const GLASS_CYAN = 0x7be8ff;
const LASER_PINK = 0xff43d6;
const LASER_PURPLE = 0x8e44ff;
const SHADOW = 0x020107;

export class Title extends Scene {
  private attractGraphics!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private titleGlow!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;

  constructor() {
    super("Title");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const fontFamily = getFontFamily(this);
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");
    this.attractGraphics = this.add.graphics().setDepth(1);

    this.titleGlow = this.add
      .text(width / 2, height * 0.24, "STARFIGHTER ASSAULT", {
        fontFamily,
        fontSize: "56px",
        color: "#ff43d6",
      })
      .setOrigin(0.5)
      .setAlpha(0.34)
      .setDepth(20);

    this.titleText = this.add
      .text(width / 2, height * 0.36, "STARFIGHTER ASSAULT", {
        fontFamily,
        fontSize: "56px",
        color: "#ff43d6",
        stroke: "#4d2cff",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.add
      .text(width / 2, height * 0.35, "BOUNTY CONTRACT: OBSIDIAN CROWN", {
        fontFamily,
        fontSize: "16px",
        color: "#ffdf6e",
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.promptText = this.add
      .text(width / 2, height * 0.54, "PRESS SPACE OR CLICK TO START", {
        fontFamily,
        fontSize: "22px",
        color: "#7be8ff",
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.add
      .text(width / 2, height * 0.61, "MOUSE - STEER  |  CLICK/SPACE - DUAL LASERS  |  SHIFT - TORPEDO", {
        fontFamily,
        fontSize: "14px",
        color: "#6a6f87",
      })
      .setOrigin(0.5)
      .setDepth(21);

    const startRun = () => this.scene.start("OpeningCrawl");
    this.input.keyboard?.once("keydown-SPACE", startRun);
    this.input.once("pointerdown", startRun);

    EventBus.emit("current-scene-ready", this);
  }

  update(time: number): void {
    const { width, height } = this.cameras.main;
    const state = createTitleAttractState(time);

    this.attractGraphics.clear();
    this.drawStarfield(width, height, state);
    this.drawCapitalShip(width, height, state);
    this.drawCockpitFrame(width, height);
    this.drawRadar(width, height, state);

    this.titleText.setY(height * 0.24 + Math.sin(time / 900) * 2);
    this.titleGlow
      .setY(this.titleText.y)
      .setScale(1 + state.capitalShip.alpha * 0.04)
      .setAlpha(0.16 + state.titleFlicker * 0.28);
    this.promptText.setAlpha(0.42 + Math.sin(time / 260) * 0.26);
  }

  private drawStarfield(
    width: number,
    height: number,
    state: TitleAttractState,
  ): void {
    const centerX = width / 2;
    const centerY = height * 0.42;

    for (let i = 0; i < 64; i++) {
      const seed = i * 37.17;
      const angle = seed % (Math.PI * 2);
      const distance = ((i * 59 + state.starOffset * 900) % 720) / 720;
      const radius = 18 + distance * Math.max(width, height) * 0.58;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * 0.68;
      const streak = 4 + distance * 18;

      this.attractGraphics.lineStyle(1, GLASS_CYAN, 0.12 + distance * 0.32);
      this.attractGraphics.beginPath();
      this.attractGraphics.moveTo(x, y);
      this.attractGraphics.lineTo(
        x + Math.cos(angle) * streak,
        y + Math.sin(angle) * streak * 0.68,
      );
      this.attractGraphics.strokePath();
    }
  }

  private drawCapitalShip(
    width: number,
    height: number,
    state: TitleAttractState,
  ): void {
    const centerX = width / 2;
    const centerY = height * (0.33 + state.capitalShip.y);
    const shipScale = state.capitalShip.scale;
    const halfWidth = width * 0.24 * shipScale;
    const noseY = centerY - height * 0.12 * shipScale;
    const sternY = centerY + height * 0.19 * shipScale;

    this.attractGraphics.fillStyle(LASER_PURPLE, 0.07 + state.capitalShip.alpha * 0.08);
    this.attractGraphics.fillTriangle(
      centerX,
      noseY,
      centerX - halfWidth,
      sternY,
      centerX + halfWidth,
      sternY,
    );

    this.attractGraphics.lineStyle(2, LASER_PURPLE, state.capitalShip.alpha);
    this.strokePath([
      [centerX, noseY],
      [centerX - halfWidth, sternY],
      [centerX + halfWidth, sternY],
      [centerX, noseY],
    ]);

    this.attractGraphics.lineStyle(1, GLASS_CYAN, state.capitalShip.alpha * 0.56);
    this.strokePath([
      [centerX, noseY + 24 * shipScale],
      [centerX - halfWidth * 0.18, sternY - 24 * shipScale],
      [centerX + halfWidth * 0.18, sternY - 24 * shipScale],
      [centerX, noseY + 24 * shipScale],
    ]);
    this.strokePath([
      [centerX - halfWidth * 0.58, sternY - 14 * shipScale],
      [centerX + halfWidth * 0.58, sternY - 14 * shipScale],
    ]);
  }

  private drawCockpitFrame(width: number, height: number): void {
    const centerX = width / 2;

    this.attractGraphics.lineStyle(2, FRAME_BLUE, 0.62);
    this.strokePath([
      [width * 0.08, height * 0.28],
      [width * 0.28, height * 0.21],
      [centerX, height * 0.25],
      [width * 0.72, height * 0.21],
      [width * 0.92, height * 0.28],
    ]);
    this.strokePath([
      [width * 0.12, height * 0.67],
      [width * 0.28, height * 0.54],
      [width * 0.36, height * 0.2],
    ]);
    this.strokePath([
      [width * 0.88, height * 0.67],
      [width * 0.72, height * 0.54],
      [width * 0.64, height * 0.2],
    ]);

    this.attractGraphics.fillStyle(FRAME_BLUE, 0.06);
    this.attractGraphics.fillTriangle(
      centerX - width * 0.07,
      height,
      centerX + width * 0.07,
      height,
      centerX,
      height * 0.72,
    );

    this.drawCannon(0, height * 0.68, width * 0.16, height * 0.055, 1);
    this.drawCannon(width, height * 0.68, width * 0.16, height * 0.055, -1);
  }

  private drawRadar(
    width: number,
    height: number,
    state: TitleAttractState,
  ): void {
    const radarX = width / 2;
    const radarY = height * 0.86;
    const radarW = Math.min(width * 0.34, 260);
    const radarH = Math.min(height * 0.15, 88);

    this.attractGraphics.fillStyle(SHADOW, 0.74);
    this.attractGraphics.fillEllipse(radarX, radarY, radarW, radarH);
    this.attractGraphics.lineStyle(2, FRAME_BLUE, 0.82);
    this.attractGraphics.strokeEllipse(radarX, radarY, radarW, radarH);
    this.attractGraphics.lineStyle(1, LASER_PURPLE, 0.42);
    this.attractGraphics.strokeEllipse(radarX, radarY, radarW * 0.62, radarH * 0.62);

    const sweepX = radarX + Math.cos(state.radarSweep) * radarW * 0.4;
    const sweepY = radarY + Math.sin(state.radarSweep) * radarH * 0.32;
    this.attractGraphics.lineStyle(1, GLASS_CYAN, 0.48);
    this.attractGraphics.beginPath();
    this.attractGraphics.moveTo(radarX, radarY);
    this.attractGraphics.lineTo(sweepX, sweepY);
    this.attractGraphics.strokePath();

    for (const contact of state.radarContacts) {
      const dotX = radarX + contact.x * radarW * 0.42;
      const dotY = radarY + contact.y * radarH * 0.34;
      this.attractGraphics.fillStyle(LASER_PINK, contact.alpha);
      this.attractGraphics.fillCircle(dotX, dotY, contact.radius);
    }
  }

  private drawCannon(
    x: number,
    y: number,
    length: number,
    height: number,
    direction: 1 | -1,
  ): void {
    const tipX = x + direction * length;

    this.attractGraphics.fillStyle(LASER_PURPLE, 0.15);
    this.attractGraphics.fillTriangle(x, y - height, x, y + height, tipX, y);
    this.attractGraphics.lineStyle(3, LASER_PINK, 0.78);
    this.strokePath([
      [x, y - height],
      [tipX, y],
      [x, y + height],
    ]);
    this.attractGraphics.lineStyle(2, GLASS_CYAN, 0.66);
    this.strokePath([[x, y], [tipX, y]]);
  }

  private strokePath(points: [number, number][]): void {
    if (points.length === 0) return;

    const [firstX, firstY] = points[0];
    this.attractGraphics.beginPath();
    this.attractGraphics.moveTo(firstX, firstY);

    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i];
      this.attractGraphics.lineTo(x, y);
    }

    this.attractGraphics.strokePath();
  }
}
