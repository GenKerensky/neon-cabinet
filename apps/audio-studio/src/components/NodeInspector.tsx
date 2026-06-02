import { AudioNodeConfig } from "@neon-cabinet/audio-tools";
import { Input } from "@neon-cabinet/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@neon-cabinet/ui/components/ui/select";

export function NodeInspector({
  node,
  onUpdate,
}: {
  node: AudioNodeConfig;
  onUpdate(id: string, update: Partial<AudioNodeConfig>): void;
}) {
  const updateNumber = (key: string) => (value: number) =>
    onUpdate(node.id, { [key]: value } as Partial<AudioNodeConfig>);
  const updateText = (key: string) => (value: string) =>
    onUpdate(node.id, { [key]: value } as Partial<AudioNodeConfig>);

  return (
    <div className="control-stack">
      <label>
        Label
        <Input
          onChange={(event) => updateText("label")(event.target.value)}
          value={node.label}
        />
      </label>

      {(node.type === "oscillator" || node.type === "lfo") && (
        <>
          <label>
            Waveform
            <Select
              onValueChange={updateText("waveform")}
              value={node.waveform}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="sine">sine</SelectItem>
                  <SelectItem value="square">square</SelectItem>
                  <SelectItem value="sawtooth">sawtooth</SelectItem>
                  <SelectItem value="triangle">triangle</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>
          <NumberControl
            label="Frequency"
            onChange={updateNumber("frequency")}
            value={node.frequency}
          />
        </>
      )}

      {node.type === "lfo" && (
        <>
          <NumberControl
            label="Depth"
            onChange={updateNumber("depth")}
            value={node.depth}
          />
          <label>
            Target Node
            <Input
              onChange={(event) => updateText("target")(event.target.value)}
              value={node.target}
            />
          </label>
        </>
      )}

      {node.type === "gainEnvelope" && (
        <>
          <NumberControl
            label="Gain"
            onChange={updateNumber("gain")}
            value={node.gain}
          />
          <NumberControl
            label="Attack"
            onChange={updateNumber("attack")}
            step={0.001}
            value={node.attack}
          />
          <NumberControl
            label="Decay"
            onChange={updateNumber("decay")}
            step={0.001}
            value={node.decay}
          />
          <NumberControl
            label="Sustain"
            max={1}
            onChange={updateNumber("sustain")}
            step={0.01}
            value={node.sustain}
          />
          <NumberControl
            label="Release"
            onChange={updateNumber("release")}
            step={0.001}
            value={node.release}
          />
        </>
      )}

      {node.type === "noiseBurst" && (
        <>
          <NumberControl
            label="Gain"
            onChange={updateNumber("gain")}
            value={node.gain}
          />
          <NumberControl
            label="Duration"
            onChange={updateNumber("duration")}
            step={0.01}
            value={node.duration}
          />
          <NumberControl
            label="Filter Frequency"
            onChange={updateNumber("filterFrequency")}
            value={node.filterFrequency ?? 0}
          />
        </>
      )}

      {node.type === "filter" && (
        <>
          <NumberControl
            label="Frequency"
            onChange={updateNumber("frequency")}
            value={node.frequency}
          />
          <NumberControl
            label="Q"
            onChange={updateNumber("q")}
            value={node.q}
          />
        </>
      )}

      {node.type === "stereoPanner" && (
        <NumberControl
          label="Pan"
          max={1}
          min={-1}
          onChange={updateNumber("pan")}
          step={0.01}
          value={node.pan}
        />
      )}

      {node.type === "spatialAttenuation" && (
        <>
          <NumberControl
            label="Max Distance"
            onChange={updateNumber("maxDistance")}
            value={node.maxDistance}
          />
          <NumberControl
            label="Min Gain"
            onChange={updateNumber("minGain")}
            step={0.01}
            value={node.minGain}
          />
          <NumberControl
            label="Max Gain"
            onChange={updateNumber("maxGain")}
            step={0.01}
            value={node.maxGain}
          />
        </>
      )}
    </div>
  );
}

function NumberControl({
  label,
  max,
  min = 0,
  onChange,
  step = 1,
  value,
}: {
  label: string;
  max?: number;
  min?: number;
  onChange(value: number): void;
  step?: number;
  value: number;
}) {
  return (
    <label>
      {label}
      <Input
        aria-label={label}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}
