import { Vector3D } from "../../engine/Vector3D";
import { WireframeModel, createEdges } from "../../engine/WireframeModel";
import { COLORS } from "../colors";

/**
 * shield-pickup - imported from OBJ
 */
export const SHIELD_PICKUP: WireframeModel = {
  vertices: [
    new Vector3D(17.502232, 37.41943, 0),
    new Vector3D(19.680687, 30.166288, -0.000001),
    new Vector3D(12.397648, 10.734774, -0.000002),
    new Vector3D(0, 0, -0.000003),
    new Vector3D(0, 33.160339, -0.000001),
    new Vector3D(0, 13.160341, -0.000002),
    new Vector3D(-10, 23.160341, -0.000002),
    new Vector3D(10, 23.160341, -0.000002),
    new Vector3D(0, 39.328648, 0),
    new Vector3D(18.827763, 23.444191, -0.000002),
    new Vector3D(16.65493, 16.722095, -0.000002),
    new Vector3D(-17.502232, 37.41943, 0),
    new Vector3D(-19.680687, 30.166288, -0.000001),
    new Vector3D(-12.397648, 10.734774, -0.000002),
    new Vector3D(0, 0, -0.000003),
    new Vector3D(0, 33.160339, -0.000001),
    new Vector3D(0, 13.160341, -0.000002),
    new Vector3D(10, 23.160341, -0.000002),
    new Vector3D(-10, 23.160341, -0.000002),
    new Vector3D(0, 39.328648, 0),
    new Vector3D(-18.827763, 23.444191, -0.000002),
    new Vector3D(-16.65493, 16.722095, -0.000002),
  ],
  edges: createEdges([
    [8, 0],
    [0, 1],
    [10, 2],
    [2, 3],
    [4, 5],
    [6, 7],
    [1, 9],
    [9, 10],
    [19, 11],
    [11, 12],
    [21, 13],
    [13, 14],
    [15, 16],
    [17, 18],
    [12, 20],
    [20, 21],
  ]),
  color: COLORS.pickup_armor,
};
