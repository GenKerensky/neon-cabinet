import { describe, it, expect, vi } from "vitest";
import { TypedEventEmitter } from "./typed-event-emitter.js";

interface TestEventMap extends Record<string, unknown[]> {
  "test-event": unknown[];
  "other-event": [];
}

describe("TypedEventEmitter", () => {
  const bus = new TypedEventEmitter<TestEventMap>();

  beforeEach(() => {
    bus.removeAllListeners();
  });

  it("registers and calls listeners", () => {
    const listener = vi.fn();
    bus.on("test-event", listener);
    bus.emit("test-event");
    expect(listener).toHaveBeenCalledOnce();
  });

  it("passes arguments to listeners", () => {
    let received: unknown[] = [];
    bus.on("test-event", (...args) => {
      received = args;
    });
    bus.emit("test-event", "a", 1);
    expect(received).toEqual(["a", 1]);
  });

  it("removes listener with off", () => {
    let calls = 0;
    const listener = () => calls++;
    bus.on("test-event", listener);
    bus.off("test-event", listener);
    bus.emit("test-event");
    expect(calls).toBe(0);
  });

  it("removeAllListeners clears event", () => {
    let calls = 0;
    bus.on("test-event", () => calls++);
    bus.on("other-event", () => calls++);
    bus.removeAllListeners("test-event");
    bus.emit("test-event");
    bus.emit("other-event");
    expect(calls).toBe(1);
  });
});
