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
    expect(state.status).toBe("playing");
    expect(state.bounties).toBe(0);
    expect(state.shields.current).toBe(state.shields.max);
    expect(state.weapons.torpedoes).toBe(3);
    expect(state.weapons.torpedoCapacity).toBe(3);
    expect(state.currentSegmentIndex).toBe(0);
    expect(state.finale.stage).toBe("approach");
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
    expect(complete.finale.stage).toBe("complete");
    expect(complete.status).toBe("victory");
  });

  it("clamps repeated lethal damage at zero lives and preserves game over", () => {
    const state = createInitialRunState(1234);
    const firstDeath = damageShield(state, state.shields.max);
    const secondDeath = damageShield(firstDeath, firstDeath.shields.max);
    const gameOver = damageShield(secondDeath, secondDeath.shields.max);
    const repeatedDamage = damageShield(gameOver, gameOver.shields.max);

    expect(gameOver.lives).toBe(0);
    expect(gameOver.status).toBe("game-over");
    expect(repeatedDamage.lives).toBe(0);
    expect(repeatedDamage.status).toBe("game-over");
  });

  it("preserves victory when shields take damage", () => {
    const finaleState = finishSegment(
      finishSegment(finishSegment(createInitialRunState(1234))),
    );
    const victoryState = progressFinale(
      progressFinale(progressFinale(progressFinale(finaleState))),
    );
    const damaged = damageShield(victoryState, victoryState.shields.max);

    expect(damaged.lives).toBe(victoryState.lives);
    expect(damaged.status).toBe("victory");
    expect(damaged.finale.stage).toBe("complete");
  });

  it("does not heal shields with negative damage", () => {
    const state = damageShield(createInitialRunState(1234), 25);
    const damaged = damageShield(state, -50);

    expect(damaged.shields.current).toBe(state.shields.current);
    expect(damaged.shields.current).toBeLessThanOrEqual(damaged.shields.max);
  });

  it("does not finish additional segments after finale or terminal states", () => {
    const finaleState = finishSegment(
      finishSegment(finishSegment(createInitialRunState(1234))),
    );
    const afterFinaleFinish = finishSegment(finaleState);
    const victoryState = progressFinale(
      progressFinale(progressFinale(progressFinale(finaleState))),
    );
    const afterVictoryFinish = finishSegment(victoryState);
    const gameOverState = damageShield(
      damageShield(damageShield(createInitialRunState(1234), 100), 100),
      100,
    );
    const afterGameOverFinish = finishSegment(gameOverState);

    expect(afterFinaleFinish.currentSegmentIndex).toBe(3);
    expect(afterFinaleFinish.status).toBe(finaleState.status);
    expect(afterVictoryFinish.currentSegmentIndex).toBe(3);
    expect(afterVictoryFinish.status).toBe("victory");
    expect(afterGameOverFinish.currentSegmentIndex).toBe(0);
    expect(afterGameOverFinish.status).toBe("game-over");
  });

  it("does not progress finale before finale starts or after terminal states", () => {
    const state = createInitialRunState(1234);
    const beforeFinale = progressFinale(state);
    const finaleState = finishSegment(finishSegment(finishSegment(state)));
    const victoryState = progressFinale(
      progressFinale(progressFinale(progressFinale(finaleState))),
    );
    const afterVictoryProgress = progressFinale(victoryState);
    const gameOverState = damageShield(
      damageShield(damageShield(state, 100), 100),
      100,
    );
    const afterGameOverProgress = progressFinale(gameOverState);

    expect(beforeFinale.finale.stage).toBe("approach");
    expect(beforeFinale.status).toBe("playing");
    expect(afterVictoryProgress.finale.stage).toBe("complete");
    expect(afterVictoryProgress.status).toBe("victory");
    expect(afterGameOverProgress.finale.stage).toBe("approach");
    expect(afterGameOverProgress.status).toBe("game-over");
  });
});
