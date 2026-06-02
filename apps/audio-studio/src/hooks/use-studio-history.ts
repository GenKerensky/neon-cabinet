import {
  AudioNodeConfig,
  AudioStudioGameRegistration,
  DEFAULT_AUDIO_STUDIO_GAME_ID,
  getAudioStudioGameById,
  getAudioStudioGames,
  migratePatchToCurrentSchema,
  PatchConnection,
  SoundPatch,
  validatePatch,
} from "@neon-cabinet/audio-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Subscription } from "rxjs";
import {
  DEFAULT_GAME,
  clonePatch,
  createDefaultNode,
  defaultPatchForGame,
} from "../lib/patch-utils";
import {
  getAudioStudioRxState,
  readPersistedSelectedGameId,
  readPersistedStudioHistory,
  writePersistedSelectedGameId,
  writePersistedStudioHistory,
  writePersistedStudioHistoryIfMissing,
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
const HISTORY_PERSIST_DEBOUNCE_MS = 180;

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
  present: createSnapshot(defaultPatchForGame(DEFAULT_GAME)),
});

export const createInitialHistoryForGame = (
  game: AudioStudioGameRegistration,
): StudioHistory => ({
  future: [],
  past: [],
  present: createSnapshot(defaultPatchForGame(game)),
});

export const trimPast = (past: StudioSnapshot[]): StudioSnapshot[] =>
  past.slice(-80);

export type DebouncedWriter<TPayload, TKey> = ((
  payload: TPayload,
  key: TKey,
) => void) & {
  cancel(): void;
  flush(): void;
};

export function createDebouncedWriter<TPayload, TKey>(
  write: (payload: TPayload, key: TKey) => Promise<void>,
  delayMs: number,
  reportError: (error: unknown) => void,
): DebouncedWriter<TPayload, TKey> {
  const latestByKey = new Map<TKey, TPayload>();
  const timersByKey = new Map<TKey, ReturnType<typeof setTimeout>>();

  const flushKey = (key: TKey): void => {
    const timer = timersByKey.get(key);
    if (timer) {
      clearTimeout(timer);
      timersByKey.delete(key);
    }
    if (!latestByKey.has(key)) return;
    const payload = latestByKey.get(key) as TPayload;
    latestByKey.delete(key);
    void write(payload, key).catch(reportError);
  };

  const flush = (): void => {
    for (const key of [...latestByKey.keys()]) {
      flushKey(key);
    }
  };

  const writer = ((payload: TPayload, key: TKey): void => {
    latestByKey.set(key, payload);
    const timer = timersByKey.get(key);
    if (timer) clearTimeout(timer);
    timersByKey.set(
      key,
      setTimeout(() => flushKey(key), delayMs),
    );
  }) as DebouncedWriter<TPayload, TKey>;

  writer.cancel = () => {
    for (const timer of timersByKey.values()) {
      clearTimeout(timer);
    }
    timersByKey.clear();
    latestByKey.clear();
  };
  writer.flush = flush;

  return writer;
}

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

function normalizeHistoryForGame(
  candidate: unknown,
  game: AudioStudioGameRegistration,
): StudioHistory | null {
  const history = normalizeHistory(candidate);
  if (!history) return null;

  if (
    game.effects.length > 0 &&
    history.present.patch.id === starterPatchIdForGame(game)
  ) {
    return null;
  }

  return history;
}

function isStaleStarterHistoryForGame(
  candidate: unknown,
  game: AudioStudioGameRegistration,
): boolean {
  if (game.effects.length === 0) return false;
  const history = normalizeHistory(candidate);
  return history?.present.patch.id === starterPatchIdForGame(game);
}

export function useStudioHistory(setStatus: (status: string) => void) {
  const [history, setHistory] = useState<StudioHistory>(() =>
    createInitialHistory(),
  );
  const [selectedGameId, setSelectedGameIdState] = useState(
    DEFAULT_AUDIO_STUDIO_GAME_ID,
  );
  const historyRef = useRef(history);
  const historySignatureRef = useRef(historySignature(history));
  const persistWriterRef = useRef<DebouncedWriter<
    StudioHistory,
    string
  > | null>(null);
  const setStatusRef = useRef(setStatus);
  const userSelectedGameRef = useRef(false);
  const selectedGameIdRef = useRef(selectedGameId);
  const { patch, selectedNodeId } = history.present;
  const games = useMemo(() => getAudioStudioGames(), []);
  const selectedGame = useMemo(
    () => getRegisteredGame(selectedGameId) ?? DEFAULT_GAME,
    [selectedGameId],
  );

  const selectedNode = useMemo(
    () =>
      patch.nodes.find((node) => node.id === selectedNodeId) ?? patch.nodes[0],
    [patch.nodes, selectedNodeId],
  );

  useEffect(() => {
    setStatusRef.current = setStatus;
  }, [setStatus]);

  if (!persistWriterRef.current) {
    persistWriterRef.current = createDebouncedWriter(
      writePersistedStudioHistory,
      HISTORY_PERSIST_DEBOUNCE_MS,
      (error) => {
        setStatusRef.current(
          error instanceof Error ? error.message : "PERSIST FAILED",
        );
      },
    );
  }

  const persistHistory = useCallback(
    (nextHistory: StudioHistory, gameId = selectedGameIdRef.current): void => {
      persistWriterRef.current?.(nextHistory, gameId);
    },
    [],
  );

  useEffect(
    () => () => {
      persistWriterRef.current?.flush();
    },
    [],
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

        const persistedGameId = normalizeGameId(
          readPersistedSelectedGameId(state),
        );
        const nextGameId = userSelectedGameRef.current
          ? selectedGameIdRef.current
          : (persistedGameId ?? DEFAULT_AUDIO_STUDIO_GAME_ID);
        selectedGameIdRef.current = nextGameId;
        setSelectedGameIdState(nextGameId);

        const nextGame = getRegisteredGame(nextGameId) ?? DEFAULT_GAME;
        const rawHistory = readPersistedStudioHistory(state, nextGameId);
        const persistedHistory = normalizeHistoryForGame(rawHistory, nextGame);
        const initialHistory = createInitialHistoryForGame(nextGame);
        if (persistedHistory) {
          applyHistory(() => persistedHistory, "RESTORED", { persist: false });
        } else {
          applyHistory(() => initialHistory, undefined, { persist: false });
          const writeHistory = isStaleStarterHistoryForGame(
            rawHistory,
            nextGame,
          )
            ? writePersistedStudioHistory
            : writePersistedStudioHistoryIfMissing;
          void writeHistory(initialHistory, nextGameId);
        }
        subscription = state.get$("studio").subscribe((value) => {
          if (!active || !isRecord(value)) return;

          const syncedGameId =
            normalizeGameId(value.selectedGameId) ?? selectedGameIdRef.current;
          const rawHistory =
            isRecord(value.gamesById) && isRecord(value.gamesById[syncedGameId])
              ? value.gamesById[syncedGameId].history
              : syncedGameId === DEFAULT_AUDIO_STUDIO_GAME_ID
                ? value.history
                : undefined;
          const syncedGame = getRegisteredGame(syncedGameId) ?? DEFAULT_GAME;
          const syncedHistory = normalizeHistoryForGame(rawHistory, syncedGame);

          if (syncedGameId !== selectedGameIdRef.current) {
            selectedGameIdRef.current = syncedGameId;
            setSelectedGameIdState(syncedGameId);
          }

          const nextHistory =
            syncedHistory ?? createInitialHistoryForGame(syncedGame);

          const signature = historySignature(nextHistory);
          if (signature === historySignatureRef.current) return;

          applyHistory(() => nextHistory, "RESTORED", { persist: false });
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
      commit(
        createSnapshot(migratePatchToCurrentSchema(nextPatch)),
        "PATCH LOADED",
      );
    },
    [commit],
  );

  const selectGame = useCallback(
    (gameId: string): void => {
      const nextGame = getRegisteredGame(gameId);
      if (!nextGame || gameId === selectedGameIdRef.current) return;

      userSelectedGameRef.current = true;
      selectedGameIdRef.current = gameId;
      setSelectedGameIdState(gameId);
      void writePersistedSelectedGameId(gameId).catch((error) => {
        setStatus(error instanceof Error ? error.message : "PERSIST FAILED");
      });

      void getAudioStudioRxState()
        .then((state) => {
          const rawHistory = readPersistedStudioHistory(state, gameId);
          const persistedHistory = normalizeHistoryForGame(
            rawHistory,
            nextGame,
          );
          const nextHistory =
            persistedHistory ?? createInitialHistoryForGame(nextGame);
          applyHistory(() => nextHistory, "GAME LOADED", { persist: false });
          if (!persistedHistory) {
            const writeHistory = isStaleStarterHistoryForGame(
              rawHistory,
              nextGame,
            )
              ? writePersistedStudioHistory
              : writePersistedStudioHistoryIfMissing;
            void writeHistory(nextHistory, gameId);
          }
        })
        .catch((error) => {
          const nextHistory = createInitialHistoryForGame(nextGame);
          applyHistory(() => nextHistory, "GAME LOADED", { persist: false });
          setStatus(error instanceof Error ? error.message : "STORAGE FAILED");
        });
    },
    [applyHistory, setStatus],
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

  const updatePatch = useCallback(
    (
      updater: (patch: SoundPatch) => SoundPatch,
      nextStatus = "EDITED",
    ): void => {
      patchCurrent(
        (current) => ({
          ...current,
          patch: updater(clonePatch(current.patch)),
        }),
        nextStatus,
      );
    },
    [patchCurrent],
  );

  return {
    addNode,
    arrangeNodes,
    connectToOutput,
    games,
    history,
    loadPatch,
    moveNode,
    redo,
    removeSelectedNode,
    resetPatch,
    restoreHistory,
    selectedGame,
    selectedGameId,
    selectedNode,
    selectGame,
    setSelectedNodeId,
    undo,
    updateNode,
    updatePatch,
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
  try {
    const patch = migratePatchToCurrentSchema(candidate);
    const result = validatePatch(patch);
    if (!result.valid) return null;
    return clonePatch(patch);
  } catch {
    return null;
  }
}

function numberOrFallback(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeGameId(candidate: unknown): string | null {
  if (typeof candidate !== "string") return null;
  return getRegisteredGame(candidate) ? candidate : null;
}

function getRegisteredGame(
  gameId: string,
): AudioStudioGameRegistration | undefined {
  return getAudioStudioGameById(gameId);
}

function starterPatchIdForGame(
  game: Pick<AudioStudioGameRegistration, "id">,
): string {
  return `${game.id}-starter-effect`;
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
  const minGap = 8;
  const preferredColumnGap = 72;
  const preferredRowGap = 32;
  const paddingX = 64;
  const paddingY = 72;
  const width = Math.max(graphSize.width ?? 920, 360);
  const height = Math.max(graphSize.height ?? 620, 320);
  const columnGap =
    maxDepth === 0
      ? 0
      : Math.max(
          minGap,
          Math.min(
            preferredColumnGap,
            (width - paddingX * 2 - (maxDepth + 1) * nodeWidth) / maxDepth,
          ),
        );
  const xStep = nodeWidth + columnGap;
  const rowByNodeId = assignCompactRows(layers, incoming);
  const rowCount = Math.max(0, ...rowByNodeId.values()) + 1;
  const rowGap =
    rowCount === 1
      ? 0
      : Math.max(
          minGap,
          Math.min(
            preferredRowGap,
            (height - paddingY * 2 - rowCount * nodeHeight) / (rowCount - 1),
          ),
        );
  const totalHeight = rowCount * nodeHeight + (rowCount - 1) * rowGap;
  const totalWidth = (maxDepth + 1) * nodeWidth + maxDepth * columnGap;
  const left = Math.max(paddingX, Math.round((width - totalWidth) / 2));
  const top = Math.max(paddingY, Math.round((height - totalHeight) / 2));
  const positions = new Map<string, { x: number; y: number }>();

  for (const [depth, layer] of layers) {
    layer.forEach((node) => {
      const row = rowByNodeId.get(node.id) ?? 0;
      positions.set(node.id, {
        x: Math.round(left + depth * xStep),
        y: Math.round(top + row * (nodeHeight + rowGap)),
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

function assignCompactRows(
  layers: Map<number, AudioNodeConfig[]>,
  incoming: Map<string, string[]>,
): Map<string, number> {
  const rows = new Map<string, number>();
  const orderedLayers = [...layers.entries()].sort(([a], [b]) => a - b);

  for (const [, layer] of orderedLayers) {
    const usedRows = new Set<number>();
    let fallbackRow = 0;
    const rankedLayer = layer
      .map((node, index) => {
        const parentRows = (incoming.get(node.id) ?? [])
          .map((parentId) => rows.get(parentId))
          .filter((row): row is number => row !== undefined);
        const desiredRow =
          parentRows.length === 0 ? fallbackRow + index : average(parentRows);

        return { desiredRow, node };
      })
      .sort(
        (a, b) =>
          a.desiredRow - b.desiredRow ||
          a.node.position.y - b.node.position.y ||
          a.node.position.x - b.node.position.x,
      );

    for (const { desiredRow, node } of rankedLayer) {
      const row = nearestAvailableRow(Math.round(desiredRow), usedRows);
      usedRows.add(row);
      rows.set(node.id, row);
      fallbackRow = Math.max(fallbackRow, row + 1);
    }
  }

  return rows;
}

function nearestAvailableRow(
  desiredRow: number,
  usedRows: Set<number>,
): number {
  const start = Math.max(0, desiredRow);
  if (!usedRows.has(start)) return start;

  for (let offset = 1; ; offset += 1) {
    const lower = start - offset;
    if (lower >= 0 && !usedRows.has(lower)) return lower;

    const upper = start + offset;
    if (!usedRows.has(upper)) return upper;
  }
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}
