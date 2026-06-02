import {
  AudioNodeConfig,
  PatchConnection,
  SoundPatch,
  validatePatch,
} from "@neon-cabinet/audio-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Subscription } from "rxjs";
import {
  DEFAULT_PATCH,
  clonePatch,
  createDefaultNode,
} from "../lib/patch-utils";
import {
  STUDIO_HISTORY_STATE_PATH,
  getAudioStudioRxState,
  readPersistedStudioHistory,
  writePersistedStudioHistory,
} from "../storage/audio-studio-rxdb";

export type StudioSnapshot = {
  baselinePatch: SoundPatch;
  distance: number;
  intensity: number;
  pan: number;
  patch: SoundPatch;
  selectedNodeId: string;
};

export type StudioHistory = {
  future: StudioSnapshot[];
  past: StudioSnapshot[];
  present: StudioSnapshot;
};

export type PreviewKey = "distance" | "intensity" | "pan";

type GraphSize = {
  height?: number;
  width?: number;
};

export const createSnapshot = (
  patch: SoundPatch,
  baselinePatch = patch,
): StudioSnapshot => {
  const patchCopy = clonePatch(patch);
  return {
    baselinePatch: clonePatch(baselinePatch),
    distance: patchCopy.preview.distance ?? 0,
    intensity: patchCopy.preview.intensity ?? 1,
    pan: patchCopy.preview.pan ?? 0,
    patch: patchCopy,
    selectedNodeId: patchCopy.nodes[0]?.id ?? "",
  };
};

export const cloneSnapshot = (snapshot: StudioSnapshot): StudioSnapshot => ({
  ...snapshot,
  baselinePatch: clonePatch(snapshot.baselinePatch),
  patch: clonePatch(snapshot.patch),
});

export const cloneHistory = (history: StudioHistory): StudioHistory => ({
  future: history.future.map(cloneSnapshot),
  past: history.past.map(cloneSnapshot),
  present: cloneSnapshot(history.present),
});

export const createInitialHistory = (): StudioHistory => ({
  future: [],
  past: [],
  present: createSnapshot(DEFAULT_PATCH),
});

export const trimPast = (past: StudioSnapshot[]): StudioSnapshot[] =>
  past.slice(-80);

export function normalizeHistory(candidate: unknown): StudioHistory | null {
  if (!isRecord(candidate)) return null;
  if (!Array.isArray(candidate.past) || !Array.isArray(candidate.future))
    return null;

  const present = normalizeSnapshot(candidate.present);
  if (!present) return null;

  const past = candidate.past.map(normalizeSnapshot);
  const future = candidate.future.map(normalizeSnapshot);
  if (
    past.some((snapshot) => !snapshot) ||
    future.some((snapshot) => !snapshot)
  ) {
    return null;
  }

  return {
    future: future as StudioSnapshot[],
    past: trimPast(past as StudioSnapshot[]),
    present,
  };
}

export function useStudioHistory(setStatus: (status: string) => void) {
  const [history, setHistory] = useState<StudioHistory>(() =>
    createInitialHistory(),
  );
  const historyRef = useRef(history);
  const historySignatureRef = useRef(historySignature(history));
  const storageReadyRef = useRef(false);
  const { patch, selectedNodeId } = history.present;

  const selectedNode = useMemo(
    () =>
      patch.nodes.find((node) => node.id === selectedNodeId) ?? patch.nodes[0],
    [patch.nodes, selectedNodeId],
  );

  const persistHistory = useCallback(
    (nextHistory: StudioHistory): void => {
      if (!storageReadyRef.current) return;
      void writePersistedStudioHistory(nextHistory).catch((error) => {
        setStatus(error instanceof Error ? error.message : "PERSIST FAILED");
      });
    },
    [setStatus],
  );

  const applyHistory = useCallback(
    (
      updater: (current: StudioHistory) => StudioHistory,
      nextStatus?: string,
      options: { persist?: boolean } = {},
    ): void => {
      const nextHistory = cloneHistory(updater(historyRef.current));
      historyRef.current = nextHistory;
      historySignatureRef.current = historySignature(nextHistory);
      setHistory(nextHistory);
      if (nextStatus) setStatus(nextStatus);
      if (options.persist !== false) persistHistory(nextHistory);
    },
    [persistHistory, setStatus],
  );

  useEffect(() => {
    let active = true;
    let subscription: Subscription | undefined;

    void getAudioStudioRxState()
      .then((state) => {
        if (!active) return;

        const persistedHistory = normalizeHistory(
          readPersistedStudioHistory(state),
        );
        if (persistedHistory) {
          applyHistory(() => persistedHistory, "RESTORED", { persist: false });
        } else {
          void writePersistedStudioHistory(historyRef.current);
        }

        storageReadyRef.current = true;
        subscription = state
          .get$(STUDIO_HISTORY_STATE_PATH)
          .subscribe((value) => {
            if (!active) return;
            const syncedHistory = normalizeHistory(value);
            if (!syncedHistory) return;

            const signature = historySignature(syncedHistory);
            if (signature === historySignatureRef.current) return;

            applyHistory(() => syncedHistory, "RESTORED", { persist: false });
          });
      })
      .catch((error) => {
        if (!active) return;
        setStatus(error instanceof Error ? error.message : "STORAGE FAILED");
      });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [applyHistory, setStatus]);

  const commit = useCallback(
    (nextPresent: StudioSnapshot, nextStatus: string): void => {
      applyHistory(
        (current) => ({
          future: [],
          past: trimPast([...current.past, cloneSnapshot(current.present)]),
          present: cloneSnapshot(nextPresent),
        }),
        nextStatus,
      );
    },
    [applyHistory],
  );

  const patchCurrent = useCallback(
    (
      updater: (snapshot: StudioSnapshot) => StudioSnapshot,
      nextStatus = "EDITED",
    ): void => {
      commit(updater(cloneSnapshot(history.present)), nextStatus);
    },
    [commit, history.present],
  );

  const restoreHistory = useCallback(
    (persistedHistory: StudioHistory): void => {
      const normalizedHistory = normalizeHistory(persistedHistory);
      if (!normalizedHistory) {
        setStatus("RESTORE FAILED");
        return;
      }
      applyHistory(() => normalizedHistory, "RESTORED");
    },
    [applyHistory, setStatus],
  );

  const loadPatch = useCallback(
    (nextPatch: SoundPatch): void => {
      commit(createSnapshot(nextPatch), "PATCH LOADED");
    },
    [commit],
  );

  const setSelectedNodeId = useCallback(
    (id: string): void => {
      applyHistory((current) => ({
        ...current,
        present: { ...current.present, selectedNodeId: id },
      }));
    },
    [applyHistory],
  );

  const updateNode = useCallback(
    (id: string, update: Partial<AudioNodeConfig>): void => {
      patchCurrent((current) => ({
        ...current,
        patch: {
          ...current.patch,
          nodes: current.patch.nodes.map((node) =>
            node.id === id ? ({ ...node, ...update } as AudioNodeConfig) : node,
          ),
        },
      }));
    },
    [patchCurrent],
  );

  const moveNode = useCallback(
    (id: string, x: number, y: number): void => {
      updateNode(id, { position: { x, y } } as Partial<AudioNodeConfig>);
    },
    [updateNode],
  );

  const arrangeNodes = useCallback(
    (graphSize: GraphSize = {}): void => {
      patchCurrent(
        (current) => ({
          ...current,
          patch: {
            ...current.patch,
            nodes: autoArrangeNodes(
              current.patch.nodes,
              current.patch.connections,
              graphSize,
            ),
          },
        }),
        "ARRANGED",
      );
    },
    [patchCurrent],
  );

  const addNode = useCallback(
    (type: AudioNodeConfig["type"]): void => {
      const node = createDefaultNode(type, patch.nodes.length);
      patchCurrent((current) => ({
        ...current,
        patch: { ...current.patch, nodes: [...current.patch.nodes, node] },
        selectedNodeId: node.id,
      }));
    },
    [patch.nodes.length, patchCurrent],
  );

  const removeSelectedNode = useCallback((): void => {
    if (!selectedNode || selectedNode.type === "output") return;
    patchCurrent((current) => ({
      ...current,
      patch: {
        ...current.patch,
        connections: current.patch.connections.filter(
          (connection) =>
            connection.from !== selectedNode.id &&
            connection.to !== selectedNode.id,
        ),
        nodes: current.patch.nodes.filter(
          (node) => node.id !== selectedNode.id,
        ),
      },
      selectedNodeId: "output",
    }));
  }, [patchCurrent, selectedNode]);

  const connectToOutput = useCallback((): void => {
    if (!selectedNode) return;
    const connection: PatchConnection = { from: selectedNode.id, to: "output" };
    const exists = patch.connections.some(
      (candidate) =>
        candidate.from === connection.from && candidate.to === connection.to,
    );
    if (exists) return;
    patchCurrent((current) => ({
      ...current,
      patch: {
        ...current.patch,
        connections: [...current.patch.connections, connection],
      },
    }));
  }, [patch.connections, patchCurrent, selectedNode]);

  const undo = useCallback((): void => {
    applyHistory((current) => {
      const previous = current.past.at(-1);
      if (!previous) return current;
      return {
        future: [cloneSnapshot(current.present), ...current.future],
        past: current.past.slice(0, -1),
        present: cloneSnapshot(previous),
      };
    }, "UNDO");
  }, [applyHistory]);

  const redo = useCallback((): void => {
    applyHistory((current) => {
      const next = current.future[0];
      if (!next) return current;
      return {
        future: current.future.slice(1),
        past: trimPast([...current.past, cloneSnapshot(current.present)]),
        present: cloneSnapshot(next),
      };
    }, "REDO");
  }, [applyHistory]);

  const resetPatch = useCallback((): void => {
    commit(createSnapshot(history.present.baselinePatch), "RESET");
  }, [commit, history.present.baselinePatch]);

  const updatePreviewValue = useCallback(
    (key: PreviewKey, value: number): void => {
      patchCurrent((current) => ({
        ...current,
        [key]: value,
        patch: {
          ...current.patch,
          preview: {
            ...current.patch.preview,
            [key]: value,
          },
        },
      }));
    },
    [patchCurrent],
  );

  return {
    addNode,
    arrangeNodes,
    connectToOutput,
    history,
    loadPatch,
    moveNode,
    redo,
    removeSelectedNode,
    resetPatch,
    restoreHistory,
    selectedNode,
    setSelectedNodeId,
    undo,
    updateNode,
    updatePreviewValue,
  };
}

function normalizeSnapshot(candidate: unknown): StudioSnapshot | null {
  if (!isRecord(candidate)) return null;
  const patch = validateSoundPatch(candidate.patch);
  const baselinePatch = validateSoundPatch(candidate.baselinePatch);
  if (!patch || !baselinePatch) return null;

  const selectedNodeId =
    typeof candidate.selectedNodeId === "string" &&
    patch.nodes.some((node) => node.id === candidate.selectedNodeId)
      ? candidate.selectedNodeId
      : (patch.nodes[0]?.id ?? "");

  return {
    baselinePatch,
    distance: numberOrFallback(candidate.distance, patch.preview.distance ?? 0),
    intensity: numberOrFallback(
      candidate.intensity,
      patch.preview.intensity ?? 1,
    ),
    pan: numberOrFallback(candidate.pan, patch.preview.pan ?? 0),
    patch,
    selectedNodeId,
  };
}

function validateSoundPatch(candidate: unknown): SoundPatch | null {
  const result = validatePatch(candidate);
  if (!result.valid) return null;
  return clonePatch(candidate as SoundPatch);
}

function numberOrFallback(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function historySignature(history: StudioHistory): string {
  return JSON.stringify(history);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function autoArrangeNodes(
  nodes: AudioNodeConfig[],
  connections: PatchConnection[],
  graphSize: GraphSize,
): AudioNodeConfig[] {
  const incoming = new Map<string, string[]>();
  const byId = new Map(nodes.map((node) => [node.id, node]));

  for (const node of nodes) incoming.set(node.id, []);
  for (const connection of connections) {
    if (!byId.has(connection.from) || !byId.has(connection.to)) continue;
    incoming.get(connection.to)?.push(connection.from);
  }

  const depths = new Map<string, number>();
  const visiting = new Set<string>();

  function depthFor(nodeId: string): number {
    const cached = depths.get(nodeId);
    if (cached !== undefined) return cached;
    if (visiting.has(nodeId)) return 0;

    visiting.add(nodeId);
    const parents = incoming.get(nodeId) ?? [];
    const depth =
      parents.length === 0 ? 0 : Math.max(...parents.map(depthFor)) + 1;
    visiting.delete(nodeId);
    depths.set(nodeId, depth);
    return depth;
  }

  for (const node of nodes) depthFor(node.id);

  const maxDepth = Math.max(0, ...depths.values());
  const layers = new Map<number, AudioNodeConfig[]>();
  for (const node of nodes) {
    const depth = depths.get(node.id) ?? 0;
    layers.set(depth, [...(layers.get(depth) ?? []), node]);
  }

  for (const layer of layers.values()) {
    layer.sort(
      (a, b) => a.position.y - b.position.y || a.position.x - b.position.x,
    );
  }

  const nodeWidth = 150;
  const nodeHeight = 68;
  const paddingX = 64;
  const paddingY = 72;
  const width = Math.max(graphSize.width ?? 920, 360);
  const height = Math.max(graphSize.height ?? 620, 320);
  const xStep =
    maxDepth === 0
      ? 0
      : Math.min(
          260,
          Math.max(120, (width - nodeWidth - paddingX * 2) / maxDepth),
        );
  const maxRows = Math.max(
    1,
    ...Array.from(layers.values()).map((layer) => layer.length),
  );
  const yStep =
    maxRows === 1
      ? 0
      : Math.min(
          132,
          Math.max(92, (height - nodeHeight - paddingY * 2) / (maxRows - 1)),
        );
  const positions = new Map<string, { x: number; y: number }>();

  for (const [depth, layer] of layers) {
    const top = paddingY + ((maxRows - layer.length) * yStep) / 2;
    layer.forEach((node, index) => {
      positions.set(node.id, {
        x: roundToGrid(paddingX + depth * xStep),
        y: roundToGrid(top + index * yStep),
      });
    });
  }

  return nodes.map(
    (node) =>
      ({
        ...node,
        position: positions.get(node.id) ?? node.position,
      }) as AudioNodeConfig,
  );
}

function roundToGrid(value: number): number {
  return Math.round(value / 10) * 10;
}
