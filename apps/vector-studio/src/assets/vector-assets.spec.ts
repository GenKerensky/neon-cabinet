import {
  createVectorAssetManifest,
  resolveVectorAssetSelection,
} from "./vector-assets";

const modules = {
  "/home/falco/code/neon-cabinet/apps/space-defender/public/assets/vector/ship.svg":
    "/@fs/space-defender/ship.svg",
  "/home/falco/code/neon-cabinet/apps/maze-runner/public/assets/vector/ghosts/chaser.svg":
    "/@fs/maze-runner/chaser.svg",
  "/home/falco/code/neon-cabinet/apps/mars-lander/public/assets/vector/landing-pad.svg":
    "/@fs/mars-lander/landing-pad.svg",
  "../../../space-defender/public/assets/vector/life-icon.svg":
    "/@fs/space-defender/life-icon.svg",
};

describe("vector asset manifest", () => {
  it("groups workspace SVG assets by game and nested folder", () => {
    const manifest = createVectorAssetManifest(modules);
    const ship = manifest["space-defender"]?.find(
      (asset) => asset.id === "space-defender-vector-ship",
    );

    expect(ship).toMatchObject({
      folder: "root",
      gameId: "space-defender",
      id: "space-defender-vector-ship",
      label: "Ship",
      legacyPath: "apps/space-defender/public/assets/vector/ship.svg",
    });
    expect(manifest["maze-runner"]?.[0]).toMatchObject({
      folder: "ghosts",
      gameId: "maze-runner",
      id: "maze-runner-vector-ghosts-chaser",
      label: "Chaser",
      legacyPath: "apps/maze-runner/public/assets/vector/ghosts/chaser.svg",
    });
    expect(
      manifest["space-defender"]?.some(
        (asset) => asset.id === "space-defender-vector-life-icon",
      ),
    ).toBe(true);
  });

  it("resolves stable ids and legacy asset query paths", () => {
    const manifest = createVectorAssetManifest(modules);

    expect(
      resolveVectorAssetSelection(manifest, {
        asset: "apps/maze-runner/public/assets/vector/ghosts/chaser.svg",
      }),
    ).toMatchObject({
      gameId: "maze-runner",
      assetId: "maze-runner-vector-ghosts-chaser",
    });
    expect(
      resolveVectorAssetSelection(manifest, {
        asset: "space-defender-vector-ship",
        game: "space-defender",
      }),
    ).toMatchObject({
      gameId: "space-defender",
      assetId: "space-defender-vector-ship",
    });
  });

  it("defaults to the first registered game that has vector assets", () => {
    const manifest = createVectorAssetManifest(modules);

    expect(resolveVectorAssetSelection(manifest, {})).toMatchObject({
      gameId: "space-defender",
      assetId: "space-defender-vector-life-icon",
    });
  });
});
