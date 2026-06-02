import { addRxPlugin, createRxDatabase, removeRxDatabase } from "rxdb";
import type { RxDatabase, RxState } from "rxdb";
import { RxDBCleanupPlugin } from "rxdb/plugins/cleanup";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBStatePlugin } from "rxdb/plugins/state";
import type { StudioHistory } from "../hooks/use-studio-history";

export type AudioStudioPersistedState = {
  studio?: {
    history?: StudioHistory;
  };
};

export const AUDIO_STUDIO_DATABASE_NAME = "neon_audio_studio";
export const AUDIO_STUDIO_STATE_NAMESPACE = "audio-studio";
export const STUDIO_HISTORY_STATE_PATH = "studio.history";

type AudioStudioDatabase = RxDatabase<Record<string, never>>;
type AudioStudioState = RxState<AudioStudioPersistedState>;

let pluginsRegistered = false;
let databasePromise: Promise<AudioStudioDatabase> | null = null;
let statePromise: Promise<AudioStudioState> | null = null;

export function createAudioStudioStorage() {
  return getRxStorageDexie();
}

export function getAudioStudioDatabaseName(): string {
  return (
    (globalThis as { __AUDIO_STUDIO_RXDB_NAME__?: string })
      .__AUDIO_STUDIO_RXDB_NAME__ ?? AUDIO_STUDIO_DATABASE_NAME
  );
}

export async function getAudioStudioDatabase(): Promise<AudioStudioDatabase> {
  registerPlugins();

  databasePromise ??= createRxDatabase({
    name: getAudioStudioDatabaseName(),
    storage: createAudioStudioStorage(),
    multiInstance: true,
  });

  return databasePromise;
}

export async function getAudioStudioRxState(): Promise<AudioStudioState> {
  statePromise ??= getAudioStudioDatabase().then((database) =>
    database.addState<AudioStudioPersistedState>(AUDIO_STUDIO_STATE_NAMESPACE),
  );

  return statePromise;
}

export function readPersistedStudioHistory(state: AudioStudioState): unknown {
  return state.get(STUDIO_HISTORY_STATE_PATH);
}

export async function writePersistedStudioHistory(
  history: StudioHistory,
): Promise<void> {
  const state = await getAudioStudioRxState();
  const nextHistory = cloneJson(history);
  await state.set(STUDIO_HISTORY_STATE_PATH, () => nextHistory);
}

export async function resetAudioStudioDatabaseForTests(
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
      getAudioStudioDatabaseName(),
      createAudioStudioStorage(),
      true,
    );
  }
}

function registerPlugins(): void {
  if (pluginsRegistered) return;
  addRxPlugin(RxDBStatePlugin);
  addRxPlugin(RxDBCleanupPlugin);
  pluginsRegistered = true;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
