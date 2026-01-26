import Phaser from "phaser";
import { TankDamageState, getDamageColor } from "./TankHealth";
import { Vector3D } from "../engine/Vector3D";

/**
 * HUD elements: crosshairs, horizon line, score, armor, radar, ammo
 */
export class HUD {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;

  // Top left - Score and Wave
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;

  // Top right - Speed and position
  private speedText!: Phaser.GameObjects.Text;
  private positionText!: Phaser.GameObjects.Text;

  // Bottom left - Armor
  private armorGraphics!: Phaser.GameObjects.Graphics;
  private armorLabel!: Phaser.GameObjects.Text;

  // Cracked windshield effect
  private crackedGraphics!: Phaser.GameObjects.Graphics;
  private isCracked = false;

  // Bottom center - Radar
  private radarGraphics!: Phaser.GameObjects.Graphics;

  // Bottom right - Ammo and reload
  private ammoText!: Phaser.GameObjects.Text;
  private reloadText!: Phaser.GameObjects.Text;
  private reloadBar!: Phaser.GameObjects.Graphics;

  // Bottom right - Weapon indicator (above ammo)
  private weaponLabel!: Phaser.GameObjects.Text;
  private weaponTexts: Phaser.GameObjects.Text[] = [];

  private crosshairColor = 0x00ff00;
  private horizonColor = 0x004400;
  private fontFamily: string;
  private margin = 30;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(100);

    this.fontFamily =
      (scene.registry.get("fontFamily") as string) || "Orbitron, monospace";

    this.createTextElements();
    this.createArmorDisplay();
    this.createRadar();
    this.createAmmoDisplay();
    this.createWeaponIndicator();
    this.createCrackedOverlay();
  }

  private createCrackedOverlay(): void {
    this.crackedGraphics = this.scene.add.graphics();
    this.crackedGraphics.setDepth(150);
    this.crackedGraphics.setVisible(false);
  }

  private createTextElements(): void {
    const { width } = this.scene.cameras.main;

    // Top left - Score
    this.scoreText = this.scene.add.text(this.margin, this.margin, "SCORE: 0", {
      fontFamily: this.fontFamily,
      fontSize: "24px",
      color: "#00ff00",
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);

    // Top left - Wave (below score)
    this.waveText = this.scene.add.text(
      this.margin,
      this.margin + 32,
      "WAVE 1",
      {
        fontFamily: this.fontFamily,
        fontSize: "20px",
        color: "#00ff00",
      },
    );
    this.waveText.setScrollFactor(0);
    this.waveText.setDepth(100);

    // Top right - Speed
    this.speedText = this.scene.add.text(
      width - this.margin,
      this.margin,
      "SPEED: 0",
      {
        fontFamily: this.fontFamily,
        fontSize: "24px",
        color: "#00ff00",
      },
    );
    this.speedText.setOrigin(1, 0);
    this.speedText.setScrollFactor(0);
    this.speedText.setDepth(100);

    // Top right - Position (below speed)
    this.positionText = this.scene.add.text(
      width - this.margin,
      this.margin + 32,
      "X: 0 Z: 0",
      {
        fontFamily: this.fontFamily,
        fontSize: "20px",
        color: "#666666",
      },
    );
    this.positionText.setOrigin(1, 0);
    this.positionText.setScrollFactor(0);
    this.positionText.setDepth(100);
  }

  private createArmorDisplay(): void {
    const { height } = this.scene.cameras.main;

    this.armorGraphics = this.scene.add.graphics();
    this.armorGraphics.setDepth(100);

    // Label above armor diagram (centered over tank)
    this.armorLabel = this.scene.add.text(
      this.margin + 60,
      height - this.margin - 185,
      "ARMOR",
      {
        fontFamily: this.fontFamily,
        fontSize: "18px",
        color: "#00ff00",
      },
    );
    this.armorLabel.setOrigin(0.5, 0);
    this.armorLabel.setScrollFactor(0);
    this.armorLabel.setDepth(100);
  }

  private createRadar(): void {
    this.radarGraphics = this.scene.add.graphics();
    this.radarGraphics.setDepth(100);
  }

  private createAmmoDisplay(): void {
    const { width, height } = this.scene.cameras.main;

    // Ammo text
    this.ammoText = this.scene.add.text(
      width - this.margin,
      height - this.margin - 120,
      "AMMO: 10",
      {
        fontFamily: this.fontFamily,
        fontSize: "28px",
        color: "#00ff00",
      },
    );
    this.ammoText.setOrigin(1, 0);
    this.ammoText.setScrollFactor(0);
    this.ammoText.setDepth(100);

    // Reload text (hidden initially)
    this.reloadText = this.scene.add.text(
      width - this.margin,
      height - this.margin - 85,
      "RELOADING",
      {
        fontFamily: this.fontFamily,
        fontSize: "20px",
        color: "#ffff00",
      },
    );
    this.reloadText.setOrigin(1, 0);
    this.reloadText.setScrollFactor(0);
    this.reloadText.setDepth(100);
    this.reloadText.setVisible(false);

    // Reload bar
    this.reloadBar = this.scene.add.graphics();
    this.reloadBar.setDepth(100);
  }

  private createWeaponIndicator(): void {
    const { width, height } = this.scene.cameras.main;

    // "WEAPONS" label
    this.weaponLabel = this.scene.add.text(
      width - this.margin,
      height - this.margin - 200,
      "WEAPONS",
      {
        fontFamily: this.fontFamily,
        fontSize: "16px",
        color: "#888888",
      },
    );
    this.weaponLabel.setOrigin(1, 0);
    this.weaponLabel.setScrollFactor(0);
    this.weaponLabel.setDepth(100);
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

  update(
    speed: number,
    posX: number,
    posZ: number,
    score: number,
    damageState: TankDamageState,
    ammo: { current: number; max: number; label?: string },
    reload: { isReloading: boolean; progress: number; label?: string },
    enemies: Vector3D[],
    playerPos: Vector3D,
    playerRotation: number,
    waveNumber = 1,
    pickups?: { position: Vector3D; color: number }[],
    weapons?: { name: string; selected: boolean }[],
  ): void {
    // Update score
    this.scoreText.setText(`SCORE: ${score}`);

    // Update wave
    this.waveText.setText(`WAVE ${waveNumber}`);

    // Update speed
    const displaySpeed = Math.abs(Math.round(speed));
    this.speedText.setText(`SPEED: ${displaySpeed}`);

    if (displaySpeed > 100) {
      this.speedText.setColor("#ffff00");
    } else if (displaySpeed > 0) {
      this.speedText.setColor("#00ff00");
    } else {
      this.speedText.setColor("#666666");
    }

    // Update position
    this.positionText.setText(`X: ${Math.round(posX)} Z: ${Math.round(posZ)}`);

    // Update armor display
    this.drawArmorIndicator(damageState);

    // Update weapon indicator
    if (weapons) {
      this.updateWeaponIndicator(weapons);
    }

    // Update ammo
    this.updateAmmo(ammo.current, ammo.max, ammo.label);

    // Update reload
    this.updateReload(reload.isReloading, reload.progress, reload.label);

    // Update radar
    this.drawRadar(enemies, playerPos, playerRotation, pickups);
  }

  private drawArmorIndicator(damage: TankDamageState): void {
    const { height } = this.scene.cameras.main;
    this.armorGraphics.clear();

    // Tank diagram position (bottom left)
    const cx = this.margin + 60;
    const cy = height - this.margin - 75;

    // Hull dimensions (top-down Abrams style) - scaled up 1.4x
    const hullW = 70; // Width
    const hullH = 112; // Length (front to back)
    const glacisH = 28; // Sloped front section height
    const rearH = 21; // Rear section height

    // Turret dimensions
    const turretW = 45;
    const turretH = 56;
    const turretOffsetY = -7; // Slightly forward of center
    const barrelW = 8;
    const barrelH = 50;

    // === FRONT SECTION (glacis plate) ===
    this.armorGraphics.lineStyle(3, getDamageColor(damage.front), 1);
    this.armorGraphics.beginPath();
    // Sloped glacis - narrower at front
    this.armorGraphics.moveTo(cx - hullW / 2 + 11, cy - hullH / 2); // Front left
    this.armorGraphics.lineTo(cx + hullW / 2 - 11, cy - hullH / 2); // Front right
    this.armorGraphics.lineTo(cx + hullW / 2, cy - hullH / 2 + glacisH); // Glacis right
    this.armorGraphics.lineTo(cx - hullW / 2, cy - hullH / 2 + glacisH); // Glacis left
    this.armorGraphics.closePath();
    this.armorGraphics.strokePath();

    // === REAR SECTION ===
    this.armorGraphics.lineStyle(3, getDamageColor(damage.rear), 1);
    this.armorGraphics.beginPath();
    this.armorGraphics.moveTo(cx - hullW / 2, cy + hullH / 2 - rearH);
    this.armorGraphics.lineTo(cx + hullW / 2, cy + hullH / 2 - rearH);
    this.armorGraphics.lineTo(cx + hullW / 2 - 7, cy + hullH / 2);
    this.armorGraphics.lineTo(cx - hullW / 2 + 7, cy + hullH / 2);
    this.armorGraphics.closePath();
    this.armorGraphics.strokePath();

    // === LEFT SECTION ===
    this.armorGraphics.lineStyle(3, getDamageColor(damage.left), 1);
    this.armorGraphics.beginPath();
    this.armorGraphics.moveTo(cx - hullW / 2, cy - hullH / 2 + glacisH);
    this.armorGraphics.lineTo(cx - hullW / 2, cy + hullH / 2 - rearH);
    this.armorGraphics.lineTo(cx - hullW / 2 + 11, cy + hullH / 2 - rearH);
    this.armorGraphics.lineTo(cx - hullW / 2 + 11, cy - hullH / 2 + glacisH);
    this.armorGraphics.closePath();
    this.armorGraphics.strokePath();

    // === RIGHT SECTION ===
    this.armorGraphics.lineStyle(3, getDamageColor(damage.right), 1);
    this.armorGraphics.beginPath();
    this.armorGraphics.moveTo(cx + hullW / 2, cy - hullH / 2 + glacisH);
    this.armorGraphics.lineTo(cx + hullW / 2, cy + hullH / 2 - rearH);
    this.armorGraphics.lineTo(cx + hullW / 2 - 11, cy + hullH / 2 - rearH);
    this.armorGraphics.lineTo(cx + hullW / 2 - 11, cy - hullH / 2 + glacisH);
    this.armorGraphics.closePath();
    this.armorGraphics.strokePath();

    // === TURRET (decorative, uses front armor color) ===
    const turretColor = 0x00aa00; // Dimmer green for turret outline
    this.armorGraphics.lineStyle(2, turretColor, 0.8);

    // Turret body - angular wedge shape
    const ty = cy + turretOffsetY;
    this.armorGraphics.beginPath();
    // Rear of turret (wider)
    this.armorGraphics.moveTo(cx - turretW / 2, ty + turretH / 2 - 7);
    this.armorGraphics.lineTo(cx + turretW / 2, ty + turretH / 2 - 7);
    // Bustle (rear extension)
    this.armorGraphics.lineTo(cx + turretW / 2 - 6, ty + turretH / 2 + 7);
    this.armorGraphics.lineTo(cx - turretW / 2 + 6, ty + turretH / 2 + 7);
    this.armorGraphics.closePath();
    this.armorGraphics.strokePath();

    // Turret main body
    this.armorGraphics.beginPath();
    this.armorGraphics.moveTo(cx - turretW / 2, ty + turretH / 2 - 7);
    this.armorGraphics.lineTo(cx - turretW / 2 + 4, ty - turretH / 2 + 11);
    this.armorGraphics.lineTo(cx + turretW / 2 - 4, ty - turretH / 2 + 11);
    this.armorGraphics.lineTo(cx + turretW / 2, ty + turretH / 2 - 7);
    this.armorGraphics.strokePath();

    // Gun mantlet (front of turret)
    this.armorGraphics.beginPath();
    this.armorGraphics.moveTo(cx - turretW / 2 + 4, ty - turretH / 2 + 11);
    this.armorGraphics.lineTo(cx - 11, ty - turretH / 2);
    this.armorGraphics.lineTo(cx + 11, ty - turretH / 2);
    this.armorGraphics.lineTo(cx + turretW / 2 - 4, ty - turretH / 2 + 11);
    this.armorGraphics.strokePath();

    // Gun barrel
    this.armorGraphics.lineStyle(2, turretColor, 0.9);
    this.armorGraphics.strokeRect(
      cx - barrelW / 2,
      ty - turretH / 2 - barrelH,
      barrelW,
      barrelH,
    );
  }

  private drawRadar(
    enemies: Vector3D[],
    playerPos: Vector3D,
    playerRotation: number,
    pickups?: { position: Vector3D; color: number }[],
  ): void {
    const { width, height } = this.scene.cameras.main;
    this.radarGraphics.clear();

    const radarRadius = 100;
    const radarX = width / 2;
    const radarY = height - this.margin - radarRadius - 30;
    const radarRange = 2000; // World units

    // Radar background
    this.radarGraphics.fillStyle(0x001100, 0.8);
    this.radarGraphics.fillCircle(radarX, radarY, radarRadius);

    // Radar border
    this.radarGraphics.lineStyle(2, 0x00ff00, 0.8);
    this.radarGraphics.strokeCircle(radarX, radarY, radarRadius);

    // Cross lines
    this.radarGraphics.lineStyle(1, 0x004400, 0.5);
    this.radarGraphics.beginPath();
    this.radarGraphics.moveTo(radarX - radarRadius, radarY);
    this.radarGraphics.lineTo(radarX + radarRadius, radarY);
    this.radarGraphics.strokePath();
    this.radarGraphics.beginPath();
    this.radarGraphics.moveTo(radarX, radarY - radarRadius);
    this.radarGraphics.lineTo(radarX, radarY + radarRadius);
    this.radarGraphics.strokePath();

    // Range rings
    this.radarGraphics.strokeCircle(radarX, radarY, radarRadius * 0.5);

    // Player dot (center)
    this.radarGraphics.fillStyle(0x00ff00, 1);
    this.radarGraphics.fillCircle(radarX, radarY, 5);

    // Facing indicator (line pointing up = forward)
    this.radarGraphics.lineStyle(2, 0x00ff00, 1);
    this.radarGraphics.beginPath();
    this.radarGraphics.moveTo(radarX, radarY);
    this.radarGraphics.lineTo(radarX, radarY - 18);
    this.radarGraphics.strokePath();

    // Helper to draw a dot at world position
    const drawDot = (worldPos: Vector3D, color: number, size: number) => {
      const dx = worldPos.x - playerPos.x;
      const dz = worldPos.z - playerPos.z;

      const cos = Math.cos(playerRotation);
      const sin = Math.sin(playerRotation);
      const relX = dx * cos - dz * sin;
      const relZ = dx * sin + dz * cos;

      const distance = Math.sqrt(relX * relX + relZ * relZ);
      let radarDist = (distance / radarRange) * radarRadius;

      if (radarDist > radarRadius - 5) {
        radarDist = radarRadius - 5;
      }

      const angle = Math.atan2(relX, -relZ);
      const dotX = radarX + Math.sin(angle) * radarDist;
      const dotY = radarY + Math.cos(angle) * radarDist;

      this.radarGraphics.fillStyle(color, 1);
      this.radarGraphics.fillCircle(dotX, dotY, size);
    };

    // Draw pickups (smaller dots)
    if (pickups) {
      for (const pickup of pickups) {
        drawDot(pickup.position, pickup.color, 4);
      }
    }

    // Draw enemies (larger dots, on top)
    for (const enemy of enemies) {
      drawDot(enemy, 0xff0000, 5);
    }
  }

  private updateAmmo(current: number, max: number, label = "AMMO"): void {
    // For percentage-based display (laser charge)
    if (label === "CHARGE") {
      const percent = Math.round((current / max) * 100);
      this.ammoText.setText(`${label}: ${percent}%`);
    } else {
      this.ammoText.setText(`${label}: ${current}`);
    }

    const ratio = current / max;
    if (ratio === 0) {
      this.ammoText.setColor("#ff0000");
    } else if (ratio < 0.3) {
      this.ammoText.setColor("#ffff00");
    } else {
      this.ammoText.setColor("#00ff00");
    }
  }

  private updateWeaponIndicator(
    weapons: { name: string; selected: boolean }[],
  ): void {
    const { width, height } = this.scene.cameras.main;

    // Clear old weapon texts
    for (const text of this.weaponTexts) {
      text.destroy();
    }
    this.weaponTexts = [];

    // Only show if more than one weapon
    if (weapons.length <= 1) {
      this.weaponLabel.setVisible(false);
      return;
    }

    this.weaponLabel.setVisible(true);

    // Create text for each weapon
    const startY = height - this.margin - 180;
    const lineHeight = 22;

    for (let i = 0; i < weapons.length; i++) {
      const weapon = weapons[i];
      const displayText = weapon.selected
        ? `[${weapon.name}]`
        : ` ${weapon.name} `;
      const color = weapon.selected ? "#00ff00" : "#666666";

      const text = this.scene.add.text(
        width - this.margin,
        startY + i * lineHeight,
        displayText,
        {
          fontFamily: this.fontFamily,
          fontSize: "18px",
          color: color,
        },
      );
      text.setOrigin(1, 0);
      text.setScrollFactor(0);
      text.setDepth(100);

      this.weaponTexts.push(text);
    }
  }

  private updateReload(
    isReloading: boolean,
    progress: number,
    label = "RELOADING",
  ): void {
    const { width, height } = this.scene.cameras.main;

    this.reloadText.setText(label);
    this.reloadText.setVisible(isReloading);
    this.reloadBar.clear();

    if (isReloading) {
      const barWidth = 180;
      const barHeight = 16;
      const barX = width - this.margin - barWidth;
      const barY = height - this.margin - 58;

      // Background
      this.reloadBar.fillStyle(0x222222, 1);
      this.reloadBar.fillRect(barX, barY, barWidth, barHeight);

      // Progress fill
      this.reloadBar.fillStyle(0x00ff00, 1);
      this.reloadBar.fillRect(barX, barY, barWidth * progress, barHeight);

      // Border
      this.reloadBar.lineStyle(2, 0x00ff00, 0.8);
      this.reloadBar.strokeRect(barX, barY, barWidth, barHeight);
    }
  }

  /**
   * Draw cracked windshield effect for final death
   */
  drawCrackedWindshield(impactX?: number, impactY?: number): void {
    if (this.isCracked) return;
    this.isCracked = true;

    const { width, height } = this.scene.cameras.main;

    // Default impact point to center if not provided
    const cx = impactX ?? width / 2;
    const cy = impactY ?? height / 2;

    this.crackedGraphics.clear();
    this.crackedGraphics.setVisible(true);

    // Draw main radial cracks
    const numMainCracks = 12;
    const mainCrackColor = 0x00ff00;

    for (let i = 0; i < numMainCracks; i++) {
      const angle = (i / numMainCracks) * Math.PI * 2 + Math.random() * 0.3;
      const length = 200 + Math.random() * 300;

      this.drawCrackLine(cx, cy, angle, length, mainCrackColor, 2);
    }

    // Draw secondary branching cracks
    const numBranches = 24;
    for (let i = 0; i < numBranches; i++) {
      const startDist = 50 + Math.random() * 150;
      const baseAngle = Math.random() * Math.PI * 2;
      const startX = cx + Math.cos(baseAngle) * startDist;
      const startY = cy + Math.sin(baseAngle) * startDist;

      const branchAngle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.5;
      const length = 50 + Math.random() * 100;

      this.drawCrackLine(
        startX,
        startY,
        branchAngle,
        length,
        mainCrackColor,
        1,
      );
    }

    // Draw spider web rings
    this.crackedGraphics.lineStyle(1, mainCrackColor, 0.4);
    for (let r = 60; r < 250; r += 40 + Math.random() * 30) {
      this.crackedGraphics.beginPath();
      const segments = 16;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const wobble = (Math.random() - 0.5) * 15;
        const x = cx + Math.cos(angle) * (r + wobble);
        const y = cy + Math.sin(angle) * (r + wobble);
        if (i === 0) {
          this.crackedGraphics.moveTo(x, y);
        } else {
          this.crackedGraphics.lineTo(x, y);
        }
      }
      this.crackedGraphics.strokePath();
    }

    // Draw impact point
    this.crackedGraphics.lineStyle(3, mainCrackColor, 1);
    this.crackedGraphics.strokeCircle(cx, cy, 15);
    this.crackedGraphics.strokeCircle(cx, cy, 8);
    this.crackedGraphics.fillStyle(mainCrackColor, 0.3);
    this.crackedGraphics.fillCircle(cx, cy, 20);
  }

  private drawCrackLine(
    x: number,
    y: number,
    angle: number,
    length: number,
    color: number,
    thickness: number,
  ): void {
    this.crackedGraphics.lineStyle(thickness, color, 0.8);
    this.crackedGraphics.beginPath();
    this.crackedGraphics.moveTo(x, y);

    // Draw jagged crack line
    let currentX = x;
    let currentY = y;
    const segments = Math.floor(length / 20);

    for (let i = 0; i < segments; i++) {
      const segLength = 15 + Math.random() * 10;
      const wobble = (Math.random() - 0.5) * 0.4;
      const segAngle = angle + wobble;

      currentX += Math.cos(segAngle) * segLength;
      currentY += Math.sin(segAngle) * segLength;

      this.crackedGraphics.lineTo(currentX, currentY);

      // Occasionally add small branches
      if (Math.random() < 0.3) {
        const branchAngle = segAngle + (Math.random() > 0.5 ? 0.5 : -0.5);
        const branchLen = 10 + Math.random() * 20;
        const branchX = currentX + Math.cos(branchAngle) * branchLen;
        const branchY = currentY + Math.sin(branchAngle) * branchLen;

        this.crackedGraphics.lineTo(branchX, branchY);
        this.crackedGraphics.moveTo(currentX, currentY);
      }
    }

    this.crackedGraphics.strokePath();
  }

  /**
   * Check if windshield is cracked
   */
  isCrackedState(): boolean {
    return this.isCracked;
  }

  /**
   * Reset cracked state (for new game)
   */
  resetCracked(): void {
    this.isCracked = false;
    this.crackedGraphics.clear();
    this.crackedGraphics.setVisible(false);
  }

  destroy(): void {
    this.graphics.destroy();
    this.scoreText.destroy();
    this.waveText.destroy();
    this.speedText.destroy();
    this.positionText.destroy();
    this.armorGraphics.destroy();
    this.armorLabel.destroy();
    this.radarGraphics.destroy();
    this.ammoText.destroy();
    this.reloadText.destroy();
    this.reloadBar.destroy();
    this.weaponLabel.destroy();
    for (const text of this.weaponTexts) {
      text.destroy();
    }
    this.crackedGraphics.destroy();
  }
}
