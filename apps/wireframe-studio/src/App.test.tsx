import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App, {
  type PreviewControllerHandle,
  type PreviewControllerState,
} from "./App";
import type { WireframeAssetManifest } from "./assets/wireframe-assets";

const manifest: WireframeAssetManifest = {
  "battle-tanks": [
    {
      folder: "enemies",
      gameId: "battle-tanks",
      id: "battle-tanks-wireframe-enemies-enemy-tank",
      label: "Enemy Tank",
      legacyPath: "apps/battle-tanks/src/game/models/enemies/enemy-tank.obj",
      relativePath: "enemies/enemy-tank.obj",
      source: "/enemy-tank.obj",
    },
  ],
};

describe("Wireframe Studio App", () => {
  it("lists checked-in model assets and exposes preview controls", async () => {
    const previewModel = vi.fn();
    const controller = createController({ previewModel });

    render(
      <App
        createController={() => Promise.resolve(controller)}
        loadAssetModel={() =>
          Promise.resolve({
            model: {
              color: 0x7be8ff,
              edges: [{ start: 0, end: 1 }],
              vertices: [
                { x: 0, y: 0, z: 0 },
                { x: 10, y: 0, z: 0 },
              ],
            },
            sidecarStatus: "NO_SIDE_CAR",
            warnings: [],
          })
        }
        manifest={manifest}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Wireframe Studio" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Enemy Tank" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Auto Orbit" })).toBeTruthy();
    await waitFor(() => expect(previewModel).toHaveBeenCalledOnce());
    expect(screen.getByText("2 vertices")).toBeTruthy();
    expect(screen.getByText("1 edges")).toBeTruthy();
  });

  it("toggles auto orbit through the preview controller", async () => {
    const setAutoOrbit = vi.fn();
    const controller = createController({ setAutoOrbit });

    render(
      <App
        createController={() => Promise.resolve(controller)}
        loadAssetModel={() =>
          Promise.resolve({
            model: {
              color: 0x7be8ff,
              edges: [],
              vertices: [],
            },
            sidecarStatus: "NO_SIDE_CAR",
            warnings: [],
          })
        }
        manifest={manifest}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Auto Orbit" }));

    await waitFor(() => expect(setAutoOrbit).toHaveBeenCalledWith(true));
  });
});

function createController(
  overrides: Partial<PreviewControllerHandle> = {},
): PreviewControllerHandle {
  return {
    clearModel: vi.fn(),
    destroy: vi.fn(),
    previewModel: vi.fn(),
    resetCamera: vi.fn(),
    setAutoOrbit: vi.fn(),
    setAxesEnabled: vi.fn(),
    setEdgeColorsEnabled: vi.fn(),
    setGridEnabled: vi.fn(),
    setShaderEnabled: vi.fn(),
    setZoomDistance: vi.fn(),
    ...overrides,
  };
}

export function createPreviewState(
  overrides: Partial<PreviewControllerState> = {},
): PreviewControllerState {
  return {
    assetLabel: "Enemy Tank",
    autoOrbit: false,
    axesEnabled: true,
    bounds: {
      center: { x: 0, y: 0, z: 0 },
      framingDistance: 120,
      max: { x: 0, y: 0, z: 0 },
      min: { x: 0, y: 0, z: 0 },
      radius: 1,
      size: { x: 0, y: 0, z: 0 },
    },
    edgeColorsEnabled: true,
    edgeCount: 1,
    gridEnabled: true,
    maxZoomDistance: 480,
    minZoomDistance: 54,
    pitch: -12,
    shaderEnabled: true,
    sidecarStatus: "NO_SIDE_CAR",
    sourcePath: "",
    status: "LOADED",
    vertexCount: 2,
    warnings: [],
    yaw: 35,
    zoomDistance: 120,
    ...overrides,
  };
}
