import { getStudioGames } from "@neon-cabinet/studio-registry";

export interface VectorAsset {
  id: string;
  gameId: string;
  label: string;
  folder: string;
  source: string;
  legacyPath: string;
  relativePath: string;
}

export type VectorAssetManifest = Record<string, VectorAsset[]>;

export interface VectorAssetSelection {
  asset?: string | null;
  game?: string | null;
}

const workspaceAssetPattern =
  /(?:^|\/)(?:apps\/)?([^/]+)\/public\/assets\/vector\/(.+\.svg)$/;

const vectorAssetModules = import.meta.glob<string>(
  "../../../*/public/assets/vector/**/*.svg",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

export const VECTOR_ASSET_MANIFEST =
  createVectorAssetManifest(vectorAssetModules);

export function createVectorAssetManifest(
  modules: Record<string, string>,
): VectorAssetManifest {
  const manifest: VectorAssetManifest = {};

  for (const [modulePath, source] of Object.entries(modules)) {
    const match = modulePath.match(workspaceAssetPattern);
    if (!match) continue;

    const [, gameId, relativePath] = match;
    const assetPath = relativePath ?? "";
    const pathParts = assetPath.split("/");
    const fileName = pathParts.at(-1) ?? assetPath;
    const folderParts = pathParts.slice(0, -1);
    const folder = folderParts.length > 0 ? folderParts.join("/") : "root";
    const id = `${gameId}-vector-${slugify(assetPath.replace(/\.svg$/, ""))}`;
    const asset: VectorAsset = {
      folder,
      gameId: gameId ?? "",
      id,
      label: titleCase(fileName.replace(/\.svg$/, "")),
      legacyPath: `apps/${gameId}/public/assets/vector/${assetPath}`,
      relativePath: assetPath,
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

export function resolveVectorAssetSelection(
  manifest: VectorAssetManifest,
  selection: VectorAssetSelection,
): { asset: VectorAsset | undefined; assetId: string; gameId: string } {
  const allAssets = Object.values(manifest).flat();
  if (selection.game && (manifest[selection.game] ?? []).length === 0) {
    return {
      asset: undefined,
      assetId: "",
      gameId: selection.game,
    };
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
      .find((asset): asset is VectorAsset => Boolean(asset)) ??
    allAssets[0];

  return {
    asset: selectedAsset,
    assetId: selectedAsset?.id ?? "",
    gameId: selectedAsset?.gameId ?? selection.game ?? "",
  };
}

export function groupedAssetsForGame(
  manifest: VectorAssetManifest,
  gameId: string,
): Array<{ folder: string; assets: VectorAsset[] }> {
  const groups = new Map<string, VectorAsset[]>();
  for (const asset of manifest[gameId] ?? []) {
    groups.set(asset.folder, [...(groups.get(asset.folder) ?? []), asset]);
  }
  return Array.from(groups, ([folder, assets]) => ({ folder, assets }));
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
