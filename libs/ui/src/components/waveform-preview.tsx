import type { SVGProps } from "react";

export function WaveformPreview({
  className,
  waveform,
}: {
  className?: string;
  waveform: string;
}) {
  return (
    <svg
      aria-label={`${waveform} waveform preview`}
      className={className}
      role="img"
      viewBox="0 0 96 32"
    >
      <title>{waveform} waveform preview</title>
      <path d={pathForWaveform(waveform)} fill="none" />
    </svg>
  );
}

function pathForWaveform(waveform: string): SVGProps<SVGPathElement>["d"] {
  switch (waveform) {
    case "sine":
      return "M4 16 C12 2 20 2 28 16 S44 30 52 16 S68 2 76 16 S88 30 96 16";
    case "sawtooth":
      return "M4 28 L28 4 L28 28 L52 4 L52 28 L76 4 L76 28 L96 8";
    case "triangle":
      return "M4 28 L28 4 L52 28 L76 4 L96 20";
    case "noise":
      return "M4 15 L10 25 L16 8 L23 19 L31 6 L38 28 L45 13 L52 17 L59 5 L66 25 L73 11 L80 21 L88 7 L96 18";
    default:
      return "M4 24 L4 8 L28 8 L28 24 L52 24 L52 8 L76 8 L76 24 L96 24";
  }
}
