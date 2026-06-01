import { Scene } from "phaser";
import { VectorPuppet, SVGParser } from "@neon-cabinet/sprite-tools";
import { EventBus } from "../EventBus";
import {
  buildGhostGameOverCopy,
  getGhostDefinitionById,
} from "../config/ghostDefinitions";
import { formatScore, readHighScore, writeHighScore } from "../utils/highScore";
import { fadeInScene, startSceneWithFade } from "../utils/sceneTransitions";

interface GameOverPayload {
  score?: number;
  killerGhostId?: string;
}

interface KillerPresentation {
  killerGhostId?: string;
  killerHeadline: string;
  killerSubline: string;
  killerSvgCacheKey?: string;
}

export function resolveGameOverKillerPresentation(
  payload?: GameOverPayload,
): KillerPresentation {
  const definition = payload?.killerGhostId
    ? getGhostDefinitionById(payload.killerGhostId)
    : undefined;

  if (!definition) {
    return {
      killerGhostId: payload?.killerGhostId,
      killerHeadline: "Caught by a Ghost!",
      killerSubline: "The maze always wants one more run.",
      killerSvgCacheKey: undefined,
    };
  }

  const copy = buildGhostGameOverCopy(definition);
  return {
    killerGhostId: definition.id,
    killerHeadline: copy.headline,
    killerSubline: copy.subline,
    killerSvgCacheKey: definition.svgCacheKey,
  };
}

export class GameOver extends Scene {
  private finalScore = 0;
  private killerPresentation: KillerPresentation =
    resolveGameOverKillerPresentation();

  constructor() {
    super("GameOver");
  }

  init(args: GameOverPayload): void {
    this.finalScore = args?.score ?? 0;
    this.killerPresentation = resolveGameOverKillerPresentation(args);
  }

  create(): void {
    this.cameras.main.setPostPipeline("VectorShader");
    fadeInScene(this);
    this.sound?.play?.("maze_runner_game_over", { volume: 0.7 });
    const { width, height } = this.cameras.main;
    const fontFamily =
      (this.registry.get("fontFamily") as string) ?? "Orbitron";

    // Overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

    // Game Over title
    const title = this.add
      .text(width / 2, height * 0.25, "GAME OVER", {
        fontFamily,
        fontSize: "48px",
        color: "#ff0000",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Score
    this.add
      .text(width / 2, height * 0.4, `FINAL SCORE: ${this.finalScore}`, {
        fontFamily,
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const killerHeaderY = height * 0.55;
    this.add
      .text(width / 2, killerHeaderY, this.killerPresentation.killerHeadline, {
        fontFamily,
        fontSize: "20px",
        color: "#ff99cc",
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        killerHeaderY + 30,
        this.killerPresentation.killerSubline,
        {
          fontFamily,
          fontSize: "14px",
          color: "#cccccc",
        },
      )
      .setOrigin(0.5);

    const killerSvg = this.killerPresentation.killerSvgCacheKey
      ? this.cache.text.get(this.killerPresentation.killerSvgCacheKey)
      : undefined;
    if (killerSvg) {
      const metadata = new SVGParser().parse(killerSvg);
      const killerPuppet = new VectorPuppet(
        this,
        width / 2,
        height * 0.66,
        metadata,
      );
      killerPuppet.setScale(2.1);
      killerPuppet.setDirection?.("RIGHT");
      this.events?.on?.("update", (time: number, delta: number) => {
        killerPuppet.update(time, delta);
      });
      this.tweens.add({
        targets: killerPuppet,
        y: height * 0.66 - 12,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }

    // High score
    const previousHighScore = readHighScore(this.registry);

    if (this.finalScore > previousHighScore) {
      const newHighScore = writeHighScore(this.finalScore, this.registry);

      const newHighScoreText = this.add
        .text(width / 2, height * 0.74, "NEW HIGH SCORE!", {
          fontFamily,
          fontSize: "18px",
          color: "#ffff00",
        })
        .setOrigin(0.5);

      this.tweens.add({
        targets: newHighScoreText,
        alpha: 0.3,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });

      this.add
        .text(
          width / 2,
          height * 0.79,
          `HIGH SCORE: ${formatScore(newHighScore)}`,
          {
            fontFamily,
            fontSize: "18px",
            color: "#aaaaaa",
          },
        )
        .setOrigin(0.5);
    } else {
      this.add
        .text(
          width / 2,
          height * 0.74,
          `HIGH SCORE: ${formatScore(previousHighScore)}`,
          {
            fontFamily,
            fontSize: "18px",
            color: "#aaaaaa",
          },
        )
        .setOrigin(0.5);
    }

    // Restart prompt
    const restartText = this.add
      .text(width / 2, height * 0.87, "PRESS SPACE TO RESTART", {
        fontFamily,
        fontSize: "18px",
        color: "#00ffff",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Menu prompt
    this.add
      .text(width / 2, height * 0.93, "PRESS M FOR MENU", {
        fontFamily,
        fontSize: "14px",
        color: "#888888",
      })
      .setOrigin(0.5);

    // Key listeners
    this.input.keyboard?.on("keydown-SPACE", () => {
      startSceneWithFade(this, "Game", undefined, {
        stop: ["Game", "GameOver"],
      });
    });

    this.input.keyboard?.on("keydown-M", () => {
      startSceneWithFade(this, "Title", undefined, {
        stop: ["Game", "GameOver"],
      });
    });

    EventBus.emit("current-scene-ready", this);
  }
}
