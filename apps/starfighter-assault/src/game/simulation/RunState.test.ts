import { describe, expect, it } from "vitest";
import {
  createInitialRunState,
  damageShield,
  finishSegment,
  getCurrentPhase,
  progressFinale,
} from "./RunState";

describe("run state", () => {
  it("starts every run with 3 lives and baseline combat resources", () => {
    const state = createInitialRunState(1234);
    expect(state.lives).toBe(3);
    expect(state.shields.current).toBe(state.shields.max);
    expect(state.weapons.torpedoes).toBe(3);
    expect(state.currentSegmentIndex).toBe(0);
    expect(getCurrentPhase(state)).toBe("segment");
  });

  it("spends one life when shields fail and restores baseline shields", () => {
    const state = createInitialRunState(1234);
    const damaged = damageShield(state, state.shields.max + 1);
    expect(damaged.lives).toBe(2);
    expect(damaged.shields.current).toBe(damaged.shields.max);
    expect(damaged.status).toBe("segment-checkpoint");
  });

  it("moves to the finale after three segments", () => {
    const state = createInitialRunState(1234);
    const afterOne = finishSegment(state);
    const afterTwo = finishSegment(afterOne);
    const afterThree = finishSegment(afterTwo);
    expect(afterThree.currentSegmentIndex).toBe(3);
    expect(getCurrentPhase(afterThree)).toBe("finale");
    expect(afterThree.finale.stage).toBe("approach");
  });

  it("progresses through fixed capital ship finale stages", () => {
    const finaleState = finishSegment(
      finishSegment(finishSegment(createInitialRunState(1234))),
    );
    const surface = progressFinale(finaleState);
    const weakPoint = progressFinale(surface);
    const escape = progressFinale(weakPoint);
    const complete = progressFinale(escape);
    expect(surface.finale.stage).toBe("surface-skim");
    expect(weakPoint.finale.stage).toBe("weak-point-pass");
    expect(escape.finale.stage).toBe("escape");
    expect(complete.status).toBe("victory");
  });
});
