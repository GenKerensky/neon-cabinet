import { getStudioGames } from "@neon-cabinet/studio-registry";

export interface WireframeAsset {
  id: string;
  gameId: string;
  label: string;
  folder: string;
  source: string;
  legacyPath: string;
  relativePath: string;
  sidecarSource?: string;
}

export type WireframeAssetManifest = Record<string, WireframeAsset[]>;

export interface WireframeAssetSelection {
  asset?: string | null;
  game?: string | null;
}

const modelAssetPattern =
  /(?:^|\/)(?:apps\/)?([^/]+)\/src\/game\/models\/(.+\.obj)$/;

const modelAssetModules = import.meta.glob<string>(
  "../../../*/src/game/models/**/*.obj",
  {
    eager: true,
    query: "?raw",
    import: "default",
  },
);

const sidecarModules = import.meta.glob<string>(
  "../../../*/src/game/models/**/*.wire.json",
  {
    eager: true,
    query: "?raw",
    import: "default",
  },
);

export const WIREFRAME_ASSET_MANIFEST = createWireframeAssetManifest(
  modelAssetModules,
  sidecarModules,
);

export function createWireframeAssetManifest(
  modules: Record<string, string>,
  sidecars: Record<string, string> = {},
): WireframeAssetManifest {
  const manifest: WireframeAssetManifest = {};

  for (const [modulePath, source] of Object.entries(modules)) {
    const match = modulePath.match(modelAssetPattern);
    if (!match) continue;

    const [, gameId, relativePath] = match;
    const pathParts = relativePath.split("/");
    const fileName = pathParts.at(-1) ?? relativePath;
    const folderParts = pathParts.slice(0, -1);
    const folder = folderParts.length > 0 ? folderParts.join("/") : "root";
    const sidecarPath = modulePath.replace(/\.obj$/, ".wire.json");
    const asset: WireframeAsset = {
      folder,
      gameId,
      id: `${gameId}-wireframe-${slugify(relativePath.replace(/\.obj$/, ""))}`,
      label: titleCase(fileName.replace(/\.obj$/, "")),
      legacyPath: `apps/${gameId}/src/game/models/${relativePath}`,
      relativePath,
      sidecarSource: sidecars[sidecarPath],
      source,
    };

    manifest[asset.gameId] = [...(manifest[asset.gameId] ?? []), asset];
  }

  return Object.fromEntries(
    Object.entries(manifest).map(([gameId, assets]) => [
      gameId,
      [...assets].sort((left, right) =>
        `${left.folder}/${left.label}`.localeCompare(
          `${right.folder}/${right.label}`,
        ),
      ),
    ]),
  );
}

export function groupedAssetsForGame(
  manifest: WireframeAssetManifest,
  gameId: string,
): Array<{ folder: string; assets: WireframeAsset[] }> {
  const groups = new Map<string, WireframeAsset[]>();
  for (const asset of manifest[gameId] ?? []) {
    groups.set(asset.folder, [...(groups.get(asset.folder) ?? []), asset]);
  }
  return Array.from(groups, ([folder, assets]) => ({ folder, assets }));
}

export function resolveWireframeAssetSelection(
  manifest: WireframeAssetManifest,
  selection: WireframeAssetSelection,
): { asset: WireframeAsset | undefined; assetId: string; gameId: string } {
  const allAssets = Object.values(manifest).flat();
  if (selection.game && (manifest[selection.game] ?? []).length === 0) {
    return { asset: undefined, assetId: "", gameId: selection.game };
  }

  const selectedAsset =
    allAssets.find((asset) => asset.legacyPath === selection.asset) ??
    allAssets.find(
      (asset) =>
        asset.id === selection.asset &&
        (!selection.game || asset.gameId === selection.game),
    ) ??
    manifest[selection.game ?? ""]?.[0] ??
    getStudioGames()
      .map((game) => manifest[game.id]?.[0])
      .find((asset): asset is WireframeAsset => Boolean(asset)) ??
    allAssets[0];

  return {
    asset: selectedAsset,
    assetId: selectedAsset?.id ?? "",
    gameId: selectedAsset?.gameId ?? selection.game ?? "",
  };
}

function slugify(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}
