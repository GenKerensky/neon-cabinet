import { addRxPlugin, createRxDatabase, removeRxDatabase } from "rxdb";
import type { RxDatabase, RxState } from "rxdb";
import { RxDBCleanupPlugin } from "rxdb/plugins/cleanup";
import { RxDBLeaderElectionPlugin } from "rxdb/plugins/leader-election";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBStatePlugin } from "rxdb/plugins/state";
import { DEFAULT_AUDIO_STUDIO_GAME_ID } from "@neon-cabinet/audio-tools";
import type { StudioHistory } from "../hooks/use-studio-history";

export type AudioStudioPersistedState = {
  studio?: {
    gamesById?: Record<string, { history?: StudioHistory }>;
    history?: StudioHistory;
    selectedGameId?: string;
  };
};

export const AUDIO_STUDIO_DATABASE_NAME = "neon_audio_studio";
export const AUDIO_STUDIO_STATE_NAMESPACE = "audio-studio";
export const STUDIO_HISTORY_STATE_PATH = "studio.history";
export const STUDIO_SELECTED_GAME_ID_STATE_PATH = "studio.selectedGameId";

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

export function gameHistoryStatePath(gameId: string): string {
  return `studio.gamesById.${gameId}.history`;
}

export function readPersistedSelectedGameId(state: AudioStudioState): unknown {
  return state.get(STUDIO_SELECTED_GAME_ID_STATE_PATH);
}

export function readPersistedStudioHistory(
  state: AudioStudioState,
  gameId = DEFAULT_AUDIO_STUDIO_GAME_ID,
): unknown {
  return (
    state.get(gameHistoryStatePath(gameId)) ??
    (gameId === DEFAULT_AUDIO_STUDIO_GAME_ID
      ? state.get(STUDIO_HISTORY_STATE_PATH)
      : undefined)
  );
}

export async function writePersistedSelectedGameId(
  gameId: string,
): Promise<void> {
  const state = await getAudioStudioRxState();
  await state.set(STUDIO_SELECTED_GAME_ID_STATE_PATH, () => gameId);
}

export async function writePersistedStudioHistory(
  history: StudioHistory,
  gameId = DEFAULT_AUDIO_STUDIO_GAME_ID,
): Promise<void> {
  const state = await getAudioStudioRxState();
  const nextHistory = cloneJson(history);
  await state.set(gameHistoryStatePath(gameId), () => nextHistory);
}

export async function writePersistedStudioHistoryIfMissing(
  history: StudioHistory,
  gameId = DEFAULT_AUDIO_STUDIO_GAME_ID,
): Promise<void> {
  const state = await getAudioStudioRxState();
  const nextHistory = cloneJson(history);
  await state.set(gameHistoryStatePath(gameId), (existing) =>
    existing === undefined ? nextHistory : existing,
  );
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
  addRxPlugin(RxDBLeaderElectionPlugin);
  addRxPlugin(RxDBCleanupPlugin);
  pluginsRegistered = true;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
