export interface SvgEditorDocument {
  document: XMLDocument;
  svg: SVGSVGElement;
}

export interface SvgEditorLayer {
  depth: number;
  id: string;
  tagName: string;
}

export type PrimitiveShapeKind =
  | "circle"
  | "ellipse"
  | "line"
  | "polygon"
  | "polyline"
  | "rect";

export interface EditorPoint {
  x: number;
  y: number;
}

export interface GradientStopInput {
  color: string;
  offset: number;
}

export interface PrimitiveShapeInput {
  fill?: string;
  height?: number;
  id: string;
  kind: PrimitiveShapeKind;
  points?: EditorPoint[];
  r?: number;
  rx?: number;
  ry?: number;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  x?: number;
  x1?: number;
  x2?: number;
  y?: number;
  y1?: number;
  y2?: number;
}

export interface UadAnimationParams {
  amplitude?: number;
  color1?: string;
  color2?: string;
  frequency?: number;
  points?: number;
  speed?: number;
  yEnd?: number;
  yStart?: number;
}

export interface UadMetadataInput {
  audio?: {
    onMax?: string;
    onMin?: string;
    onPeak?: string;
  };
  chomp?: UadAnimationParams;
  collider?: boolean;
  directionBend?: { amount: number; pivotY?: number };
  directionRotation?:
    | boolean
    | {
        DOWN?: number;
        LEFT?: number;
        RIGHT?: number;
        UP?: number;
      };
  flash?: UadAnimationParams;
  material?: {
    chromaticScale?: number;
    phosphorTrail?: number;
  };
  physics?: {
    bounce?: number;
    drag?: number;
    friction?: number;
    height?: number;
    mass?: number;
    radius?: number;
    shape?: "circle" | "rect";
    width?: number;
  };
  pulse?: UadAnimationParams;
  slideRange?: number;
  wave?: UadAnimationParams;
  wobble?: UadAnimationParams;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const LAYER_TAGS = new Set([
  "circle",
  "ellipse",
  "g",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
]);

export function parseSvgEditorDocument(svgSource: string): SvgEditorDocument {
  const document = new DOMParser().parseFromString(svgSource, "image/svg+xml");
  const svg = document.querySelector("svg");

  if (!svg) {
    throw new Error("Invalid SVG: No <svg> element found.");
  }

  return {
    document,
    svg: svg as unknown as SVGSVGElement,
  };
}

export function serializeSvgEditorDocument(editor: SvgEditorDocument): string {
  return new XMLSerializer().serializeToString(editor.svg);
}

export function listSvgLayers(editor: SvgEditorDocument): SvgEditorLayer[] {
  const layers: SvgEditorLayer[] = [];

  function visit(element: Element, depth: number): void {
    Array.from(element.children).forEach((child) => {
      const tagName = child.tagName.toLowerCase();
      if (!LAYER_TAGS.has(tagName)) return;
      const id = child.getAttribute("id");
      if (id) {
        layers.push({ depth, id, tagName });
      }
      visit(child, depth + 1);
    });
  }

  visit(editor.svg, 0);
  return layers;
}

export function updateSvgElementAttributes(
  editor: SvgEditorDocument,
  elementId: string,
  attributes: Record<string, boolean | number | string | null | undefined>,
): void {
  const element = findElementById(editor, elementId);
  Object.entries(attributes).forEach(([name, value]) => {
    setSerializedAttribute(element, name, value);
  });
}

export function createPrimitiveShape(
  editor: SvgEditorDocument,
  input: PrimitiveShapeInput,
): Element {
  const element = editor.document.createElementNS(SVG_NS, input.kind);
  element.setAttribute("id", input.id);

  if (input.kind === "rect") {
    setShapeAttributes(element, {
      height: input.height ?? 16,
      rx: input.rx,
      ry: input.ry,
      width: input.width ?? 16,
      x: input.x ?? 0,
      y: input.y ?? 0,
    });
  } else if (input.kind === "circle") {
    setShapeAttributes(element, {
      cx: input.x ?? 0,
      cy: input.y ?? 0,
      r: input.r ?? Math.min(input.width ?? 12, input.height ?? 12) / 2,
    });
  } else if (input.kind === "ellipse") {
    setShapeAttributes(element, {
      cx: input.x ?? 0,
      cy: input.y ?? 0,
      rx: input.rx ?? (input.width ?? 16) / 2,
      ry: input.ry ?? (input.height ?? 12) / 2,
    });
  } else if (input.kind === "line") {
    setShapeAttributes(element, {
      x1: input.x1 ?? input.x ?? 0,
      x2: input.x2 ?? (input.x ?? 0) + (input.width ?? 16),
      y1: input.y1 ?? input.y ?? 0,
      y2: input.y2 ?? input.y ?? 0,
    });
  } else if (input.kind === "polygon" || input.kind === "polyline") {
    element.setAttribute(
      "points",
      formatPoints(input.points ?? defaultPolygonPoints(input)),
    );
  }

  setSerializedAttribute(element, "fill", input.fill ?? "none");
  setSerializedAttribute(element, "stroke", input.stroke ?? "#66ffff");
  setSerializedAttribute(element, "stroke-width", input.strokeWidth);
  editor.svg.appendChild(element);
  return element;
}

export function createPenPath(
  editor: SvgEditorDocument,
  input: {
    closed?: boolean;
    fill?: string;
    id: string;
    points: EditorPoint[];
    stroke?: string;
    strokeWidth?: number;
  },
): Element {
  if (input.points.length === 0) {
    throw new Error("Cannot create a path without points.");
  }

  const path = editor.document.createElementNS(SVG_NS, "path");
  const [first, ...rest] = input.points;
  path.setAttribute(
    "d",
    [
      `M ${formatNumber(first.x)} ${formatNumber(first.y)}`,
      ...rest.map(
        (point) => `L ${formatNumber(point.x)} ${formatNumber(point.y)}`,
      ),
      input.closed ? "Z" : "",
    ]
      .filter(Boolean)
      .join(" "),
  );
  path.setAttribute("id", input.id);
  path.setAttribute("fill", input.fill ?? "none");
  path.setAttribute("stroke", input.stroke ?? "#66ffff");
  setSerializedAttribute(path, "stroke-width", input.strokeWidth);
  editor.svg.appendChild(path);
  return path;
}

export function moveSvgPoint(
  editor: SvgEditorDocument,
  elementId: string,
  pointIndex: number,
  point: EditorPoint,
): void {
  const element = findElementById(editor, elementId);
  const tagName = element.tagName.toLowerCase();

  if (tagName === "polygon" || tagName === "polyline") {
    const points = parsePoints(element.getAttribute("points") ?? "");
    if (!points[pointIndex]) {
      throw new Error(`Point ${pointIndex} does not exist on ${elementId}.`);
    }
    points[pointIndex] = point;
    element.setAttribute("points", formatPoints(points));
    return;
  }

  if (tagName === "path") {
    element.setAttribute(
      "d",
      moveLinePathPoint(element.getAttribute("d") ?? "", pointIndex, point),
    );
    return;
  }

  throw new Error(`<${tagName}> does not expose editable points.`);
}

export function createGradientFill(
  editor: SvgEditorDocument,
  input: {
    id: string;
    stops: GradientStopInput[];
    targetId?: string;
  },
): Element {
  const defs = getOrCreateDefs(editor);
  findElementByIdOptional(editor, input.id)?.remove();

  const gradient = editor.document.createElementNS(SVG_NS, "linearGradient");
  gradient.setAttribute("id", input.id);
  gradient.setAttribute("x1", "0%");
  gradient.setAttribute("x2", "100%");
  gradient.setAttribute("y1", "0%");
  gradient.setAttribute("y2", "0%");

  input.stops.forEach((stopInput) => {
    const stop = editor.document.createElementNS(SVG_NS, "stop");
    stop.setAttribute("offset", `${formatNumber(stopInput.offset * 100)}%`);
    stop.setAttribute("stop-color", stopInput.color);
    gradient.appendChild(stop);
  });

  defs.appendChild(gradient);
  if (input.targetId) {
    updateSvgElementAttributes(editor, input.targetId, {
      fill: `url(#${input.id})`,
    });
  }
  return gradient;
}

export function createSocket(
  editor: SvgEditorDocument,
  input: { id: string; type?: string; x: number; y: number },
): Element {
  const socket = editor.document.createElementNS(SVG_NS, "g");
  socket.setAttribute("id", input.id);
  socket.setAttribute(
    "transform",
    `translate(${formatNumber(input.x)} ${formatNumber(input.y)})`,
  );
  socket.setAttribute("data-socket-type", input.type ?? "spawn");
  editor.svg.appendChild(socket);
  return socket;
}

export function writeUadMetadata(
  editor: SvgEditorDocument,
  elementId: string,
  metadata: UadMetadataInput,
): void {
  const element = findElementById(editor, elementId);

  writeAnimation(element, "data-anim-wave", metadata.wave);
  writeAnimation(element, "data-anim-wobble", metadata.wobble);
  writeAnimation(element, "data-anim-chomp", metadata.chomp);
  writeAnimation(element, "data-anim-flash", metadata.flash);
  writeAnimation(element, "data-anim-pulse", metadata.pulse);

  if ("slideRange" in metadata) {
    setSerializedAttribute(element, "data-slide-range", metadata.slideRange);
  }
  if (metadata.directionBend) {
    element.setAttribute(
      "data-direction-bend",
      formatDataParams(metadata.directionBend, ["amount", "pivotY"]),
    );
  }
  if (metadata.directionRotation !== undefined) {
    element.setAttribute(
      "data-direction-rotation",
      metadata.directionRotation === true
        ? "true"
        : JSON.stringify(metadata.directionRotation),
    );
  }

  if (metadata.material) {
    if ("phosphorTrail" in metadata.material) {
      setSerializedAttribute(
        element,
        "data-material-phosphor-trail",
        metadata.material.phosphorTrail,
      );
    }
    if ("chromaticScale" in metadata.material) {
      setSerializedAttribute(
        element,
        "data-material-chromatic-scale",
        metadata.material.chromaticScale,
      );
    }
  }
  if (metadata.audio) {
    if ("onMax" in metadata.audio) {
      setSerializedAttribute(element, "data-on-anim-max", metadata.audio.onMax);
    }
    if ("onMin" in metadata.audio) {
      setSerializedAttribute(element, "data-on-anim-min", metadata.audio.onMin);
    }
    if ("onPeak" in metadata.audio) {
      setSerializedAttribute(
        element,
        "data-on-anim-peak",
        metadata.audio.onPeak,
      );
    }
  }

  if (metadata.collider === true) {
    addClassName(element, "physics-collider");
  }
  if (metadata.physics) {
    if ("shape" in metadata.physics) {
      setSerializedAttribute(
        element,
        "data-physics-shape",
        metadata.physics.shape,
      );
    }
    if ("radius" in metadata.physics) {
      setSerializedAttribute(element, "data-radius", metadata.physics.radius);
    }
    if ("width" in metadata.physics) {
      setSerializedAttribute(element, "data-width", metadata.physics.width);
    }
    if ("height" in metadata.physics) {
      setSerializedAttribute(element, "data-height", metadata.physics.height);
    }
    if ("mass" in metadata.physics) {
      setSerializedAttribute(element, "data-mass", metadata.physics.mass);
    }
    if ("bounce" in metadata.physics) {
      setSerializedAttribute(element, "data-bounce", metadata.physics.bounce);
    }
    if ("drag" in metadata.physics) {
      setSerializedAttribute(element, "data-drag", metadata.physics.drag);
    }
    if ("friction" in metadata.physics) {
      setSerializedAttribute(
        element,
        "data-friction",
        metadata.physics.friction,
      );
    }
  }
}

function findElementById(
  editor: SvgEditorDocument,
  elementId: string,
): Element {
  const element = findElementByIdOptional(editor, elementId);
  if (!element) {
    throw new Error(`SVG element "${elementId}" was not found.`);
  }
  return element;
}

function findElementByIdOptional(
  editor: SvgEditorDocument,
  elementId: string,
): Element | null {
  return (
    Array.from(editor.svg.querySelectorAll("*")).find(
      (element) => element.getAttribute("id") === elementId,
    ) ?? null
  );
}

function getOrCreateDefs(editor: SvgEditorDocument): Element {
  const existing = Array.from(editor.svg.children).find(
    (child) => child.tagName.toLowerCase() === "defs",
  );
  if (existing) return existing;

  const defs = editor.document.createElementNS(SVG_NS, "defs");
  editor.svg.insertBefore(defs, editor.svg.firstChild);
  return defs;
}

function setShapeAttributes(
  element: Element,
  attributes: Record<string, number | undefined>,
): void {
  Object.entries(attributes).forEach(([name, value]) => {
    setSerializedAttribute(element, name, value);
  });
}

function setSerializedAttribute(
  element: Element,
  name: string,
  value: boolean | number | string | null | undefined,
): void {
  if (value === null || value === undefined || value === "") {
    element.removeAttribute(name);
    return;
  }
  element.setAttribute(
    name,
    typeof value === "boolean" ? `${value}` : formatValue(value),
  );
}

function addClassName(element: Element, className: string): void {
  const classNames = new Set(
    (element.getAttribute("class") ?? "")
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean),
  );
  classNames.add(className);
  element.setAttribute("class", Array.from(classNames).join(" "));
}

function writeAnimation(
  element: Element,
  attributeName: string,
  params: UadAnimationParams | undefined,
): void {
  if (!params) return;
  element.setAttribute(
    attributeName,
    formatDataParams(params, [
      "frequency",
      "amplitude",
      "speed",
      "points",
      "color1",
      "color2",
      "yStart",
      "yEnd",
    ]),
  );
}

function formatDataParams(value: object, order: string[]): string {
  const record = value as Record<string, number | string | undefined>;
  return order
    .flatMap((key) => {
      const paramValue = record[key];
      return paramValue === undefined
        ? []
        : `${key}:${formatValue(paramValue)}`;
    })
    .join(" ");
}

function defaultPolygonPoints(input: PrimitiveShapeInput): EditorPoint[] {
  const x = input.x ?? 0;
  const y = input.y ?? 0;
  const width = input.width ?? 16;
  const height = input.height ?? 16;
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width / 2, y: y + height },
  ];
}

function parsePoints(pointsAttr: string): EditorPoint[] {
  const values = pointsAttr
    .trim()
    .split(/[\s,]+/)
    .map((part) => Number.parseFloat(part))
    .filter(Number.isFinite);
  const points: EditorPoint[] = [];
  for (let index = 0; index < values.length - 1; index += 2) {
    points.push({ x: values[index], y: values[index + 1] });
  }
  return points;
}

function formatPoints(points: EditorPoint[]): string {
  return points
    .map((point) => `${formatNumber(point.x)},${formatNumber(point.y)}`)
    .join(" ");
}

function moveLinePathPoint(
  d: string,
  pointIndex: number,
  point: EditorPoint,
): string {
  let index = 0;
  return d.replace(
    /([ML])\s*(-?\d+(?:\.\d+)?)\s*,?\s*(-?\d+(?:\.\d+)?)/gi,
    (match, command: string) => {
      const replacement =
        index === pointIndex
          ? `${command.toUpperCase()} ${formatNumber(point.x)} ${formatNumber(point.y)}`
          : match;
      index += 1;
      return replacement;
    },
  );
}

function formatValue(value: number | string): string {
  return typeof value === "number" ? formatNumber(value) : value;
}

function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? value.toFixed(0)
    : Number.parseFloat(value.toFixed(4)).toString();
}
