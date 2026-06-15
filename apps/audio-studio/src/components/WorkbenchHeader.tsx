import { AudioNodeConfig, SoundPatch } from "@neon-cabinet/audio-tools";
import { Badge } from "@neon-cabinet/ui/components/ui/badge";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import { Redo2Icon, RotateCcwIcon, Undo2Icon } from "lucide-react";
import { NodePalette } from "./NodePalette";

export function WorkbenchHeader({
  canRedo,
  canUndo,
  onAddNode,
  onRedo,
  onReset,
  onUndo,
  patch,
}: {
  canRedo: boolean;
  canUndo: boolean;
  onAddNode(type: AudioNodeConfig["type"]): void;
  onRedo(): void;
  onReset(): void;
  onUndo(): void;
  patch: SoundPatch;
}) {
  return (
    <header className="graph-header">
      <div className="patch-heading">
        <h2>{patch.name}</h2>
        <Badge variant="secondary">{patch.category}</Badge>
      </div>
      <div aria-label="History controls" className="workbench-actions">
        <Button
          disabled={!canUndo}
          onClick={onUndo}
          type="button"
          variant="outline"
        >
          <Undo2Icon data-icon="inline-start" />
          Undo
        </Button>
        <Button
          disabled={!canRedo}
          onClick={onRedo}
          type="button"
          variant="outline"
        >
          <Redo2Icon data-icon="inline-start" />
          Redo
        </Button>
        <Button onClick={onReset} type="button" variant="outline">
          <RotateCcwIcon data-icon="inline-start" />
          Reset
        </Button>
      </div>
      <NodePalette onAddNode={onAddNode} />
    </header>
  );
}
