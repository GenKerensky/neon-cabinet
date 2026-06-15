import type { AudioClip, ClipNote } from "../types";
import type { QuantizeSettings } from "./quantize";
import { midiToPitch, pitchToMidi } from "./pitch";
import { quantizeBeat } from "./quantize";
import { sortClipNotes } from "./clip-selection";

const DEFAULT_MIN_DURATION_BEATS = 0.25;

export function moveClipNotes(
  clip: AudioClip,
  noteIds: string[],
  delta: { beatDelta: number; semitoneDelta: number },
): AudioClip {
  const selected = new Set(noteIds);
  return updateClipNotes(clip, (note) => {
    if (!selected.has(note.id)) return note;
    return {
      ...note,
      pitch: midiToPitch(pitchToMidi(note.pitch) + delta.semitoneDelta),
      startBeat: Math.max(0, note.startBeat + delta.beatDelta),
    };
  });
}

export function resizeClipNote(
  clip: AudioClip,
  noteId: string,
  edge: "start" | "end",
  nextBeat: number,
  minDurationBeats = DEFAULT_MIN_DURATION_BEATS,
): AudioClip {
  return updateClipNotes(clip, (note) => {
    if (note.id !== noteId) return note;

    if (edge === "start") {
      const latestStart =
        note.startBeat + note.durationBeats - minDurationBeats;
      const startBeat = Math.max(0, Math.min(nextBeat, latestStart));
      return {
        ...note,
        durationBeats: note.startBeat + note.durationBeats - startBeat,
        startBeat,
      };
    }

    const endBeat = Math.max(nextBeat, note.startBeat + minDurationBeats);
    return {
      ...note,
      durationBeats: endBeat - note.startBeat,
    };
  });
}

export function transposeClipNotes(
  clip: AudioClip,
  noteIds: string[],
  semitoneDelta: number,
): AudioClip {
  const selected = new Set(noteIds);
  return updateClipNotes(clip, (note) => {
    if (!selected.has(note.id)) return note;
    return {
      ...note,
      pitch: midiToPitch(pitchToMidi(note.pitch) + semitoneDelta),
    };
  });
}

export function duplicateClipNotes(
  clip: AudioClip,
  noteIds: string[],
  beatDelta: number,
): AudioClip {
  const selected = new Set(noteIds);
  const existingIds = new Set(clip.notes.map((note) => note.id));
  const copies = clip.notes
    .filter((note) => selected.has(note.id))
    .map((note) => {
      const id = nextCopyId(note.id, existingIds);
      existingIds.add(id);
      return {
        ...note,
        id,
        startBeat: Math.max(0, note.startBeat + beatDelta),
      };
    });

  return {
    ...clip,
    notes: sortClipNotes([...clip.notes, ...copies]),
  };
}

export function deleteClipNotes(clip: AudioClip, noteIds: string[]): AudioClip {
  const selected = new Set(noteIds);
  return {
    ...clip,
    notes: clip.notes.filter((note) => !selected.has(note.id)),
  };
}

export function quantizeClipNotes(
  clip: AudioClip,
  noteIds: string[],
  settings: QuantizeSettings,
): AudioClip {
  const selected = new Set(noteIds);
  return updateClipNotes(clip, (note) => {
    if (!selected.has(note.id)) return note;
    return {
      ...note,
      durationBeats: Math.max(
        DEFAULT_MIN_DURATION_BEATS,
        quantizeBeat(note.durationBeats, settings),
      ),
      startBeat: Math.max(0, quantizeBeat(note.startBeat, settings)),
    };
  });
}

function updateClipNotes(
  clip: AudioClip,
  updater: (note: ClipNote) => ClipNote,
): AudioClip {
  return {
    ...clip,
    notes: sortClipNotes(clip.notes.map(updater)),
  };
}

function nextCopyId(sourceId: string, existingIds: Set<string>): string {
  const baseId = `${sourceId}-copy`;
  if (!existingIds.has(baseId)) return baseId;

  let index = 2;
  while (existingIds.has(`${baseId}-${index}`)) {
    index += 1;
  }
  return `${baseId}-${index}`;
}
