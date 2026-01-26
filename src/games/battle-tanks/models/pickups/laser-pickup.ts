import { Vector3D } from "../../engine/Vector3D";
import { WireframeModel, createEdges } from "../../engine/WireframeModel";
import { COLORS } from "../colors";

/**
 * Laser pickup - stylized ray gun shape (gold)
 */
export const LASER_PICKUP: WireframeModel = {
  vertices: [
    // Handle/grip (0-3)
    new Vector3D(-6, 0, -8),
    new Vector3D(6, 0, -8),
    new Vector3D(6, 12, -8),
    new Vector3D(-6, 12, -8),
    // Body housing (4-7)
    new Vector3D(-10, 12, -12),
    new Vector3D(10, 12, -12),
    new Vector3D(10, 24, -8),
    new Vector3D(-10, 24, -8),
    // Barrel base (8-11)
    new Vector3D(-5, 16, -8),
    new Vector3D(5, 16, -8),
    new Vector3D(5, 22, 25),
    new Vector3D(-5, 22, 25),
    // Emitter tip flared (12-15)
    new Vector3D(-8, 14, 25),
    new Vector3D(8, 14, 25),
    new Vector3D(8, 24, 32),
    new Vector3D(-8, 24, 32),
  ],
  edges: createEdges([
    // Handle
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    // Body
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    // Connect handle to body
    [2, 4],
    [3, 7],
    [2, 5],
    [3, 4],
    // Barrel
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 8],
    // Emitter
    [12, 13],
    [13, 14],
    [14, 15],
    [15, 12],
    // Connect barrel to emitter
    [10, 14],
    [11, 15],
    [10, 13],
    [11, 12],
  ]),
  color: COLORS.pickup_weapon,
};
