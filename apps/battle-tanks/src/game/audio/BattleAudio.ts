import { Scene, Sound } from "phaser";
import { Vector3D } from "../engine/Vector3D";
import { Enemy } from "../objects/EnemyManager";

type WeaponSound = "autocannon" | "laser";

interface RumbleVoice {
  oscillator: OscillatorNode;
  modulator: OscillatorNode;
  gain: GainNode;
  panner: StereoPannerNode;
}

export class BattleAudio {
  private static sharedContext?: AudioContext;
  private static sharedMasterGain?: GainNode;

  private readonly scene: Scene;
  private playerRumble?: RumbleVoice;
  private enemyRumbles = new WeakMap<object, RumbleVoice>();
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
    const voice = this.getPlayerRumble();
    const speed = Math.min(1, Math.abs(velocity) / 150);
    const targetGain = speed > 0.02 ? 0.05 + speed * 0.08 : 0;
    const targetFrequency = 18 + speed * 10;
    const now = this.now();

    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(targetGain, now, 0.08);
    voice.oscillator.frequency.setTargetAtTime(targetFrequency, now, 0.12);
  }

  updateEnemyTanks(
    enemies: Enemy[],
    playerPosition: Vector3D,
    playerRotation: number,
  ): void {
    const present = new Set<object>();

    for (const enemy of enemies) {
      if (enemy.type !== "tank" || !enemy.isAlive()) continue;

      present.add(enemy);
      const voice = this.getEnemyRumble(enemy);
      const dx = enemy.position.x - playerPosition.x;
      const dz = enemy.position.z - playerPosition.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const proximity = Math.max(0, 1 - distance / 1300);
      const angle = Math.atan2(dx, dz) - playerRotation;
      const pan = Math.max(-1, Math.min(1, Math.sin(angle)));
      const now = this.now();

      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(proximity * 0.09, now, 0.12);
      voice.panner.pan.setTargetAtTime(pan, now, 0.1);
      voice.oscillator.frequency.setTargetAtTime(16 + proximity * 9, now, 0.2);
    }

    for (const enemy of this.activeEnemyRumbles) {
      if (present.has(enemy)) continue;
      this.fadeAndStopEnemyRumble(enemy);
    }
    this.activeEnemyRumbles = present;
  }

  playWeaponFire(type: WeaponSound): void {
    if (type === "laser") {
      this.playLaserShot();
      return;
    }

    this.playCannonShot(0, 1.25);
  }

  playEnemyFire(position: Vector3D, playerPosition: Vector3D): void {
    const dx = position.x - playerPosition.x;
    const dz = position.z - playerPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const volume = Math.max(0.16, 1 - distance / 1500) * 0.85;
    const pan = Math.max(-1, Math.min(1, dx / 700));
    this.playCannonShot(pan, volume);
  }

  playEnemyDamaged(position: Vector3D, playerPosition: Vector3D): void {
    const { pan, volume } = this.spatialMix(position, playerPosition, 1100);
    this.playImpactCrunch(pan, volume * 0.9, 150, 0.16);
  }

  playPlayerDamaged(): void {
    this.playImpactCrunch(0, 1.1, 95, 0.28);
  }

  playEnemyDestroyed(position: Vector3D, playerPosition: Vector3D): void {
    const { pan, volume } = this.spatialMix(position, playerPosition, 1400);
    this.playExplosion(pan, volume * 1.25);
  }

  playPlayerDestroyed(): void {
    this.playExplosion(0, 1.35);
    this.playFallingDigitalWhine();
  }

  playGameOverTaps(): void {
    const start = this.now() + 0.05;
    const notes = [
      [392, 0, 0.26],
      [392, 0.34, 0.26],
      [523.25, 0.68, 0.52],
      [392, 1.32, 0.26],
      [523.25, 1.66, 0.26],
      [659.25, 2, 0.82],
      [523.25, 2.98, 0.5],
      [659.25, 3.58, 0.5],
      [783.99, 4.18, 0.9],
    ] as const;

    for (const [frequency, offset, duration] of notes) {
      this.playDigitalBugleNote(frequency, start + offset, duration);
    }
  }

  destroy(): void {
    this.stopTitleMusic();
    this.fadeAndStopVoice(this.playerRumble, 0.04);
    this.playerRumble = undefined;

    for (const enemy of this.activeEnemyRumbles) {
      this.fadeAndStopEnemyRumble(enemy);
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
    BattleAudio.sharedMasterGain = BattleAudio.sharedContext.createGain();
    BattleAudio.sharedMasterGain.gain.value = 0.85;
    BattleAudio.sharedMasterGain.connect(BattleAudio.sharedContext.destination);
    return BattleAudio.sharedContext;
  }

  private now(): number {
    return this.getContext().currentTime;
  }

  private createRumbleVoice(baseFrequency: number): RumbleVoice {
    const context = this.getContext();
    const oscillator = context.createOscillator();
    const modulator = context.createOscillator();
    const gain = context.createGain();
    const modGain = context.createGain();
    const panner = context.createStereoPanner();

    oscillator.type = "sawtooth";
    oscillator.frequency.value = baseFrequency;
    modulator.type = "sine";
    modulator.frequency.value = 5;
    modGain.gain.value = 2.5;
    gain.gain.value = 0;

    modulator.connect(modGain);
    modGain.connect(oscillator.frequency);
    oscillator.connect(gain);
    gain.connect(panner);
    panner.connect(BattleAudio.sharedMasterGain!);

    oscillator.start();
    modulator.start();

    return { oscillator, modulator, gain, panner };
  }

  private getPlayerRumble(): RumbleVoice {
    if (!this.playerRumble) {
      this.playerRumble = this.createRumbleVoice(18);
    }
    return this.playerRumble;
  }

  private getEnemyRumble(enemy: object): RumbleVoice {
    let voice = this.enemyRumbles.get(enemy);
    if (!voice) {
      voice = this.createRumbleVoice(16);
      this.enemyRumbles.set(enemy, voice);
    }
    return voice;
  }

  private fadeAndStopEnemyRumble(enemy: object): void {
    const voice = this.enemyRumbles.get(enemy);
    this.fadeAndStopVoice(voice, 0.12);
    this.enemyRumbles.delete(enemy);
  }

  private fadeAndStopVoice(
    voice: RumbleVoice | undefined,
    fadeTime: number,
  ): void {
    if (!voice) return;

    const now = this.now();
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0, now, fadeTime);
    window.setTimeout(
      () => {
        voice.oscillator.stop();
        voice.modulator.stop();
        voice.oscillator.disconnect();
        voice.modulator.disconnect();
        voice.gain.disconnect();
        voice.panner.disconnect();
      },
      fadeTime * 1000 + 120,
    );
  }

  private playCannonShot(pan: number, volume: number): void {
    const context = this.getContext();
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    const panner = context.createStereoPanner();

    osc.type = "square";
    osc.frequency.setValueAtTime(64, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.11);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.36 * volume, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    panner.pan.value = pan;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(BattleAudio.sharedMasterGain!);
    osc.start(now);
    osc.stop(now + 0.17);
    this.playNoiseBurst(now, 0.09, volume * 0.62, pan, 2400);
    this.playNoiseBurst(now + 0.015, 0.19, volume * 0.34, pan, 700);
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
    gain.connect(BattleAudio.sharedMasterGain!);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  private playImpactCrunch(
    pan: number,
    volume: number,
    frequency: number,
    duration: number,
  ): void {
    const context = this.getContext();
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    const panner = context.createStereoPanner();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(
      frequency * 0.48,
      now + duration,
    );
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18 * volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    panner.pan.value = pan;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(BattleAudio.sharedMasterGain!);
    osc.start(now);
    osc.stop(now + duration + 0.02);
    this.playNoiseBurst(now, duration, volume * 0.12, pan, 1600);
  }

  private playExplosion(pan: number, volume: number): void {
    const context = this.getContext();
    const now = context.currentTime;
    this.playNoiseBurst(now, 0.72, 0.82 * volume, pan, 520);
    this.playNoiseBurst(now, 0.2, 0.38 * volume, pan, 1800);
    this.playImpactCrunch(pan, volume * 1.15, 58, 0.62);
  }

  private playFallingDigitalWhine(): void {
    const context = this.getContext();
    const now = context.currentTime + 0.08;
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.85);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.13, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(gain);
    gain.connect(BattleAudio.sharedMasterGain!);
    osc.start(now);
    osc.stop(now + 0.92);
  }

  private playDigitalBugleNote(
    frequency: number,
    start: number,
    duration: number,
  ): void {
    const context = this.getContext();
    const osc = context.createOscillator();
    const harmonic = context.createOscillator();
    const gain = context.createGain();

    osc.type = "square";
    harmonic.type = "triangle";
    osc.frequency.value = frequency;
    harmonic.frequency.value = frequency * 2;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.1, start + 0.025);
    gain.gain.setTargetAtTime(0.065, start + duration * 0.35, 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    harmonic.connect(gain);
    gain.connect(BattleAudio.sharedMasterGain!);
    osc.start(start);
    harmonic.start(start);
    osc.stop(start + duration + 0.02);
    harmonic.stop(start + duration + 0.02);
  }

  private playNoiseBurst(
    start: number,
    duration: number,
    volume: number,
    pan: number,
    filterFrequency: number,
  ): void {
    const context = this.getContext();
    const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < sampleCount; i++) {
      const envelope = 1 - i / sampleCount;
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const panner = context.createStereoPanner();

    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = filterFrequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    panner.pan.value = pan;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(BattleAudio.sharedMasterGain!);
    source.start(start);
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
