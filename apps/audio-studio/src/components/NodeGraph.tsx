import { AudioNodeConfig, PatchConnection } from "@neon-cabinet/audio-tools";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import { LayoutGridIcon } from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { GraphNode } from "./GraphNode";

type NodePosition = {
  x: number;
  y: number;
};

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
};

type PanState = {
  originX: number;
  originY: number;
  startX: number;
  startY: number;
};

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
  const dragStateRef = useRef<DragState | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const draftPositionsRef = useRef<Record<string, NodePosition>>({});
  const [draftPositions, setDraftPositions] = useState<
    Record<string, NodePosition>
  >({});
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState<NodePosition>({ x: 0, y: 0 });

  const displayNodes = useMemo(
    () =>
      nodes.map(
        (node) =>
          ({
            ...node,
            position: draftPositions[node.id] ?? node.position,
          }) as AudioNodeConfig,
      ),
    [draftPositions, nodes],
  );

  const nodeById = useMemo(
    () => new Map(displayNodes.map((node) => [node.id, node])),
    [displayNodes],
  );

  function startDrag(
    event: PointerEvent<HTMLButtonElement>,
    node: AudioNodeConfig,
  ): void {
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds || !hasPointerCoordinates(event)) return;

    dragStateRef.current = {
      id: node.id,
      offsetX: event.clientX - bounds.left - node.position.x,
      offsetY: event.clientY - bounds.top - node.position.y,
    };
    onSelectNode(node.id);
  }

  function dragNode(
    event: PointerEvent<HTMLButtonElement>,
    node: AudioNodeConfig,
  ): void {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.id !== node.id) return;

    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds || !hasPointerCoordinates(event)) return;

    const position = {
      x: Math.round(event.clientX - bounds.left - dragState.offsetX),
      y: Math.round(event.clientY - bounds.top - dragState.offsetY),
    };
    setDraftPosition(node.id, position);
  }

  function endDrag(
    event: PointerEvent<HTMLButtonElement>,
    node: AudioNodeConfig,
  ): void {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.id !== node.id) return;

    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Synthetic pointer events in tests can lack a captured active pointer.
    }
    dragStateRef.current = null;

    const position = draftPositionsRef.current[node.id] ?? node.position;
    const committedPosition =
      nodes.find((candidate) => candidate.id === node.id)?.position ??
      node.position;
    clearDraftPosition(node.id);
    if (
      position.x === committedPosition.x &&
      position.y === committedPosition.y
    ) {
      return;
    }
    onMoveNode(node.id, position.x, position.y);
  }

  function autoArrange(event: MouseEvent<HTMLButtonElement>): void {
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    onAutoArrange({ height: bounds?.height, width: bounds?.width });
  }

  function startPan(event: PointerEvent<HTMLDivElement>): void {
    const isMiddleMousePan = event.button === 1;
    const isEmptyGridPan = event.button === 0 && isEmptyGridTarget(event);
    if (
      (!isMiddleMousePan && !isEmptyGridPan) ||
      !hasPointerCoordinates(event)
    ) {
      return;
    }

    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Synthetic pointer events in tests can lack a real active pointer.
    }
    panStateRef.current = {
      originX: panOffset.x,
      originY: panOffset.y,
      startX: event.clientX,
      startY: event.clientY,
    };
    setIsPanning(true);
  }

  function panGraph(event: PointerEvent<HTMLDivElement>): void {
    const panState = panStateRef.current;
    if (!panState || !hasPointerCoordinates(event)) return;

    event.preventDefault();
    setPanOffset({
      x: Math.round(panState.originX + event.clientX - panState.startX),
      y: Math.round(panState.originY + event.clientY - panState.startY),
    });
  }

  function endPan(event: PointerEvent<HTMLDivElement>): void {
    if (!panStateRef.current) return;

    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Synthetic pointer events in tests can lack a captured active pointer.
    }
    panStateRef.current = null;
    setIsPanning(false);
  }

  function setDraftPosition(id: string, position: NodePosition): void {
    draftPositionsRef.current = {
      ...draftPositionsRef.current,
      [id]: position,
    };
    setDraftPositions(draftPositionsRef.current);
  }

  function clearDraftPosition(id: string): void {
    const { [id]: _removed, ...remaining } = draftPositionsRef.current;
    draftPositionsRef.current = remaining;
    setDraftPositions(remaining);
  }

  return (
    <div
      className={isPanning ? "graph-canvas panning" : "graph-canvas"}
      onPointerCancel={endPan}
      onPointerDown={startPan}
      onPointerMove={panGraph}
      onPointerUp={endPan}
      style={{
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    >
      <div
        className="graph-content"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
      >
        <svg aria-hidden="true" className="connections">
          {connections.map((connection, index) => {
            const from = nodeById.get(connection.from);
            const to = nodeById.get(connection.to);
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
        {displayNodes.map((node) => (
          <GraphNode
            isSelected={node.id === selectedNodeId}
            key={node.id}
            node={node}
            onDragNode={dragNode}
            onEndDrag={endDrag}
            onSelectNode={onSelectNode}
            onStartDrag={startDrag}
          />
        ))}
      </div>
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

function hasPointerCoordinates(
  event: PointerEvent<HTMLButtonElement | HTMLDivElement>,
): boolean {
  return Number.isFinite(event.clientX) && Number.isFinite(event.clientY);
}

function isEmptyGridTarget(event: PointerEvent<HTMLDivElement>): boolean {
  const target = event.target;
  if (!(target instanceof Element)) return false;

  return !target.closest(".graph-node, .auto-arrange-button");
}
