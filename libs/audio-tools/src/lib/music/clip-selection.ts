import type { AudioClip, ClipNote } from "../types";
import { pitchToMidi } from "./pitch";

export interface ClipNoteSelectionRange {
  startBeat: number;
  endBeat: number;
  lowMidi: number;
  highMidi: number;
}

export function selectNotesInRange(
  clip: AudioClip,
  range: ClipNoteSelectionRange,
): string[] {
  const startBeat = Math.min(range.startBeat, range.endBeat);
  const endBeat = Math.max(range.startBeat, range.endBeat);
  const lowMidi = Math.min(range.lowMidi, range.highMidi);
  const highMidi = Math.max(range.lowMidi, range.highMidi);

  return sortClipNotes(clip.notes)
    .filter((note) => {
      const noteStart = note.startBeat;
      const noteEnd = note.startBeat + note.durationBeats;
      const midi = pitchToMidi(note.pitch);
      return (
        noteStart < endBeat &&
        noteEnd > startBeat &&
        midi >= lowMidi &&
        midi <= highMidi
      );
    })
    .map((note) => note.id);
}

export function sortClipNotes(notes: ClipNote[]): ClipNote[] {
  return [...notes].sort((a, b) => {
    const startDelta = a.startBeat - b.startBeat;
    if (startDelta !== 0) return startDelta;

    const pitchDelta = pitchToMidi(a.pitch) - pitchToMidi(b.pitch);
    if (pitchDelta !== 0) return pitchDelta;

    return a.id.localeCompare(b.id);
  });
}

export function findNeighborNote(
  clip: AudioClip,
  selectedNoteId: string,
  direction: -1 | 1,
): ClipNote | undefined {
  const sorted = sortClipNotes(clip.notes);
  const selectedIndex = sorted.findIndex((note) => note.id === selectedNoteId);
  if (selectedIndex < 0) return undefined;
  return sorted[selectedIndex + direction];
}
