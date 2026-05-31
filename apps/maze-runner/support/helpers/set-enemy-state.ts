import type { Game as PhaserGame } from "phaser";
import { EnemyState } from "../../src/game/objects/Enemy";

/* eslint-disable @typescript-eslint/no-explicit-any */
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
  commands: Record<string, (...args: any[]) => void>,
): void {
  commands.setEnemyState = (textureOrId: string, state: string) => {
    const scenes = game.scene.getScenes(true);
    const gameScene = scenes.find((s) => s.scene.key === "Game") as any;
    if (!gameScene?.enemies) return;

    const enemy = gameScene.enemies.find((candidate: any) => {
      const texture = candidate.texture?.key ?? candidate.textureName;
      return texture === textureOrId || candidate.textureName === textureOrId;
    });

    const enemyState = toEnemyState(state);
    if (!enemy || !enemyState) return;
    enemy.setEnemyState(enemyState);
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
