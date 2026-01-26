import { Vector3D } from "../../engine/Vector3D";
import { WireframeModel, createEdges } from "../../engine/WireframeModel";
import { COLORS } from "../colors";

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
