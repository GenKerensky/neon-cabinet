export type Point = { x: number; y: number };
export type GridPoint = { gridX: number; gridY: number };
export type Axis = "x" | "y";

export type PenGeometry = {
  centerX: number;
  centerY: number;
  interiorCells: GridPoint[];
  gateCell: GridPoint;
  exitCell: GridPoint;
  topGateRow: number;
  bottomWallRow: number;
};

function makeGridPoint(gridX: number, gridY: number): GridPoint {
  return { gridX, gridY };
}

export function getCellCenter(
  gridX: number,
  gridY: number,
  tileSize: number,
  offsetX: number,
  offsetY: number,
): Point {
  return {
    x: offsetX + gridX * tileSize + tileSize / 2,
    y: offsetY + gridY * tileSize + tileSize / 2,
  };
}

export function worldToGrid(
  x: number,
  y: number,
  tileSize: number,
  offsetX: number,
  offsetY: number,
): GridPoint {
  return {
    gridX: Math.floor((x - offsetX) / tileSize),
    gridY: Math.floor((y - offsetY) / tileSize),
  };
}

export function distanceToCellCenter(
  x: number,
  y: number,
  gridX: number,
  gridY: number,
  tileSize: number,
  offsetX: number,
  offsetY: number,
): { dx: number; dy: number; distance: number } {
  const center = getCellCenter(gridX, gridY, tileSize, offsetX, offsetY);
  const dx = x - center.x;
  const dy = y - center.y;

  return {
    dx,
    dy,
    distance: Math.hypot(dx, dy),
  };
}

export function getCenterTolerance(tileSize: number): number {
  return Math.max(0.5, tileSize * 0.02);
}

export function isAtCellCenter(
  x: number,
  y: number,
  gridX: number,
  gridY: number,
  tileSize: number,
  offsetX: number,
  offsetY: number,
  tolerance = getCenterTolerance(tileSize),
): boolean {
  const { distance } = distanceToCellCenter(x, y, gridX, gridY, tileSize, offsetX, offsetY);
  return distance <= tolerance;
}

export function snapToCellCenter(
  gridX: number,
  gridY: number,
  tileSize: number,
  offsetX: number,
  offsetY: number,
): Point {
  return getCellCenter(gridX, gridY, tileSize, offsetX, offsetY);
}

export function hasLeftCurrentCenter(
  x: number,
  y: number,
  gridX: number,
  gridY: number,
  tileSize: number,
  offsetX: number,
  offsetY: number,
  tolerance = getCenterTolerance(tileSize),
): boolean {
  const { distance } = distanceToCellCenter(x, y, gridX, gridY, tileSize, offsetX, offsetY);
  return distance > tolerance;
}

export function hasCrossedCellCenter(
  previousPosition: Point,
  nextPosition: Point,
  centerPosition: Point,
  axis: Axis,
): boolean {
  const previousDelta = previousPosition[axis] - centerPosition[axis];
  const nextDelta = nextPosition[axis] - centerPosition[axis];

  if (previousDelta === 0 && nextDelta === 0) {
    return false;
  }

  if (previousDelta === 0) {
    return false;
  }

  if (nextDelta === 0) {
    return previousDelta !== 0;
  }

  return previousDelta < 0 !== nextDelta < 0;
}

export function getPenGeometry(width: number, height: number): PenGeometry {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  return {
    centerX,
    centerY,
    interiorCells: [
      makeGridPoint(centerX - 1, centerY),
      makeGridPoint(centerX, centerY),
      makeGridPoint(centerX + 1, centerY),
      makeGridPoint(centerX - 1, centerY + 1),
      makeGridPoint(centerX, centerY + 1),
      makeGridPoint(centerX + 1, centerY + 1),
    ],
    gateCell: makeGridPoint(centerX, centerY - 1),
    exitCell: makeGridPoint(centerX, centerY - 2),
    topGateRow: centerY - 1,
    bottomWallRow: centerY + 2,
  };
}

export function isPenInteriorCell(gridX: number, gridY: number, width: number, height: number): boolean {
  const { centerX, centerY } = getPenGeometry(width, height);
  return gridX >= centerX - 1 && gridX <= centerX + 1 && gridY >= centerY && gridY <= centerY + 1;
}

export function isPenGateCell(gridX: number, gridY: number, width: number, height: number): boolean {
  const { gateCell } = getPenGeometry(width, height);
  return gridX === gateCell.gridX && gridY === gateCell.gridY;
}

export function isPenExitCell(gridX: number, gridY: number, width: number, height: number): boolean {
  const { exitCell } = getPenGeometry(width, height);
  return gridX === exitCell.gridX && gridY === exitCell.gridY;
}

export function isEnteringPenFromOutside(
  from: GridPoint,
  to: GridPoint,
  width: number,
  height: number,
): boolean {
  const fromInsidePen =
    isPenInteriorCell(from.gridX, from.gridY, width, height) ||
    isPenGateCell(from.gridX, from.gridY, width, height);
  const toGateOrInterior =
    isPenGateCell(to.gridX, to.gridY, width, height) || isPenInteriorCell(to.gridX, to.gridY, width, height);

  return !fromInsidePen && toGateOrInterior;
}
