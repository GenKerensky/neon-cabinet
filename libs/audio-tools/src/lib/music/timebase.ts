export const DEFAULT_TIMEBASE = 480;

export function beatsToTicks(
  beats: number,
  timebase = DEFAULT_TIMEBASE,
): number {
  return Math.round(beats * timebase);
}

export function ticksToBeats(
  ticks: number,
  timebase = DEFAULT_TIMEBASE,
): number {
  return ticks / timebase;
}

export function ticksToSeconds(
  ticks: number,
  bpm: number,
  timebase = DEFAULT_TIMEBASE,
): number {
  return ticksToBeats(ticks, timebase) * (60 / bpm);
}

export function secondsToTicks(
  seconds: number,
  bpm: number,
  timebase = DEFAULT_TIMEBASE,
): number {
  return beatsToTicks(seconds / (60 / bpm), timebase);
}
