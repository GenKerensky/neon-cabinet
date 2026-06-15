import type {
  ClipNote,
  ClipNotePitch,
  SoundPatch,
} from "@neon-cabinet/audio-tools";

export const BEAT_WIDTH = 64;
export const LABEL_WIDTH = 88;
export const NOTE_HEIGHT = 22;
export const ROW_HEIGHT = 30;
export const SNAP_BEATS = 0.25;
export const VISIBLE_BEATS = 16;

const PITCH_CLASSES = [
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
];

export const PIANO_ROWS = Array.from({ length: 49 }, (_value, index) => {
  const midi = 84 - index;
  const octave = Math.floor(midi / 12) - 1;
  return `${PITCH_CLASSES[midi % 12]}${octave}`;
});

export interface ComposePlayhead {
  durationSeconds: number;
  mode: "loop" | "once";
  startedAtMs: number;
}

export interface ComposeModeProps {
  onUpdatePatch(
    updater: (patch: SoundPatch) => SoundPatch,
    status?: string,
  ): void;
  patch: SoundPatch;
  playhead?: ComposePlayhead | null;
}

export interface ComposeNoteRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export type ComposeGesture =
  | {
      draftNotes: ClipNote[];
      noteId: string;
      type: "create";
    }
  | {
      draftNotes: ClipNote[];
      noteId: string;
      startClientX: number;
      startClientY: number;
      startNote: ClipNote;
      type: "move";
    }
  | {
      draftNotes: ClipNote[];
      noteId: string;
      startNote: ClipNote;
      type: "resize";
    };

export type ComposePitch = ClipNotePitch;
