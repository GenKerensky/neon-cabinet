import { Input, Scene } from "phaser";
import type { GameObjects } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../utils/font";
import { getVectorMode, setVectorMode, VectorMode } from "../utils/settings";
import { VectorShader } from "@neon-cabinet/shaders";

export class Pause extends Scene {
  private modeLetterTexts: GameObjects.Text[] = [];
  private currentMode: VectorMode;

  constructor() {
    super("Pause");
    this.currentMode = VectorMode.COLOR;
  }

  create(): void {
    // Color mode will be set automatically in onPreRender from registry
    this.cameras.main.setPostPipeline("VectorShader");

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const font = getFontFamily(this);

    // Semi-transparent overlay
    const overlay = this.add.rectangle(
      centerX,
      centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7,
    );
    overlay.setDepth(1000);

    // Paused title (yellow)
    const title = this.add.text(centerX, centerY - 100, "PAUSED", {
      fontFamily: font,
      fontSize: "56px",
      color: "#ffff00",
      stroke: "#888800",
      strokeThickness: 2,
    });
    title.setOrigin(0.5);
    title.setDepth(1001);

    // Settings section
    this.currentMode = getVectorMode(this);
    const modeLabel = this.add.text(centerX, centerY - 24, "Vector Display:", {
      fontFamily: font,
      fontSize: "20px",
      color: "#aaaaaa",
    });
    modeLabel.setOrigin(0.5);
    modeLabel.setDepth(1001);

    // Create rainbow text for mode (each letter different color)
    this.createRainbowModeText(centerX, centerY + 4, font);

    const toggleHint = this.add.text(
      centerX,
      centerY + 36,
      "[ PRESS T TO TOGGLE ]",
      {
        fontFamily: font,
        fontSize: "16px",
        color: "#888888",
      },
    );
    toggleHint.setOrigin(0.5);
    toggleHint.setDepth(1001);

    // Resume instruction
    const resumeText = this.add.text(
      centerX,
      centerY + 80,
      "[ PRESS ESC TO RESUME ]",
      {
        fontFamily: font,
        fontSize: "20px",
        color: "#ffffff",
      },
    );
    resumeText.setOrigin(0.5);
    resumeText.setDepth(1001);

    // Blink effect on resume text
    this.tweens.add({
      targets: resumeText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // T key to toggle vector mode
    const tKey = this.input.keyboard?.addKey(Input.Keyboard.KeyCodes.T);
    tKey?.on("down", () => {
      this.toggleVectorMode();
    });

    // ESC to resume - use KeyCodes constant for reliability
    const escKey = this.input.keyboard?.addKey(Input.Keyboard.KeyCodes.ESC);
    escKey?.on("down", () => {
      this.scene.resume("Game");
      this.scene.stop();
    });

    // Emit event for React bridge
    EventBus.emit("current-scene-ready", this);
  }

  private toggleVectorMode(): void {
    // Toggle mode
    this.currentMode =
      this.currentMode === VectorMode.COLOR
        ? VectorMode.MONOCHROME
        : VectorMode.COLOR;

    // Update registry
    setVectorMode(this, this.currentMode);

    // Update rainbow text
    this.updateRainbowModeText();

    // Update this scene's shader
    const pipeline = this.cameras.main.getPostPipeline(
      "VectorShader",
    ) as VectorShader;
    if (pipeline) {
      pipeline.setColorMode(this.currentMode);
    }

    // Update all other active scenes' shaders
    const scenes = this.scene.manager.getScenes(true);
    scenes.forEach((scene) => {
      if (scene !== this && scene.cameras) {
        const scenePipeline = scene.cameras.main.getPostPipeline(
          "VectorShader",
        ) as VectorShader;
        if (scenePipeline) {
          scenePipeline.setColorMode(this.currentMode);
        }
      }
    });
  }

  private createRainbowModeText(x: number, y: number, font: string): void {
    const text = this.currentMode === VectorMode.COLOR ? "COLOR" : "MONOCHROME";
    const fontSize = 24;
    const letterSpacing = 18;
    const startX = x - ((text.length - 1) * letterSpacing) / 2;

    // Rainbow colors (only for COLOR mode)
    const rainbowColors = [
      "#ff0000", // Red
      "#ff7f00", // Orange
      "#ffff00", // Yellow
      "#00ff00", // Green
      "#0000ff", // Blue
      "#4b0082", // Indigo
      "#9400d3", // Violet
    ];

    const isColorMode = this.currentMode === VectorMode.COLOR;

    for (let i = 0; i < text.length; i++) {
      const letterText = this.add.text(startX + i * letterSpacing, y, text[i], {
        fontFamily: font,
        fontSize: `${fontSize}px`,
        color: isColorMode
          ? rainbowColors[i % rainbowColors.length]
          : "#ffffff", // White for MONOCHROME
      });
      letterText.setOrigin(0.5);
      letterText.setDepth(1001);
      this.modeLetterTexts.push(letterText);
    }
  }

  private updateRainbowModeText(): void {
    // Clear existing letter texts
    this.modeLetterTexts.forEach((text) => text.destroy());
    this.modeLetterTexts = [];

    // Recreate with new text
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const font = getFontFamily(this);
    this.createRainbowModeText(centerX, centerY + 4, font);
  }
}
