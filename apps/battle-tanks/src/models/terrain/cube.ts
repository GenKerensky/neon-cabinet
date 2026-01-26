import { Vector3D } from "../../engine/Vector3D";
import { WireframeModel, createEdges } from "../../engine/WireframeModel";
import { COLORS } from "../colors";

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
