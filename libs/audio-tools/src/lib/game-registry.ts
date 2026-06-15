import {
  DEFAULT_STUDIO_GAME_ID,
  getStudioGameById,
  getStudioGames,
} from "@neon-cabinet/studio-registry";
import { BATTLE_TANKS_AUDIO_PATCHES } from "./battle-tanks-presets";
import { MARS_LANDER_AUDIO_PATCHES } from "./mars-lander-presets";
import { SPACE_DEFENDER_AUDIO_PATCHES } from "./space-defender-presets";
import { AudioStudioGameRegistration, SoundPatch } from "./types";

export const DEFAULT_AUDIO_STUDIO_GAME_ID = DEFAULT_STUDIO_GAME_ID;

const registeredGames: AudioStudioGameRegistration[] = getStudioGames().map(
  (game) => ({
    ...game,
    effects: effectsForGame(game.id),
    defaultEffectId: defaultEffectIdForGame(game.id),
  }),
);

export function registerAudioStudioGame(
  game: AudioStudioGameRegistration,
): AudioStudioGameRegistration {
  const existingIndex = registeredGames.findIndex(
    (candidate) => candidate.id === game.id,
  );
  if (existingIndex >= 0) {
    registeredGames[existingIndex] = game;
  } else {
    registeredGames.push(game);
  }
  return game;
}

export function getAudioStudioGames(): AudioStudioGameRegistration[] {
  return registeredGames.map(cloneGameRegistration);
}

export function getAudioStudioGameById(
  id: string,
): AudioStudioGameRegistration | undefined {
  const game = registeredGames.find((candidate) => candidate.id === id);
  if (game) return cloneGameRegistration(game);

  const sharedGame = getStudioGameById(id);
  return sharedGame
    ? {
        ...sharedGame,
        effects: [],
      }
    : undefined;
}

export const AUDIO_STUDIO_GAMES = registeredGames;

function effectsForGame(gameId: string): SoundPatch[] {
  if (gameId === "battle-tanks") return BATTLE_TANKS_AUDIO_PATCHES;
  if (gameId === "space-defender") return SPACE_DEFENDER_AUDIO_PATCHES;
  if (gameId === "mars-lander") return MARS_LANDER_AUDIO_PATCHES;
  return [];
}

function defaultEffectIdForGame(gameId: string): string | undefined {
  if (gameId === "battle-tanks") return "battle-tanks-cannon-bang";
  if (gameId === "space-defender") return "space-defender-thrust-loop";
  if (gameId === "mars-lander") return "mars-lander-thrust-loop";
  return undefined;
}

function cloneGameRegistration(
  game: AudioStudioGameRegistration,
): AudioStudioGameRegistration {
  return JSON.parse(JSON.stringify(game)) as AudioStudioGameRegistration;
}
