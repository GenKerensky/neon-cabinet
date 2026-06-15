import {
  BATTLE_TANKS_AUDIO_PATCH_BY_ID,
  PatchInstance,
  createLoopingPatch,
  playPatchOnce,
} from "@neon-cabinet/audio-tools";
import { Scene, Sound } from "phaser";
import { Vector3D } from "../engine/Vector3D";
import { Enemy } from "../objects/EnemyManager";

type WeaponSound = "autocannon" | "laser";

const PATCHES = {
  playerRumble: BATTLE_TANKS_AUDIO_PATCH_BY_ID["battle-tanks-player-rumble"],
  enemyRumble: BATTLE_TANKS_AUDIO_PATCH_BY_ID["battle-tanks-enemy-rumble"],
  cannonBang: BATTLE_TANKS_AUDIO_PATCH_BY_ID["battle-tanks-cannon-bang"],
  impactCrunch: BATTLE_TANKS_AUDIO_PATCH_BY_ID["battle-tanks-impact-crunch"],
  explosion: BATTLE_TANKS_AUDIO_PATCH_BY_ID["battle-tanks-explosion"],
  digitalTaps: BATTLE_TANKS_AUDIO_PATCH_BY_ID["battle-tanks-digital-taps"],
};

export class BattleAudio {
  private static sharedContext?: AudioContext;

  private readonly scene: Scene;
  private playerRumble?: PatchInstance;
  private enemyRumbles = new WeakMap<object, PatchInstance>();
  private activeEnemyRumbles = new Set<object>();
  private titleMusic?: Sound.BaseSound;

  constructor(scene: Scene) {
    this.scene = scene;
    this.installUnlockHandlers();
  }

  preload(): void {
    this.scene.load.audio("titleMusic", ["audio/Ludum Dare 30 08.ogg"]);
  }

  playTitleMusic(): void {
    if (this.titleMusic?.isPlaying) return;

    this.titleMusic = this.scene.sound.add("titleMusic", {
      loop: true,
      volume: 0.45,
    });
    this.titleMusic.play();

    if ((this.scene.sound as Sound.WebAudioSoundManager).locked) {
      this.scene.sound.once("unlocked", () => {
        if (!this.titleMusic?.isPlaying) this.titleMusic?.play();
      });
    }
  }

  stopTitleMusic(): void {
    this.titleMusic?.stop();
    this.titleMusic?.destroy();
    this.titleMusic = undefined;
  }

  updatePlayerRumble(velocity: number): void {
    const speed = Math.min(1, Math.abs(velocity) / 150);
    const intensity = speed > 0.02 ? 0.38 + speed * 0.62 : 0;
    this.getPlayerRumble().updateContext({ intensity, pan: 0, distance: 0 });
  }

  updateEnemyTanks(
    enemies: readonly Enemy[],
    playerPosition: Vector3D,
    playerRotation: number,
  ): void {
    const present = new Set<object>();

    for (const enemy of enemies) {
      if (enemy.type !== "tank" || !enemy.isAlive()) continue;

      present.add(enemy);
      const dx = enemy.position.x - playerPosition.x;
      const dz = enemy.position.z - playerPosition.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz) - playerRotation;
      const pan = Math.max(-1, Math.min(1, Math.sin(angle)));

      this.getEnemyRumble(enemy).updateContext({
        distance,
        intensity: 1,
        pan,
      });
    }

    for (const enemy of this.activeEnemyRumbles) {
      if (present.has(enemy)) continue;
      this.stopEnemyRumble(enemy);
    }
    this.activeEnemyRumbles = present;
  }

  playWeaponFire(type: WeaponSound): void {
    if (type === "laser") {
      this.playLaserShot();
      return;
    }

    void playPatchOnce(this.getContext(), PATCHES.cannonBang, {
      intensity: 1.25,
    });
  }

  playEnemyFire(position: Vector3D, playerPosition: Vector3D): void {
    const { pan, volume } = this.spatialMix(position, playerPosition, 1500);
    void playPatchOnce(this.getContext(), PATCHES.cannonBang, {
      intensity: volume * 0.9,
      pan,
    });
  }

  playEnemyDamaged(position: Vector3D, playerPosition: Vector3D): void {
    const { pan, volume } = this.spatialMix(position, playerPosition, 1100);
    void playPatchOnce(this.getContext(), PATCHES.impactCrunch, {
      intensity: volume * 0.9,
      pan,
    });
  }

  playPlayerDamaged(): void {
    void playPatchOnce(this.getContext(), PATCHES.impactCrunch, {
      intensity: 1.1,
      pan: 0,
    });
  }

  playEnemyDestroyed(position: Vector3D, playerPosition: Vector3D): void {
    const { pan, volume } = this.spatialMix(position, playerPosition, 1400);
    void playPatchOnce(this.getContext(), PATCHES.explosion, {
      intensity: volume * 1.25,
      pan,
    });
  }

  playPlayerDestroyed(): void {
    void playPatchOnce(this.getContext(), PATCHES.explosion, {
      intensity: 1.35,
      pan: 0,
    });
  }

  playGameOverTaps(): void {
    void playPatchOnce(this.getContext(), PATCHES.digitalTaps);
  }

  destroy(): void {
    this.stopTitleMusic();
    this.playerRumble?.stop();
    this.playerRumble = undefined;

    for (const enemy of this.activeEnemyRumbles) {
      this.stopEnemyRumble(enemy);
    }
    this.activeEnemyRumbles.clear();
  }

  private installUnlockHandlers(): void {
    const unlock = () => void this.resumeContext();
    this.scene.input.keyboard?.once("keydown", unlock);
    this.scene.input.once("pointerdown", unlock);
  }

  private resumeContext(): void {
    const context = this.getContext();
    if (context.state !== "running") void context.resume();
  }

  private getContext(): AudioContext {
    if (BattleAudio.sharedContext) return BattleAudio.sharedContext;

    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    BattleAudio.sharedContext = new AudioContextCtor();
    return BattleAudio.sharedContext;
  }

  private getPlayerRumble(): PatchInstance {
    if (!this.playerRumble) {
      this.playerRumble = createLoopingPatch(
        this.getContext(),
        PATCHES.playerRumble,
        { intensity: 0 },
      );
    }
    return this.playerRumble;
  }

  private getEnemyRumble(enemy: object): PatchInstance {
    let instance = this.enemyRumbles.get(enemy);
    if (!instance) {
      instance = createLoopingPatch(this.getContext(), PATCHES.enemyRumble, {
        distance: 1300,
        intensity: 0,
        pan: 0,
      });
      this.enemyRumbles.set(enemy, instance);
    }
    return instance;
  }

  private stopEnemyRumble(enemy: object): void {
    this.enemyRumbles.get(enemy)?.stop();
    this.enemyRumbles.delete(enemy);
  }

  private playLaserShot(): void {
    const context = this.getContext();
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(940, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  private spatialMix(
    position: Vector3D,
    listenerPosition: Vector3D,
    maxDistance: number,
  ): { pan: number; volume: number } {
    const dx = position.x - listenerPosition.x;
    const dz = position.z - listenerPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const volume = Math.max(0.1, 1 - distance / maxDistance);
    const pan = Math.max(-1, Math.min(1, dx / 650));
    return { pan, volume };
  }
}
