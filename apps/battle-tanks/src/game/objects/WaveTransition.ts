import type { GameObjects, Scene } from "phaser";

export type TransitionState =
  | "idle"
  | "wave_complete"
  | "countdown"
  | "wave_start";

/**
 * Dramatic wave transition overlay with countdown
 */
export class WaveTransition {
  private scene: Scene;
  private state: TransitionState = "idle";
  private stateTimer = 0;
  private waveNumber = 0;
  private countdownValue = 3;

  private container!: GameObjects.Container;
  private mainText!: GameObjects.Text;
  private subText!: GameObjects.Text;

  private fontFamily: string;
  private onComplete?: () => void;

  // Timing (ms)
  private readonly waveCompleteDuration = 1500;
  private readonly countdownInterval = 1000;
  private readonly waveStartDuration = 1500;

  constructor(scene: Scene) {
    this.scene = scene;
    this.fontFamily =
      (scene.registry.get("fontFamily") as string) || "Orbitron, monospace";

    this.createElements();
  }

  private createElements(): void {
    const { width, height } = this.scene.cameras.main;

    this.container = this.scene.add.container(width / 2, height / 2);
    this.container.setDepth(200);
    this.container.setVisible(false);

    this.mainText = this.scene.add.text(0, -30, "", {
      fontFamily: this.fontFamily,
      fontSize: "64px",
      color: "#00ff00",
      stroke: "#004400",
      strokeThickness: 4,
    });
    this.mainText.setOrigin(0.5);

    this.subText = this.scene.add.text(0, 40, "", {
      fontFamily: this.fontFamily,
      fontSize: "24px",
      color: "#00aa00",
    });
    this.subText.setOrigin(0.5);

    this.container.add([this.mainText, this.subText]);
  }

  /**
   * Start wave complete -> countdown -> wave start transition
   */
  startTransition(waveNumber: number, onComplete: () => void): void {
    this.waveNumber = waveNumber;
    this.onComplete = onComplete;

    this.showWaveComplete();
  }

  private showWaveComplete(): void {
    this.state = "wave_complete";
    this.stateTimer = 0;

    this.mainText.setText("WAVE CLEARED");
    this.mainText.setFontSize(48);
    this.mainText.setColor("#00ff00");
    this.subText.setText(`+${this.waveNumber * 100} BONUS`);
    this.subText.setAlpha(1);

    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.container.setScale(0.5);

    // Animate in
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
    });
  }

  private showCountdown(): void {
    this.state = "countdown";
    this.stateTimer = 0;
    this.countdownValue = 3;

    this.mainText.setText("3");
    this.mainText.setFontSize(96);
    this.mainText.setColor("#ffff00");
    this.subText.setText("GET READY");
    this.subText.setAlpha(0.7);

    this.animateCountdownNumber();
  }

  private animateCountdownNumber(): void {
    // Pulse animation for countdown number
    this.mainText.setScale(1.5);
    this.scene.tweens.add({
      targets: this.mainText,
      scale: 1,
      duration: 200,
      ease: "Quad.easeOut",
    });
  }

  private showWaveStart(): void {
    this.state = "wave_start";
    this.stateTimer = 0;

    this.mainText.setText(`WAVE ${this.waveNumber + 1}`);
    this.mainText.setFontSize(72);
    this.mainText.setColor("#00ff00");
    this.subText.setText("FIGHT!");
    this.subText.setAlpha(1);

    // Scale in animation
    this.container.setScale(0.3);
    this.scene.tweens.add({
      targets: this.container,
      scale: 1.2,
      duration: 200,
      ease: "Back.easeOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.container,
          scale: 1,
          duration: 100,
        });
      },
    });
  }

  private hideAndComplete(): void {
    // Immediately set to idle to prevent multiple calls
    this.state = "idle";

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      ease: "Quad.easeIn",
      onComplete: () => {
        this.container.setVisible(false);
        if (this.onComplete) {
          this.onComplete();
        }
      },
    });
  }

  /**
   * Update transition state
   */
  update(delta: number): void {
    if (this.state === "idle") return;

    this.stateTimer += delta;

    switch (this.state) {
      case "wave_complete":
        if (this.stateTimer >= this.waveCompleteDuration) {
          this.showCountdown();
        }
        break;

      case "countdown":
        if (this.stateTimer >= this.countdownInterval) {
          this.stateTimer = 0;
          this.countdownValue--;

          if (this.countdownValue > 0) {
            this.mainText.setText(this.countdownValue.toString());
            this.animateCountdownNumber();
          } else {
            this.showWaveStart();
          }
        }
        break;

      case "wave_start":
        if (this.stateTimer >= this.waveStartDuration) {
          this.hideAndComplete();
        }
        break;
    }
  }

  /**
   * Check if transition is active
   */
  isActive(): boolean {
    return this.state !== "idle";
  }

  /**
   * Get current state
   */
  getState(): TransitionState {
    return this.state;
  }

  /**
   * Quick start for first wave (no "wave complete")
   */
  startFirstWave(onComplete: () => void): void {
    this.waveNumber = 0;
    this.onComplete = onComplete;

    this.state = "wave_start";
    this.stateTimer = 0;

    this.mainText.setText("WAVE 1");
    this.mainText.setFontSize(72);
    this.mainText.setColor("#00ff00");
    this.subText.setText("BATTLE STATIONS!");
    this.subText.setAlpha(1);

    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.container.setScale(0.3);

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: "Back.easeOut",
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
