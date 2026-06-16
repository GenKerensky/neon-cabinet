import { Vector3D } from "../engine/Vector3D";
import { createEdges, type WireframeModel } from "../engine/WireframeModel";
import type { WireframeRenderer } from "../engine/WireframeRenderer";

const GLASS_CYAN = 0x7be8ff;
const LASER_PINK = 0xff2bd6;
const LASER_PURPLE = 0x8e44ff;
const ENGINE_BLUE = 0x25a7ff;

const PLAYER_SHIP_MODEL: WireframeModel = {
  vertices: [
    new Vector3D(0, -46, 340),
    new Vector3D(-36, -74, 130),
    new Vector3D(36, -74, 130),
    new Vector3D(0, -28, 152),
    new Vector3D(-84, -40, 76),
    new Vector3D(84, -40, 76),
    new Vector3D(-122, -56, 116),
    new Vector3D(122, -56, 116),
    new Vector3D(-208, -72, 192),
    new Vector3D(208, -72, 192),
    new Vector3D(-116, 18, 170),
    new Vector3D(116, 18, 170),
    new Vector3D(-92, -18, 70),
    new Vector3D(-136, -18, 202),
    new Vector3D(-94, -48, 70),
    new Vector3D(-138, -48, 202),
    new Vector3D(-118, -8, 112),
    new Vector3D(-158, -10, 240),
    new Vector3D(-118, -58, 112),
    new Vector3D(-160, -58, 240),
    new Vector3D(92, -18, 70),
    new Vector3D(136, -18, 202),
    new Vector3D(94, -48, 70),
    new Vector3D(138, -48, 202),
    new Vector3D(118, -8, 112),
    new Vector3D(158, -10, 240),
    new Vector3D(118, -58, 112),
    new Vector3D(160, -58, 240),
    new Vector3D(-32, -82, 92),
    new Vector3D(32, -82, 92),
    new Vector3D(0, -88, 230),
    new Vector3D(-18, -58, 286),
    new Vector3D(18, -58, 286),
  ],
  edges: [
    ...createEdges([
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [1, 4],
      [2, 5],
      [4, 5],
      [1, 28],
      [2, 29],
      [28, 30],
      [29, 30],
      [30, 0],
      [31, 0],
      [32, 0],
      [31, 32],
    ]),
    ...createEdges(
      [
        [4, 6],
        [6, 8],
        [8, 10],
        [10, 6],
        [6, 1],
        [5, 7],
        [7, 9],
        [9, 11],
        [11, 7],
        [7, 2],
      ],
      LASER_PURPLE,
    ),
    ...createEdges(
      [
        [12, 13],
        [14, 15],
        [12, 14],
        [13, 15],
        [16, 17],
        [18, 19],
        [16, 18],
        [17, 19],
        [20, 21],
        [22, 23],
        [20, 22],
        [21, 23],
        [24, 25],
        [26, 27],
        [24, 26],
        [25, 27],
      ],
      LASER_PINK,
    ),
    ...createEdges(
      [
        [13, 17],
        [15, 19],
        [21, 25],
        [23, 27],
      ],
      ENGINE_BLUE,
    ),
  ],
  color: GLASS_CYAN,
};

export function getPlayerShipWireframeModel(): WireframeModel {
  return PLAYER_SHIP_MODEL;
}

export function renderPlayerShipWireframe(
  renderer: WireframeRenderer,
  screenW: number,
  screenH: number,
): void {
  const model = getPlayerShipWireframeModel();
  renderer.clear();
  renderer.render(model, Vector3D.zero(), 0, screenW, screenH, model.color);
}
