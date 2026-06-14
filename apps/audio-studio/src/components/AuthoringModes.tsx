import { ClipInstrument, SoundPatch } from "@neon-cabinet/audio-tools";
import { AudioKnob } from "@neon-cabinet/ui/components/audio-knob";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import { Input } from "@neon-cabinet/ui/components/ui/input";
import { GradientSlider } from "@neon-cabinet/ui/components/gradient-slider";
import { WaveformPreview } from "@neon-cabinet/ui/components/waveform-preview";
import {
  addDefaultNote,
  defaultInstrument,
  getPrimaryClip,
  getPrimaryInstrument,
  pitchLabel,
  updateInstrument,
  updateNotePitch,
  updateNoteVelocity,
} from "./authoring-utils";

export { ComposeMode } from "./compose";
export type { ComposePlayhead } from "./compose";

const WAVEFORMS = ["square", "sine", "sawtooth", "triangle", "noise"];

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
              <GradientSlider
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
