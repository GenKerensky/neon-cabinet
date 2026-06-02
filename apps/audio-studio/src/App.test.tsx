import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import {
  cloneHistory,
  createInitialHistory,
  normalizeHistory,
} from "./hooks/use-studio-history";
import {
  getAudioStudioRxState,
  readPersistedStudioHistory,
  resetAudioStudioDatabaseForTests,
  writePersistedStudioHistory,
} from "./storage/audio-studio-rxdb";

describe("Audio Studio", () => {
  beforeEach(async () => {
    await resetAudioStudioDatabaseForTests();
  });

  afterEach(async () => {
    cleanup();
    await resetAudioStudioDatabaseForTests();
  });

  it("edits selected node values and updates the exported JSON", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /low bang/i }));
    const frequency = screen.getByLabelText("Frequency");
    fireEvent.change(frequency, { target: { value: "72" } });

    const exported = JSON.parse(
      screen.getByLabelText("Patch JSON").textContent ?? "{}",
    );
    const node = exported.nodes.find(
      (candidate: { id: string }) => candidate.id === "thump",
    );

    expect(node.frequency).toBe(72);
  });

  it("imports exported JSON back into the graph", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /battle tanks explosion/i }),
    );
    const exported = screen.getByLabelText("Patch JSON").textContent ?? "";

    fireEvent.click(
      screen.getByRole("button", { name: /battle tanks player rumble/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /expand import/i }));
    fireEvent.change(screen.getByLabelText("Import JSON"), {
      target: { value: exported },
    });
    fireEvent.click(screen.getByRole("button", { name: "Import" }));

    expect(
      screen.getByRole("heading", { name: /battle tanks explosion/i }),
    ).toBeTruthy();
  });

  it("supports undo, redo, and reset for patch edits", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /low bang/i }));
    fireEvent.change(screen.getByLabelText("Frequency"), {
      target: { value: "72" },
    });

    expect(readNode("thump").frequency).toBe(72);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(readNode("thump").frequency).not.toBe(72);

    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(readNode("thump").frequency).toBe(72);

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(readNode("thump").frequency).not.toBe(72);
  });

  it("auto arranges graph nodes as a single undoable edit", () => {
    render(<App />);

    const originalPosition = readNode("thump").position;

    fireEvent.click(screen.getByRole("button", { name: "Auto arrange nodes" }));

    expect(readNode("thump").position).not.toEqual(originalPosition);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(readNode("thump").position).toEqual(originalPosition);
  });

  it("collapses export and import panels", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /collapse export/i }));
    expect(screen.queryByLabelText("Patch JSON")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /expand export/i }));
    expect(screen.getByLabelText("Patch JSON")).toBeTruthy();

    expect(screen.queryByLabelText("Import JSON")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /expand import/i }));
    expect(screen.getByLabelText("Import JSON")).toBeTruthy();
  });

  it("restores committed edits after recreating the RxDB state instance", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /low bang/i }));
    fireEvent.change(screen.getByLabelText("Frequency"), {
      target: { value: "72" },
    });

    await waitFor(async () => {
      const state = await getAudioStudioRxState();
      const persisted = normalizeHistory(readPersistedStudioHistory(state));
      const node = persisted?.present.patch.nodes.find(
        (candidate) => candidate.id === "thump",
      );
      expect(node).toMatchObject({ frequency: 72 });
    });

    cleanup();
    await resetAudioStudioDatabaseForTests({ remove: false });

    render(<App />);

    await waitFor(() => {
      expect(readNode("thump").frequency).toBe(72);
    });
  });

  it("syncs external RxState updates into React state with undo history intact", async () => {
    render(<App />);

    await waitFor(async () => {
      const state = await getAudioStudioRxState();
      expect(normalizeHistory(readPersistedStudioHistory(state))).toBeTruthy();
    });

    const nextHistory = cloneHistory(createInitialHistory());
    nextHistory.past = [cloneHistory(nextHistory).present];
    nextHistory.present.patch.nodes = nextHistory.present.patch.nodes.map(
      (node) => (node.id === "thump" ? { ...node, frequency: 88 } : node),
    );
    nextHistory.present.selectedNodeId = "thump";

    await act(async () => {
      await writePersistedStudioHistory(nextHistory);
    });

    await waitFor(() => {
      expect(readNode("thump").frequency).toBe(88);
    });

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(() => {
      expect(readNode("thump").frequency).not.toBe(88);
    });
  });

  it("ignores malformed persisted state and loads the default patch", async () => {
    const state = await getAudioStudioRxState();
    await state.set("studio.history", () => ({ malformed: true }));
    cleanup();
    await resetAudioStudioDatabaseForTests({ remove: false });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: /battle tanks harsh cannon bang/i,
        }),
      ).toBeTruthy();
    });
  });
});

function readNode(nodeId: string): {
  frequency?: number;
  id: string;
  position?: { x: number; y: number };
} {
  const exported = JSON.parse(
    screen.getByLabelText("Patch JSON").textContent ?? "{}",
  );
  return exported.nodes.find(
    (candidate: { id: string }) => candidate.id === nodeId,
  );
}
