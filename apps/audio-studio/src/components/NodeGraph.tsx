import { AudioNodeConfig, PatchConnection } from "@neon-cabinet/audio-tools";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import { LayoutGridIcon } from "lucide-react";
import { useState, type MouseEvent, type PointerEvent } from "react";
import { GraphNode } from "./GraphNode";

export function NodeGraph({
  connections,
  nodes,
  onAutoArrange,
  onMoveNode,
  onSelectNode,
  selectedNodeId,
}: {
  connections: PatchConnection[];
  nodes: AudioNodeConfig[];
  onAutoArrange(size?: { height?: number; width?: number }): void;
  onMoveNode(id: string, x: number, y: number): void;
  onSelectNode(id: string): void;
  selectedNodeId?: string;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function dragNode(
    event: PointerEvent<HTMLButtonElement>,
    node: AudioNodeConfig,
  ): void {
    if (draggingId !== node.id) return;
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds) return;
    onMoveNode(
      node.id,
      Math.round(event.clientX - bounds.left - 70),
      Math.round(event.clientY - bounds.top - 32),
    );
  }

  function autoArrange(event: MouseEvent<HTMLButtonElement>): void {
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    onAutoArrange({ height: bounds?.height, width: bounds?.width });
  }

  return (
    <div className="graph-canvas">
      <svg aria-hidden="true" className="connections">
        {connections.map((connection, index) => {
          const from = nodes.find((node) => node.id === connection.from);
          const to = nodes.find((node) => node.id === connection.to);
          if (!from || !to) return null;
          const start = {
            x: from.position.x + 150,
            y: from.position.y + 34,
          };
          const end = {
            x: to.position.x,
            y: to.position.y + 34,
          };
          const middle = (end.x - start.x) / 2;
          return (
            <path
              d={`M ${start.x} ${start.y} C ${start.x + middle} ${start.y}, ${end.x - middle} ${end.y}, ${end.x} ${end.y}`}
              key={`${connection.from}-${connection.to}-${index}`}
            />
          );
        })}
      </svg>
      {nodes.map((node) => (
        <GraphNode
          isSelected={node.id === selectedNodeId}
          key={node.id}
          node={node}
          onDragNode={dragNode}
          onSelectNode={onSelectNode}
          onSetDraggingId={setDraggingId}
        />
      ))}
      <Button
        aria-label="Auto arrange nodes"
        className="auto-arrange-button"
        onClick={autoArrange}
        title="Auto arrange nodes"
        type="button"
        variant="outline"
      >
        <LayoutGridIcon aria-hidden="true" />
      </Button>
    </div>
  );
}
