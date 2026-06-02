import {
  getHackPickupDefinition,
  HackPickupId,
} from "../config/hackDefinitions";
import type {
  HackAchievementId,
  HackUpgradeId,
} from "../utils/hackProgression";
import { completeAchievement, recordHackUse } from "../utils/hackProgression";

export type HackRoutingOverride = "scatter" | "jammed" | "orbit" | null;

export interface HackTarget {
  x: number;
  y: number;
}

export interface HackPlayerApi {
  x: number;
  y: number;
  getCurrentDirection(): number;
  enablePhaseBreach(durationMs: number, maxTiles: number): void;
  setHackSpeedMultiplier(multiplier: number): void;
  setTurnAssistMultiplier(multiplier: number): void;
  activateShield(durationMs: number): void;
  clearHackEffects(): void;
}

export interface HackEnemyApi {
  x: number;
  y: number;
  getState(): string;
  forceReverse(): void;
  setHackSpeedMultiplier(multiplier: number): void;
  setRoutingOverride(override: HackRoutingOverride, durationMs?: number): void;
  setTargetOverride(target: HackTarget | null, durationMs?: number): void;
  stunFor(durationMs: number): void;
}

export interface HackSystemContext {
  player: HackPlayerApi;
  enemies: HackEnemyApi[];
  addScore(points: number): void;
  setGateHackActive(active: boolean): void;
  showEffect(name: string, x: number, y: number): void;
  completeAchievement(id: HackAchievementId): void;
}

export interface HackSystemOptions {
  unlockedUpgrades?: readonly HackUpgradeId[];
}

export interface HackCollectResult {
  heldHack: HackPickupId;
  replaced: boolean;
  replacementBonus: number;
}

export interface ActiveHackEffect {
  id: HackPickupId | "overclock-rebound";
  remainingMs: number;
}

export interface HackActivationOptions {
  blocked?: boolean;
}

const NON_LIVING_STATES = new Set(["dead", "entering_pen"]);

export class HackSystem {
  private context: HackSystemContext;
  private heldHack: HackPickupId | null = null;
  private activeEffects: ActiveHackEffect[] = [];
  private upgrades: Set<HackUpgradeId>;

  constructor(context: HackSystemContext, options: HackSystemOptions = {}) {
    this.context = context;
    this.upgrades = new Set(options.unlockedUpgrades ?? []);
  }

  setEnemies(enemies: HackEnemyApi[]): void {
    this.context.enemies = enemies;
  }

  getHeldHack(): HackPickupId | null {
    return this.heldHack;
  }

  getActiveEffects(): ActiveHackEffect[] {
    return this.activeEffects.map((effect) => ({ ...effect }));
  }

  getActiveEffect(id: ActiveHackEffect["id"]): ActiveHackEffect | undefined {
    const effect = this.activeEffects.find((active) => active.id === id);
    return effect ? { ...effect } : undefined;
  }

  isEffectActive(id: ActiveHackEffect["id"]): boolean {
    return this.activeEffects.some((effect) => effect.id === id);
  }

  collectHack(id: HackPickupId): HackCollectResult {
    const replaced = this.heldHack !== null;
    const replacementBonus = replaced ? this.getReplacementBonus() : 0;
    this.heldHack = id;

    if (replacementBonus > 0) {
      this.context.addScore(replacementBonus);
    }

    return { heldHack: id, replaced, replacementBonus };
  }

  activateHeldHack(options: HackActivationOptions = {}): boolean {
    if (options.blocked || !this.heldHack) return false;

    const id = this.heldHack;
    const definition = getHackPickupDefinition(id);
    const durationMs = this.getDurationMs(definition.durationMs);
    this.heldHack = null;
    this.context.completeAchievement("first-hack-used");
    completeAchievement("first-hack-used");
    recordHackUse(id);

    switch (id) {
      case HackPickupId.PHASE_CHIP:
        this.context.player.enablePhaseBreach(durationMs, 3);
        this.addEffect(id, durationMs);
        break;
      case HackPickupId.DECOY_SPARK:
        this.applyDecoy(durationMs);
        this.addEffect(id, durationMs);
        break;
      case HackPickupId.REVERSE_PULSE:
        this.applyReversePulse(durationMs);
        this.addEffect(id, durationMs);
        break;
      case HackPickupId.OVERCLOCK_PELLET:
        this.context.player.setHackSpeedMultiplier(1.35);
        this.context.player.setTurnAssistMultiplier(1.6);
        this.addEffect(id, durationMs);
        break;
      case HackPickupId.SHIELD_RING:
        this.context.player.activateShield(durationMs);
        this.addEffect(id, durationMs);
        break;
      case HackPickupId.SCORE_MAGNET:
        this.addEffect(id, durationMs);
        break;
      case HackPickupId.GHOST_JAMMER:
        this.applyGhostJammer(durationMs);
        this.addEffect(id, durationMs);
        break;
      case HackPickupId.GATE_KEY:
        this.context.setGateHackActive(true);
        this.addEffect(id, durationMs);
        break;
    }

    this.context.showEffect(
      definition.shortName,
      this.context.player.x,
      this.context.player.y,
    );
    return true;
  }

  update(deltaMs: number): void {
    const expired: ActiveHackEffect[] = [];
    for (const effect of this.activeEffects) {
      effect.remainingMs -= deltaMs;
      if (effect.remainingMs <= 0) expired.push(effect);
    }

    this.activeEffects = this.activeEffects.filter(
      (effect) => effect.remainingMs > 0,
    );
    for (const effect of expired) {
      this.cleanupEffect(effect);
    }
  }

  clearForDeath(): void {
    this.heldHack = null;
    this.activeEffects = [];
    this.context.player.clearHackEffects();
    this.context.setGateHackActive(false);
    for (const enemy of this.context.enemies) {
      enemy.setHackSpeedMultiplier(1);
      enemy.setRoutingOverride(null);
      enemy.setTargetOverride(null);
    }
  }

  absorbShieldHit(x: number, y: number): void {
    const stunDuration = this.upgrades.has("stronger-shield") ? 2200 : 1500;
    const radius = this.upgrades.has("stronger-shield") ? 210 : 150;
    for (const enemy of this.context.enemies) {
      if (Math.hypot(enemy.x - x, enemy.y - y) <= radius) {
        enemy.stunFor(stunDuration);
      }
    }
    this.context.completeAchievement("shield-save");
    completeAchievement("shield-save");
    this.context.showEffect("SHIELD", x, y);
  }

  private addEffect(id: ActiveHackEffect["id"], durationMs: number): void {
    this.activeEffects = this.activeEffects.filter(
      (effect) => effect.id !== id,
    );
    this.activeEffects.push({ id, remainingMs: durationMs });
  }

  private cleanupEffect(effect: ActiveHackEffect): void {
    switch (effect.id) {
      case HackPickupId.OVERCLOCK_PELLET:
        this.context.player.setHackSpeedMultiplier(1);
        this.context.player.setTurnAssistMultiplier(1);
        for (const enemy of this.context.enemies) {
          enemy.setHackSpeedMultiplier(1.25);
        }
        this.addEffect("overclock-rebound", 3000);
        break;
      case "overclock-rebound":
        for (const enemy of this.context.enemies) {
          enemy.setHackSpeedMultiplier(1);
        }
        break;
      case HackPickupId.DECOY_SPARK:
      case HackPickupId.GHOST_JAMMER:
      case HackPickupId.REVERSE_PULSE:
        for (const enemy of this.context.enemies) {
          enemy.setRoutingOverride(null);
          enemy.setTargetOverride(null);
        }
        break;
      case HackPickupId.GATE_KEY:
        this.context.setGateHackActive(false);
        break;
      case HackPickupId.SHIELD_RING:
        this.context.player.activateShield(0);
        break;
      default:
        break;
    }
  }

  private applyDecoy(durationMs: number): void {
    const target = { x: this.context.player.x, y: this.context.player.y };
    for (const enemy of this.context.enemies) {
      if (this.isLivingEnemy(enemy)) {
        enemy.setTargetOverride(target, durationMs);
      }
    }
  }

  private applyReversePulse(durationMs: number): void {
    const radius = 8 * 30;
    for (const enemy of this.context.enemies) {
      if (
        this.isLivingEnemy(enemy) &&
        Math.hypot(
          enemy.x - this.context.player.x,
          enemy.y - this.context.player.y,
        ) <= radius
      ) {
        enemy.forceReverse();
        enemy.setRoutingOverride("scatter", durationMs);
      }
    }
  }

  private applyGhostJammer(durationMs: number): void {
    for (const enemy of this.context.enemies) {
      if (this.isLivingEnemy(enemy)) {
        enemy.setRoutingOverride("jammed", durationMs);
        enemy.setTargetOverride(null);
      }
    }
  }

  private isLivingEnemy(enemy: HackEnemyApi): boolean {
    return !NON_LIVING_STATES.has(enemy.getState());
  }

  private getReplacementBonus(): number {
    return this.upgrades.has("replacement-bonus") ? 100 : 50;
  }

  private getDurationMs(baseDurationMs: number): number {
    return this.upgrades.has("longer-duration")
      ? Math.round(baseDurationMs * 1.2)
      : baseDurationMs;
  }
}
