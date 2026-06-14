import { directionToDx, directionToDy, Direction } from "./DirectionUtils";
import { worldToGrid } from "./gridGeometry";
import { CellType, type MazeCell } from "./MazeGenerator";

export interface NullLanceEnemy {
  x: number;
  y: number;
  getState(): string;
}

export interface NullLanceTargetOptions<TEnemy extends NullLanceEnemy> {
  grid: MazeCell[][];
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  offsetX: number;
  offsetY: number;
  player: {
    x: number;
    y: number;
    direction: Direction;
  };
  enemies: readonly TEnemy[];
}

const NON_LIVING_STATES = new Set(["dead", "entering_pen"]);

export function findNullLanceTarget<TEnemy extends NullLanceEnemy>(
  options: NullLanceTargetOptions<TEnemy>,
): TEnemy | null {
  const dx = directionToDx(options.player.direction);
  const dy = directionToDy(options.player.direction);
  if (dx === 0 && dy === 0) return null;

  const start = worldToGrid(
    options.player.x,
    options.player.y,
    options.tileSize,
    options.offsetX,
    options.offsetY,
  );
  const enemiesByCell = new Map<string, TEnemy[]>();

  for (const enemy of options.enemies) {
    if (NON_LIVING_STATES.has(enemy.getState())) continue;
    const cell = worldToGrid(
      enemy.x,
      enemy.y,
      options.tileSize,
      options.offsetX,
      options.offsetY,
    );
    const key = `${cell.gridX},${cell.gridY}`;
    enemiesByCell.set(key, [...(enemiesByCell.get(key) ?? []), enemy]);
  }

  let x = start.gridX + dx;
  let y = start.gridY + dy;
  while (x >= 0 && x < options.gridWidth && y >= 0 && y < options.gridHeight) {
    if (options.grid[y]?.[x]?.type !== CellType.PASSAGE) return null;
    const enemies = enemiesByCell.get(`${x},${y}`);
    if (enemies?.[0]) return enemies[0];
    x += dx;
    y += dy;
  }

  return null;
}
