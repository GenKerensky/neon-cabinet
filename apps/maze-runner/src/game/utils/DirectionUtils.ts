import { CellType } from "./MazeGenerator";
import type { MazeCell } from "./MazeGenerator";

export enum Direction {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4,
}

export const ALL_DIRECTIONS: Direction[] = [
  Direction.UP,
  Direction.DOWN,
  Direction.LEFT,
  Direction.RIGHT,
];

export function directionToDx(dir: Direction): number {
  switch (dir) {
    case Direction.LEFT:
      return -1;
    case Direction.RIGHT:
      return 1;
    default:
      return 0;
  }
}

export function directionToDy(dir: Direction): number {
  switch (dir) {
    case Direction.UP:
      return -1;
    case Direction.DOWN:
      return 1;
    default:
      return 0;
  }
}

export function oppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case Direction.UP:
      return Direction.DOWN;
    case Direction.DOWN:
      return Direction.UP;
    case Direction.LEFT:
      return Direction.RIGHT;
    case Direction.RIGHT:
      return Direction.LEFT;
    default:
      return Direction.NONE;
  }
}

export function getValidDirections(
  gridX: number,
  gridY: number,
  grid: MazeCell[][],
  gridWidth: number,
  gridHeight: number,
): Direction[] {
  const dirs: Direction[] = [];

  for (const dir of ALL_DIRECTIONS) {
    const nx = gridX + directionToDx(dir);
    const ny = gridY + directionToDy(dir);

    if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
      if (grid[ny][nx].type === CellType.PASSAGE) {
        dirs.push(dir);
      }
    }
  }

  return dirs;
}
