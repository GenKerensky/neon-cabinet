import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { VectorMode } from "../utils/settings";

interface ChompAngle {
  mouth: number;
}

const CHOMP_ANGLES: ChompAngle[] = [{ mouth: 0 }, { mouth: 30 }, { mouth: 60 }];

const DIR_CENTER_ANGLES: Record<string, number> = {
  right: 0,
  left: Math.PI,
  up: (Math.PI * 3) / 2,
  down: Math.PI / 2,
};

const DEATH_FRAMES: number[] = [
  0, 15, 30, 45, 60, 90, 120, 180, 150, 120, 90, 0,
];

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    this.generatePlayerTextures();
    this.generateGhostTextures();
    this.generateCollectibleTextures();
    this.registerPlayerAnimations();
    this.registerGhostAnimations();
  }

  private generatePlayerTextures(): void {
    const pSize = 32;
    const pCx = pSize / 2;
    const pCy = pSize / 2;
    const pRadius = 14;
    const eyeOffsetX = 6;
    const eyeOffsetY = -6;

    for (const dir of ["right", "left", "up", "down"] as const) {
      const centerAngle = DIR_CENTER_ANGLES[dir];
      for (let frame = 0; frame < CHOMP_ANGLES.length; frame++) {
        const { mouth } = CHOMP_ANGLES[frame];
        const g = this.make.graphics({ x: 0, y: 0 });

        g.fillStyle(0x000000, 1);
        g.fillCircle(pCx, pCy, pRadius);

        g.lineStyle(2, 0xffff00, 1);
        g.beginPath();

        const mouthRad = (mouth * Math.PI) / 180;

        if (mouth === 0) {
          g.arc(pCx, pCy, pRadius, 0, Math.PI * 2, false);
        } else {
          g.arc(
            pCx,
            pCy,
            pRadius,
            centerAngle + mouthRad / 2,
            centerAngle + Math.PI * 2 - mouthRad / 2,
            false,
          );
        }
        g.closePath();
        g.strokePath();

        let eyeX = pCx + eyeOffsetX;
        let eyeY = pCy + eyeOffsetY;
        let pupilX = eyeX + 1;
        let pupilY = eyeY;

        if (dir === "left") {
          eyeX = pCx - eyeOffsetX;
          pupilX = eyeX - 1;
        } else if (dir === "up") {
          eyeX = pCx;
          eyeY = pCy - 10;
          pupilX = eyeX;
          pupilY = eyeY - 1;
        } else if (dir === "down") {
          eyeX = pCx;
          eyeY = pCy - 2;
          pupilX = eyeX;
          pupilY = eyeY + 1;
        }

        g.fillStyle(0xffffff, 1);
        g.fillCircle(eyeX, eyeY, 3);
        g.fillStyle(0x0000ff, 1);
        g.fillCircle(pupilX, pupilY, 1.5);

        const key = `player_${dir}_${frame}`;
        g.generateTexture(key, pSize, pSize);
        g.destroy();
      }
    }

    for (let frame = 0; frame < DEATH_FRAMES.length; frame++) {
      const g = this.make.graphics({ x: 0, y: 0 });
      const mouthDeg = DEATH_FRAMES[frame];
      const mouthRad = (mouthDeg * Math.PI) / 180;
      const startRad = -mouthRad / 2;

      g.fillStyle(0xffff00, 1);
      if (mouthDeg === 0) {
        g.fillCircle(pCx, pCy, 4);
      } else {
        g.beginPath();
        g.arc(
          pCx,
          pCy,
          pRadius,
          startRad + Math.PI,
          startRad + Math.PI + (Math.PI * 2 - mouthRad),
          false,
        );
        g.closePath();
        g.fillPath();
      }

      const key = `player_death_${frame}`;
      g.generateTexture(key, pSize, pSize);
      g.destroy();
    }
  }

  private generateGhostTextures(): void {
    const enemyColors = [
      { name: "chaser", color: 0xff0000 },
      { name: "ambusher", color: 0xff69b4 },
      { name: "wanderer", color: 0x00ffff },
      { name: "timid", color: 0xff8800 },
    ];

    const ghostSize = 32;
    const gCx = ghostSize / 2;
    const gTop = 6;
    const gBot = 26;

    for (const { name, color } of enemyColors) {
      for (const dir of ["right", "left", "up", "down"] as const) {
        for (let frame = 0; frame < 2; frame++) {
          const g = this.make.graphics({ x: 0, y: 0 });

          const footY1 = frame === 0 ? gBot : gBot - 4;
          const footY2 = frame === 0 ? gBot - 4 : gBot;

          g.fillStyle(0x000000, 1);
          g.beginPath();
          g.arc(gCx, gTop + 4, 12, Math.PI, 0, false);
          g.lineTo(gCx + 12, footY1);
          g.lineTo(gCx + 8, footY2);
          g.lineTo(gCx + 4, footY1);
          g.lineTo(gCx, footY2);
          g.lineTo(gCx - 4, footY1);
          g.lineTo(gCx - 8, footY2);
          g.lineTo(gCx - 12, footY1);
          g.closePath();
          g.fillPath();

          g.lineStyle(2, color, 1);
          g.beginPath();
          g.arc(gCx, gTop + 4, 12, Math.PI, 0, false);
          g.lineTo(gCx + 12, footY1);
          g.lineTo(gCx + 8, footY2);
          g.lineTo(gCx + 4, footY1);
          g.lineTo(gCx, footY2);
          g.lineTo(gCx - 4, footY1);
          g.lineTo(gCx - 8, footY2);
          g.lineTo(gCx - 12, footY1);
          g.closePath();
          g.strokePath();

          const eyeOffsetX = dir === "left" ? -2 : dir === "right" ? 2 : 0;
          const eyeOffsetY = dir === "up" ? -1 : dir === "down" ? 1 : 0;

          g.fillStyle(0xffffff, 1);
          g.fillCircle(gCx - 5 + eyeOffsetX, gTop + 6 + eyeOffsetY, 4);
          g.fillCircle(gCx + 5 + eyeOffsetX, gTop + 6 + eyeOffsetY, 4);
          g.fillStyle(0x0000ff, 1);
          g.fillCircle(gCx - 3 + eyeOffsetX * 2, gTop + 6 + eyeOffsetY, 2);
          g.fillCircle(gCx + 7 + eyeOffsetX * 2, gTop + 6 + eyeOffsetY, 2);

          const key = `${name}_${dir}_${frame}`;
          g.generateTexture(key, ghostSize, ghostSize);
          g.destroy();
        }
      }

      const vulnG = this.make.graphics({ x: 0, y: 0 });
      vulnG.fillStyle(0x000000, 1);
      vulnG.beginPath();
      vulnG.arc(gCx, gTop + 4, 12, Math.PI, 0, false);
      vulnG.lineTo(gCx + 12, gBot - 2);
      vulnG.lineTo(gCx + 8, gBot);
      vulnG.lineTo(gCx + 5, gBot - 4);
      vulnG.lineTo(gCx + 2, gBot);
      vulnG.lineTo(gCx - 2, gBot - 4);
      vulnG.lineTo(gCx - 5, gBot);
      vulnG.lineTo(gCx - 8, gBot - 4);
      vulnG.lineTo(gCx - 12, gBot - 2);
      vulnG.closePath();
      vulnG.fillPath();

      vulnG.lineStyle(2, 0x0000ff, 1);
      vulnG.beginPath();
      vulnG.arc(gCx, gTop + 4, 12, Math.PI, 0, false);
      vulnG.lineTo(gCx + 12, gBot - 2);
      vulnG.lineTo(gCx + 8, gBot);
      vulnG.lineTo(gCx + 5, gBot - 4);
      vulnG.lineTo(gCx + 2, gBot);
      vulnG.lineTo(gCx - 2, gBot - 4);
      vulnG.lineTo(gCx - 5, gBot);
      vulnG.lineTo(gCx - 8, gBot - 4);
      vulnG.lineTo(gCx - 12, gBot - 2);
      vulnG.closePath();
      vulnG.strokePath();

      vulnG.fillStyle(0xffffff, 1);
      vulnG.fillCircle(gCx - 5, gTop + 6, 4);
      vulnG.fillCircle(gCx + 5, gTop + 6, 4);
      vulnG.fillStyle(0x0000ff, 1);
      vulnG.fillCircle(gCx - 3, gTop + 6, 2);
      vulnG.fillCircle(gCx + 7, gTop + 6, 2);

      vulnG.generateTexture(`${name}_vulnerable`, ghostSize, ghostSize);
      vulnG.destroy();

      for (const dir of ["right", "left", "up", "down"] as const) {
        const eG = this.make.graphics({ x: 0, y: 0 });
        const eyeOffsetX = dir === "left" ? -4 : dir === "right" ? 4 : 0;
        const eyeOffsetY = dir === "up" ? -2 : dir === "down" ? 2 : 0;

        eG.fillStyle(0xffffff, 1);
        eG.fillCircle(gCx - 5 + eyeOffsetX, gTop + 6 + eyeOffsetY, 5);
        eG.fillCircle(gCx + 5 + eyeOffsetX, gTop + 6 + eyeOffsetY, 5);
        eG.fillStyle(0x0000ff, 1);
        eG.fillCircle(gCx - 3 + eyeOffsetX * 2, gTop + 6 + eyeOffsetY, 3);
        eG.fillCircle(gCx + 7 + eyeOffsetX * 2, gTop + 6 + eyeOffsetY, 3);

        const key = `${name}_eyes_${dir}`;
        eG.generateTexture(key, ghostSize, ghostSize);
        eG.destroy();
      }
    }
  }

  private generateCollectibleTextures(): void {
    const dotG = this.make.graphics({ x: 0, y: 0 });
    dotG.fillStyle(0xffffcc, 1);
    dotG.fillCircle(3, 3, 2);
    dotG.generateTexture("dot", 6, 6);
    dotG.destroy();

    const ppG = this.make.graphics({ x: 0, y: 0 });
    ppG.fillStyle(0xffffcc, 1);
    ppG.fillCircle(8, 8, 6);
    ppG.lineStyle(1, 0xffffff, 0.8);
    ppG.strokeCircle(8, 8, 6);
    ppG.generateTexture("power_pellet", 16, 16);
    ppG.destroy();

    const bonusG = this.make.graphics({ x: 0, y: 0 });
    const bSize = 32;
    const bCx = bSize / 2;
    const bCy = bSize / 2 + 2;

    bonusG.fillStyle(0x000000, 1);
    bonusG.fillCircle(bCx, bCy, 12);

    bonusG.fillStyle(0xff0000, 1);
    bonusG.fillCircle(bCx, bCy, 10);

    bonusG.lineStyle(2, 0x00ff00, 1);
    bonusG.lineBetween(bCx, bCy - 10, bCx + 2, bCy - 15);

    bonusG.fillStyle(0x00ff00, 1);
    bonusG.fillCircle(bCx + 4, bCy - 14, 3);

    bonusG.fillStyle(0xff8888, 1);
    bonusG.fillCircle(bCx - 3, bCy - 4, 3);

    bonusG.generateTexture("bonus_item", bSize, bSize);
    bonusG.destroy();

    const wallG = this.make.graphics({ x: 0, y: 0 });
    wallG.lineStyle(2, 0x0000ff, 1);
    wallG.lineBetween(0, 15, 30, 15);
    wallG.lineStyle(1, 0x4444ff, 0.5);
    wallG.lineBetween(0, 13, 30, 13);
    wallG.lineBetween(0, 17, 30, 17);
    wallG.generateTexture("wall_h", 30, 30);
    wallG.destroy();

    const wallVG = this.make.graphics({ x: 0, y: 0 });
    wallVG.lineStyle(2, 0x0000ff, 1);
    wallVG.lineBetween(15, 0, 15, 30);
    wallVG.lineStyle(1, 0x4444ff, 0.5);
    wallVG.lineBetween(13, 0, 13, 30);
    wallVG.lineBetween(17, 0, 17, 30);
    wallVG.generateTexture("wall_v", 30, 30);
    wallVG.destroy();
  }

  private registerPlayerAnimations(): void {
    const dirs = ["right", "left", "up", "down"] as const;
    const frameRate = 10;

    for (const dir of dirs) {
      const frames = [`player_${dir}_0`, `player_${dir}_1`, `player_${dir}_2`];
      this.anims.create({
        key: `player_chomp_${dir}`,
        frames: frames.map((f) => ({ key: f })),
        frameRate,
        repeat: -1,
      });
    }

    const deathFrames = DEATH_FRAMES.map((_, i) => ({
      key: `player_death_${i}`,
    }));
    this.anims.create({
      key: "player_death",
      frames: deathFrames,
      frameRate: 10,
      repeat: 0,
    });
  }

  private registerGhostAnimations(): void {
    const enemyNames = ["chaser", "ambusher", "wanderer", "timid"];
    const dirs = ["right", "left", "up", "down"] as const;

    for (const name of enemyNames) {
      for (const dir of dirs) {
        const frames = [`${name}_${dir}_0`, `${name}_${dir}_1`];
        this.anims.create({
          key: `${name}_walk_${dir}`,
          frames: frames.map((f) => ({ key: f })),
          frameRate: 8,
          repeat: -1,
        });
      }

      this.anims.create({
        key: `${name}_vulnerable`,
        frames: [{ key: `${name}_vulnerable` }],
        frameRate: 1,
        repeat: -1,
      });

      for (const dir of dirs) {
        this.anims.create({
          key: `${name}_eyes_${dir}`,
          frames: [{ key: `${name}_eyes_${dir}` }],
          frameRate: 1,
          repeat: -1,
        });
      }
    }
  }

  create(): void {
    this.cameras.main.setPostPipeline("VectorShader");
    const fontFamily = (this.game.config as { customFontFamily?: string })
      .customFontFamily;
    if (fontFamily) this.registry.set("fontFamily", fontFamily);

    if (this.registry.get("vectorMode") === undefined) {
      this.registry.set("vectorMode", VectorMode.COLOR);
    }

    EventBus.emit("current-scene-ready", this);
    this.scene.start("Title");
  }
}
