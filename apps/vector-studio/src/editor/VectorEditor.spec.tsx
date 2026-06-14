import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  CreateVectorEditorAdapter,
  VectorEditorAdapter,
  VectorEditorAdapterEvents,
  VectorEditorMode,
} from "./svgcanvas-adapter";
import { VectorEditor } from "./VectorEditor";

function createAdapterHarness(initialSvg: string) {
  let source = initialSvg;
  let selectedIds = ["body"];
  let events: VectorEditorAdapterEvents | undefined;

  const adapter: VectorEditorAdapter = {
    deleteSelection: vi.fn(),
    destroy: vi.fn(),
    getSelectedElementIds: vi.fn(() => selectedIds),
    getSvgSource: vi.fn(() => source),
    loadSvg: vi.fn((nextSource: string) => {
      source = nextSource;
    }),
    selectElementById: vi.fn((id: string) => {
      selectedIds = [id];
      events?.onSelectionChange(selectedIds);
    }),
    setMode: vi.fn(),
    setSelectedAttributes: vi.fn((attrs) => {
      source = source.replace(
        /fill="[^"]*"/,
        `fill="${String(attrs.fill ?? "#66ffff")}"`,
      );
      events?.onChange(source, selectedIds);
    }),
  };

  const createAdapter: CreateVectorEditorAdapter = vi.fn(
    (_container, nextEvents) => {
      events = nextEvents;
      return adapter;
    },
  );

  return {
    adapter,
    createAdapter,
    emitChange(nextSource: string, nextSelectedIds = selectedIds) {
      source = nextSource;
      selectedIds = nextSelectedIds;
      events?.onChange(nextSource, nextSelectedIds);
    },
  };
}

describe("VectorEditor", () => {
  it("uses SVGCanvas modes for drawing tools instead of fake add-shape commands", () => {
    const changes: Array<{ selectedElementId: string; svgSource: string }> = [];
    const applyPreview = vi.fn();
    const harness = createAdapterHarness(
      `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect id="body" x="8" y="8" width="16" height="16" fill="#66ffff"/></svg>`,
    );

    render(
      <VectorEditor
        assetLabel="Ship"
        createAdapter={harness.createAdapter}
        dirty
        onApplyPreview={applyPreview}
        onChange={(svgSource, selectedElementId) => {
          changes.push({ selectedElementId, svgSource });
        }}
        selectedElementId="body"
        svgSource={harness.adapter.getSvgSource()}
      />,
    );

    expect(screen.getByRole("tab", { name: "Select" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Pen" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Rect" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Apply to preview" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add shape" })).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Rect" }));
    expect(harness.adapter.setMode).toHaveBeenLastCalledWith(
      "rect" satisfies VectorEditorMode,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Node" }));
    expect(harness.adapter.setMode).toHaveBeenLastCalledWith("pathedit");

    fireEvent.click(screen.getByRole("tab", { name: "Pen" }));
    expect(harness.adapter.setMode).toHaveBeenLastCalledWith("fhpath");

    act(() => {
      harness.emitChange(
        `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect id="body" x="8" y="8" width="16" height="16" fill="#66ffff"/><rect id="rect_1" x="20" y="20" width="8" height="8"/></svg>`,
        ["rect_1"],
      );
    });

    expect(changes.at(-1)?.selectedElementId).toMatch(/^rect_/);
    expect(changes.at(-1)?.svgSource).toContain("<rect");
  });

  it("syncs layer selection and paint controls through the SVGCanvas adapter", () => {
    const changes: Array<{ selectedElementId: string; svgSource: string }> = [];
    const harness = createAdapterHarness(
      `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect id="body" x="8" y="8" width="16" height="16" fill="#66ffff"/><circle id="eye" cx="16" cy="16" r="4"/></svg>`,
    );

    render(
      <VectorEditor
        assetLabel="Ship"
        createAdapter={harness.createAdapter}
        dirty
        onApplyPreview={vi.fn()}
        onChange={(svgSource, selectedElementId) => {
          changes.push({ selectedElementId, svgSource });
        }}
        selectedElementId="body"
        svgSource={harness.adapter.getSvgSource()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /eye/i }));
    expect(harness.adapter.selectElementById).toHaveBeenLastCalledWith("eye");

    fireEvent.change(screen.getByLabelText("Fill color"), {
      target: { value: "#ff4fd8" },
    });

    expect(harness.adapter.setSelectedAttributes).toHaveBeenLastCalledWith({
      fill: "#ff4fd8",
    });
    expect(changes.at(-1)?.svgSource).toContain('fill="#ff4fd8"');
    expect(changes.at(-1)?.selectedElementId).toBe("eye");
  });

  it("writes UAD metadata and sockets without SVG.js selection artifacts", () => {
    const changes: Array<{ selectedElementId: string; svgSource: string }> = [];
    const applyPreview = vi.fn();
    const harness = createAdapterHarness(
      `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect id="body" x="8" y="8" width="16" height="16" fill="#66ffff"/></svg>`,
    );

    render(
      <VectorEditor
        assetLabel="Ship"
        createAdapter={harness.createAdapter}
        dirty
        onApplyPreview={applyPreview}
        onChange={(svgSource, selectedElementId) => {
          changes.push({ selectedElementId, svgSource });
        }}
        selectedElementId="body"
        svgSource={harness.adapter.getSvgSource()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Wave" }));
    expect(changes.at(-1)?.svgSource).toContain("data-anim-wave");

    fireEvent.click(screen.getByRole("button", { name: "Mark collider" }));
    expect(changes.at(-1)?.svgSource).toContain("physics-collider");

    fireEvent.click(screen.getByRole("button", { name: "Add socket" }));
    expect(changes.at(-1)?.svgSource).toContain("data-socket-type");
    expect(changes.at(-1)?.svgSource).not.toContain("svg-editor-selected-node");
    expect(changes.at(-1)?.svgSource).not.toContain("svgjs");

    fireEvent.click(screen.getByRole("button", { name: "Apply to preview" }));
    expect(applyPreview).toHaveBeenCalledTimes(1);
  });
});
