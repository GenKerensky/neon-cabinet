import type { Game as PhaserGame } from "phaser";
import { CollectibleType } from "../../src/game/objects/Collectible";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function registerEatPowerPelletCommand(
  game: PhaserGame,
  commands: Record<string, (...args: any[]) => void>,
): void {
  commands.eatPowerPellet = () => {
    const scenes = game.scene.getScenes(true);
    const gameScene = scenes.find((s) => s.scene.key === "Game") as any;
    if (!gameScene?.collectibleManager) return;

    const collectibles = gameScene.collectibleManager.getCollectibles?.() ?? [];
    const powerPellet = collectibles.find(
      (collectible: any) =>
        collectible.active &&
        collectible.getType?.() === CollectibleType.POWER_PELLET,
    );

    if (!powerPellet) return;
    gameScene.onCollectibleHit(null, powerPellet);
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
