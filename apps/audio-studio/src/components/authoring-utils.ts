import {
  AudioClip,
  ClipInstrument,
  ClipNote,
  ClipNotePitch,
  SoundPatch,
} from "@neon-cabinet/audio-tools";

export const DEFAULT_CLIP_ID = "main-clip";
export const DEFAULT_CHANNEL_ID = "pulse-1";
export const DEFAULT_INSTRUMENT_ID = "square-lead";

export function addDefaultNote(patch: SoundPatch): SoundPatch {
  const next = ensureAuthoringData(patch);
  const clip = next.clips?.[0];
  if (!clip) return next;
  const note: ClipNote = {
    id: `note-${clip.notes.length + 1}`,
    channelId: clip.channels[0]?.id ?? DEFAULT_CHANNEL_ID,
    durationBeats: 1,
    instrumentId: next.instruments?.[0]?.id ?? DEFAULT_INSTRUMENT_ID,
    pitch: { accidental: "natural", note: "C", octave: 4 },
    startBeat: clip.notes.length,
    velocity: 0.8,
  };
  return {
    ...next,
    clips: [
      { ...clip, notes: [...clip.notes, note] },
      ...(next.clips ?? []).slice(1),
    ],
    duration: Math.max(
      next.duration,
      (note.startBeat + note.durationBeats) * (60 / clip.bpm),
    ),
  };
}

export function updatePrimaryClipNotes(
  patch: SoundPatch,
  notes: ClipNote[],
): SoundPatch {
  const next = ensureAuthoringData(patch);
  const clip = next.clips?.[0];
  if (!clip) return next;
  return {
    ...next,
    clips: [{ ...clip, notes }, ...(next.clips ?? []).slice(1)],
    duration: Math.max(
      next.duration,
      ...notes.map(
        (note) => (note.startBeat + note.durationBeats) * (60 / clip.bpm),
      ),
    ),
  };
}

export function updateNotePitch(
  patch: SoundPatch,
  noteId: string,
  value: string,
): SoundPatch {
  const pitch = parsePitch(value);
  if (!pitch) return patch;
  return updateClipNotes(patch, (note) =>
    note.id === noteId ? { ...note, pitch } : note,
  );
}

export function updateNoteVelocity(
  patch: SoundPatch,
  noteId: string,
  value: number,
): SoundPatch {
  return updateClipNotes(patch, (note) =>
    note.id === noteId
      ? { ...note, velocity: Math.min(1, Math.max(0, value)) }
      : note,
  );
}

export function updateClipNotes(
  patch: SoundPatch,
  updater: (note: ClipNote) => ClipNote,
): SoundPatch {
  const next = ensureAuthoringData(patch);
  const clip = next.clips?.[0];
  if (!clip) return next;
  return {
    ...next,
    clips: [
      { ...clip, notes: clip.notes.map(updater) },
      ...(next.clips ?? []).slice(1),
    ],
  };
}

export function updateInstrument(
  patch: SoundPatch,
  update: Partial<ClipInstrument>,
): SoundPatch {
  const next = ensureAuthoringData(patch);
  const instrument = next.instruments?.[0] ?? defaultInstrument();
  return {
    ...next,
    instruments: [
      { ...instrument, ...update },
      ...(next.instruments ?? []).slice(1),
    ],
  };
}

export function ensureAuthoringData(patch: SoundPatch): SoundPatch {
  const instruments = patch.instruments?.length
    ? patch.instruments
    : [defaultInstrument()];
  const clips = patch.clips?.length
    ? patch.clips
    : [defaultClip(instruments[0].id)];
  const nodes = patch.nodes.some((node) => node.type === "clipSource")
    ? patch.nodes
    : [
        {
          id: "clip-source",
          type: "clipSource" as const,
          label: "Clip Source",
          position: { x: 120, y: 120 },
          clipId: clips[0].id,
        },
        ...patch.nodes,
      ];
  const output = nodes.find((node) => node.type === "output");
  const connections =
    output &&
    !patch.connections.some((connection) => connection.from === "clip-source")
      ? [{ from: "clip-source", to: output.id }, ...patch.connections]
      : patch.connections;

  return {
    ...patch,
    clips,
    constraintProfileId: patch.constraintProfileId ?? "fantasy",
    connections,
    instruments,
    nodes,
    schemaVersion: 2,
  };
}

export function defaultClip(instrumentId: string): AudioClip {
  return {
    id: DEFAULT_CLIP_ID,
    bpm: 120,
    channels: [{ id: DEFAULT_CHANNEL_ID, engine: "pulse", name: "Pulse 1" }],
    name: "Main Clip",
    notes: [],
    timeSignature: [4, 4],
    type: "music",
  };
}

export function defaultInstrument(): ClipInstrument {
  return {
    id: DEFAULT_INSTRUMENT_ID,
    engine: "pulse",
    envelope: { attack: 0.005, decay: 0.04, release: 0.06, sustain: 0.7 },
    gain: 0.75,
    name: "Square Lead",
    waveform: "square",
  };
}

export function getPrimaryClip(patch: SoundPatch): AudioClip | undefined {
  return patch.clips?.[0];
}

export function getPrimaryInstrument(
  patch: SoundPatch,
): ClipInstrument | undefined {
  return patch.instruments?.[0];
}

export function parsePitch(value: string): ClipNotePitch | null {
  const match = value
    .trim()
    .toUpperCase()
    .match(/^([A-G])([#B]?)(-?\d+)$/);
  if (!match) return null;
  return {
    accidental: match[2] === "#" ? "#" : match[2] === "B" ? "b" : "natural",
    note: match[1] as ClipNotePitch["note"],
    octave: Number(match[3]),
  };
}

export function pitchLabel(pitch: ClipNotePitch): string {
  return `${pitch.note}${pitch.accidental === "natural" ? "" : pitch.accidental}${pitch.octave}`;
}
