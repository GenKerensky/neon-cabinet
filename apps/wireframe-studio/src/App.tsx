import {
  DEFAULT_STUDIO_GAME_ID,
  getStudioGameById,
  getStudioGames,
} from "@neon-cabinet/studio-registry";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseObjSource } from "./assets/obj-parser";
import {
  WIREFRAME_ASSET_MANIFEST,
  groupedAssetsForGame,
  resolveWireframeAssetSelection,
  type WireframeAsset,
  type WireframeAssetManifest,
} from "./assets/wireframe-assets";
import {
  applyWireSidecar,
  type WireSidecarStatus,
  type WireframePreviewModel,
} from "./assets/wire-sidecar";
import {
  createInitialPreviewState,
  type WireframePreviewState,
} from "./preview/wireframe-preview-state";

export type PreviewControllerState = WireframePreviewState;

export interface PreviewControllerHandle {
  clearModel(): void;
  destroy(): void;
  previewModel(input: {
    assetLabel: string;
    model: WireframePreviewModel;
    sidecarStatus: WireSidecarStatus;
    sourcePath: string;
    warnings: string[];
  }): void;
  resetCamera(): void;
  setAutoOrbit(enabled: boolean): void;
  setAxesEnabled(enabled: boolean): void;
  setEdgeColorsEnabled(enabled: boolean): void;
  setGridEnabled(enabled: boolean): void;
  setShaderEnabled(enabled: boolean): void;
  setZoomDistance(distance: number): void;
}

export interface LoadedWireframeAsset {
  model: WireframePreviewModel;
  sidecarStatus: WireSidecarStatus;
  warnings: string[];
}

export interface AppProps {
  createController?: (
    container: HTMLElement,
    onStateChange: (state: PreviewControllerState) => void,
  ) => Promise<PreviewControllerHandle>;
  loadAssetModel?: (asset: WireframeAsset) => Promise<LoadedWireframeAsset>;
  manifest?: WireframeAssetManifest;
}

const games = getStudioGames();

export default function App({
  createController = createDefaultController,
  loadAssetModel = loadAssetModelFromSource,
  manifest = WIREFRAME_ASSET_MANIFEST,
}: AppProps) {
  const initialSelection = useMemo(
    () =>
      resolveWireframeAssetSelection(
        manifest,
        Object.fromEntries(new URLSearchParams(window.location.search)),
      ),
    [manifest],
  );
  const [selectedGameId, setSelectedGameId] = useState(
    initialSelection.gameId || DEFAULT_STUDIO_GAME_ID,
  );
  const [selectedAssetId, setSelectedAssetId] = useState(
    initialSelection.assetId,
  );
  const [autoOrbit, setAutoOrbit] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewControllerState>(
    createInitialPreviewState(),
  );
  const [loadStatus, setLoadStatus] = useState("READY");
  const [controllerReady, setControllerReady] = useState(false);
  const controllerRef = useRef<PreviewControllerHandle | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const groupedAssets = useMemo(
    () => groupedAssetsForGame(manifest, selectedGameId),
    [manifest, selectedGameId],
  );
  const selectedAsset = useMemo(
    () =>
      (manifest[selectedGameId] ?? []).find(
        (asset) => asset.id === selectedAssetId,
      ),
    [manifest, selectedAssetId, selectedGameId],
  );
  const selectedGame =
    getStudioGameById(selectedGameId) ??
    getStudioGameById(DEFAULT_STUDIO_GAME_ID);

  useEffect(() => {
    const container = stageRef.current;
    if (!container) return;
    let active = true;
    void createController(container, setPreviewState).then((controller) => {
      if (!active) {
        controller.destroy();
        return;
      }
      controllerRef.current = controller;
      setControllerReady(true);
    });
    return () => {
      active = false;
      setControllerReady(false);
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [createController]);

  useEffect(() => {
    const assets = manifest[selectedGameId] ?? [];
    if (
      assets.length > 0 &&
      !assets.some((asset) => asset.id === selectedAssetId)
    ) {
      setSelectedAssetId(assets[0].id);
    }
  }, [manifest, selectedAssetId, selectedGameId]);

  useEffect(() => {
    if (!selectedAsset) {
      controllerRef.current?.clearModel();
      setPreviewState(createInitialPreviewState());
      setLoadStatus("NO ASSET");
      return;
    }

    let active = true;
    setLoadStatus("LOADING");
    void loadAssetModel(selectedAsset)
      .then((result) => {
        if (!active) return;
        const nextState = {
          ...createInitialPreviewState(result.model),
          assetLabel: selectedAsset.label,
          autoOrbit,
          sidecarStatus: result.sidecarStatus,
          sourcePath: selectedAsset.legacyPath,
          status: "LOADED",
          warnings: result.warnings,
        };
        setPreviewState(nextState);
        setLoadStatus("LOADED");
        controllerRef.current?.previewModel({
          assetLabel: selectedAsset.label,
          model: result.model,
          sidecarStatus: result.sidecarStatus,
          sourcePath: selectedAsset.legacyPath,
          warnings: result.warnings,
        });
        controllerRef.current?.setAutoOrbit(autoOrbit);
      })
      .catch((error) => {
        if (!active) return;
        setLoadStatus(error instanceof Error ? error.message : "LOAD FAILED");
      });

    return () => {
      active = false;
    };
  }, [autoOrbit, controllerReady, loadAssetModel, selectedAsset]);

  useEffect(() => {
    if (!selectedAsset) return;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("game", selectedAsset.gameId);
    nextUrl.searchParams.set("asset", selectedAsset.id);
    window.history.replaceState(null, "", nextUrl);
  }, [selectedAsset]);

  const selectGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setSelectedAssetId(manifest[gameId]?.[0]?.id ?? "");
  };

  const toggleAutoOrbit = () => {
    const enabled = !autoOrbit;
    setAutoOrbit(enabled);
    setPreviewState((current) => ({ ...current, autoOrbit: enabled }));
    controllerRef.current?.setAutoOrbit(enabled);
  };

  const setZoomDistance = (value: number) => {
    setPreviewState((current) => ({ ...current, zoomDistance: value }));
    controllerRef.current?.setZoomDistance(value);
  };

  return (
    <main className="wireframe-studio dark">
      <aside className="asset-browser">
        <div className="brand-block">
          <div className="brand-row">
            <div className="brand-mark">
              <span aria-hidden="true">O</span>
            </div>
            <h1>Wireframe Studio</h1>
          </div>
          <label className="field-label">
            <span>Game</span>
            <select
              aria-label="Select game"
              onChange={(event) => selectGame(event.target.value)}
              value={selectedGameId}
            >
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          aria-label="Wireframe asset tree"
          className="asset-tree"
          role="tree"
        >
          {groupedAssets.length === 0 ? (
            <div className="asset-empty">No checked-in OBJ assets</div>
          ) : (
            groupedAssets.map(({ assets, folder }) => (
              <section className="asset-tree-section" key={folder}>
                <div className="asset-tree-folder">{folder}</div>
                <div className="asset-tree-children" role="group">
                  {assets.map((asset) => (
                    <button
                      className={
                        asset.id === selectedAssetId
                          ? "asset-row active"
                          : "asset-row"
                      }
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      type="button"
                    >
                      {asset.label}
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </aside>

      <section className="preview-shell">
        <header className="preview-topbar">
          <div>
            <h2>{selectedAsset?.label ?? "No model selected"}</h2>
            <span>
              {previewState.vertexCount} vertices, {previewState.edgeCount}{" "}
              edges - {previewState.sidecarStatus}
            </span>
          </div>
          <div className="preview-status">
            <span>{loadStatus}</span>
            <span>{previewState.shaderEnabled ? "Shader" : "Raw"}</span>
          </div>
        </header>
        <div className="preview-stage-wrap">
          <div ref={stageRef} className="phaser-stage" />
          {!selectedAsset ? (
            <div className="empty-stage">
              <span aria-hidden="true" className="empty-stage-icon">
                O
              </span>
              <h2>No wireframe model loaded</h2>
              <p>Select a checked-in OBJ asset to preview it.</p>
            </div>
          ) : null}
        </div>
      </section>

      <aside className="wireframe-inspector">
        <section className="panel">
          <h2>Camera</h2>
          <button
            aria-pressed={autoOrbit}
            className={autoOrbit ? "active" : ""}
            onClick={toggleAutoOrbit}
            type="button"
          >
            Auto Orbit
          </button>
          <button
            onClick={() => controllerRef.current?.resetCamera()}
            type="button"
          >
            Reset
          </button>
          <label className="field-label">
            <span>Zoom</span>
            <input
              max={previewState.maxZoomDistance}
              min={previewState.minZoomDistance}
              onChange={(event) => setZoomDistance(Number(event.target.value))}
              step="1"
              type="range"
              value={previewState.zoomDistance}
            />
          </label>
          <div className="stat-grid">
            <span>Yaw</span>
            <strong>{previewState.yaw.toFixed(1)}</strong>
            <span>Pitch</span>
            <strong>{previewState.pitch.toFixed(1)}</strong>
          </div>
        </section>

        <section className="panel">
          <h2>Display</h2>
          <ToggleRow
            checked={previewState.shaderEnabled}
            label="Shader"
            onChange={(checked) =>
              controllerRef.current?.setShaderEnabled(checked)
            }
          />
          <ToggleRow
            checked={previewState.gridEnabled}
            label="Grid"
            onChange={(checked) =>
              controllerRef.current?.setGridEnabled(checked)
            }
          />
          <ToggleRow
            checked={previewState.axesEnabled}
            label="Axes"
            onChange={(checked) =>
              controllerRef.current?.setAxesEnabled(checked)
            }
          />
          <ToggleRow
            checked={previewState.edgeColorsEnabled}
            label="Edge Colors"
            onChange={(checked) =>
              controllerRef.current?.setEdgeColorsEnabled(checked)
            }
          />
        </section>

        <section className="panel">
          <h2>Model</h2>
          <div className="stat-grid">
            <span>Vertices</span>
            <strong>{previewState.vertexCount} vertices</strong>
            <span>Edges</span>
            <strong>{previewState.edgeCount} edges</strong>
            <span>Width</span>
            <strong>{previewState.bounds.size.x.toFixed(1)}</strong>
            <span>Height</span>
            <strong>{previewState.bounds.size.y.toFixed(1)}</strong>
            <span>Depth</span>
            <strong>{previewState.bounds.size.z.toFixed(1)}</strong>
          </div>
          <p className="source-path">
            {selectedAsset?.legacyPath ?? "No source"}
          </p>
          {previewState.warnings.length > 0 ? (
            <ul className="warning-list">
              {previewState.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </section>
      </aside>
    </main>
  );
}

function ToggleRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange(checked: boolean): void;
}) {
  const [localChecked, setLocalChecked] = useState(checked);
  useEffect(() => setLocalChecked(checked), [checked]);
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input
        checked={localChecked}
        onChange={(event) => {
          setLocalChecked(event.target.checked);
          onChange(event.target.checked);
        }}
        type="checkbox"
      />
    </label>
  );
}

async function createDefaultController(
  container: HTMLElement,
  onStateChange: (state: PreviewControllerState) => void,
): Promise<PreviewControllerHandle> {
  const { WireframePreviewController } =
    await import("./preview/wireframe-preview-controller");
  return new WireframePreviewController({ container, onStateChange });
}

async function loadAssetModelFromSource(
  asset: WireframeAsset,
): Promise<LoadedWireframeAsset> {
  const parsed = parseObjSource(asset.source);
  const game = getStudioGameById(asset.gameId);
  return applyWireSidecar(
    parsed,
    asset.sidecarSource,
    parseCssColor(game?.theme.primary) ?? 0x7be8ff,
  );
}

function parseCssColor(value: string | undefined): number | undefined {
  if (!value?.startsWith("#")) return undefined;
  const parsed = Number(`0x${value.slice(1)}`);
  return Number.isFinite(parsed) ? parsed : undefined;
}
