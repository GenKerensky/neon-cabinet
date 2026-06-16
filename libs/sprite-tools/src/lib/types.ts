export interface AnimationMetadata {
  type: "wave" | "wobble" | "chomp" | "flash" | "pulse";
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
  hud?: HudBindingMetadata;
}

export interface AudioMetadata {
  onMax?: string;
  onMin?: string;
  onPeak?: string;
}

export interface HudStateStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  visible?: boolean;
}

export interface HudBindingMetadata {
  role?: string;
  bind?: string;
}

export interface HudMetadata extends HudBindingMetadata {
  stateStyles?: Record<string, HudStateStyle>;
}

export type StrokePolicy = "scale" | "screen" | "ignore";

export interface LayerMetadata {
  id: string;
  type:
    | "path"
    | "circle"
    | "ellipse"
    | "rect"
    | "line"
    | "polyline"
    | "polygon"
    | "group";
  d?: string; // For paths
  cx?: number; // For circles
  cy?: number;
  r?: number;
  rx?: number; // For ellipses and rounded rects
  ry?: number;
  x1?: number; // For lines
  y1?: number;
  x2?: number;
  y2?: number;
  points?: { x: number; y: number }[]; // For polylines/polygons
  x?: number; // For rects
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokePolicy?: StrokePolicy;
  opacity?: number;
  transform?: string;
  slideRange?: number;
  directionBend?: DirectionBendMetadata;
  directionRotation?: DirectionRotationMetadata;
  animations: AnimationMetadata[];
  material: MaterialMetadata;
  physics?: PhysicsMetadata;
  audio?: AudioMetadata;
  hud?: HudMetadata;
  visible?: boolean;
  children?: LayerMetadata[];
}

export interface SVGPuppetMetadata {
  viewBox: { x: number; y: number; width: number; height: number };
  layers: LayerMetadata[];
  sockets: SocketMetadata[];
}
