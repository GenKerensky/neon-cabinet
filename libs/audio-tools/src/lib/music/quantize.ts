import { beatsToTicks, DEFAULT_TIMEBASE, ticksToBeats } from "./timebase";

export type QuantizeMode = "straight" | "dotted" | "triplet";
export type QuantizeRounding = "round" | "floor" | "ceil";

export interface QuantizeSettings {
  denominator: 1 | 2 | 4 | 8 | 16 | 32 | 64;
  mode: QuantizeMode;
  rounding?: QuantizeRounding;
  timebase?: number;
}

export function quantizeUnitTicks(settings: QuantizeSettings): number {
  const timebase = settings.timebase ?? DEFAULT_TIMEBASE;
  const straightUnit = timebase * (4 / settings.denominator);

  if (settings.mode === "dotted") {
    return Math.round(straightUnit * 1.5);
  }

  if (settings.mode === "triplet") {
    return Math.round(straightUnit * (2 / 3));
  }

  return Math.round(straightUnit);
}

export function quantizeTick(tick: number, settings: QuantizeSettings): number {
  const unit = quantizeUnitTicks(settings);
  const rounding = settings.rounding ?? "round";
  const quotient = tick / unit;

  if (rounding === "floor") return Math.floor(quotient) * unit;
  if (rounding === "ceil") return Math.ceil(quotient) * unit;
  return Math.round(quotient) * unit;
}

export function quantizeBeat(beat: number, settings: QuantizeSettings): number {
  const timebase = settings.timebase ?? DEFAULT_TIMEBASE;
  return ticksToBeats(
    quantizeTick(beatsToTicks(beat, timebase), settings),
    timebase,
  );
}
