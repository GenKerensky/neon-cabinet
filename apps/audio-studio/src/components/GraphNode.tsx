import { AudioNodeConfig } from "@neon-cabinet/audio-tools";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import { type PointerEvent } from "react";
import { labelForType } from "../lib/patch-utils";

export function GraphNode({
  isSelected,
  node,
  onDragNode,
  onEndDrag,
  onSelectNode,
  onStartDrag,
}: {
  isSelected: boolean;
  node: AudioNodeConfig;
  onDragNode(
    event: PointerEvent<HTMLButtonElement>,
    node: AudioNodeConfig,
  ): void;
  onEndDrag(
    event: PointerEvent<HTMLButtonElement>,
    node: AudioNodeConfig,
  ): void;
  onSelectNode(id: string): void;
  onStartDrag(
    event: PointerEvent<HTMLButtonElement>,
    node: AudioNodeConfig,
  ): void;
}) {
  return (
    <Button
      className={isSelected ? "graph-node active" : "graph-node"}
      onClick={() => onSelectNode(node.id)}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        try {
          event.currentTarget.setPointerCapture?.(event.pointerId);
        } catch {
          // Synthetic pointer events in tests can lack a real active pointer.
        }
        onStartDrag(event, node);
      }}
      onPointerMove={(event) => onDragNode(event, node)}
      onPointerCancel={(event) => onEndDrag(event, node)}
      onPointerUp={(event) => onEndDrag(event, node)}
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
