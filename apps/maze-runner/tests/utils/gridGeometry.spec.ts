import { describe, expect, it } from "vitest";
import {
  distanceToCellCenter,
  getCellCenter,
  getCenterTolerance,
  getPenGeometry,
  hasCrossedCellCenter,
  isAtCellCenter,
  isEnteringPenFromOutside,
  isPenExitCell,
  isPenGateCell,
  isPenInteriorCell,
  snapToCellCenter,
  worldToGrid,
} from "../../src/game/utils/gridGeometry";

describe("gridGeometry", () => {
  it("converts between grid and world coordinates", () => {
    expect(getCellCenter(3, 4, 58, 10, 20)).toEqual({ x: 213, y: 281 });
    expect(worldToGrid(213, 281, 58, 10, 20)).toEqual({ gridX: 3, gridY: 4 });
  });

  it("computes distance and center tolerance", () => {
    expect(getCenterTolerance(30)).toBe(0.6);
    expect(getCenterTolerance(10)).toBe(0.5);
    expect(getCenterTolerance(58)).toBe(1.16);

    expect(distanceToCellCenter(214, 283, 3, 4, 58, 10, 20)).toEqual({
      dx: 1,
      dy: 2,
      distance: Math.hypot(1, 2),
    });
    expect(isAtCellCenter(213.4, 281.3, 3, 4, 58, 10, 20)).toBe(true);
    expect(isAtCellCenter(216, 281, 3, 4, 58, 10, 20)).toBe(false);
  });

  it("snaps without mutation", () => {
    expect(snapToCellCenter(3, 4, 58, 10, 20)).toEqual({ x: 213, y: 281 });
  });

  it("detects center crossing without exact equality", () => {
    expect(
      hasCrossedCellCenter(
        { x: 10, y: 5 },
        { x: 14, y: 5 },
        { x: 12, y: 5 },
        "x",
      ),
    ).toBe(true);
    expect(
      hasCrossedCellCenter(
        { x: 12, y: 1 },
        { x: 12, y: 6 },
        { x: 12, y: 4 },
        "y",
      ),
    ).toBe(true);
    expect(
      hasCrossedCellCenter(
        { x: 10, y: 5 },
        { x: 11, y: 5 },
        { x: 12, y: 5 },
        "x",
      ),
    ).toBe(false);
  });

  it.each([
    { width: 21, height: 21, centerX: 10, centerY: 10 },
    { width: 31, height: 31, centerX: 15, centerY: 15 },
  ])(
    "matches MazeGenerator pen geometry for $width x $height",
    ({ width, height, centerX, centerY }) => {
      const geometry = getPenGeometry(width, height);

      expect(geometry).toEqual({
        centerX,
        centerY,
        interiorCells: [
          { gridX: centerX - 1, gridY: centerY },
          { gridX: centerX, gridY: centerY },
          { gridX: centerX + 1, gridY: centerY },
          { gridX: centerX - 1, gridY: centerY + 1 },
          { gridX: centerX, gridY: centerY + 1 },
          { gridX: centerX + 1, gridY: centerY + 1 },
        ],
        gateCell: { gridX: centerX, gridY: centerY - 1 },
        exitCell: { gridX: centerX, gridY: centerY - 2 },
        topGateRow: centerY - 1,
        bottomWallRow: centerY + 2,
      });

      for (const cell of geometry.interiorCells) {
        expect(isPenInteriorCell(cell.gridX, cell.gridY, width, height)).toBe(
          true,
        );
      }
      expect(
        isPenGateCell(
          geometry.gateCell.gridX,
          geometry.gateCell.gridY,
          width,
          height,
        ),
      ).toBe(true);
      expect(
        isPenExitCell(
          geometry.exitCell.gridX,
          geometry.exitCell.gridY,
          width,
          height,
        ),
      ).toBe(true);
    },
  );

  it("handles an even-sized grid defensively", () => {
    const geometry = getPenGeometry(20, 20);

    expect(geometry.centerX).toBe(10);
    expect(geometry.centerY).toBe(10);
    expect(geometry.gateCell).toEqual({ gridX: 10, gridY: 9 });
    expect(isPenInteriorCell(9, 10, 20, 20)).toBe(true);
    expect(isPenGateCell(10, 9, 20, 20)).toBe(true);
    expect(isPenExitCell(10, 8, 20, 20)).toBe(true);
  });

  it("only treats outside-to-gate/interior movement as entering the pen", () => {
    expect(
      isEnteringPenFromOutside(
        { gridX: 10, gridY: 7 },
        { gridX: 10, gridY: 9 },
        21,
        21,
      ),
    ).toBe(true);
    expect(
      isEnteringPenFromOutside(
        { gridX: 8, gridY: 10 },
        { gridX: 9, gridY: 10 },
        21,
        21,
      ),
    ).toBe(true);
    expect(
      isEnteringPenFromOutside(
        { gridX: 10, gridY: 8 },
        { gridX: 10, gridY: 9 },
        21,
        21,
      ),
    ).toBe(true);
    expect(
      isEnteringPenFromOutside(
        { gridX: 10, gridY: 9 },
        { gridX: 10, gridY: 10 },
        21,
        21,
      ),
    ).toBe(false);
    expect(
      isEnteringPenFromOutside(
        { gridX: 10, gridY: 10 },
        { gridX: 10, gridY: 7 },
        21,
        21,
      ),
    ).toBe(false);
    expect(
      isEnteringPenFromOutside(
        { gridX: 10, gridY: 7 },
        { gridX: 10, gridY: 8 },
        21,
        21,
      ),
    ).toBe(false);
  });
});
