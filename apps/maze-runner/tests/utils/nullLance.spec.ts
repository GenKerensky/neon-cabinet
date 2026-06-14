import { describe, expect, it } from "vitest";
import { findNullLanceTarget } from "../../src/game/utils/nullLance";
import { Direction } from "../../src/game/utils/DirectionUtils";
import { CellType, type MazeCell } from "../../src/game/utils/MazeGenerator";

function gridFromPattern(pattern: string[]): MazeCell[][] {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
      visited: false,
    })),
  );
}

describe("findNullLanceTarget", () => {
  it("returns the first living ghost in the player's line", () => {
    const grid = gridFromPattern(["WWWWWWW", "W.....W", "WWWWWWW"]);
    const enemies = [
      { x: 56, y: 24, getState: () => "chase" },
      { x: 72, y: 24, getState: () => "chase" },
    ];

    expect(
      findNullLanceTarget({
        grid,
        gridWidth: 7,
        gridHeight: 3,
        tileSize: 16,
        offsetX: 0,
        offsetY: 0,
        player: { x: 24, y: 24, direction: Direction.RIGHT },
        enemies,
      }),
    ).toBe(enemies[0]);
  });

  it("ignores dead ghosts and stops at walls", () => {
    const grid = gridFromPattern(["WWWWWWWWW", "W...W...W", "WWWWWWWWW"]);
    const enemies = [
      { x: 56, y: 24, getState: () => "dead" },
      { x: 104, y: 24, getState: () => "chase" },
    ];

    expect(
      findNullLanceTarget({
        grid,
        gridWidth: 9,
        gridHeight: 3,
        tileSize: 16,
        offsetX: 0,
        offsetY: 0,
        player: { x: 24, y: 24, direction: Direction.RIGHT },
        enemies,
      }),
    ).toBeNull();
  });
});
