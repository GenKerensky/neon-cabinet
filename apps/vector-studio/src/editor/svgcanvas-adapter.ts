import SvgCanvas from "@svgedit/svgcanvas";

export type VectorEditorMode =
  | "circle"
  | "ellipse"
  | "fhpath"
  | "line"
  | "pathedit"
  | "polygon"
  | "polyline"
  | "rect"
  | "select";

export interface VectorEditorAdapterEvents {
  onChange(svgSource: string, selectedElementIds: string[]): void;
  onSelectionChange(selectedElementIds: string[]): void;
}

export interface VectorEditorAdapter {
  deleteSelection(): void;
  destroy(): void;
  getSelectedElementIds(): string[];
  getSvgSource(): string;
  loadSvg(svgSource: string): void;
  selectElementById(elementId: string): void;
  setMode(mode: VectorEditorMode): void;
  setSelectedAttributes(
    attributes: Record<string, boolean | number | string | null>,
  ): void;
}

export type CreateVectorEditorAdapter = (
  container: HTMLElement,
  events: VectorEditorAdapterEvents,
) => VectorEditorAdapter;

type RawSvgCanvas = SvgCanvas & {
  getSelectedElements(): Array<Element | null | undefined>;
};

const SVG_CANVAS_WIDTH = 640;
const SVG_CANVAS_HEIGHT = 480;

export const createSvgCanvasAdapter: CreateVectorEditorAdapter = (
  container,
  events,
) => new SvgCanvasVectorEditorAdapter(container, events);

class SvgCanvasVectorEditorAdapter implements VectorEditorAdapter {
  private readonly canvas: RawSvgCanvas;
  private readonly container: HTMLElement;
  private readonly events: VectorEditorAdapterEvents;
  private loading = false;

  constructor(container: HTMLElement, events: VectorEditorAdapterEvents) {
    this.container = container;
    this.events = events;
    this.canvas = new SvgCanvas(container, {
      canvasName: "vector-studio-svgcanvas",
      dimensions: [640, 480],
      imgPath: "",
      initFill: { color: "66ffff", opacity: 1 },
      initOpacity: 1,
      initStroke: { color: "66ffff", opacity: 1, width: 1.5 },
      initTool: "select",
      selectNew: true,
      selectionColor: "#66ffff",
      show_outside_canvas: true,
      text: {
        font_family: "monospace",
        font_size: 16,
        stroke_width: 0,
      },
    }) as RawSvgCanvas;

    this.canvas.bind("selected", () => {
      this.events.onSelectionChange(this.getSelectedElementIds());
    });
    this.canvas.bind("changed", () => {
      this.emitChange();
    });
    this.canvas.bind("sourcechanged", () => {
      this.emitChange();
    });
  }

  loadSvg(svgSource: string): void {
    this.loading = true;
    this.canvas.setSvgString(svgSource, true);
    this.canvas.setMode("select");
    this.loading = false;
    this.events.onSelectionChange(this.getSelectedElementIds());
  }

  getSvgSource(): string {
    return normalizeSvgCanvasOutput(this.canvas.getSvgString());
  }

  setMode(mode: VectorEditorMode): void {
    this.canvas.setMode(mode);
  }

  getSelectedElementIds(): string[] {
    return this.canvas.getSelectedElements().flatMap((element) => {
      const id = element?.getAttribute("id");
      return id && id !== "svgcontent" ? [id] : [];
    });
  }

  selectElementById(elementId: string): void {
    const element = findElementById(this.canvas.getSvgContent(), elementId);
    if (!element) return;
    this.canvas.selectOnly([element], true);
    this.events.onSelectionChange(this.getSelectedElementIds());
  }

  setSelectedAttributes(
    attributes: Record<string, boolean | number | string | null>,
  ): void {
    const selectedElements = this.canvas
      .getSelectedElements()
      .filter((element): element is Element => Boolean(element));
    if (selectedElements.length === 0) return;

    Object.entries(attributes).forEach(([name, value]) => {
      if (value === null) {
        selectedElements.forEach((element) => element.removeAttribute(name));
        return;
      }
      this.canvas.changeSelectedAttribute(
        name,
        typeof value === "boolean" ? `${value}` : value,
      );
    });
    this.emitChange();
  }

  deleteSelection(): void {
    this.canvas.deleteSelectedElements();
    this.emitChange();
  }

  destroy(): void {
    this.container.innerHTML = "";
  }

  private emitChange(): void {
    if (this.loading) return;
    this.events.onChange(this.getSvgSource(), this.getSelectedElementIds());
  }
}

function findElementById(root: Element, elementId: string): Element | null {
  return (
    Array.from(root.querySelectorAll("[id]")).find(
      (element) => element.getAttribute("id") === elementId,
    ) ?? null
  );
}

export function normalizeSvgCanvasOutputForTests(svgSource: string): string {
  return normalizeSvgCanvasOutput(svgSource);
}

function normalizeSvgCanvasOutput(svgSource: string): string {
  const document = new DOMParser().parseFromString(svgSource, "image/svg+xml");
  const svg = document.querySelector("svg");
  svg?.removeAttribute("id");
  svg?.removeAttribute("overflow");
  const viewBox = svg ? parseViewBox(svg) : null;

  svg
    ?.querySelectorAll(":scope > g.layer")
    .forEach((layerGroup) => unwrapSvgCanvasLayer(layerGroup));

  document
    .querySelectorAll(
      [
        "#selectorParentGroup",
        "#canvasBackground",
        "title",
        ".svg-editor-selected-node",
        ".svgjs-editor-root",
      ].join(","),
    )
    .forEach((node) => node.remove());
  if (svg && viewBox) normalizeGeneratedGeometry(svg, viewBox);
  return new XMLSerializer().serializeToString(
    document.querySelector("svg") ?? document.documentElement,
  );
}

function unwrapSvgCanvasLayer(layerGroup: Element): void {
  const parent = layerGroup.parentNode;
  if (!parent) return;

  Array.from(layerGroup.childNodes)
    .filter(
      (child) =>
        child.nodeType !== Node.ELEMENT_NODE ||
        (child as Element).tagName.toLowerCase() !== "title",
    )
    .forEach((child) => parent.insertBefore(child, layerGroup));
  parent.removeChild(layerGroup);
}

interface SvgViewBox {
  height: number;
  minX: number;
  minY: number;
  width: number;
}

function parseViewBox(svg: Element): SvgViewBox | null {
  const viewBox = svg
    .getAttribute("viewBox")
    ?.trim()
    .split(/[\s,]+/)
    .map((value) => Number(value));
  if (
    viewBox?.length === 4 &&
    viewBox.every((value) => Number.isFinite(value))
  ) {
    const [minX, minY, width, height] = viewBox;
    if (width > 0 && height > 0) return { height, minX, minY, width };
  }

  const width = parseSvgNumber(svg.getAttribute("width"));
  const height = parseSvgNumber(svg.getAttribute("height"));
  if (width && height) return { height, minX: 0, minY: 0, width };
  return null;
}

function normalizeGeneratedGeometry(svg: Element, viewBox: SvgViewBox): void {
  Array.from(svg.querySelectorAll("[id^='svg_']")).forEach((element) => {
    if (!shouldNormalizeGeneratedElement(element, viewBox)) return;
    scaleAttributes(element, viewBox);
  });
}

function shouldNormalizeGeneratedElement(
  element: Element,
  viewBox: SvgViewBox,
): boolean {
  const xAttrs = ["x", "x1", "x2", "cx"];
  const yAttrs = ["y", "y1", "y2", "cy"];
  const widthAttrs = ["width", "rx"];
  const heightAttrs = ["height", "ry"];
  const radiusAttrs = ["r"];

  return (
    hasOutOfBoundsCoordinate(element, xAttrs, viewBox.minX, viewBox.width) ||
    hasOutOfBoundsCoordinate(element, yAttrs, viewBox.minY, viewBox.height) ||
    hasOversizedLength(element, widthAttrs, viewBox.width) ||
    hasOversizedLength(element, heightAttrs, viewBox.height) ||
    hasOversizedLength(
      element,
      radiusAttrs,
      Math.min(viewBox.width, viewBox.height),
    ) ||
    hasOutOfBoundsPoints(element, viewBox)
  );
}

function hasOutOfBoundsCoordinate(
  element: Element,
  attributes: string[],
  origin: number,
  size: number,
): boolean {
  return attributes.some((attribute) => {
    const value = parseSvgNumber(element.getAttribute(attribute));
    if (value === null) return false;
    return value < origin - size || value > origin + size * 2;
  });
}

function hasOversizedLength(
  element: Element,
  attributes: string[],
  size: number,
): boolean {
  return attributes.some((attribute) => {
    const value = parseSvgNumber(element.getAttribute(attribute));
    return value !== null && value > size * 2;
  });
}

function hasOutOfBoundsPoints(element: Element, viewBox: SvgViewBox): boolean {
  const points = element.getAttribute("points");
  if (!points) return false;
  return readPointPairs(points).some(
    ([x, y]) =>
      x < viewBox.minX - viewBox.width ||
      x > viewBox.minX + viewBox.width * 2 ||
      y < viewBox.minY - viewBox.height ||
      y > viewBox.minY + viewBox.height * 2,
  );
}

function scaleAttributes(element: Element, viewBox: SvgViewBox): void {
  const xScale = viewBox.width / SVG_CANVAS_WIDTH;
  const yScale = viewBox.height / SVG_CANVAS_HEIGHT;
  const radiusScale = Math.min(xScale, yScale);

  scaleNumberAttributes(
    element,
    ["x", "x1", "x2", "cx"],
    (value) => viewBox.minX + value * xScale,
  );
  scaleNumberAttributes(
    element,
    ["y", "y1", "y2", "cy"],
    (value) => viewBox.minY + value * yScale,
  );
  scaleNumberAttributes(element, ["width", "rx"], (value) => value * xScale);
  scaleNumberAttributes(element, ["height", "ry"], (value) => value * yScale);
  scaleNumberAttributes(element, ["r"], (value) => value * radiusScale);
  scalePointsAttribute(element, viewBox, xScale, yScale);
  scalePathAttribute(element, viewBox, xScale, yScale);
}

function scaleNumberAttributes(
  element: Element,
  attributes: string[],
  scale: (value: number) => number,
): void {
  attributes.forEach((attribute) => {
    const value = parseSvgNumber(element.getAttribute(attribute));
    if (value === null) return;
    element.setAttribute(attribute, formatSvgNumber(scale(value)));
  });
}

function scalePointsAttribute(
  element: Element,
  viewBox: SvgViewBox,
  xScale: number,
  yScale: number,
): void {
  const points = element.getAttribute("points");
  if (!points) return;
  const scaledPoints = readPointPairs(points).map(([x, y]) =>
    [
      formatSvgNumber(viewBox.minX + x * xScale),
      formatSvgNumber(viewBox.minY + y * yScale),
    ].join(","),
  );
  element.setAttribute("points", scaledPoints.join(" "));
}

function scalePathAttribute(
  element: Element,
  viewBox: SvgViewBox,
  xScale: number,
  yScale: number,
): void {
  const path = element.getAttribute("d");
  if (!path) return;

  let coordinateIndex = 0;
  const scaledPath = path.replace(
    /-?\d*\.?\d+(?:e[-+]?\d+)?/gi,
    (rawValue, offset, fullPath) => {
      const previousCommand = findPreviousPathCommand(fullPath, offset);
      if (previousCommand && ["H", "h"].includes(previousCommand)) {
        return formatSvgNumber(viewBox.minX + Number(rawValue) * xScale);
      }
      if (previousCommand && ["V", "v"].includes(previousCommand)) {
        return formatSvgNumber(viewBox.minY + Number(rawValue) * yScale);
      }

      const isXCoordinate = coordinateIndex % 2 === 0;
      coordinateIndex += 1;
      return formatSvgNumber(
        isXCoordinate
          ? viewBox.minX + Number(rawValue) * xScale
          : viewBox.minY + Number(rawValue) * yScale,
      );
    },
  );
  element.setAttribute("d", scaledPath);
}

function findPreviousPathCommand(path: string, offset: number): string | null {
  for (let index = offset; index >= 0; index -= 1) {
    const character = path[index];
    if (/[a-z]/i.test(character)) return character;
  }
  return null;
}

function readPointPairs(points: string): Array<[number, number]> {
  const values = points
    .trim()
    .split(/[\s,]+/)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const pairs: Array<[number, number]> = [];
  for (let index = 0; index < values.length - 1; index += 2) {
    pairs.push([values[index], values[index + 1]]);
  }
  return pairs;
}

function parseSvgNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatSvgNumber(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? "0" : `${rounded}`;
}
