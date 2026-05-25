import { describe, it, expect } from "vitest";
import { EventBus } from "../src/game/EventBus";

describe("EventBus", () => {
  it("emits and receives events", () => {
    const payload = "test-payload" as any;
    let received: any = null;
    const listener = (arg: any) => {
      received = arg;
    };

    EventBus.on("current-scene-ready", listener);
    EventBus.emit("current-scene-ready", payload);

    expect(received).toBe(payload);

    EventBus.off("current-scene-ready", listener);
  });

  it("removes listener so callback is not called after off", () => {
    let callCount = 0;
    const listener = () => {
      callCount++;
    };

    EventBus.on("current-scene-ready", listener);
    EventBus.off("current-scene-ready", listener);
    EventBus.emit("current-scene-ready", null as any);

    expect(callCount).toBe(0);
  });
});
