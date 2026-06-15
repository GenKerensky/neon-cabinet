import { AudioNodeConfig } from "@neon-cabinet/audio-tools";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@neon-cabinet/ui/components/ui/card";
import { ScrollArea } from "@neon-cabinet/ui/components/ui/scroll-area";
import { Separator } from "@neon-cabinet/ui/components/ui/separator";
import { Trash2Icon, UnplugIcon } from "lucide-react";
import { JsonPanel } from "./JsonPanel";
import { NodeInspector } from "./NodeInspector";

export function Inspector({
  exportedJson,
  importValue,
  isExportOpen,
  isImportOpen,
  onConnectToOutput,
  onDownloadJson,
  onImportPatch,
  onRemoveSelectedNode,
  onSetImportValue,
  onToggleExport,
  onToggleImport,
  onUpdateNode,
  selectedNode,
}: {
  exportedJson: string;
  importValue: string;
  isExportOpen: boolean;
  isImportOpen: boolean;
  onConnectToOutput(): void;
  onDownloadJson(): void;
  onImportPatch(): void;
  onRemoveSelectedNode(): void;
  onSetImportValue(value: string): void;
  onToggleExport(): void;
  onToggleImport(): void;
  onUpdateNode(id: string, update: Partial<AudioNodeConfig>): void;
  selectedNode?: AudioNodeConfig;
}) {
  return (
    <aside className="inspector">
      <ScrollArea className="inspector-scroll">
        <Card className="panel">
          <CardHeader className="panel-title">
            <CardTitle>Inspector</CardTitle>
            <Button
              onClick={onRemoveSelectedNode}
              type="button"
              variant="outline"
            >
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </CardHeader>
          <CardContent>
            {selectedNode ? (
              <NodeInspector node={selectedNode} onUpdate={onUpdateNode} />
            ) : null}
            <Separator />
            <Button
              className="connect-button"
              onClick={onConnectToOutput}
              type="button"
              variant="outline"
            >
              <UnplugIcon data-icon="inline-start" />
              Connect to Output
            </Button>
          </CardContent>
        </Card>

        <JsonPanel
          content={exportedJson}
          isOpen={isExportOpen}
          onDownload={onDownloadJson}
          onImport={onImportPatch}
          onImportValueChange={onSetImportValue}
          onToggle={onToggleExport}
          title="Export"
          type="export"
          value={importValue}
        />

        <JsonPanel
          content={exportedJson}
          isOpen={isImportOpen}
          onDownload={onDownloadJson}
          onImport={onImportPatch}
          onImportValueChange={onSetImportValue}
          onToggle={onToggleImport}
          title="Import"
          type="import"
          value={importValue}
        />
      </ScrollArea>
    </aside>
  );
}
