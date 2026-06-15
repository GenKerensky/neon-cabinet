export interface RadarThreat {
  id: string;
  x: number;
  y: number;
  z: number;
  threat: number;
}

export interface RadarDot {
  id: string;
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
}

const MAX_RANGE = 1_800;
const HALF_WIDTH = 700;
const FAR_THREAT_COLOR = "#ff9a9a";
const CLOSE_THREAT_COLOR = "#ff3b3b";

export function projectThreatsToRadar(threats: RadarThreat[]): RadarDot[] {
  return threats
    .filter((threat) => threat.z > 0 && distanceToThreat(threat) <= MAX_RANGE)
    .map((threat) => {
      const distance = distanceToThreat(threat);
      const proximity = 1 - clamp(distance / MAX_RANGE, 0, 1);
      const threatLevel = clamp(threat.threat, 0, 1);
      const intensity = clamp(proximity * 0.65 + threatLevel * 0.35, 0, 1);

      return {
        id: threat.id,
        x: clamp(threat.x / HALF_WIDTH, -1, 1),
        y: clamp(1 - (threat.z / MAX_RANGE) * 2, -1, 1),
        radius: round(3 + proximity * 4 + threatLevel * 2),
        alpha: round(clamp(0.3 + proximity * 0.45 + threatLevel * 0.25, 0, 1)),
        color: intensity >= 0.55 ? CLOSE_THREAT_COLOR : FAR_THREAT_COLOR,
      };
    });
}

function distanceToThreat(threat: RadarThreat): number {
  return Math.hypot(threat.x, threat.y, threat.z);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
