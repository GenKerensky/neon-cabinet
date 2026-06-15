import { describe, expect, it } from "vitest";
import { HackPickupId } from "../../src/game/config/hackDefinitions";
import {
  buildHackPlacementPlan,
  selectHackPickupCells,
} from "../../src/game/config/hackPlacement";
import { CellType, type MazeCell } from "../../src/game/utils/MazeGenerator";

function gridFromPattern(pattern: string[]): MazeCell[][] {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
      visited: false,
    })),
  );
}

describe("hackPlacement", () => {
  it("places zero hacks on level 1", () => {
    expect(buildHackPlacementPlan(1).count).toBe(0);
    expect(buildHackPlacementPlan(1).pool).toEqual([]);
  });

  it("starts level 2 with two beginner defensive hacks", () => {
    expect(buildHackPlacementPlan(2)).toEqual({
      count: 2,
      pool: [HackPickupId.PHASE_CHIP, HackPickupId.SHIELD_RING],
    });
  });

  it("adds Null Lance only in the level 7+ pool", () => {
    expect(buildHackPlacementPlan(6).pool).not.toContain(
      HackPickupId.NULL_LANCE,
    );
    expect(buildHackPlacementPlan(7).pool).toContain(HackPickupId.NULL_LANCE);
    expect(buildHackPlacementPlan(7).count).toBe(5);
  });

  it("selects valid spread cells outside spawn and power pellet cells", () => {
    const grid = gridFromPattern([
      "WWWWWWWWW",
      "W.......W",
      "W.......W",
      "W.......W",
      "W.......W",
      "W.......W",
      "W.......W",
      "W.......W",
      "WWWWWWWWW",
    ]);
    const placements = selectHackPickupCells({
      grid,
      gridWidth: 9,
      gridHeight: 9,
      level: 7,
      rng: () => 0,
    });

    expect(placements).toHaveLength(5);
    expect(
      placements.map((placement) => `${placement.gridX},${placement.gridY}`),
    ).not.toContain("1,1");
    expect(
      placements.map((placement) => `${placement.gridX},${placement.gridY}`),
    ).not.toContain("7,1");
    expect(
      placements.map((placement) => `${placement.gridX},${placement.gridY}`),
    ).not.toContain("1,7");
    expect(
      placements.map((placement) => `${placement.gridX},${placement.gridY}`),
    ).not.toContain("7,7");
    expect(
      placements.some(
        (placement) => placement.gridX === 4 && placement.gridY === 4,
      ),
    ).toBe(false);
    expect(
      new Set(placements.map((placement) => placement.hackId)).size,
    ).toBeGreaterThan(1);
  });
});
