import type { ClipNotePitch } from "../types";

const SEMITONE_BY_NOTE: Record<ClipNotePitch["note"], number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const SHARP_PITCHES: Array<Omit<ClipNotePitch, "octave">> = [
  { note: "C", accidental: "natural" },
  { note: "C", accidental: "#" },
  { note: "D", accidental: "natural" },
  { note: "D", accidental: "#" },
  { note: "E", accidental: "natural" },
  { note: "F", accidental: "natural" },
  { note: "F", accidental: "#" },
  { note: "G", accidental: "natural" },
  { note: "G", accidental: "#" },
  { note: "A", accidental: "natural" },
  { note: "A", accidental: "#" },
  { note: "B", accidental: "natural" },
];

export function pitchToMidi(pitch: ClipNotePitch): number {
  const accidental =
    pitch.accidental === "#" ? 1 : pitch.accidental === "b" ? -1 : 0;
  return (pitch.octave + 1) * 12 + SEMITONE_BY_NOTE[pitch.note] + accidental;
}

export function midiToPitch(midi: number): ClipNotePitch {
  const normalizedMidi = clamp(Math.round(midi), 0, 127);
  const octave = Math.floor(normalizedMidi / 12) - 1;
  const semitone = ((normalizedMidi % 12) + 12) % 12;
  return { ...SHARP_PITCHES[semitone], octave };
}

export function noteToFrequency(pitch: ClipNotePitch): number {
  return 440 * 2 ** ((pitchToMidi(pitch) - 69) / 12);
}

export function frequencyToPitch(frequency: number): ClipNotePitch {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    return midiToPitch(0);
  }
  return midiToPitch(69 + 12 * Math.log2(frequency / 440));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
