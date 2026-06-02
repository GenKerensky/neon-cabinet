import {
  AudioClip,
  ClipInstrument,
  ClipNote,
  ClipNotePitch,
  noteToFrequency,
  SoundPatch,
} from "@neon-cabinet/audio-tools";
import { AudioKnob } from "@neon-cabinet/ui/components/audio-knob";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import { Input } from "@neon-cabinet/ui/components/ui/input";
import { Slider } from "@neon-cabinet/ui/components/ui/slider";
import { WaveformPreview } from "@neon-cabinet/ui/components/waveform-preview";
import { PointerEvent, useEffect, useRef, useState } from "react";

const DEFAULT_CLIP_ID = "main-clip";
const DEFAULT_CHANNEL_ID = "pulse-1";
const DEFAULT_INSTRUMENT_ID = "square-lead";
const BEAT_WIDTH = 64;
const LABEL_WIDTH = 88;
const NOTE_HEIGHT = 22;
const ROW_HEIGHT = 30;
const SNAP_BEATS = 0.25;
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
const PIANO_ROWS = Array.from({ length: 49 }, (_value, index) => {
  const midi = 84 - index;
  const octave = Math.floor(midi / 12) - 1;
  return `${PITCH_CLASSES[midi % 12]}${octave}`;
});
const WAVEFORMS = ["square", "sine", "sawtooth", "triangle", "noise"];

type ComposeGesture =
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

export function ComposeMode({
  onUpdatePatch,
  patch,
}: {
  onUpdatePatch(
    updater: (patch: SoundPatch) => SoundPatch,
    status?: string,
  ): void;
  patch: SoundPatch;
}) {
  const clip = getPrimaryClip(patch);
  const gridRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gestureRef = useRef<ComposeGesture | null>(null);
  const [gesture, setGesture] = useState<ComposeGesture | null>(null);
  const notes = gesture?.draftNotes ?? clip?.notes ?? [];

  useEffect(() => {
    setActiveGesture(null);
  }, [clip?.id, patch.id]);

  function setActiveGesture(nextGesture: ComposeGesture | null): void {
    gestureRef.current = nextGesture;
    setGesture(nextGesture);
  }

  function playNote(note: ClipNote): void {
    const AudioContextConstructor =
      globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AudioContextConstructor) return;

    const audioContext =
      audioContextRef.current ?? new AudioContextConstructor();
    audioContextRef.current = audioContext;
    void audioContext.resume?.();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = waveformForAudition(
      getPrimaryInstrument(patch)?.waveform,
    );
    oscillator.frequency.value = noteToFrequency(note.pitch);
    gain.gain.value = Math.max(0.02, Math.min(0.9, note.velocity * 0.45));
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(
      now + Math.min(0.45, Math.max(0.08, note.durationBeats * 0.18)),
    );
  }

  function commitNotes(draftNotes: ClipNote[], status = "NOTES EDITED"): void {
    onUpdatePatch(
      (current) => updatePrimaryClipNotes(current, draftNotes),
      status,
    );
  }

  function handleGridPointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest(".piano-note")) return;

    const next = ensureAuthoringData(patch);
    const nextClip = next.clips?.[0];
    if (!nextClip) return;
    const note = createNoteAtPointer(event, nextClip, next);
    playNote(note);
    setActiveGesture({
      draftNotes: [...nextClip.notes, note],
      noteId: note.id,
      type: "create",
    });
    capturePointerSafely(event.currentTarget, event.pointerId);
  }

  function handleNotePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    note: ClipNote,
  ): void {
    if (event.button !== 0) return;
    event.stopPropagation();
    playNote(note);
    setActiveGesture({
      draftNotes: clip?.notes ?? [],
      noteId: note.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startNote: note,
      type: "move",
    });
    capturePointerSafely(event.currentTarget, event.pointerId);
  }

  function handleResizePointerDown(
    event: PointerEvent<HTMLSpanElement>,
    note: ClipNote,
  ): void {
    if (event.button !== 0) return;
    event.stopPropagation();
    setActiveGesture({
      draftNotes: clip?.notes ?? [],
      noteId: note.id,
      startNote: note,
      type: "resize",
    });
    capturePointerSafely(event.currentTarget, event.pointerId);
  }

  function handleGridPointerMove(event: PointerEvent<HTMLDivElement>): void {
    const currentGesture = gestureRef.current;
    if (!currentGesture) return;

    if (currentGesture.type === "create") {
      const beat = beatFromPointer(event);
      const draftNotes = currentGesture.draftNotes.map((note) =>
        note.id === currentGesture.noteId
          ? {
              ...note,
              durationBeats: Math.max(
                SNAP_BEATS,
                snapBeat(beat - note.startBeat + SNAP_BEATS),
              ),
            }
          : note,
      );
      setActiveGesture({ ...currentGesture, draftNotes });
      return;
    }

    if (currentGesture.type === "move") {
      const rowDelta = Math.round(
        (event.clientY - currentGesture.startClientY) / ROW_HEIGHT,
      );
      const beatDelta = snapBeat(
        (event.clientX - currentGesture.startClientX) / BEAT_WIDTH,
      );
      const draftNotes = currentGesture.draftNotes.map((note) =>
        note.id === currentGesture.noteId
          ? {
              ...note,
              pitch: pitchForRow(
                rowIndexForPitch(currentGesture.startNote.pitch) + rowDelta,
              ),
              startBeat: Math.max(
                0,
                snapBeat(currentGesture.startNote.startBeat + beatDelta),
              ),
            }
          : note,
      );
      setActiveGesture({ ...currentGesture, draftNotes });
      return;
    }

    const beat = beatFromPointer(event);
    const draftNotes = currentGesture.draftNotes.map((note) =>
      note.id === currentGesture.noteId
        ? {
            ...note,
            durationBeats: Math.max(
              SNAP_BEATS,
              snapBeat(beat - currentGesture.startNote.startBeat),
            ),
          }
        : note,
    );
    setActiveGesture({ ...currentGesture, draftNotes });
  }

  function handleGridPointerUp(): void {
    const currentGesture = gestureRef.current;
    if (!currentGesture) return;
    commitNotes(
      currentGesture.draftNotes,
      currentGesture.type === "create" ? "NOTE ADDED" : "NOTES EDITED",
    );
    setActiveGesture(null);
  }

  return (
    <section
      className="mode-panel compose-mode"
      onKeyDown={(event) => {
        if (event.key.toLowerCase() === "a") {
          onUpdatePatch(addDefaultNote, "NOTE ADDED");
        }
      }}
      tabIndex={0}
    >
      <div className="mode-toolbar">
        <strong>Compose</strong>
        <Button
          onClick={() => onUpdatePatch(addDefaultNote, "NOTE ADDED")}
          type="button"
        >
          Add note
        </Button>
      </div>
      <div className="piano-roll">
        <div className="beat-ruler">
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index}>
              Bar {Math.floor(index / 4) + 1}.{(index % 4) + 1}
            </span>
          ))}
        </div>
        <div
          aria-label="Piano roll note grid"
          className="piano-grid"
          onPointerDown={handleGridPointerDown}
          onPointerMove={handleGridPointerMove}
          onPointerUp={handleGridPointerUp}
          ref={gridRef}
          role="grid"
        >
          <div className="piano-key-column">
            {PIANO_ROWS.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
          <div aria-hidden="true" className="piano-note-lanes" />
          {notes.map((note) => (
            <button
              aria-label={`Audition ${pitchLabel(note.pitch)} note`}
              className="piano-note"
              key={note.id}
              onPointerDown={(event) => handleNotePointerDown(event, note)}
              style={{
                left: `${LABEL_WIDTH + note.startBeat * BEAT_WIDTH}px`,
                top: `${rowIndexForPitch(note.pitch) * ROW_HEIGHT + (ROW_HEIGHT - NOTE_HEIGHT) / 2}px`,
                width: `${Math.max(32, note.durationBeats * BEAT_WIDTH)}px`,
              }}
              type="button"
            >
              {pitchLabel(note.pitch)}
              <span
                aria-label={`Resize ${pitchLabel(note.pitch)} note`}
                className="piano-note-resize"
                onPointerDown={(event) => handleResizePointerDown(event, note)}
                role="slider"
                tabIndex={0}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrackerMode({
  onUpdatePatch,
  patch,
}: {
  onUpdatePatch(
    updater: (patch: SoundPatch) => SoundPatch,
    status?: string,
  ): void;
  patch: SoundPatch;
}) {
  const clip = getPrimaryClip(patch);
  const notes = clip?.notes ?? [];

  return (
    <section className="mode-panel tracker-mode">
      <div className="mode-toolbar">
        <strong>Tracker</strong>
        <Button
          onClick={() => onUpdatePatch(addDefaultNote, "NOTE ADDED")}
          type="button"
        >
          Insert row
        </Button>
      </div>
      <div className="tracker-table" role="table">
        <div className="tracker-row tracker-head" role="row">
          <span>Row</span>
          <span>Note</span>
          <span>Instrument</span>
          <span>Volume</span>
          <span>FX</span>
          <span>Value</span>
        </div>
        {notes.length === 0 ? (
          <p className="empty-state">No tracker notes</p>
        ) : (
          notes.map((note, index) => (
            <div className="tracker-row" key={note.id} role="row">
              <span>{String(index).padStart(2, "0")}</span>
              <Input
                aria-label={`Tracker note ${index + 1} pitch`}
                onChange={(event) =>
                  onUpdatePatch(
                    (current) =>
                      updateNotePitch(current, note.id, event.target.value),
                    "NOTE EDITED",
                  )
                }
                value={pitchLabel(note.pitch)}
              />
              <span>{note.instrumentId}</span>
              <Input
                aria-label={`Tracker note ${index + 1} velocity`}
                max={1}
                min={0}
                onChange={(event) =>
                  onUpdatePatch(
                    (current) =>
                      updateNoteVelocity(
                        current,
                        note.id,
                        Number(event.target.value),
                      ),
                    "NOTE EDITED",
                  )
                }
                step={0.01}
                type="number"
                value={note.velocity}
              />
              <span>ARP</span>
              <span>00</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function InstrumentMode({
  onUpdatePatch,
  patch,
}: {
  onUpdatePatch(
    updater: (patch: SoundPatch) => SoundPatch,
    status?: string,
  ): void;
  patch: SoundPatch;
}) {
  const instrument = getPrimaryInstrument(patch);
  const gain = instrument?.gain ?? 0.75;
  const waveform = instrument?.waveform ?? "square";

  return (
    <section className="mode-panel instrument-mode">
      <div className="mode-toolbar">
        <strong>Instrument</strong>
        <span>{instrument?.name ?? "Square Lead"}</span>
      </div>
      <div className="instrument-panel">
        <div className="instrument-module waveform-module">
          <h3>Waveform</h3>
          <div className="waveform-grid">
            {WAVEFORMS.map((candidate) => (
              <Button
                className={
                  candidate === waveform
                    ? "waveform-button active"
                    : "waveform-button"
                }
                key={candidate}
                onClick={() =>
                  onUpdatePatch(
                    (current) =>
                      updateInstrument(current, {
                        waveform: candidate as ClipInstrument["waveform"],
                      }),
                    "INSTRUMENT EDITED",
                  )
                }
                type="button"
                variant="outline"
              >
                <WaveformPreview waveform={candidate} />
                <span>{candidate}</span>
              </Button>
            ))}
          </div>
        </div>
        <div className="instrument-module knob-module">
          <h3>Voice</h3>
          <label>
            Gain
            <AudioKnob
              label="Gain"
              max={1}
              min={0}
              onChange={(value) =>
                onUpdatePatch(
                  (current) => updateInstrument(current, { gain: value }),
                  "INSTRUMENT EDITED",
                )
              }
              value={gain}
            />
            <Input
              aria-label="Gain value"
              max={1}
              min={0}
              onChange={(event) =>
                onUpdatePatch(
                  (current) =>
                    updateInstrument(current, {
                      gain: Number(event.target.value),
                    }),
                  "INSTRUMENT EDITED",
                )
              }
              step={0.01}
              type="number"
              value={gain}
            />
          </label>
        </div>
        <div className="instrument-module envelope-module">
          <h3>ADSR</h3>
          {(["attack", "decay", "sustain", "release"] as const).map((key) => (
            <label key={key}>
              {key}
              <Slider
                max={key === "sustain" ? 1 : 0.5}
                min={0}
                onValueChange={([value]) =>
                  onUpdatePatch(
                    (current) =>
                      updateInstrument(current, {
                        envelope: {
                          ...(getPrimaryInstrument(current)?.envelope ??
                            defaultInstrument().envelope),
                          [key]: value,
                        },
                      }),
                    "INSTRUMENT EDITED",
                  )
                }
                step={0.001}
                value={[
                  instrument?.envelope[key] ??
                    defaultInstrument().envelope[key],
                ]}
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

function addDefaultNote(patch: SoundPatch): SoundPatch {
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

function createNoteAtPointer(
  event: PointerEvent<HTMLElement>,
  clip: AudioClip,
  patch: SoundPatch,
): ClipNote {
  const row = rowFromPointer(event);
  const startBeat = beatFromPointer(event);
  return {
    id: `note-${Date.now()}-${clip.notes.length + 1}`,
    channelId: clip.channels[0]?.id ?? DEFAULT_CHANNEL_ID,
    durationBeats: 1,
    instrumentId: patch.instruments?.[0]?.id ?? DEFAULT_INSTRUMENT_ID,
    pitch: pitchForRow(row),
    startBeat,
    velocity: 0.8,
  };
}

function updatePrimaryClipNotes(
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

function updateNotePitch(
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

function updateNoteVelocity(
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

function updateClipNotes(
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

function updateInstrument(
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

function ensureAuthoringData(patch: SoundPatch): SoundPatch {
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

function defaultClip(instrumentId: string): AudioClip {
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

function defaultInstrument(): ClipInstrument {
  return {
    id: DEFAULT_INSTRUMENT_ID,
    engine: "pulse",
    envelope: { attack: 0.005, decay: 0.04, release: 0.06, sustain: 0.7 },
    gain: 0.75,
    name: "Square Lead",
    waveform: "square",
  };
}

function getPrimaryClip(patch: SoundPatch): AudioClip | undefined {
  return patch.clips?.[0];
}

function getPrimaryInstrument(patch: SoundPatch): ClipInstrument | undefined {
  return patch.instruments?.[0];
}

function beatFromPointer(event: PointerEvent<HTMLElement>): number {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = Math.max(0, event.clientX - rect.left - LABEL_WIDTH);
  return snapBeat(x / BEAT_WIDTH);
}

function rowFromPointer(event: PointerEvent<HTMLElement>): number {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  return Math.max(
    0,
    Math.min(
      PIANO_ROWS.length - 1,
      Math.floor((event.clientY - rect.top) / ROW_HEIGHT),
    ),
  );
}

function pitchForRow(row: number): ClipNotePitch {
  return (
    parsePitch(
      PIANO_ROWS[Math.max(0, Math.min(PIANO_ROWS.length - 1, row))],
    ) ?? { accidental: "natural", note: "C", octave: 4 }
  );
}

function snapBeat(value: number): number {
  return Number((Math.round(value / SNAP_BEATS) * SNAP_BEATS).toFixed(2));
}

function waveformForAudition(
  waveform: ClipInstrument["waveform"] | undefined,
): OscillatorType {
  if (
    waveform === "sine" ||
    waveform === "square" ||
    waveform === "sawtooth" ||
    waveform === "triangle"
  ) {
    return waveform;
  }
  return "square";
}

function capturePointerSafely(element: HTMLElement, pointerId: number): void {
  try {
    element.setPointerCapture?.(pointerId);
  } catch {
    // Synthetic pointer events used by QA tools can be uncapturable.
  }
}

function parsePitch(value: string): ClipNotePitch | null {
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

function pitchLabel(pitch: ClipNotePitch): string {
  return `${pitch.note}${pitch.accidental === "natural" ? "" : pitch.accidental}${pitch.octave}`;
}

function rowIndexForPitch(pitch: ClipNotePitch): number {
  const index = PIANO_ROWS.indexOf(pitchLabel(pitch));
  return index === -1 ? PIANO_ROWS.length - 1 : index;
}
