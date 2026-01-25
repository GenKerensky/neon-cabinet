import Phaser from "phaser";

/**
 * HUD elements: crosshairs, horizon line, controls hint
 */
export class HUD {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private controlsText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private positionText!: Phaser.GameObjects.Text;

  private crosshairColor = 0x00ff00;
  private horizonColor = 0x004400;
  private fontFamily: string;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(100);

    this.fontFamily =
      (scene.registry.get("fontFamily") as string) || "Orbitron, monospace";

    this.createTextElements();
  }

  private createTextElements(): void {
    const { width, height } = this.scene.cameras.main;
    const margin = 30;

    this.controlsText = this.scene.add.text(
      width / 2,
      height - margin,
      "W/↑ - FORWARD  |  S/↓ - REVERSE  |  A/← D/→ - TURN  |  ESC - PAUSE",
      {
        fontFamily: this.fontFamily,
        fontSize: "14px",
        color: "#888888",
      },
    );
    this.controlsText.setOrigin(0.5, 1);
    this.controlsText.setScrollFactor(0);
    this.controlsText.setDepth(100);

    this.speedText = this.scene.add.text(margin, margin, "SPEED: 0", {
      fontFamily: this.fontFamily,
      fontSize: "16px",
      color: "#00ff00",
    });
    this.speedText.setScrollFactor(0);
    this.speedText.setDepth(100);

    this.positionText = this.scene.add.text(
      width - margin,
      margin,
      "X: 0 Z: 0",
      {
        fontFamily: this.fontFamily,
        fontSize: "14px",
        color: "#666666",
      },
    );
    this.positionText.setOrigin(1, 0);
    this.positionText.setScrollFactor(0);
    this.positionText.setDepth(100);
  }

  draw(): void {
    const { width, height } = this.scene.cameras.main;

    this.graphics.clear();

    this.drawCrosshairs(width, height);
    this.drawHorizon(width, height);
  }

  private drawCrosshairs(screenW: number, screenH: number): void {
    const cx = screenW / 2;
    const cy = screenH / 2;

    this.graphics.lineStyle(2, this.crosshairColor, 1);

    // Horizontal
    this.graphics.beginPath();
    this.graphics.moveTo(cx - 30, cy);
    this.graphics.lineTo(cx - 10, cy);
    this.graphics.strokePath();

    this.graphics.beginPath();
    this.graphics.moveTo(cx + 10, cy);
    this.graphics.lineTo(cx + 30, cy);
    this.graphics.strokePath();

    // Vertical
    this.graphics.beginPath();
    this.graphics.moveTo(cx, cy - 30);
    this.graphics.lineTo(cx, cy - 10);
    this.graphics.strokePath();

    this.graphics.beginPath();
    this.graphics.moveTo(cx, cy + 10);
    this.graphics.lineTo(cx, cy + 30);
    this.graphics.strokePath();

    // Center dot
    this.graphics.fillStyle(this.crosshairColor, 1);
    this.graphics.fillCircle(cx, cy, 2);

    // Corner brackets
    const bracketSize = 8;
    const bracketOffset = 40;

    this.graphics.lineStyle(1, this.crosshairColor, 0.6);

    // Top-left
    this.graphics.beginPath();
    this.graphics.moveTo(cx - bracketOffset, cy - bracketOffset + bracketSize);
    this.graphics.lineTo(cx - bracketOffset, cy - bracketOffset);
    this.graphics.lineTo(cx - bracketOffset + bracketSize, cy - bracketOffset);
    this.graphics.strokePath();

    // Top-right
    this.graphics.beginPath();
    this.graphics.moveTo(cx + bracketOffset - bracketSize, cy - bracketOffset);
    this.graphics.lineTo(cx + bracketOffset, cy - bracketOffset);
    this.graphics.lineTo(cx + bracketOffset, cy - bracketOffset + bracketSize);
    this.graphics.strokePath();

    // Bottom-left
    this.graphics.beginPath();
    this.graphics.moveTo(cx - bracketOffset, cy + bracketOffset - bracketSize);
    this.graphics.lineTo(cx - bracketOffset, cy + bracketOffset);
    this.graphics.lineTo(cx - bracketOffset + bracketSize, cy + bracketOffset);
    this.graphics.strokePath();

    // Bottom-right
    this.graphics.beginPath();
    this.graphics.moveTo(cx + bracketOffset - bracketSize, cy + bracketOffset);
    this.graphics.lineTo(cx + bracketOffset, cy + bracketOffset);
    this.graphics.lineTo(cx + bracketOffset, cy + bracketOffset - bracketSize);
    this.graphics.strokePath();
  }

  private drawHorizon(screenW: number, screenH: number): void {
    const horizonY = screenH / 2;

    this.graphics.lineStyle(1, this.horizonColor, 0.5);
    this.graphics.beginPath();
    this.graphics.moveTo(0, horizonY);
    this.graphics.lineTo(screenW, horizonY);
    this.graphics.strokePath();

    const tickSpacing = 100;
    const tickHeight = 5;

    for (let x = tickSpacing; x < screenW; x += tickSpacing) {
      this.graphics.beginPath();
      this.graphics.moveTo(x, horizonY - tickHeight);
      this.graphics.lineTo(x, horizonY + tickHeight);
      this.graphics.strokePath();
    }
  }

  update(speed: number, posX: number, posZ: number): void {
    const displaySpeed = Math.abs(Math.round(speed));
    this.speedText.setText(`SPEED: ${displaySpeed}`);

    if (displaySpeed > 100) {
      this.speedText.setColor("#ffff00");
    } else if (displaySpeed > 0) {
      this.speedText.setColor("#00ff00");
    } else {
      this.speedText.setColor("#666666");
    }

    this.positionText.setText(`X: ${Math.round(posX)} Z: ${Math.round(posZ)}`);
  }

  destroy(): void {
    this.graphics.destroy();
    this.controlsText.destroy();
    this.speedText.destroy();
    this.positionText.destroy();
  }
}
