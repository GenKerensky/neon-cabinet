import {
  createLoopingPatch,
  getAudioStudioGameById,
  playPatchOnce,
} from "@neon-cabinet/audio-tools";
import type {
  PatchInstance,
  PatchPreviewContext,
  SoundPatch,
} from "@neon-cabinet/audio-tools";

export const SPACE_DEFENDER_AUDIO_IDS = {
  thrustLoop: "space-defender-thrust-loop",
  autocannon: "space-defender-autocannon",
  laser: "space-defender-laser",
  rayGun: "space-defender-ray-gun",
  missileLaunch: "space-defender-missile-launch",
  missileDetonation: "space-defender-missile-detonation",
  asteroidHit: "space-defender-asteroid-hit",
  asteroidDestruction: "space-defender-asteroid-destruction",
  shipCollision: "space-defender-ship-collision",
  shipDestruction: "space-defender-ship-destruction",
  gameStart: "space-defender-game-start",
  pause: "space-defender-pause",
  weaponSwitch: "space-defender-weapon-switch",
  weaponUnlock: "space-defender-weapon-unlock",
  waveClear: "space-defender-wave-clear",
  gameOver: "space-defender-game-over",
  titlePlaceholder: "space-defender-title-placeholder",
} as const;

type SpaceDefenderAudioId =
  (typeof SPACE_DEFENDER_AUDIO_IDS)[keyof typeof SPACE_DEFENDER_AUDIO_IDS];

const gameRegistration = getAudioStudioGameById("space-defender");
const patchesById = new Map<string, SoundPatch>(
  (gameRegistration?.effects ?? []).map((patch) => [patch.id, patch]),
);

export class SpaceDefenderAudio {
  private context?: AudioContext;
  private thrust?: PatchInstance;

  playWeapon(weaponName: string, context?: PatchPreviewContext): void {
    switch (weaponName) {
      case "AUTOCANNON":
        this.play(SPACE_DEFENDER_AUDIO_IDS.autocannon, context);
        break;
      case "LASER":
        this.play(SPACE_DEFENDER_AUDIO_IDS.laser, context);
        break;
      case "MISSILE":
        this.play(SPACE_DEFENDER_AUDIO_IDS.missileLaunch, context);
        break;
      case "RAY GUN":
        this.play(SPACE_DEFENDER_AUDIO_IDS.rayGun, context);
        break;
    }
  }

  playGameStart(): void {
    this.play(SPACE_DEFENDER_AUDIO_IDS.gameStart);
  }

  playPause(): void {
    this.play(SPACE_DEFENDER_AUDIO_IDS.pause, { intensity: 0.75 });
  }

  playWeaponSwitch(): void {
    this.play(SPACE_DEFENDER_AUDIO_IDS.weaponSwitch, { intensity: 0.85 });
  }

  playWeaponUnlock(): void {
    this.play(SPACE_DEFENDER_AUDIO_IDS.weaponUnlock);
  }

  playAsteroidHit(context?: PatchPreviewContext): void {
    this.play(SPACE_DEFENDER_AUDIO_IDS.asteroidHit, context);
  }

  playAsteroidDestruction(context?: PatchPreviewContext): void {
    this.play(SPACE_DEFENDER_AUDIO_IDS.asteroidDestruction, context);
  }

  playMissileDetonation(context?: PatchPreviewContext): void {
    this.play(SPACE_DEFENDER_AUDIO_IDS.missileDetonation, context);
  }

  playShipCollision(): void {
    this.play(SPACE_DEFENDER_AUDIO_IDS.shipCollision);
  }

  playShipDestruction(): void {
    this.play(SPACE_DEFENDER_AUDIO_IDS.shipDestruction);
  }

  playWaveClear(): void {
    this.play(SPACE_DEFENDER_AUDIO_IDS.waveClear);
  }

  playGameOver(): void {
    this.play(SPACE_DEFENDER_AUDIO_IDS.gameOver);
  }

  playTitlePlaceholder(): void {
    this.play(SPACE_DEFENDER_AUDIO_IDS.titlePlaceholder, { intensity: 0.6 });
  }

  updateThrust(intensity: number, pan: number): void {
    const patch = patchesById.get(SPACE_DEFENDER_AUDIO_IDS.thrustLoop);
    const audioContext = this.ensureContext();
    if (!patch || !audioContext) return;

    const normalizedIntensity = Math.max(0, Math.min(1, intensity));
    if (normalizedIntensity <= 0.01) {
      this.thrust?.updateContext({ intensity: 0.0001, pan });
      return;
    }

    if (!this.thrust) {
      this.thrust = createLoopingPatch(audioContext, patch, {
        intensity: normalizedIntensity,
        pan,
        distance: 0,
      });
    } else {
      this.thrust.updateContext({
        intensity: normalizedIntensity,
        pan,
        distance: 0,
      });
    }
  }

  stopThrust(): void {
    this.thrust?.stop();
    this.thrust = undefined;
  }

  destroy(): void {
    this.stopThrust();
  }

  private play(
    id: SpaceDefenderAudioId,
    context: PatchPreviewContext = {},
  ): void {
    const patch = patchesById.get(id);
    const audioContext = this.ensureContext();
    if (!patch || !audioContext) return;

    void playPatchOnce(audioContext, patch, context).catch(() => {
      // Browser audio policies can reject until the first user gesture.
    });
  }

  private ensureContext(): AudioContext | undefined {
    if (typeof window === "undefined") return undefined;
    if (!this.context) {
      const windowWithWebkit = window as unknown as {
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextCtor =
        window.AudioContext ?? windowWithWebkit.webkitAudioContext;
      if (!AudioContextCtor) return undefined;
      this.context = new AudioContextCtor();
    }

    if (this.context.state === "suspended") {
      void this.context.resume().catch(() => undefined);
    }

    return this.context;
  }
}
