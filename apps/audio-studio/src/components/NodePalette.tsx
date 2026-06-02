import { AudioNodeConfig } from "@neon-cabinet/audio-tools";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import { PlusIcon } from "lucide-react";
import { NODE_TYPES, labelForType } from "../lib/patch-utils";

export function NodePalette({
  onAddNode,
}: {
  onAddNode(type: AudioNodeConfig["type"]): void;
}) {
  return (
    <div className="node-palette">
      {NODE_TYPES.map((type) => (
        <Button
          key={type}
          onClick={() => onAddNode(type)}
          type="button"
          variant="outline"
        >
          <PlusIcon data-icon="inline-start" />
          {labelForType(type)}
        </Button>
      ))}
    </div>
  );
}
