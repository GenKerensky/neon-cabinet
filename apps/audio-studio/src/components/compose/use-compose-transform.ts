import type { ClipNote, ClipNotePitch } from "@neon-cabinet/audio-tools";
import { pitchLabel, parsePitch } from "../authoring-utils";
import {
  BEAT_WIDTH,
  LABEL_WIDTH,
  NOTE_HEIGHT,
  PIANO_ROWS,
  ROW_HEIGHT,
  type ComposeNoteRect,
} from "./compose-types";

export interface ComposeTransformOptions {
  beatWidth?: number;
  labelWidth?: number;
  maxMidi?: number;
  noteHeight?: number;
  rowHeight?: number;
}

export interface ComposeTransform {
  beatToX(beat: number): number;
  noteToRect(note: ClipNote): ComposeNoteRect;
  pitchToY(pitch: ClipNotePitch): number;
  rowToPitch(row: number): ClipNotePitch;
  rowForPitch(pitch: ClipNotePitch): number;
  xToBeat(x: number): number;
  yToPitch(y: number): ClipNotePitch;
}

export function createComposeTransform(
  options: ComposeTransformOptions = {},
): ComposeTransform {
  const beatWidth = options.beatWidth ?? BEAT_WIDTH;
  const labelWidth = options.labelWidth ?? LABEL_WIDTH;
  const noteHeight = options.noteHeight ?? NOTE_HEIGHT;
  const rowHeight = options.rowHeight ?? ROW_HEIGHT;
  const maxMidi = options.maxMidi ?? 84;
  const rows = rowsForMaxMidi(maxMidi);

  return {
    beatToX(beat) {
      return labelWidth + beat * beatWidth;
    },
    noteToRect(note) {
      return {
        height: noteHeight,
        left: this.beatToX(note.startBeat),
        top: this.pitchToY(note.pitch),
        width: Math.max(32, note.durationBeats * beatWidth),
      };
    },
    pitchToY(pitch) {
      return (
        rowForPitchInRows(rows, pitch) * rowHeight +
        (rowHeight - noteHeight) / 2
      );
    },
    rowForPitch(pitch) {
      return rowForPitchInRows(rows, pitch);
    },
    rowToPitch(row) {
      return pitchForRowInRows(rows, row);
    },
    xToBeat(x) {
      return Math.max(0, (x - labelWidth) / beatWidth);
    },
    yToPitch(y) {
      return pitchForRowInRows(rows, Math.floor(y / rowHeight));
    },
  };
}

function rowsForMaxMidi(maxMidi: number): string[] {
  if (maxMidi === 84) return PIANO_ROWS;
  return Array.from({ length: 49 }, (_value, index) => {
    const midi = maxMidi - index;
    const octave = Math.floor(midi / 12) - 1;
    const pitchClass = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ][((midi % 12) + 12) % 12];
    return `${pitchClass}${octave}`;
  });
}

function pitchForRowInRows(rows: string[], row: number): ClipNotePitch {
  return (
    parsePitch(rows[Math.max(0, Math.min(rows.length - 1, row))]) ?? {
      accidental: "natural",
      note: "C",
      octave: 4,
    }
  );
}

function rowForPitchInRows(rows: string[], pitch: ClipNotePitch): number {
  const index = rows.indexOf(pitchLabel(pitch));
  return index === -1 ? rows.length - 1 : index;
}
