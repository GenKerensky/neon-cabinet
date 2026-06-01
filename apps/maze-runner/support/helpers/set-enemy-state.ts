import type { Game as PhaserGame } from "phaser";
import { EnemyState } from "../../src/game/objects/Enemy";
import {
  getMazeRunnerGameScene,
  isString,
  type HarnessCommands,
} from "./types";

function toEnemyState(state: string): EnemyState | null {
  const normalized = state.trim().toLowerCase();
  switch (normalized) {
    case EnemyState.SCATTER:
      return EnemyState.SCATTER;
    case EnemyState.CHASE:
      return EnemyState.CHASE;
    case EnemyState.FRIGHTENED:
      return EnemyState.FRIGHTENED;
    case EnemyState.DEAD:
      return EnemyState.DEAD;
    default:
      return null;
  }
}

export function registerSetEnemyStateCommand(
  game: PhaserGame,
  commands: HarnessCommands,
): void {
  commands.setEnemyState = (textureOrId: unknown, state: unknown) => {
    if (!isString(textureOrId) || !isString(state)) return;

    const enemyState = toEnemyState(state);
    if (!enemyState) return;

    getMazeRunnerGameScene(game)?.setEnemyStateForDebug(
      textureOrId,
      enemyState,
    );
  };
}
