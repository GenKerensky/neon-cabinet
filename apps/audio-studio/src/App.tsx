import {
  parsePatch,
  serializePatch,
  validatePatch,
} from "@neon-cabinet/audio-tools";
import { useMemo, useState } from "react";
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

function App() {
  const [importValue, setImportValue] = useState("");
  const [jsonPanels, setJsonPanels] = useState<JsonPanelState>({
    export: true,
    import: false,
  });
  const [status, setStatus] = useState("READY");
  const studio = useStudioHistory(setStatus);
  const preview = usePatchPreview();
  const { distance, intensity, pan, patch } = studio.history.present;

  const exportedJson = useMemo(() => serializePatch(patch), [patch]);
  const validation = useMemo(() => validatePatch(patch), [patch]);

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
    <main className="audio-studio theme-audio-studio dark">
      <PresetBrowser activePatchId={patch.id} onLoadPatch={studio.loadPatch} />

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

        <NodeGraph
          connections={patch.connections}
          nodes={patch.nodes}
          onAutoArrange={studio.arrangeNodes}
          onMoveNode={studio.moveNode}
          onSelectNode={studio.setSelectedNodeId}
          selectedNodeId={studio.selectedNode?.id}
        />
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
