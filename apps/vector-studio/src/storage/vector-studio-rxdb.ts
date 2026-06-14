import { addRxPlugin, createRxDatabase, removeRxDatabase } from "rxdb";
import type { RxDatabase, RxState } from "rxdb";
import { RxDBCleanupPlugin } from "rxdb/plugins/cleanup";
import { RxDBLeaderElectionPlugin } from "rxdb/plugins/leader-election";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBStatePlugin } from "rxdb/plugins/state";

export interface VectorStudioDraft {
  appliedSvgSource?: string;
  assetId: string;
  gameId: string;
  selectedElementId?: string;
  svgSource: string;
  updatedAt: number;
}

export type VectorStudioPersistedState = {
  editor?: {
    draftsByAssetKey?: Record<string, VectorStudioDraft>;
  };
};

export const VECTOR_STUDIO_DATABASE_NAME = "neon_vector_studio";
export const VECTOR_STUDIO_STATE_NAMESPACE = "vector-studio";

type VectorStudioDatabase = RxDatabase<Record<string, never>>;
export type VectorStudioState = RxState<VectorStudioPersistedState>;

let pluginsRegistered = false;
let databasePromise: Promise<VectorStudioDatabase> | null = null;
let statePromise: Promise<VectorStudioState> | null = null;

export function createVectorStudioStorage() {
  return getRxStorageDexie();
}

export function getVectorStudioDatabaseName(): string {
  return (
    (globalThis as { __VECTOR_STUDIO_RXDB_NAME__?: string })
      .__VECTOR_STUDIO_RXDB_NAME__ ?? VECTOR_STUDIO_DATABASE_NAME
  );
}

export async function getVectorStudioDatabase(): Promise<VectorStudioDatabase> {
  registerPlugins();

  databasePromise ??= createRxDatabase({
    multiInstance: true,
    name: getVectorStudioDatabaseName(),
    storage: createVectorStudioStorage(),
  });

  return databasePromise;
}

export async function getVectorStudioRxState(): Promise<VectorStudioState> {
  statePromise ??= getVectorStudioDatabase().then((database) =>
    database.addState<VectorStudioPersistedState>(
      VECTOR_STUDIO_STATE_NAMESPACE,
    ),
  );

  return statePromise;
}

export function vectorDraftStatePath(
  gameId: string,
  assetId: string,
): `editor.draftsByAssetKey.${string}` {
  return `editor.draftsByAssetKey.${draftKey(gameId, assetId)}`;
}

export function readPersistedVectorDraft(
  state: VectorStudioState,
  gameId: string,
  assetId: string,
): VectorStudioDraft | undefined {
  const draft = state.get(vectorDraftStatePath(gameId, assetId));
  return isVectorDraft(draft) ? draft : undefined;
}

export async function writePersistedVectorDraft(
  draft: VectorStudioDraft,
): Promise<void> {
  const state = await getVectorStudioRxState();
  const nextDraft = cloneJson(draft);
  await state.set(
    vectorDraftStatePath(draft.gameId, draft.assetId),
    () => nextDraft,
  );
}

export async function resetVectorStudioDatabaseForTests(
  options: { remove?: boolean } = {},
): Promise<void> {
  const remove = options.remove ?? true;
  const database = databasePromise ? await databasePromise : null;
  statePromise = null;
  databasePromise = null;

  if (database && !database.closed) {
    await database.close();
  }

  if (remove) {
    await removeRxDatabase(
      getVectorStudioDatabaseName(),
      createVectorStudioStorage(),
      true,
    );
  }
}

function draftKey(gameId: string, assetId: string): string {
  return `${sanitizePathSegment(gameId)}__${sanitizePathSegment(assetId)}`;
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[.$[\]#/]/g, "_");
}

function registerPlugins(): void {
  if (pluginsRegistered) return;
  addRxPlugin(RxDBStatePlugin);
  addRxPlugin(RxDBLeaderElectionPlugin);
  addRxPlugin(RxDBCleanupPlugin);
  pluginsRegistered = true;
}

function isVectorDraft(value: unknown): value is VectorStudioDraft {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<VectorStudioDraft>;
  return (
    typeof candidate.assetId === "string" &&
    typeof candidate.gameId === "string" &&
    typeof candidate.svgSource === "string" &&
    typeof candidate.updatedAt === "number"
  );
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
