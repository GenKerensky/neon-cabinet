import { Button } from "@neon-cabinet/ui/components/ui/button";
import { GradientSlider } from "@neon-cabinet/ui/components/gradient-slider";
import { PauseIcon, PlayIcon, RepeatIcon } from "lucide-react";
import { PreviewKey } from "../hooks/use-studio-history";

export function TransportControls({
  distance,
  intensity,
  isLooping,
  onPlayPreview,
  onToggleLoop,
  onUpdatePreviewValue,
  pan,
  statusText,
  valid,
}: {
  distance: number;
  intensity: number;
  isLooping: boolean;
  onPlayPreview(): void;
  onToggleLoop(): void;
  onUpdatePreviewValue(key: PreviewKey, value: number): void;
  pan: number;
  statusText: string;
  valid: boolean;
}) {
  return (
    <footer className="transport">
      <Button onClick={onPlayPreview} type="button" variant="outline">
        <PlayIcon data-icon="inline-start" />
        Play
      </Button>
      <Button onClick={onToggleLoop} type="button" variant="outline">
        {isLooping ? (
          <PauseIcon data-icon="inline-start" />
        ) : (
          <RepeatIcon data-icon="inline-start" />
        )}
        {isLooping ? "Stop" : "Loop"}
      </Button>
      <SliderControl
        label="Distance"
        max={1600}
        min={0}
        onChange={(value) => onUpdatePreviewValue("distance", value)}
        value={distance}
      />
      <SliderControl
        label="Pan"
        max={1}
        min={-1}
        onChange={(value) => onUpdatePreviewValue("pan", value)}
        step={0.01}
        value={pan}
      />
      <SliderControl
        label="Intensity"
        max={1.5}
        min={0}
        onChange={(value) => onUpdatePreviewValue("intensity", value)}
        step={0.01}
        value={intensity}
      />
      <span className={valid ? "status ok" : "status error"}>{statusText}</span>
    </footer>
  );
}

function SliderControl({
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange(value: number): void;
  step?: number;
  value: number;
}) {
  return (
    <label>
      {label}
      <GradientSlider
        aria-label={label}
        max={max}
        min={min}
        onValueChange={([nextValue]) => onChange(nextValue ?? value)}
        step={step}
        value={[value]}
      />
    </label>
  );
}
