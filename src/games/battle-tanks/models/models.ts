import { Vector3D } from "../engine/Vector3D";
import { WireframeModel, createEdges } from "../engine/WireframeModel";

/**
 * Color palette for Battle Tanks
 */
export const COLORS = {
  player: 0x00ff00,
  enemy: 0xff0000,
  obstacle: 0x00ffff,
  terrain: 0x00aa00,
  projectile: 0xffff00,
  mountains: 0x006600,
  grid: 0x004400,
};

/**
 * Enemy tank model (Battlezone style)
 */
export const ENEMY_TANK: WireframeModel = {
  vertices: [
    // Body base
    new Vector3D(-15, 0, -20),
    new Vector3D(15, 0, -20),
    new Vector3D(15, 0, 20),
    new Vector3D(-15, 0, 20),
    // Body top
    new Vector3D(-15, 12, -20),
    new Vector3D(15, 12, -20),
    new Vector3D(15, 12, 20),
    new Vector3D(-15, 12, 20),
    // Turret base
    new Vector3D(-8, 12, -8),
    new Vector3D(8, 12, -8),
    new Vector3D(8, 12, 8),
    new Vector3D(-8, 12, 8),
    // Turret top
    new Vector3D(-8, 20, -8),
    new Vector3D(8, 20, -8),
    new Vector3D(8, 20, 8),
    new Vector3D(-8, 20, 8),
    // Cannon
    new Vector3D(-2, 16, 8),
    new Vector3D(2, 16, 8),
    new Vector3D(2, 16, 35),
    new Vector3D(-2, 16, 35),
  ],
  edges: createEdges([
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 8],
    [12, 13],
    [13, 14],
    [14, 15],
    [15, 12],
    [8, 12],
    [9, 13],
    [10, 14],
    [11, 15],
    [16, 17],
    [17, 18],
    [18, 19],
    [19, 16],
  ]),
  color: COLORS.enemy,
};

/**
 * Pyramid obstacle
 */
export const PYRAMID: WireframeModel = {
  vertices: [
    new Vector3D(-30, 0, -30),
    new Vector3D(30, 0, -30),
    new Vector3D(30, 0, 30),
    new Vector3D(-30, 0, 30),
    new Vector3D(0, 60, 0),
  ],
  edges: createEdges([
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 4],
  ]),
  color: COLORS.obstacle,
};

/**
 * Cube obstacle
 */
export const CUBE: WireframeModel = {
  vertices: [
    new Vector3D(-25, 0, -25),
    new Vector3D(25, 0, -25),
    new Vector3D(25, 0, 25),
    new Vector3D(-25, 0, 25),
    new Vector3D(-25, 50, -25),
    new Vector3D(25, 50, -25),
    new Vector3D(25, 50, 25),
    new Vector3D(-25, 50, 25),
  ],
  edges: createEdges([
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ]),
  color: COLORS.obstacle,
};

/**
 * Projectile
 */
export const PROJECTILE: WireframeModel = {
  vertices: [
    new Vector3D(0, 0, -8),
    new Vector3D(-2, 0, 0),
    new Vector3D(2, 0, 0),
    new Vector3D(0, 2, 0),
    new Vector3D(0, -2, 0),
    new Vector3D(0, 0, 12),
  ],
  edges: createEdges([
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [1, 3],
    [3, 2],
    [2, 4],
    [4, 1],
    [1, 5],
    [2, 5],
    [3, 5],
    [4, 5],
  ]),
  color: COLORS.projectile,
};
