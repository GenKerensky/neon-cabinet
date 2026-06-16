import { describe, expect, it } from "vitest";
import {
  createWireframeAssetManifest,
  groupedAssetsForGame,
  resolveWireframeAssetSelection,
} from "./wireframe-assets";

describe("wireframe asset manifest", () => {
  it("creates model assets from checked-in OBJ glob records with optional sidecars", () => {
    const manifest = createWireframeAssetManifest(
      {
        "../../../battle-tanks/src/game/models/enemies/enemy-tank.obj":
          "/assets/enemy-tank.obj",
        "../../../battle-tanks/src/game/models/pickups/shield-pickup.obj":
          "/assets/shield-pickup.obj",
      },
      {
        "../../../battle-tanks/src/game/models/enemies/enemy-tank.wire.json":
          '{"color":"#35ff95"}',
      },
    );

    expect(manifest["battle-tanks"]).toHaveLength(2);
    expect(manifest["battle-tanks"][0]).toMatchObject({
      folder: "enemies",
      gameId: "battle-tanks",
      label: "Enemy Tank",
      relativePath: "enemies/enemy-tank.obj",
      sidecarSource: '{"color":"#35ff95"}',
      source: "/assets/enemy-tank.obj",
    });
  });

  it("groups assets by folder", () => {
    const manifest = createWireframeAssetManifest({
      "../../../battle-tanks/src/game/models/enemies/enemy-tank.obj": "enemy",
      "../../../battle-tanks/src/game/models/pickups/shield-pickup.obj":
        "shield",
    });

    expect(groupedAssetsForGame(manifest, "battle-tanks")).toEqual([
      {
        folder: "enemies",
        assets: [manifest["battle-tanks"][0]],
      },
      {
        folder: "pickups",
        assets: [manifest["battle-tanks"][1]],
      },
    ]);
  });

  it("resolves URL selection by id or legacy path with a first-asset fallback", () => {
    const manifest = createWireframeAssetManifest({
      "../../../battle-tanks/src/game/models/enemies/enemy-tank.obj": "enemy",
    });
    const asset = manifest["battle-tanks"][0];

    expect(
      resolveWireframeAssetSelection(manifest, {
        asset: asset.id,
        game: "battle-tanks",
      }).asset,
    ).toBe(asset);
    expect(
      resolveWireframeAssetSelection(manifest, {
        asset: asset.legacyPath,
      }).asset,
    ).toBe(asset);
    expect(resolveWireframeAssetSelection(manifest, {}).asset).toBe(asset);
  });
});
