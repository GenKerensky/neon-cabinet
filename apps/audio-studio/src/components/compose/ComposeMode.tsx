import {
  AudioClip,
  ClipInstrument,
  ClipNote,
  noteToFrequency,
} from "@neon-cabinet/audio-tools";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  addDefaultNote,
  ensureAuthoringData,
  getPrimaryClip,
  getPrimaryInstrument,
  updatePrimaryClipNotes,
} from "../authoring-utils";
import {
  BEAT_WIDTH,
  ROW_HEIGHT,
  SNAP_BEATS,
  type ComposeGesture,
  type ComposeModeProps,
} from "./compose-types";
import { createComposeTransform } from "./use-compose-transform";
import { NoteLayer } from "./NoteLayer";
import { PianoRollViewport } from "./PianoRollViewport";
import { PlayheadLayer } from "./PlayheadLayer";

export function ComposeMode({
  onUpdatePatch,
  patch,
  playhead,
}: ComposeModeProps) {
  const clip = getPrimaryClip(patch);
  const gridRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gestureRef = useRef<ComposeGesture | null>(null);
  const transform = useMemo(() => createComposeTransform(), []);
  const [gesture, setGesture] = useState<ComposeGesture | null>(null);
  const [playheadBeat, setPlayheadBeat] = useState(0);
  const notes = gesture?.draftNotes ?? clip?.notes ?? [];
  const clipDurationBeats = getClipDurationBeats(clip, patch.duration);
  const showPlayhead = Boolean(playhead && clip);

  useEffect(() => {
    setActiveGesture(null);
  }, [clip?.id, patch.id]);

  useEffect(() => {
    if (!playhead || !clip) {
      setPlayheadBeat(0);
      return;
    }

    let animationFrame = 0;
    const beatSeconds = 60 / clip.bpm;

    const tick = () => {
      const elapsedSeconds =
        (globalThis.performance.now() - playhead.startedAtMs) / 1000;
      const elapsedBeats = elapsedSeconds / beatSeconds;
      const nextBeat =
        playhead.mode === "loop"
          ? elapsedBeats % Math.max(SNAP_BEATS, clipDurationBeats)
          : Math.min(clipDurationBeats, elapsedBeats);
      setPlayheadBeat(nextBeat);

      if (playhead.mode === "loop" || elapsedBeats < clipDurationBeats) {
        animationFrame = globalThis.requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      globalThis.cancelAnimationFrame(animationFrame);
    };
  }, [clip, clipDurationBeats, playhead]);

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

  function deleteNote(noteId: string): void {
    commitNotes(
      (clip?.notes ?? []).filter((note) => note.id !== noteId),
      "NOTE DELETED",
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
              pitch: transform.rowToPitch(
                transform.rowForPitch(currentGesture.startNote.pitch) +
                  rowDelta,
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

  function beatFromPointer(event: PointerEvent<HTMLElement>): number {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    return snapBeat(transform.xToBeat(event.clientX - rect.left));
  }

  function rowFromPointer(event: PointerEvent<HTMLElement>): number {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    return transform.rowForPitch(transform.yToPitch(event.clientY - rect.top));
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
      <PianoRollViewport
        gridRef={gridRef}
        onPointerDown={handleGridPointerDown}
        onPointerMove={handleGridPointerMove}
        onPointerUp={handleGridPointerUp}
      >
        {showPlayhead ? <PlayheadLayer beat={playheadBeat} /> : null}
        <NoteLayer
          notes={notes}
          onDeleteNote={deleteNote}
          onNotePointerDown={handleNotePointerDown}
          onResizePointerDown={handleResizePointerDown}
          transform={transform}
        />
      </PianoRollViewport>
    </section>
  );

  function createNoteAtPointer(
    event: PointerEvent<HTMLElement>,
    sourceClip: AudioClip,
    sourcePatch: typeof patch,
  ): ClipNote {
    return {
      id: `note-${Date.now()}-${sourceClip.notes.length + 1}`,
      channelId: sourceClip.channels[0]?.id ?? "pulse-1",
      durationBeats: 1,
      instrumentId: sourcePatch.instruments?.[0]?.id ?? "square-lead",
      pitch: transform.rowToPitch(rowFromPointer(event)),
      startBeat: beatFromPointer(event),
      velocity: 0.8,
    };
  }
}

function getClipDurationBeats(
  clip: AudioClip | undefined,
  fallbackDurationSeconds: number,
): number {
  if (!clip) return Math.max(SNAP_BEATS, fallbackDurationSeconds * 2);
  const noteEndBeat = clip.notes.reduce(
    (longest, note) => Math.max(longest, note.startBeat + note.durationBeats),
    0,
  );
  const patchDurationBeats = fallbackDurationSeconds / (60 / clip.bpm);
  return Math.max(SNAP_BEATS, noteEndBeat, patchDurationBeats);
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
