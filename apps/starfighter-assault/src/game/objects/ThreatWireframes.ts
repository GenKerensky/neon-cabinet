import { Vector3D } from "../engine/Vector3D";
import { createEdges, type WireframeModel } from "../engine/WireframeModel";
import type { WireframeRenderer } from "../engine/WireframeRenderer";
import type { ThreatKind } from "../rail/SegmentTypes";
import type { FlightPoint } from "./RailPlayer";
import { getAliveThreats, type Threat } from "./Threats";

const GLASS_CYAN = 0x7be8ff;
const LASER_PINK = 0xff2bd6;
const LASER_PURPLE = 0x8e44ff;
const WARNING_RED = 0xff4058;

const FIGHTER_MODEL: WireframeModel = {
  vertices: [
    new Vector3D(0, 0, 42),
    new Vector3D(-44, -12, -28),
    new Vector3D(44, -12, -28),
    new Vector3D(0, 18, -12),
    new Vector3D(-78, -4, -48),
    new Vector3D(78, -4, -48),
    new Vector3D(-18, -18, -36),
    new Vector3D(18, -18, -36),
  ],
  edges: [
    ...createEdges([
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [1, 6],
      [2, 7],
      [6, 7],
    ]),
    ...createEdges(
      [
        [1, 4],
        [2, 5],
        [4, 6],
        [5, 7],
      ],
      LASER_PINK,
    ),
  ],
  color: GLASS_CYAN,
};

const ELITE_FIGHTER_MODEL: WireframeModel = {
  vertices: [
    new Vector3D(0, 0, 55),
    new Vector3D(-52, -16, -34),
    new Vector3D(52, -16, -34),
    new Vector3D(0, 24, -18),
    new Vector3D(-96, -2, -58),
    new Vector3D(96, -2, -58),
    new Vector3D(-22, -24, -48),
    new Vector3D(22, -24, -48),
    new Vector3D(0, 2, -78),
  ],
  edges: [
    ...createEdges([
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [1, 6],
      [2, 7],
      [6, 7],
      [6, 8],
      [7, 8],
      [3, 8],
    ]),
    ...createEdges(
      [
        [1, 4],
        [2, 5],
        [4, 6],
        [5, 7],
      ],
      LASER_PINK,
    ),
    ...createEdges([[0, 8]], WARNING_RED),
  ],
  color: LASER_PURPLE,
};

const TURRET_MODEL: WireframeModel = {
  vertices: [
    new Vector3D(-38, -26, -28),
    new Vector3D(38, -26, -28),
    new Vector3D(38, -26, 28),
    new Vector3D(-38, -26, 28),
    new Vector3D(-24, 12, -18),
    new Vector3D(24, 12, -18),
    new Vector3D(24, 12, 18),
    new Vector3D(-24, 12, 18),
    new Vector3D(0, 34, 0),
    new Vector3D(0, 34, 82),
  ],
  edges: [
    ...createEdges([
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
      [4, 8],
      [5, 8],
      [6, 8],
      [7, 8],
    ]),
    ...createEdges([[8, 9]], LASER_PINK),
  ],
  color: GLASS_CYAN,
};

const GUN_EMPLACEMENT_MODEL: WireframeModel = {
  vertices: [
    new Vector3D(-58, -30, -34),
    new Vector3D(58, -30, -34),
    new Vector3D(58, -30, 34),
    new Vector3D(-58, -30, 34),
    new Vector3D(-32, 6, -18),
    new Vector3D(32, 6, -18),
    new Vector3D(32, 6, 18),
    new Vector3D(-32, 6, 18),
    new Vector3D(-16, 20, 18),
    new Vector3D(16, 20, 18),
    new Vector3D(-16, 20, 98),
    new Vector3D(16, 20, 98),
  ],
  edges: [
    ...createEdges([
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
      [9, 11],
      [11, 10],
      [10, 8],
      [6, 8],
      [6, 9],
    ]),
    ...createEdges(
      [
        [8, 10],
        [9, 11],
      ],
      WARNING_RED,
    ),
  ],
  color: LASER_PURPLE,
};

const MINE_MODEL: WireframeModel = {
  vertices: [
    new Vector3D(0, 34, 0),
    new Vector3D(0, -34, 0),
    new Vector3D(-34, 0, 0),
    new Vector3D(34, 0, 0),
    new Vector3D(0, 0, -34),
    new Vector3D(0, 0, 34),
  ],
  edges: [
    ...createEdges([
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
      [2, 4],
      [4, 3],
      [3, 5],
      [5, 2],
    ]),
  ],
  color: WARNING_RED,
};

const SHIELD_NODE_MODEL: WireframeModel = {
  vertices: [
    new Vector3D(-34, -34, -34),
    new Vector3D(34, -34, -34),
    new Vector3D(34, 34, -34),
    new Vector3D(-34, 34, -34),
    new Vector3D(-34, -34, 34),
    new Vector3D(34, -34, 34),
    new Vector3D(34, 34, 34),
    new Vector3D(-34, 34, 34),
    new Vector3D(0, 0, 0),
  ],
  edges: [
    ...createEdges([
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
    ...createEdges(
      [
        [0, 8],
        [1, 8],
        [2, 8],
        [3, 8],
        [4, 8],
        [5, 8],
        [6, 8],
        [7, 8],
      ],
      LASER_PINK,
    ),
  ],
  color: GLASS_CYAN,
};

const DEBRIS_MODEL: WireframeModel = {
  vertices: [
    new Vector3D(-58, -20, -28),
    new Vector3D(22, -34, -12),
    new Vector3D(64, 4, -36),
    new Vector3D(-18, 30, 6),
    new Vector3D(-48, 8, 38),
    new Vector3D(42, 24, 34),
  ],
  edges: createEdges([
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [3, 4],
    [4, 5],
    [5, 1],
    [0, 4],
  ]),
  color: LASER_PURPLE,
};

const THREAT_MODELS: Record<ThreatKind, WireframeModel> = {
  fighter: FIGHTER_MODEL,
  "elite-fighter": ELITE_FIGHTER_MODEL,
  mine: MINE_MODEL,
  turret: TURRET_MODEL,
  "shield-node": SHIELD_NODE_MODEL,
  "gun-emplacement": GUN_EMPLACEMENT_MODEL,
  debris: DEBRIS_MODEL,
};

export function getThreatWireframeModel(kind: ThreatKind): WireframeModel {
  return THREAT_MODELS[kind];
}

export function renderThreatWireframes(
  renderer: WireframeRenderer,
  threats: Threat[],
  playerPosition: FlightPoint,
  screenW: number,
  screenH: number,
): void {
  renderer.clear();

  for (const threat of getAliveThreats(threats)) {
    const model = getThreatWireframeModel(threat.kind);
    const position = new Vector3D(
      threat.x - playerPosition.x * 0.35,
      threat.y - playerPosition.y * 0.18,
      threat.z,
    );
    const rotation = getThreatRotation(threat);
    renderer.render(model, position, rotation, screenW, screenH, model.color);
  }
}

function getThreatRotation(threat: Threat): number {
  if (threat.kind === "turret" || threat.kind === "gun-emplacement") {
    return 0;
  }

  return Math.sin(threat.z * 0.01 + threat.x * 0.03) * 0.18;
}
