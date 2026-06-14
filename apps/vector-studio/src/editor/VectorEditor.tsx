import { Button } from "@neon-cabinet/ui/components/ui/button";
import { GradientSlider } from "@neon-cabinet/ui/components/gradient-slider";
import { ScrollArea } from "@neon-cabinet/ui/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@neon-cabinet/ui/components/ui/tooltip";
import {
  Circle,
  Crosshair,
  MousePointer2,
  Palette,
  PenTool,
  Pentagon,
  Slash,
  Sparkles,
  Spline,
  Square,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createGradientFill,
  createSocket,
  listSvgLayers,
  parseSvgEditorDocument,
  serializeSvgEditorDocument,
  writeUadMetadata,
  type SvgEditorDocument,
} from "./svg-editor-model";
import {
  createSvgCanvasAdapter,
  type CreateVectorEditorAdapter,
  type VectorEditorAdapter,
  type VectorEditorMode,
} from "./svgcanvas-adapter";

export type VectorEditorTool =
  | "circle"
  | "ellipse"
  | "line"
  | "node"
  | "pen"
  | "polygon"
  | "polyline"
  | "rect"
  | "select";

export interface VectorEditorProps {
  assetLabel: string;
  createAdapter?: CreateVectorEditorAdapter;
  dirty: boolean;
  onApplyPreview(): void;
  onChange(svgSource: string, selectedElementId: string): void;
  selectedElementId: string;
  svgSource: string;
}

const toolGroups: Array<{
  tools: Array<{
    icon: LucideIcon;
    label: string;
    mode: VectorEditorMode;
    value: VectorEditorTool;
  }>;
}> = [
  {
    tools: [
      { icon: MousePointer2, label: "Select", mode: "select", value: "select" },
      { icon: Waypoints, label: "Node", mode: "pathedit", value: "node" },
      { icon: PenTool, label: "Pen", mode: "fhpath", value: "pen" },
    ],
  },
  {
    tools: [
      { icon: Square, label: "Rect", mode: "rect", value: "rect" },
      { icon: Circle, label: "Circle", mode: "circle", value: "circle" },
      { icon: Circle, label: "Ellipse", mode: "ellipse", value: "ellipse" },
      { icon: Slash, label: "Line", mode: "line", value: "line" },
      { icon: Pentagon, label: "Polygon", mode: "polygon", value: "polygon" },
      { icon: Spline, label: "Polyline", mode: "polyline", value: "polyline" },
    ],
  },
];

export function VectorEditor({
  assetLabel,
  createAdapter = createSvgCanvasAdapter,
  dirty,
  onApplyPreview,
  onChange,
  selectedElementId,
  svgSource,
}: VectorEditorProps) {
  const [activeTool, setActiveTool] = useState<VectorEditorTool>("select");
  const [currentSelectedId, setCurrentSelectedId] = useState(selectedElementId);
  const [workingSource, setWorkingSource] = useState(svgSource);
  const adapterRef = useRef<VectorEditorAdapter | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const commandCountRef = useRef(0);
  const currentSelectedIdRef = useRef(selectedElementId);
  const onChangeRef = useRef(onChange);
  const workingSourceRef = useRef(svgSource);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const commitSource = useCallback(
    (nextSource: string, nextSelectedId = currentSelectedIdRef.current) => {
      workingSourceRef.current = nextSource;
      currentSelectedIdRef.current = nextSelectedId;
      setWorkingSource(nextSource);
      setCurrentSelectedId(nextSelectedId);
      onChangeRef.current(nextSource, nextSelectedId);
    },
    [],
  );

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const adapter = createAdapter(container, {
      onChange(nextSource, selectedElementIds) {
        commitSource(
          nextSource,
          selectedElementIds[0] ?? currentSelectedIdRef.current,
        );
      },
      onSelectionChange(selectedElementIds) {
        const nextSelectedId = selectedElementIds[0] ?? "";
        currentSelectedIdRef.current = nextSelectedId;
        setCurrentSelectedId(nextSelectedId);
      },
    });
    adapterRef.current = adapter;
    adapter.loadSvg(svgSource);
    if (selectedElementId) {
      adapter.selectElementById(selectedElementId);
    }

    return () => {
      adapterRef.current = null;
      adapter.destroy();
    };
  }, [commitSource, createAdapter]);

  useEffect(() => {
    if (workingSourceRef.current === svgSource) return;
    workingSourceRef.current = svgSource;
    setWorkingSource(svgSource);
    adapterRef.current?.loadSvg(svgSource);
    if (selectedElementId) {
      adapterRef.current?.selectElementById(selectedElementId);
    }
  }, [selectedElementId, svgSource]);

  useEffect(() => {
    currentSelectedIdRef.current = selectedElementId;
    setCurrentSelectedId(selectedElementId);
  }, [selectedElementId]);

  const editor = useMemo(
    () => safeParseSvgEditorDocument(workingSource),
    [workingSource],
  );
  const layers = useMemo(() => (editor ? listSvgLayers(editor) : []), [editor]);
  const selectedId =
    currentSelectedId || layers.find((layer) => layer.id)?.id || "";
  const selectedElement = useMemo(
    () => (editor && selectedId ? findElement(editor, selectedId) : null),
    [editor, selectedId],
  );

  const selectTool = (tool: VectorEditorTool, mode: VectorEditorMode) => {
    setActiveTool(tool);
    adapterRef.current?.setMode(mode);
  };

  const selectLayer = (layerId: string) => {
    currentSelectedIdRef.current = layerId;
    setCurrentSelectedId(layerId);
    adapterRef.current?.selectElementById(layerId);
    commitSource(
      adapterRef.current?.getSvgSource() ?? workingSourceRef.current,
      layerId,
    );
  };

  const reloadEditorSource = (
    nextSource: string,
    nextSelectedId = selectedId,
  ) => {
    adapterRef.current?.loadSvg(nextSource);
    if (nextSelectedId) {
      adapterRef.current?.selectElementById(nextSelectedId);
    }
    commitSource(nextSource, nextSelectedId);
  };

  const updateSelectedAttributes = (
    attributes: Record<string, boolean | number | string | null>,
  ) => {
    if (!selectedId) return;
    adapterRef.current?.setSelectedAttributes(attributes);
    commitSource(
      adapterRef.current?.getSvgSource() ?? workingSourceRef.current,
      selectedId,
    );
  };

  const updateSelectedUad = (
    metadata: Parameters<typeof writeUadMetadata>[2],
  ) => {
    if (!selectedId) return;
    const nextEditor = parseSvgEditorDocument(
      adapterRef.current?.getSvgSource() ?? workingSource,
    );
    writeUadMetadata(nextEditor, selectedId, metadata);
    reloadEditorSource(serializeSvgEditorDocument(nextEditor), selectedId);
  };

  const addSocket = () => {
    const nextEditor = parseSvgEditorDocument(
      adapterRef.current?.getSvgSource() ?? workingSource,
    );
    const box = viewBoxForEditor(nextEditor);
    commandCountRef.current += 1;
    const socketId = `socket_${commandCountRef.current}`;
    createSocket(nextEditor, {
      id: socketId,
      type: "spawn",
      x: box.centerX,
      y: box.centerY,
    });
    reloadEditorSource(serializeSvgEditorDocument(nextEditor), socketId);
  };

  const applyGradient = () => {
    if (!selectedId) return;
    const nextEditor = parseSvgEditorDocument(
      adapterRef.current?.getSvgSource() ?? workingSource,
    );
    commandCountRef.current += 1;
    createGradientFill(nextEditor, {
      id: `gradient_${commandCountRef.current}`,
      stops: [
        { color: "#66ffff", offset: 0 },
        { color: "#ff4fd8", offset: 1 },
      ],
      targetId: selectedId,
    });
    reloadEditorSource(serializeSvgEditorDocument(nextEditor), selectedId);
  };

  const markCollider = () => {
    updateSelectedUad({
      collider: true,
      physics: { height: 16, shape: "rect", width: 16 },
    });
  };

  return (
    <TooltipProvider>
      <section
        className="svg-editor-workbench"
        aria-label={`${assetLabel} editor`}
      >
        <header className="svg-editor-header">
          <div>
            <h2>{assetLabel}</h2>
            <span>{dirty ? "Unsaved draft" : "Draft synced"}</span>
          </div>
          <Button onClick={onApplyPreview} type="button" variant="outline">
            Apply to preview
          </Button>
        </header>

        <div className="svg-editor-body">
          <div
            aria-label="Vector drawing tools"
            className="svg-editor-tools"
            role="tablist"
          >
            {toolGroups.map((group, groupIndex) => (
              <div className="tool-group" key={groupIndex}>
                {group.tools.map((tool) => (
                  <Tooltip key={tool.value}>
                    <TooltipTrigger asChild>
                      <button
                        aria-selected={activeTool === tool.value}
                        className={
                          activeTool === tool.value
                            ? "tool-button active"
                            : "tool-button"
                        }
                        onClick={() => selectTool(tool.value, tool.mode)}
                        role="tab"
                        type="button"
                      >
                        <tool.icon aria-hidden="true" />
                        <span>{tool.label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{tool.label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>

          <div className="svg-editor-canvas-shell">
            <div className="svg-editor-canvas-grid" />
            <div className="svg-editor-canvas svgcanvas-host" ref={canvasRef} />
          </div>

          <aside className="svg-editor-panel">
            <PanelTitle title="Layers" />
            <ScrollArea className="editor-layer-scroll">
              <div className="editor-layer-tree">
                {layers.length === 0 ? (
                  <p className="muted">No editable SVG layers.</p>
                ) : (
                  layers.map((layer) => (
                    <button
                      className={
                        layer.id === selectedId
                          ? "editor-layer-row active"
                          : "editor-layer-row"
                      }
                      key={layer.id}
                      onClick={() => selectLayer(layer.id)}
                      style={{ "--depth": layer.depth } as CSSProperties}
                      type="button"
                    >
                      <span>{layer.id}</span>
                      <em>{layer.tagName}</em>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>

            <PanelTitle title="Paint" />
            <label className="editor-field">
              <span>Fill color</span>
              <input
                aria-label="Fill color"
                onChange={(event) =>
                  updateSelectedAttributes({ fill: event.target.value })
                }
                type="color"
                value={colorInputValue(selectedElement?.getAttribute("fill"))}
              />
            </label>
            <label className="editor-field">
              <span>Stroke color</span>
              <input
                aria-label="Stroke color"
                onChange={(event) =>
                  updateSelectedAttributes({ stroke: event.target.value })
                }
                type="color"
                value={colorInputValue(selectedElement?.getAttribute("stroke"))}
              />
            </label>
            <SliderField
              label="Opacity"
              max={1}
              min={0}
              onChange={(value) => updateSelectedAttributes({ opacity: value })}
              step={0.05}
              value={numberAttribute(selectedElement, "opacity", 1)}
            />
            <SliderField
              label="Stroke width"
              max={12}
              min={0}
              onChange={(value) =>
                updateSelectedAttributes({ "stroke-width": value })
              }
              step={0.5}
              value={numberAttribute(selectedElement, "stroke-width", 1)}
            />

            <PanelTitle title="Vector Actions" />
            <div className="editor-uad-grid">
              <Button onClick={applyGradient} type="button" variant="outline">
                <Palette aria-hidden="true" />
                Apply gradient
              </Button>
              <Button onClick={addSocket} type="button" variant="outline">
                <Crosshair aria-hidden="true" />
                Add socket
              </Button>
              <Button onClick={markCollider} type="button" variant="outline">
                <Sparkles aria-hidden="true" />
                Mark collider
              </Button>
            </div>

            <PanelTitle title="UAD Metadata" />
            <div className="editor-uad-grid">
              <Button
                onClick={() =>
                  updateSelectedUad({
                    wave: { amplitude: 2, frequency: 4, points: 12 },
                  })
                }
                type="button"
                variant="outline"
              >
                Wave
              </Button>
              <Button
                onClick={() =>
                  updateSelectedUad({
                    pulse: { amplitude: 0.5, frequency: 3 },
                  })
                }
                type="button"
                variant="outline"
              >
                Pulse
              </Button>
              <Button
                onClick={() =>
                  updateSelectedUad({
                    slideRange: 4,
                  })
                }
                type="button"
                variant="outline"
              >
                Slide
              </Button>
              <Button
                onClick={() =>
                  updateSelectedUad({
                    directionRotation: true,
                  })
                }
                type="button"
                variant="outline"
              >
                Rotate
              </Button>
              <Button
                onClick={() =>
                  updateSelectedUad({
                    material: { chromaticScale: 0.35, phosphorTrail: 1.2 },
                  })
                }
                type="button"
                variant="outline"
              >
                Material
              </Button>
              <Button
                onClick={() =>
                  updateSelectedUad({
                    audio: { onPeak: "spark" },
                  })
                }
                type="button"
                variant="outline"
              >
                Audio
              </Button>
            </div>
          </aside>
        </div>
      </section>
    </TooltipProvider>
  );
}

function PanelTitle({ title }: { title: string }) {
  return <h3 className="editor-panel-title">{title}</h3>;
}

function SliderField({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange(value: number): void;
  step: number;
  value: number;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <label className="editor-slider-field">
      <span>{label}</span>
      <GradientSlider
        aria-label={label}
        max={max}
        min={min}
        onValueChange={([nextValue]) => {
          const resolved = nextValue ?? localValue;
          setLocalValue(resolved);
          onChange(resolved);
        }}
        step={step}
        value={[localValue]}
      />
      <em>{localValue.toFixed(step < 1 ? 2 : 0)}</em>
    </label>
  );
}

function viewBoxForEditor(editor: SvgEditorDocument): {
  centerX: number;
  centerY: number;
  height: number;
  width: number;
  x: number;
  y: number;
} {
  const viewBox = editor.svg.getAttribute("viewBox");
  const values = viewBox
    ?.trim()
    .split(/[\s,]+/)
    .map((value) => Number.parseFloat(value))
    .filter(Number.isFinite);
  const [x, y, width, height] =
    values && values.length >= 4
      ? values
      : [
          0,
          0,
          Number.parseFloat(editor.svg.getAttribute("width") ?? "48") || 48,
          Number.parseFloat(editor.svg.getAttribute("height") ?? "48") || 48,
        ];
  return {
    centerX: x + width / 2,
    centerY: y + height / 2,
    height,
    width,
    x,
    y,
  };
}

function safeParseSvgEditorDocument(
  svgSource: string,
): SvgEditorDocument | null {
  try {
    return parseSvgEditorDocument(svgSource);
  } catch {
    return null;
  }
}

function findElement(
  editor: SvgEditorDocument,
  elementId: string,
): Element | null {
  return (
    Array.from(editor.svg.querySelectorAll("*")).find(
      (element) => element.getAttribute("id") === elementId,
    ) ?? null
  );
}

function colorInputValue(value: string | null | undefined): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : "#66ffff";
}

function numberAttribute(
  element: Element | null,
  attributeName: string,
  fallback: number,
): number {
  const value = element?.getAttribute(attributeName);
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
