import { describe, expect, it, vi } from "vitest";
import { Direction } from "../../src/game/utils/DirectionUtils";
import { HackPickupId } from "../../src/game/config/hackDefinitions";
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
    fireNullLance: vi.fn(() => true),
    completeAchievement: vi.fn(),
  };
}

describe("HackSystem", () => {
  it("stores one DEF hack and one ATK hack without replacement", () => {
    const context = createContext();
    const system = new HackSystem(context);

    expect(system.collectHack(HackPickupId.PHASE_CHIP)).toEqual({
      heldHack: HackPickupId.PHASE_CHIP,
      slot: "def",
      collected: true,
      full: false,
    });
    expect(system.collectHack(HackPickupId.REVERSE_PULSE)).toEqual({
      heldHack: HackPickupId.REVERSE_PULSE,
      slot: "atk",
      collected: true,
      full: false,
    });
    expect(system.getHeldHack("def")).toBe(HackPickupId.PHASE_CHIP);
    expect(system.getHeldHack("atk")).toBe(HackPickupId.REVERSE_PULSE);
  });

  it("rejects collecting into a full matching slot", () => {
    const context = createContext();
    const system = new HackSystem(context);

    system.collectHack(HackPickupId.PHASE_CHIP);

    expect(system.collectHack(HackPickupId.SHIELD_RING)).toEqual({
      heldHack: HackPickupId.PHASE_CHIP,
      slot: "def",
      collected: false,
      full: true,
    });
    expect(system.getHeldHack("def")).toBe(HackPickupId.PHASE_CHIP);
    expect(context.addScore).not.toHaveBeenCalled();
  });

  it("activates held hacks with timers and clears the held slot", () => {
    const context = createContext();
    const system = new HackSystem(context);
    system.collectHack(HackPickupId.OVERCLOCK_PELLET);

    expect(system.activateHeldHack("atk")).toBe(true);
    expect(system.getHeldHack("atk")).toBeNull();
    expect(system.getActiveEffect(HackPickupId.OVERCLOCK_PELLET)?.remainingMs).toBe(
      5000,
    );
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
    system.collectHack(HackPickupId.REVERSE_PULSE);

    expect(system.activateHeldHack("atk", { blocked: true })).toBe(false);
    expect(system.getHeldHack("atk")).toBe(HackPickupId.REVERSE_PULSE);
    expect(context.enemies[0].forceReverse).not.toHaveBeenCalled();
  });

  it("fires Null Lance through the ATK slot and records a miss effect when it misses", () => {
    const context = createContext();
    context.fireNullLance = vi.fn(() => false);
    const system = new HackSystem(context);
    system.collectHack(HackPickupId.NULL_LANCE);

    expect(system.activateHeldHack("atk")).toBe(true);

    expect(context.fireNullLance).toHaveBeenCalled();
    expect(system.getHeldHack("atk")).toBeNull();
    expect(context.showEffect).toHaveBeenCalledWith("MISS", 100, 100);
  });

  it("clears held and active hacks on death", () => {
    const context = createContext();
    const system = new HackSystem(context);
    system.collectHack(HackPickupId.SHIELD_RING);
    system.activateHeldHack("def");

    system.clearForDeath();

    expect(system.getHeldHacks()).toEqual({ def: null, atk: null });
    expect(system.getActiveEffects()).toHaveLength(0);
    expect(context.player.clearHackEffects).toHaveBeenCalled();
  });
});
