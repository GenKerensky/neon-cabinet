import { describe, expect, it, vi } from "vitest";
import { Direction } from "../../src/game/utils/DirectionUtils";
import {
  HackSystem,
  type HackSystemContext,
} from "../../src/game/systems/HackSystem";

function createContext(): HackSystemContext {
  return {
    player: {
      x: 100,
      y: 100,
      getCurrentDirection: () => Direction.RIGHT,
      enablePhaseBreach: vi.fn(),
      setHackSpeedMultiplier: vi.fn(),
      setTurnAssistMultiplier: vi.fn(),
      activateShield: vi.fn(),
      clearHackEffects: vi.fn(),
    },
    enemies: [
      {
        x: 130,
        y: 100,
        getState: () => "chase",
        forceReverse: vi.fn(),
        setHackSpeedMultiplier: vi.fn(),
        setRoutingOverride: vi.fn(),
        setTargetOverride: vi.fn(),
        stunFor: vi.fn(),
      },
    ],
    addScore: vi.fn(),
    setGateHackActive: vi.fn(),
    showEffect: vi.fn(),
    completeAchievement: vi.fn(),
  };
}

describe("HackSystem", () => {
  it("stores one held hack and awards replacement score when overwritten", () => {
    const context = createContext();
    const system = new HackSystem(context);

    expect(system.collectHack("phase-chip")).toEqual({
      heldHack: "phase-chip",
      replaced: false,
      replacementBonus: 0,
    });
    expect(system.collectHack("shield-ring")).toEqual({
      heldHack: "shield-ring",
      replaced: true,
      replacementBonus: 50,
    });
    expect(context.addScore).toHaveBeenCalledWith(50);
  });

  it("activates held hacks with timers and clears the held slot", () => {
    const context = createContext();
    const system = new HackSystem(context);
    system.collectHack("overclock-pellet");

    expect(system.activateHeldHack()).toBe(true);
    expect(system.getHeldHack()).toBeNull();
    expect(system.getActiveEffect("overclock-pellet")?.remainingMs).toBe(5000);
    expect(context.player.setHackSpeedMultiplier).toHaveBeenCalledWith(1.35);

    system.update(5000);
    expect(context.player.setHackSpeedMultiplier).toHaveBeenLastCalledWith(1);
    expect(context.enemies[0].setHackSpeedMultiplier).toHaveBeenCalledWith(
      1.25,
    );

    system.update(3000);
    expect(context.enemies[0].setHackSpeedMultiplier).toHaveBeenLastCalledWith(
      1,
    );
  });

  it("ignores activation while gameplay is blocked", () => {
    const context = createContext();
    const system = new HackSystem(context);
    system.collectHack("reverse-pulse");

    expect(system.activateHeldHack({ blocked: true })).toBe(false);
    expect(system.getHeldHack()).toBe("reverse-pulse");
    expect(context.enemies[0].forceReverse).not.toHaveBeenCalled();
  });

  it("clears held and active hacks on death", () => {
    const context = createContext();
    const system = new HackSystem(context);
    system.collectHack("shield-ring");
    system.activateHeldHack();

    system.clearForDeath();

    expect(system.getHeldHack()).toBeNull();
    expect(system.getActiveEffects()).toHaveLength(0);
    expect(context.player.clearHackEffects).toHaveBeenCalled();
  });
});
