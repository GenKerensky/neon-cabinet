import { useRef } from "react";

import { cn } from "../lib/utils";

export function AudioKnob({
  className,
  label,
  max,
  min,
  onChange,
  step = 0.01,
  value,
}: {
  className?: string;
  label: string;
  max: number;
  min: number;
  onChange(value: number): void;
  step?: number;
  value: number;
}) {
  const dragRef = useRef<{
    startValue: number;
    startX: number;
    startY: number;
  } | null>(null);
  const percent = (value - min) / Math.max(0.0001, max - min);
  const clampedPercent = Math.max(0, Math.min(1, percent));
  const angle = -135 + clampedPercent * 270;
  const pointer = polarToPoint(50, 50, 28, angle);
  const range = max - min;
  const ticks = Array.from({ length: 11 }, (_, index) => {
    const tickAngle = -135 + index * 27;
    const outer = polarToPoint(50, 50, 45, tickAngle);
    const inner = polarToPoint(50, 50, index % 5 === 0 ? 38 : 41, tickAngle);
    return { inner, outer };
  });

  function commitValue(nextValue: number): void {
    const stepped = Math.round(nextValue / step) * step;
    const precision = decimalPlaces(step);
    onChange(Number(clamp(stepped, min, max).toFixed(precision)));
  }

  return (
    <div className={cn("audio-knob-control", className)}>
      <div
        className="audio-knob-face"
        aria-hidden="true"
        onPointerDown={(event) => {
          dragRef.current = {
            startValue: value,
            startX: event.clientX,
            startY: event.clientY,
          };
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag) return;
          const verticalDelta = drag.startY - event.clientY;
          const horizontalDelta = event.clientX - drag.startX;
          const normalizedDelta =
            (verticalDelta + horizontalDelta * 0.35) / 120;
          commitValue(drag.startValue + normalizedDelta * range);
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      >
        <svg className="audio-knob-svg" viewBox="0 0 100 100">
          <path
            className="audio-knob-scale"
            d={describeArc(50, 50, 45, -135, 135)}
          />
          {ticks.map((tick, index) => (
            <line
              className="audio-knob-tick"
              key={index}
              x1={formatNumber(tick.inner.x)}
              x2={formatNumber(tick.outer.x)}
              y1={formatNumber(tick.inner.y)}
              y2={formatNumber(tick.outer.y)}
            />
          ))}
          <text className="audio-knob-label" x="18" y="84">
            -20dB
          </text>
          <text className="audio-knob-label audio-knob-label-end" x="82" y="84">
            +40dB
          </text>
          <circle className="audio-knob-body" cx="50" cy="50" r="30" />
          <circle className="audio-knob-cap" cx="50" cy="50" r="10" />
          <line
            className="audio-knob-pointer"
            x1="50"
            x2={formatNumber(pointer.x)}
            y1="50"
            y2={formatNumber(pointer.y)}
          />
        </svg>
      </div>
      <input
        aria-label={`${label} knob`}
        className="audio-knob-slider"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function decimalPlaces(step: number): number {
  const decimal = String(step).split(".")[1];
  return decimal?.length ?? 0;
}

function polarToPoint(
  centerX: number,
  centerY: number,
  radius: number,
  angleDegrees: number,
): { x: number; y: number } {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY + radius * Math.sin(angleRadians),
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToPoint(centerX, centerY, radius, endAngle);
  const end = polarToPoint(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    formatNumber(start.x),
    formatNumber(start.y),
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    formatNumber(end.x),
    formatNumber(end.y),
  ].join(" ");
}

function formatNumber(value: number): string {
  return String(Number(value.toFixed(2)));
}
