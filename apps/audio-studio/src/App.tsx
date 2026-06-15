import {
  parsePatch,
  serializePatch,
  validatePatch,
} from "@neon-cabinet/audio-tools";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@neon-cabinet/ui/components/ui/tabs";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  ComposeMode,
  InstrumentMode,
  TrackerMode,
} from "./components/AuthoringModes";
import { Inspector } from "./components/Inspector";
import { NodeGraph } from "./components/NodeGraph";
import { PresetBrowser } from "./components/PresetBrowser";
import { TransportControls } from "./components/TransportControls";
import { WorkbenchHeader } from "./components/WorkbenchHeader";
import { usePatchPreview } from "./hooks/use-patch-preview";
import { useStudioHistory } from "./hooks/use-studio-history";

type JsonPanelState = {
  export: boolean;
  import: boolean;
};

type StudioMode = "compose" | "tracker" | "instrument" | "patch-graph";

function App() {
  const [activeMode, setActiveMode] = useState<StudioMode>("patch-graph");
  const [importValue, setImportValue] = useState("");
  const [jsonPanels, setJsonPanels] = useState<JsonPanelState>({
    export: true,
    import: false,
  });
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [status, setStatus] = useState("READY");
  const studio = useStudioHistory(setStatus);
  const preview = usePatchPreview();
  const { distance, intensity, pan, patch } = studio.history.present;

  const exportedJson = useMemo(() => serializePatch(patch), [patch]);
  const validation = useMemo(() => validatePatch(patch), [patch]);
  const gameThemeStyle = useMemo(
    () =>
      ({
        "--accent": studio.selectedGame.theme.accent,
        "--accent-foreground": studio.selectedGame.theme.accentForeground,
        "--audio-grid": studio.selectedGame.theme.audioGrid,
        "--audio-line": studio.selectedGame.theme.audioLine,
        "--audio-panel": studio.selectedGame.theme.audioPanel,
        "--audio-panel-strong": studio.selectedGame.theme.audioPanelStrong,
        "--background": studio.selectedGame.theme.background,
        "--border": studio.selectedGame.theme.border,
        "--destructive": "#ff5f6d",
        "--foreground": studio.selectedGame.theme.foreground,
        "--input": studio.selectedGame.theme.input,
        "--muted": studio.selectedGame.theme.secondary,
        "--muted-foreground": studio.selectedGame.theme.foreground,
        "--popover": studio.selectedGame.theme.audioPanelStrong,
        "--popover-foreground": studio.selectedGame.theme.foreground,
        "--primary": studio.selectedGame.theme.primary,
        "--primary-foreground": studio.selectedGame.theme.primaryForeground,
        "--ring": studio.selectedGame.theme.ring,
        "--secondary": studio.selectedGame.theme.secondary,
        "--secondary-foreground": studio.selectedGame.theme.secondaryForeground,
        "--sidebar": studio.selectedGame.theme.audioPanel,
        "--sidebar-accent": studio.selectedGame.theme.secondary,
        "--sidebar-accent-foreground":
          studio.selectedGame.theme.secondaryForeground,
        "--sidebar-border": studio.selectedGame.theme.border,
        "--sidebar-foreground": studio.selectedGame.theme.foreground,
        "--sidebar-primary": studio.selectedGame.theme.primary,
        "--sidebar-primary-foreground":
          studio.selectedGame.theme.primaryForeground,
        "--sidebar-ring": studio.selectedGame.theme.ring,
      }) as CSSProperties,
    [studio.selectedGame],
  );
  const appStyle = useMemo(
    () =>
      ({
        ...gameThemeStyle,
        gridTemplateColumns: `${sidebarWidth}px 8px minmax(460px, 1fr) 324px`,
      }) as CSSProperties,
    [gameThemeStyle, sidebarWidth],
  );

  useEffect(() => {
    const target = document.body;
    const entries = Object.entries(gameThemeStyle) as [string, string][];
    const previous = new Map(
      entries.map(([key]) => [key, target.style.getPropertyValue(key)]),
    );

    for (const [key, value] of entries) {
      target.style.setProperty(key, value);
    }

    return () => {
      for (const [key, value] of previous) {
        if (value) {
          target.style.setProperty(key, value);
        } else {
          target.style.removeProperty(key);
        }
      }
    };
  }, [gameThemeStyle]);

  function toggleJsonPanel(panel: keyof JsonPanelState): void {
    setJsonPanels((current) => ({ ...current, [panel]: !current[panel] }));
  }

  function importPatch(): void {
    try {
      studio.loadPatch(parsePatch(importValue));
      setStatus("IMPORTED");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "IMPORT FAILED");
    }
  }

  async function playPreview(): Promise<void> {
    await preview.playPreview(patch, { distance, pan, intensity });
    setStatus("PLAYED");
  }

  async function toggleLoop(): Promise<void> {
    const looping = await preview.toggleLoop(patch, {
      distance,
      pan,
      intensity,
    });
    setStatus(looping ? "LOOPING" : "STOPPED");
  }

  function downloadJson(): void {
    const blob = new Blob([exportedJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${patch.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="audio-studio theme-audio-studio dark" style={appStyle}>
      <PresetBrowser
        activePatchId={patch.id}
        games={studio.games}
        onLoadPatch={studio.loadPatch}
        onSelectGame={studio.selectGame}
        selectedGame={studio.selectedGame}
        selectedGameId={studio.selectedGameId}
      />

      <div
        aria-label="Resize preset sidebar"
        className="sidebar-resize-handle"
        onPointerDown={(event) => {
          const target = event.currentTarget;
          target.setPointerCapture?.(event.pointerId);
          const startX = event.clientX;
          const startWidth = sidebarWidth;
          const onMove = (moveEvent: PointerEvent) => {
            setSidebarWidth(
              Math.min(
                420,
                Math.max(190, startWidth + moveEvent.clientX - startX),
              ),
            );
          };
          const onUp = () => {
            target.removeEventListener("pointermove", onMove);
            target.removeEventListener("pointerup", onUp);
          };
          target.addEventListener("pointermove", onMove);
          target.addEventListener("pointerup", onUp);
        }}
        role="separator"
        tabIndex={0}
      />

      <section className="graph-shell">
        <WorkbenchHeader
          canRedo={studio.history.future.length > 0}
          canUndo={studio.history.past.length > 0}
          onAddNode={studio.addNode}
          onRedo={studio.redo}
          onReset={studio.resetPatch}
          onUndo={studio.undo}
          patch={patch}
        />

        <Tabs
          className="workbench-tabs"
          onValueChange={(value) => setActiveMode(value as StudioMode)}
          value={activeMode}
        >
          <TabsList aria-label="Audio authoring modes" className="mode-tabs">
            <TabsTrigger
              onClick={() => setActiveMode("compose")}
              value="compose"
            >
              Compose
            </TabsTrigger>
            <TabsTrigger
              onClick={() => setActiveMode("tracker")}
              value="tracker"
            >
              Tracker
            </TabsTrigger>
            <TabsTrigger
              onClick={() => setActiveMode("instrument")}
              value="instrument"
            >
              Instrument
            </TabsTrigger>
            <TabsTrigger
              onClick={() => setActiveMode("patch-graph")}
              value="patch-graph"
            >
              Patch Graph
            </TabsTrigger>
          </TabsList>
          <TabsContent value="compose">
            <ComposeMode
              onUpdatePatch={studio.updatePatch}
              patch={patch}
              playhead={preview.playback}
            />
          </TabsContent>
          <TabsContent value="tracker">
            <TrackerMode onUpdatePatch={studio.updatePatch} patch={patch} />
          </TabsContent>
          <TabsContent value="instrument">
            <InstrumentMode onUpdatePatch={studio.updatePatch} patch={patch} />
          </TabsContent>
          <TabsContent value="patch-graph">
            <NodeGraph
              connections={patch.connections}
              nodes={patch.nodes}
              onAutoArrange={studio.arrangeNodes}
              onMoveNode={studio.moveNode}
              onSelectNode={studio.setSelectedNodeId}
              selectedNodeId={studio.selectedNode?.id}
            />
          </TabsContent>
        </Tabs>
      </section>

      <Inspector
        exportedJson={exportedJson}
        importValue={importValue}
        isExportOpen={jsonPanels.export}
        isImportOpen={jsonPanels.import}
        onConnectToOutput={studio.connectToOutput}
        onDownloadJson={downloadJson}
        onImportPatch={importPatch}
        onRemoveSelectedNode={studio.removeSelectedNode}
        onSetImportValue={setImportValue}
        onToggleExport={() => toggleJsonPanel("export")}
        onToggleImport={() => toggleJsonPanel("import")}
        onUpdateNode={studio.updateNode}
        selectedNode={studio.selectedNode}
      />

      <TransportControls
        distance={distance}
        intensity={intensity}
        isLooping={preview.isLooping}
        onPlayPreview={() => void playPreview()}
        onToggleLoop={() => void toggleLoop()}
        onUpdatePreviewValue={studio.updatePreviewValue}
        pan={pan}
        statusText={validation.valid ? status : validation.errors[0]}
        valid={validation.valid}
      />
    </main>
  );
}

export default App;
