import { AudioNodeConfig } from "@neon-cabinet/audio-tools";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import { type PointerEvent } from "react";
import { labelForType } from "../lib/patch-utils";

export function GraphNode({
  isSelected,
  node,
  onDragNode,
  onSelectNode,
  onSetDraggingId,
}: {
  isSelected: boolean;
  node: AudioNodeConfig;
  onDragNode(
    event: PointerEvent<HTMLButtonElement>,
    node: AudioNodeConfig,
  ): void;
  onSelectNode(id: string): void;
  onSetDraggingId(id: string | null): void;
}) {
  return (
    <Button
      className={isSelected ? "graph-node active" : "graph-node"}
      onClick={() => onSelectNode(node.id)}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onSetDraggingId(node.id);
      }}
      onPointerMove={(event) => onDragNode(event, node)}
      onPointerUp={() => onSetDraggingId(null)}
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
      }}
      type="button"
      variant="outline"
    >
      <span>{node.label}</span>
      <small>{labelForType(node.type)}</small>
      <i className="port in" />
      <i className="port out" />
    </Button>
  );
}
