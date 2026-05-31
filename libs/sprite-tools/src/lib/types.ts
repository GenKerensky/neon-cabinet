export interface AnimationMetadata {
  type: "wave" | "wobble" | "chomp" | "flash";
  frequency: number;
  amplitude: number;
  speed?: number;
  points?: number;
  color1?: string;
  color2?: string;
  yStart?: number;
  yEnd?: number;
}

export interface MaterialMetadata {
  phosphorTrail?: number;
  chromaticScale?: number;
}

export interface DirectionBendMetadata {
  amount: number;
  pivotY?: number;
}

export interface DirectionRotationMetadata {
  RIGHT: number;
  DOWN: number;
  LEFT: number;
  UP: number;
}

export interface PhysicsMetadata {
  shape: "circle" | "rect";
  radius?: number;
  width?: number;
  height?: number;
  mass?: number;
  bounce?: number;
  drag?: number;
  friction?: number;
}

export interface SocketMetadata {
  id: string;
  x: number;
  y: number;
  type: string;
}

export interface AudioMetadata {
  onMax?: string;
  onMin?: string;
  onPeak?: string;
}

export interface LayerMetadata {
  id: string;
  type: "path" | "circle" | "rect" | "group";
  d?: string; // For paths
  cx?: number; // For circles
  cy?: number;
  r?: number;
  x?: number; // For rects
  y?: number;
  width?: number;
  height?: number;
  rx?: number;
  ry?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  transform?: string;
  slideRange?: number;
  directionBend?: DirectionBendMetadata;
  directionRotation?: DirectionRotationMetadata;
  animations: AnimationMetadata[];
  material: MaterialMetadata;
  physics?: PhysicsMetadata;
  audio?: AudioMetadata;
  visible?: boolean;
  children?: LayerMetadata[];
}

export interface SVGPuppetMetadata {
  viewBox: { x: number; y: number; width: number; height: number };
  layers: LayerMetadata[];
  sockets: SocketMetadata[];
}
