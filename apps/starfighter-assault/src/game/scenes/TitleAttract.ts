export interface TitleRadarContact {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export interface TitleAttractState {
  loopProgress: number;
  capitalShip: {
    scale: number;
    y: number;
    alpha: number;
  };
  radarSweep: number;
  titleFlicker: number;
  starOffset: number;
  radarContacts: TitleRadarContact[];
}

const LOOP_DURATION_MS = 8000;
const BASE_CONTACTS: Array<{ x: number; y: number; phase: number }> = [
  { x: -0.58, y: -0.22, phase: 0 },
  { x: -0.22, y: 0.16, phase: 0.18 },
  { x: 0.05, y: -0.36, phase: 0.36 },
  { x: 0.32, y: 0.08, phase: 0.54 },
  { x: 0.62, y: -0.1, phase: 0.72 },
];

export function createTitleAttractState(timeMs: number): TitleAttractState {
  const loopProgress = normalizeLoop(timeMs / LOOP_DURATION_MS);
  const flybyPulse = Math.sin(loopProgress * Math.PI);
  const titleFlicker =
    0.74 + Math.sin(loopProgress * Math.PI * 22) * 0.1 + flybyPulse * 0.14;

  return {
    loopProgress,
    capitalShip: {
      scale: round(0.65 + flybyPulse * 0.5),
      y: round(-0.16 + flybyPulse * 0.2),
      alpha: round(0.32 + flybyPulse * 0.34),
    },
    radarSweep: loopProgress * Math.PI * 2,
    titleFlicker: round(clamp(titleFlicker, 0.58, 1)),
    starOffset: loopProgress,
    radarContacts: BASE_CONTACTS.map((contact) => {
      const pulse = 0.5 + Math.sin((loopProgress + contact.phase) * Math.PI * 2) * 0.5;
      return {
        x: contact.x,
        y: contact.y,
        radius: round(3 + pulse * 3),
        alpha: round(0.45 + pulse * 0.5),
      };
    }),
  };
}

function normalizeLoop(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
