import {
  DEFAULT_STUDIO_GAME_ID,
  getStudioGameById,
  getStudioGames,
  type StudioGame,
} from "@neon-cabinet/studio-registry";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import { GradientSlider } from "@neon-cabinet/ui/components/gradient-slider";
import { ScrollArea } from "@neon-cabinet/ui/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@neon-cabinet/ui/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@neon-cabinet/ui/components/ui/tabs";
import { VectorMode } from "@neon-cabinet/shaders/shaders";
import {
  ChevronRightIcon,
  EyeIcon,
  FileCode2Icon,
  PauseIcon,
  PlayIcon,
  ScanLineIcon,
  ShapesIcon,
  StepBackIcon,
  StepForwardIcon,
} from "lucide-react";
import type { Subscription } from "rxjs";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  groupedAssetsForGame,
  resolveVectorAssetSelection,
  VECTOR_ASSET_MANIFEST,
  type VectorAsset,
} from "./assets/vector-assets";
import {
  type PreviewState,
  VectorPreviewController,
} from "./preview/vector-preview-controller";
import { VectorEditor } from "./editor/VectorEditor";
import {
  getVectorStudioRxState,
  readPersistedVectorDraft,
  writePersistedVectorDraft,
} from "./storage/vector-studio-rxdb";

const games = getStudioGames();

const initialSelection = resolveVectorAssetSelection(
  VECTOR_ASSET_MANIFEST,
  Object.fromEntries(new URLSearchParams(window.location.search)),
);

const initialPreviewState: PreviewState = {
  animationPaused: false,
  animationSpeed: 1,
  assetLabel: initialSelection.asset?.label ?? "No asset selected",
  colliderCount: 0,
  layers: [],
  rotation: 0,
  scale: 4,
  shaderEnabled: true,
  socketCount: 0,
  status: "READY",
  unsupportedWarnings: [],
  vectorMode: VectorMode.COLOR,
};

const DRAFT_PERSIST_DEBOUNCE_MS = 180;

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [selectedGameId, setSelectedGameId] = useState(
    initialSelection.gameId || DEFAULT_STUDIO_GAME_ID,
  );
  const [selectedAssetId, setSelectedAssetId] = useState(
    initialSelection.assetId,
  );
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [showSockets, setShowSockets] = useState(true);
  const [showColliders, setShowColliders] = useState(true);
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState<
    "editor" | "preview"
  >("preview");
  const [editorSvgSource, setEditorSvgSource] = useState("");
  const [appliedSvgSource, setAppliedSvgSource] = useState("");
  const [editorSelectedElementId, setEditorSelectedElementId] = useState("");
  const [editorDirty, setEditorDirty] = useState(false);
  const [draftStatus, setDraftStatus] = useState("DRAFT READY");
  const [previewState, setPreviewState] = useState(initialPreviewState);
  const controllerRef = useRef<VectorPreviewController | null>(null);
  const appliedSvgSourceRef = useRef("");
  const draftPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const editorSelectedElementIdRef = useRef("");
  const editorSvgSourceRef = useRef("");
  const selectedAssetRef = useRef<VectorAsset | undefined>(undefined);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const selectedGame =
    getStudioGameById(selectedGameId) ??
    getStudioGameById(DEFAULT_STUDIO_GAME_ID);
  const groupedAssets = useMemo(
    () => groupedAssetsForGame(VECTOR_ASSET_MANIFEST, selectedGameId),
    [selectedGameId],
  );
  const selectedAsset = useMemo(
    () =>
      (VECTOR_ASSET_MANIFEST[selectedGameId] ?? []).find(
        (asset) => asset.id === selectedAssetId,
      ),
    [selectedAssetId, selectedGameId],
  );
  const appStyle = useMemo(
    () =>
      ({
        ...themeVariables(selectedGame),
        gridTemplateColumns: `${sidebarWidth}px 8px minmax(460px, 1fr) 340px`,
      }) as CSSProperties,
    [selectedGame, sidebarWidth],
  );

  useEffect(() => {
    appliedSvgSourceRef.current = appliedSvgSource;
  }, [appliedSvgSource]);

  useEffect(() => {
    editorSvgSourceRef.current = editorSvgSource;
  }, [editorSvgSource]);

  useEffect(() => {
    editorSelectedElementIdRef.current = editorSelectedElementId;
  }, [editorSelectedElementId]);

  useEffect(() => {
    selectedAssetRef.current = selectedAsset;
  }, [selectedAsset]);

  const writeCurrentDraft = useCallback(async (): Promise<void> => {
    const asset = selectedAssetRef.current;
    const svgSource = editorSvgSourceRef.current;
    if (!asset || !svgSource) return;

    await writePersistedVectorDraft({
      appliedSvgSource: appliedSvgSourceRef.current || svgSource,
      assetId: asset.id,
      gameId: asset.gameId,
      selectedElementId: editorSelectedElementIdRef.current,
      svgSource,
      updatedAt: Date.now(),
    });
  }, []);

  const queueDraftPersist = useCallback(() => {
    if (draftPersistTimerRef.current) {
      clearTimeout(draftPersistTimerRef.current);
    }
    draftPersistTimerRef.current = setTimeout(() => {
      draftPersistTimerRef.current = null;
      void writeCurrentDraft()
        .then(() => setDraftStatus("DRAFT SYNCED"))
        .catch((error) => {
          setDraftStatus(
            error instanceof Error ? error.message : "DRAFT FAILED",
          );
        });
    }, DRAFT_PERSIST_DEBOUNCE_MS);
  }, [writeCurrentDraft]);

  useEffect(
    () => () => {
      if (draftPersistTimerRef.current) {
        clearTimeout(draftPersistTimerRef.current);
        draftPersistTimerRef.current = null;
      }
      void writeCurrentDraft();
    },
    [writeCurrentDraft],
  );

  const handleEditorChange = useCallback(
    (svgSource: string, selectedElementId: string): void => {
      editorSvgSourceRef.current = svgSource;
      editorSelectedElementIdRef.current = selectedElementId;
      setEditorSvgSource(svgSource);
      setEditorSelectedElementId(selectedElementId);
      setEditorDirty(svgSource !== appliedSvgSourceRef.current);
      setDraftStatus("DRAFT MODIFIED");
      queueDraftPersist();
    },
    [queueDraftPersist],
  );

  const applyEditorToPreview = useCallback(() => {
    appliedSvgSourceRef.current = editorSvgSourceRef.current;
    setAppliedSvgSource(editorSvgSourceRef.current);
    setEditorDirty(false);
    setDraftStatus("APPLIED");
    void writeCurrentDraft().catch((error) => {
      setDraftStatus(error instanceof Error ? error.message : "DRAFT FAILED");
    });
  }, [writeCurrentDraft]);

  useEffect(() => {
    const container = stageRef.current;
    if (!container) return;
    const controller = new VectorPreviewController({
      container,
      onStateChange: setPreviewState,
    });
    controllerRef.current = controller;
    return () => {
      controllerRef.current = null;
      controller.destroy();
    };
  }, []);

  useEffect(() => {
    if (!selectedAsset) {
      setEditorSvgSource("");
      setAppliedSvgSource("");
      setEditorSelectedElementId("");
      setEditorDirty(false);
      setDraftStatus("NO ASSET");
      controllerRef.current?.clearAsset();
      return;
    }

    let active = true;
    setEditorSvgSource("");
    setAppliedSvgSource("");
    setEditorSelectedElementId("");
    setEditorDirty(false);
    setDraftStatus("LOADING SOURCE");

    void loadSvgSourceForAsset(selectedAsset)
      .then(async (assetSvgSource) => {
        const state = await getVectorStudioRxState();
        const draft = readPersistedVectorDraft(
          state,
          selectedAsset.gameId,
          selectedAsset.id,
        );
        return { assetSvgSource, draft };
      })
      .then(({ assetSvgSource, draft }) => {
        if (!active) return;
        const restoredSvgSource = draft?.svgSource ?? assetSvgSource;
        const restoredAppliedSource =
          draft?.appliedSvgSource ?? restoredSvgSource;
        editorSvgSourceRef.current = restoredSvgSource;
        appliedSvgSourceRef.current = restoredAppliedSource;
        editorSelectedElementIdRef.current = draft?.selectedElementId ?? "";
        setEditorSvgSource(restoredSvgSource);
        setAppliedSvgSource(restoredAppliedSource);
        setEditorSelectedElementId(draft?.selectedElementId ?? "");
        setEditorDirty(restoredSvgSource !== restoredAppliedSource);
        setDraftStatus(draft ? "DRAFT RESTORED" : "SOURCE LOADED");
      })
      .catch((error) => {
        if (!active) return;
        setDraftStatus(error instanceof Error ? error.message : "LOAD FAILED");
        setPreviewState((current) => ({
          ...current,
          status: error instanceof Error ? error.message : "LOAD FAILED",
        }));
      });

    return () => {
      active = false;
    };
  }, [selectedAsset]);

  useEffect(() => {
    if (!selectedAsset) return;
    let active = true;
    let subscription: Subscription | undefined;

    void getVectorStudioRxState()
      .then((state) => {
        if (!active) return;
        subscription = state.get$("editor").subscribe(() => {
          if (!active || !selectedAssetRef.current) return;
          const asset = selectedAssetRef.current;
          const draft = readPersistedVectorDraft(state, asset.gameId, asset.id);
          if (!draft || draft.svgSource === editorSvgSourceRef.current) return;

          editorSvgSourceRef.current = draft.svgSource;
          appliedSvgSourceRef.current =
            draft.appliedSvgSource ?? draft.svgSource;
          editorSelectedElementIdRef.current = draft.selectedElementId ?? "";
          setEditorSvgSource(draft.svgSource);
          setAppliedSvgSource(draft.appliedSvgSource ?? draft.svgSource);
          setEditorSelectedElementId(draft.selectedElementId ?? "");
          setEditorDirty(
            draft.svgSource !== (draft.appliedSvgSource ?? draft.svgSource),
          );
          setDraftStatus("TAB SYNCED");
        });
      })
      .catch((error) => {
        if (!active) return;
        setDraftStatus(
          error instanceof Error ? error.message : "STORAGE FAILED",
        );
      });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [selectedAsset]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    if (!selectedAsset || !appliedSvgSource) {
      controller.clearAsset();
      return;
    }
    controller.previewSvg(appliedSvgSource, selectedAsset.label);
  }, [appliedSvgSource, selectedAsset]);

  useEffect(() => {
    const assets = VECTOR_ASSET_MANIFEST[selectedGameId] ?? [];
    if (
      assets.length > 0 &&
      !assets.some((asset) => asset.id === selectedAssetId)
    ) {
      setSelectedAssetId(assets[0]?.id ?? "");
    }
  }, [selectedAssetId, selectedGameId]);

  useEffect(() => {
    if (!selectedAsset) return;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("game", selectedAsset.gameId);
    nextUrl.searchParams.set("asset", selectedAsset.id);
    window.history.replaceState(null, "", nextUrl);
  }, [selectedAsset]);

  const selectGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setSelectedAssetId(VECTOR_ASSET_MANIFEST[gameId]?.[0]?.id ?? "");
  };

  return (
    <main className="vector-studio theme-audio-studio dark" style={appStyle}>
      <AssetBrowser
        groupedAssets={groupedAssets}
        onSelectAsset={setSelectedAssetId}
        onSelectGame={selectGame}
        openFolders={openFolders}
        selectedAssetId={selectedAssetId}
        selectedGameId={selectedGameId}
        setOpenFolders={setOpenFolders}
      />

      <div
        aria-label="Resize asset sidebar"
        className="sidebar-resize-handle"
        onPointerDown={(event) => {
          const target = event.currentTarget;
          target.setPointerCapture?.(event.pointerId);
          const startX = event.clientX;
          const startWidth = sidebarWidth;
          const onMove = (moveEvent: PointerEvent) => {
            setSidebarWidth(
              Math.min(
                440,
                Math.max(210, startWidth + moveEvent.clientX - startX),
              ),
            );
          };
          const onUp = () => {
            target.removeEventListener("pointermove", onMove);
            target.removeEventListener("pointerup", onUp);
          };
          target.addEventListener("pointermove", onMove);
          target.addEventListener("pointerup", onUp);
        }}
        role="separator"
        tabIndex={0}
      />

      <section className="workbench-shell">
        <Tabs
          className="workbench-tabs"
          onValueChange={(value) =>
            setActiveWorkbenchTab(value === "editor" ? "editor" : "preview")
          }
          value={activeWorkbenchTab}
        >
          <header className="preview-topbar workbench-topbar">
            <div>
              <h2>{selectedAsset?.label ?? "No vector asset"}</h2>
              <span>
                {previewState.layers.length} layers, {previewState.socketCount}{" "}
                sockets, {previewState.colliderCount} colliders - {draftStatus}
              </span>
            </div>
            <TabsList
              aria-label="Vector workbench modes"
              className="workbench-mode-tabs"
            >
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <div className="preview-status">
              <span>{previewState.status}</span>
              <span>{previewState.shaderEnabled ? "Shader" : "Raw"}</span>
              <span>{previewState.vectorMode}</span>
            </div>
          </header>

          <TabsContent className="workbench-tab-content" value="editor">
            {selectedAsset && editorSvgSource ? (
              <VectorEditor
                assetLabel={selectedAsset.label}
                dirty={editorDirty}
                onApplyPreview={applyEditorToPreview}
                onChange={handleEditorChange}
                selectedElementId={editorSelectedElementId}
                svgSource={editorSvgSource}
              />
            ) : (
              <div className="empty-stage editor-empty">
                <FileCode2Icon aria-hidden="true" />
                <h2>No editable vector asset</h2>
                <p>
                  This game is registered for the studio suite, but it does not
                  have SVG assets under public/assets/vector yet.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent
            className="workbench-tab-content preview-tab-content"
            forceMount
            value="preview"
          >
            <div className="preview-stage-wrap">
              <div className="preview-grid" />
              <div ref={stageRef} className="phaser-stage" />
              {!selectedAsset ? (
                <div className="empty-stage">
                  <FileCode2Icon aria-hidden="true" />
                  <h2>No vector assets found</h2>
                  <p>
                    This game is registered for the studio suite, but it does
                    not have SVG assets under public/assets/vector yet.
                  </p>
                </div>
              ) : null}
            </div>
            <footer className="warning-bar">
              {previewState.unsupportedWarnings.length === 0
                ? "No unsupported SVG elements detected."
                : `Unsupported: ${previewState.unsupportedWarnings.join(", ")}`}
            </footer>
          </TabsContent>
        </Tabs>
      </section>

      <Inspector
        onSetAnimationPaused={(paused) =>
          controllerRef.current?.setAnimationPaused(paused)
        }
        onSetAnimationSpeed={(speed) =>
          controllerRef.current?.setAnimationSpeed(speed)
        }
        onSetColliders={(checked) => {
          setShowColliders(checked);
          controllerRef.current?.setOverlayVisibility({ colliders: checked });
        }}
        onSetDirection={(direction) =>
          controllerRef.current?.setDirection(direction)
        }
        onSetLayerAlpha={(layerId, value) =>
          controllerRef.current?.setLayerAlpha(layerId, value)
        }
        onSetLayerRotation={(layerId, value) =>
          controllerRef.current?.setLayerRotation(layerId, value)
        }
        onSetLayerScale={(layerId, value) =>
          controllerRef.current?.setLayerScale(layerId, value)
        }
        onSetLayerVisible={(layerId, visible) =>
          controllerRef.current?.setLayerVisible(layerId, visible)
        }
        onSetRotation={(degrees) => controllerRef.current?.setRotation(degrees)}
        onSetScale={(scale) => controllerRef.current?.setScale(scale)}
        onSetShader={(enabled) =>
          controllerRef.current?.setShaderEnabled(enabled)
        }
        onSetSockets={(checked) => {
          setShowSockets(checked);
          controllerRef.current?.setOverlayVisibility({ sockets: checked });
        }}
        onSetVectorMode={(mode) => controllerRef.current?.setVectorMode(mode)}
        onStepFrame={(direction) => controllerRef.current?.stepFrame(direction)}
        previewState={previewState}
        showColliders={showColliders}
        showSockets={showSockets}
      />
    </main>
  );
}

function AssetBrowser({
  groupedAssets,
  onSelectAsset,
  onSelectGame,
  openFolders,
  selectedAssetId,
  selectedGameId,
  setOpenFolders,
}: {
  groupedAssets: Array<{ assets: VectorAsset[]; folder: string }>;
  onSelectAsset(assetId: string): void;
  onSelectGame(gameId: string): void;
  openFolders: Record<string, boolean>;
  selectedAssetId: string;
  selectedGameId: string;
  setOpenFolders(
    updater: (current: Record<string, boolean>) => Record<string, boolean>,
  ): void;
}) {
  return (
    <aside className="asset-browser">
      <div className="brand-block">
        <div className="brand-row">
          <div className="brand-mark">
            <ShapesIcon aria-hidden="true" />
          </div>
          <h1>Vector Studio</h1>
        </div>
        <Select onValueChange={onSelectGame} value={selectedGameId}>
          <SelectTrigger aria-label="Select game" className="game-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {games.map((game) => (
              <SelectItem key={game.id} value={game.id}>
                <span className="game-option">
                  <img alt="" src={game.icon.svgDataUri} />
                  {game.title}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="asset-scroll">
        <div aria-label="Vector asset tree" className="asset-tree" role="tree">
          {groupedAssets.length === 0 ? (
            <Button
              className="asset-row empty"
              disabled
              type="button"
              variant="outline"
            >
              No vector assets
            </Button>
          ) : (
            groupedAssets.map(({ assets, folder }) => {
              const isOpen = openFolders[folder] ?? true;
              return (
                <section className="asset-tree-section" key={folder}>
                  <button
                    aria-expanded={isOpen}
                    className="asset-tree-folder"
                    onClick={() =>
                      setOpenFolders((current) => ({
                        ...current,
                        [folder]: !isOpen,
                      }))
                    }
                    role="treeitem"
                    type="button"
                  >
                    <ChevronRightIcon aria-hidden="true" />
                    {folder}
                  </button>
                  {isOpen ? (
                    <div className="asset-tree-children" role="group">
                      {assets.map((asset) => (
                        <Button
                          className={
                            asset.id === selectedAssetId
                              ? "asset-row active"
                              : "asset-row"
                          }
                          key={asset.id}
                          onClick={() => onSelectAsset(asset.id)}
                          type="button"
                          variant="outline"
                        >
                          {asset.label}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

async function loadSvgSourceForAsset(asset: VectorAsset): Promise<string> {
  const response = await fetch(asset.source);
  if (!response.ok) {
    throw new Error(`Unable to load ${asset.label}`);
  }
  return response.text();
}

function Inspector({
  onSetAnimationPaused,
  onSetAnimationSpeed,
  onSetColliders,
  onSetDirection,
  onSetLayerAlpha,
  onSetLayerRotation,
  onSetLayerScale,
  onSetLayerVisible,
  onSetRotation,
  onSetScale,
  onSetShader,
  onSetSockets,
  onSetVectorMode,
  onStepFrame,
  previewState,
  showColliders,
  showSockets,
}: {
  onSetAnimationPaused(paused: boolean): void;
  onSetAnimationSpeed(speed: number): void;
  onSetColliders(checked: boolean): void;
  onSetDirection(direction: "CENTER" | "DOWN" | "LEFT" | "RIGHT" | "UP"): void;
  onSetLayerAlpha(layerId: string, value: number): void;
  onSetLayerRotation(layerId: string, value: number): void;
  onSetLayerScale(layerId: string, value: number): void;
  onSetLayerVisible(layerId: string, visible: boolean): void;
  onSetRotation(degrees: number): void;
  onSetScale(scale: number): void;
  onSetShader(enabled: boolean): void;
  onSetSockets(checked: boolean): void;
  onSetVectorMode(mode: VectorMode): void;
  onStepFrame(direction: number): void;
  previewState: PreviewState;
  showColliders: boolean;
  showSockets: boolean;
}) {
  return (
    <aside className="vector-inspector">
      <Panel title="Preview">
        <div className="button-grid">
          <Button
            className={previewState.shaderEnabled ? "active" : ""}
            onClick={() => onSetShader(!previewState.shaderEnabled)}
            type="button"
            variant="outline"
          >
            <ScanLineIcon data-icon="inline-start" />
            Shader
          </Button>
          <Button
            onClick={() =>
              onSetVectorMode(
                previewState.vectorMode === VectorMode.COLOR
                  ? VectorMode.MONOCHROME
                  : VectorMode.COLOR,
              )
            }
            type="button"
            variant="outline"
          >
            <EyeIcon data-icon="inline-start" />
            {previewState.vectorMode === VectorMode.COLOR ? "Color" : "Mono"}
          </Button>
        </div>
        <label className="toggle-line">
          <input
            checked={showSockets}
            onChange={(event) => onSetSockets(event.target.checked)}
            type="checkbox"
          />
          Sockets
        </label>
        <label className="toggle-line">
          <input
            checked={showColliders}
            onChange={(event) => onSetColliders(event.target.checked)}
            type="checkbox"
          />
          Colliders
        </label>
      </Panel>

      <Panel title="Direction">
        <div className="direction-pad">
          <Button
            className="dir-up"
            onClick={() => onSetDirection("UP")}
            type="button"
            variant="outline"
          >
            ↑
          </Button>
          <Button
            className="dir-left"
            onClick={() => onSetDirection("LEFT")}
            type="button"
            variant="outline"
          >
            ←
          </Button>
          <Button
            className="dir-center"
            onClick={() => onSetDirection("CENTER")}
            type="button"
            variant="outline"
          >
            •
          </Button>
          <Button
            className="dir-right"
            onClick={() => onSetDirection("RIGHT")}
            type="button"
            variant="outline"
          >
            →
          </Button>
          <Button
            className="dir-down"
            onClick={() => onSetDirection("DOWN")}
            type="button"
            variant="outline"
          >
            ↓
          </Button>
        </div>
      </Panel>

      <Panel title="Transform">
        <SliderLine
          label="Scale"
          max={8}
          min={1}
          onChange={onSetScale}
          step={0.25}
          suffix="x"
          value={previewState.scale}
        />
        <SliderLine
          label="Rotation"
          max={180}
          min={-180}
          onChange={onSetRotation}
          suffix="deg"
          value={previewState.rotation}
        />
      </Panel>

      <Panel title="Animation">
        <div className="transport-grid">
          <Button
            onClick={() => onStepFrame(-1)}
            type="button"
            variant="outline"
          >
            <StepBackIcon />
          </Button>
          <Button
            onClick={() =>
              onSetAnimationSpeed(previewState.animationSpeed - 0.25)
            }
            type="button"
            variant="outline"
          >
            -
          </Button>
          <Button
            className="play-toggle active"
            onClick={() => onSetAnimationPaused(!previewState.animationPaused)}
            type="button"
            variant="outline"
          >
            {previewState.animationPaused ? <PlayIcon /> : <PauseIcon />}
          </Button>
          <Button
            onClick={() =>
              onSetAnimationSpeed(previewState.animationSpeed + 0.25)
            }
            type="button"
            variant="outline"
          >
            +
          </Button>
          <Button
            onClick={() => onStepFrame(1)}
            type="button"
            variant="outline"
          >
            <StepForwardIcon />
          </Button>
        </div>
        <span className="control-value">
          {previewState.animationSpeed.toFixed(2)}x
        </span>
      </Panel>

      <Panel title="Layers">
        <div className="layer-list">
          {previewState.layers.length === 0 ? (
            <p className="muted">No layer metadata loaded.</p>
          ) : (
            previewState.layers.map((layer) => (
              <article
                className="layer-row"
                key={layer.id}
                style={{ "--depth": layer.depth } as CSSProperties}
              >
                <label className="layer-title">
                  <input
                    defaultChecked={layer.visible}
                    onChange={(event) =>
                      onSetLayerVisible(layer.id, event.target.checked)
                    }
                    type="checkbox"
                  />
                  <strong>{layer.id}</strong>
                  <span>{layer.type}</span>
                </label>
                <SliderLine
                  label="Alpha"
                  max={1}
                  min={0}
                  onChange={(value) => onSetLayerAlpha(layer.id, value)}
                  step={0.05}
                  value={1}
                />
                <SliderLine
                  label="Scale"
                  max={2}
                  min={0.2}
                  onChange={(value) => onSetLayerScale(layer.id, value)}
                  step={0.05}
                  value={1}
                />
                <SliderLine
                  label="Rotate"
                  max={180}
                  min={-180}
                  onChange={(value) => onSetLayerRotation(layer.id, value)}
                  suffix="deg"
                  value={0}
                />
              </article>
            ))
          )}
        </div>
      </Panel>
    </aside>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function SliderLine({
  label,
  max,
  min,
  onChange,
  step = 1,
  suffix = "",
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange(value: number): void;
  step?: number;
  suffix?: string;
  value: number;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <label className="slider-line">
      <span>{label}</span>
      <GradientSlider
        aria-label={label}
        max={max}
        min={min}
        onValueChange={([nextValue]) => {
          const resolved = nextValue ?? localValue;
          setLocalValue(resolved);
          onChange(resolved);
        }}
        step={step}
        value={[localValue]}
      />
      <em>
        {localValue.toFixed(step < 1 ? 2 : 0)}
        {suffix}
      </em>
    </label>
  );
}

function themeVariables(game?: StudioGame): CSSProperties {
  const theme = game?.theme ?? getStudioGameById(DEFAULT_STUDIO_GAME_ID)?.theme;
  return {
    "--accent": theme?.accent,
    "--accent-foreground": theme?.accentForeground,
    "--audio-grid": theme?.audioGrid,
    "--audio-line": theme?.audioLine,
    "--audio-panel": theme?.audioPanel,
    "--audio-panel-strong": theme?.audioPanelStrong,
    "--background": theme?.background,
    "--border": theme?.border,
    "--foreground": theme?.foreground,
    "--input": theme?.input,
    "--primary": theme?.primary,
    "--primary-foreground": theme?.primaryForeground,
    "--ring": theme?.ring,
    "--secondary": theme?.secondary,
    "--secondary-foreground": theme?.secondaryForeground,
    "--sidebar": theme?.audioPanel,
    "--sidebar-accent": theme?.secondary,
    "--sidebar-accent-foreground": theme?.secondaryForeground,
    "--sidebar-border": theme?.border,
    "--sidebar-foreground": theme?.foreground,
    "--sidebar-primary": theme?.primary,
    "--sidebar-primary-foreground": theme?.primaryForeground,
    "--sidebar-ring": theme?.ring,
  } as CSSProperties;
}

export default App;
