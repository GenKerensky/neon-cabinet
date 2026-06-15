import type { Scene } from "phaser";
import { VectorPuppet } from "@neon-cabinet/sprite-tools";
import {
  createEmptyVectorMetadata,
  getSpaceDefenderVectorMetadata,
  type SpaceDefenderVectorAssetId,
} from "../config/vectorAssets";

export function createVectorPuppet(
  scene: Scene,
  assetId: SpaceDefenderVectorAssetId,
  x: number,
  y: number,
): VectorPuppet {
  return new VectorPuppet(
    scene,
    x,
    y,
    getSpaceDefenderVectorMetadata(
      scene,
      assetId,
      createEmptyVectorMetadata(32, 32),
    ),
  );
}

export function spawnMuzzleFlash(
  scene: Scene,
  x: number,
  y: number,
  angle: number,
): void {
  const flash = createVectorPuppet(scene, "muzzleFlash", x, y);
  flash.setRotation(angle);
  flash.setScale(1.3);
  flash.setDepth(12);

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2,
    scaleY: 2,
    duration: 90,
    onComplete: () => {
      flash.destroy();
    },
  });
}
