import { Vector3D } from "../../engine/Vector3D";
import { WireframeModel, createEdges } from "../../engine/WireframeModel";
import { COLORS } from "../colors";

/**
 * Player Projectile (yellow)
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
