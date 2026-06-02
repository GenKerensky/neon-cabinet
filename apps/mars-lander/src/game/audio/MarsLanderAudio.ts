import { Sound, type Scene } from "phaser";
import {
  createLoopingPatch,
  MARS_LANDER_AUDIO_PATCH_BY_ID,
  type PatchInstance,
} from "@neon-cabinet/audio-tools";

type MarsLanderAudioKey =
  | "gearDeploy"
  | "touchdown"
  | "levelCleared"
  | "crashExplosion"
  | "gameOver"
  | "start"
  | "pause"
  | "resume"
  | "lowFuel"
  | "titlePlaceholder";

const AUDIO_FILES: Record<MarsLanderAudioKey, { key: string; path: string }> = {
  gearDeploy: {
    key: "mars_lander_gear_deploy",
    path: "assets/audio/gear-deploy.wav",
  },
  touchdown: {
    key: "mars_lander_touchdown",
    path: "assets/audio/touchdown.wav",
  },
  levelCleared: {
    key: "mars_lander_level_cleared",
    path: "assets/audio/level-cleared.wav",
  },
  crashExplosion: {
    key: "mars_lander_crash_explosion",
    path: "assets/audio/crash-explosion.wav",
  },
  gameOver: {
    key: "mars_lander_game_over",
    path: "assets/audio/game-over.wav",
  },
  start: {
    key: "mars_lander_start",
    path: "assets/audio/start.wav",
  },
  pause: {
    key: "mars_lander_pause",
    path: "assets/audio/pause.wav",
  },
  resume: {
    key: "mars_lander_resume",
    path: "assets/audio/resume.wav",
  },
  lowFuel: {
    key: "mars_lander_low_fuel",
    path: "assets/audio/low-fuel.wav",
  },
  titlePlaceholder: {
    key: "mars_lander_title_placeholder",
    path: "assets/audio/title-placeholder.wav",
  },
};

export class MarsLanderAudio {
  private static audioContext: AudioContext | undefined;
  private static unlocked = false;

  private thrustLoop: PatchInstance | undefined;
  private titleLoop:
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound
    | Phaser.Sound.WebAudioSound
    | undefined;
  private lowFuelArmed = true;

  constructor(private scene: Scene) {
    this.installUnlockHandlers();
  }

  static preload(scene: Scene, assetPath: (path: string) => string): void {
    for (const { key, path } of Object.values(AUDIO_FILES)) {
      scene.load.audio(key, assetPath(path));
    }
  }

  updateThrust(options: {
    active: boolean;
    fuelPercent: number;
    x: number;
    worldWidth: number;
  }): void {
    if (!options.active || options.fuelPercent <= 0) {
      this.stopThrustLoop();
      return;
    }

    const audioContext = MarsLanderAudio.getAudioContext();
    if (!audioContext) return;

    const intensity = Math.min(1, Math.max(0.2, options.fuelPercent / 100));
    const pan =
      Math.min(1, Math.max(0, options.x / options.worldWidth)) * 2 - 1;

    if (!this.thrustLoop) {
      this.thrustLoop = createLoopingPatch(
        audioContext,
        MARS_LANDER_AUDIO_PATCH_BY_ID["mars-lander-thrust-loop"],
        { intensity, pan },
      );
    } else {
      this.thrustLoop.updateContext({ intensity, pan });
    }
  }

  stopThrustLoop(): void {
    this.thrustLoop?.stop();
    this.thrustLoop = undefined;
  }

  playGearDeploy(): void {
    this.playOneShot("gearDeploy", 0.62);
  }

  playTouchdown(): void {
    this.playOneShot("touchdown", 0.7);
  }

  playLevelCleared(): void {
    this.playOneShot("levelCleared", 0.76);
  }

  playCrashExplosion(): void {
    this.playOneShot("crashExplosion", 0.88);
  }

  playGameOver(): void {
    this.playOneShot("gameOver", 0.8);
  }

  playStart(): void {
    this.playOneShot("start", 0.72);
  }

  playPause(): void {
    this.playOneShot("pause", 0.58);
  }

  playResume(): void {
    this.playOneShot("resume", 0.62);
  }

  playLowFuel(): void {
    if (!this.lowFuelArmed) return;
    this.lowFuelArmed = false;
    this.playOneShot("lowFuel", 0.68);
  }

  resetLowFuelWarning(): void {
    this.lowFuelArmed = true;
  }

  playTitlePlaceholder(): void {
    const { key } = AUDIO_FILES.titlePlaceholder;
    if (this.titleLoop || !this.hasAudio(key)) return;

    if ((this.scene.sound as Sound.WebAudioSoundManager).locked) {
      this.scene.sound.once("unlocked", () => {
        this.playTitlePlaceholder();
      });
      return;
    }

    this.titleLoop = this.scene.sound.add(key, {
      loop: true,
      volume: 0.36,
    });
    this.titleLoop.play();
  }

  stopTitlePlaceholder(): void {
    this.titleLoop?.stop();
    this.titleLoop?.destroy();
    this.titleLoop = undefined;
  }

  destroy(): void {
    this.stopThrustLoop();
    this.stopTitlePlaceholder();
  }

  private playOneShot(audioKey: MarsLanderAudioKey, volume: number): void {
    const { key } = AUDIO_FILES[audioKey];
    if (!this.hasAudio(key)) return;
    this.scene.sound.play(key, { volume });
  }

  private hasAudio(key: string): boolean {
    return this.scene.cache.audio.exists(key);
  }

  private installUnlockHandlers(): void {
    const unlock = () => {
      const audioContext = MarsLanderAudio.getAudioContext();
      void audioContext?.resume();
      MarsLanderAudio.unlocked = true;
    };

    if (MarsLanderAudio.unlocked) return;
    this.scene.input.keyboard?.once("keydown", unlock);
    this.scene.input.once("pointerdown", unlock);
  }

  private static getAudioContext(): AudioContext | undefined {
    if (typeof window === "undefined") return undefined;

    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextConstructor) return undefined;
    MarsLanderAudio.audioContext ??= new AudioContextConstructor();
    return MarsLanderAudio.audioContext;
  }
}
