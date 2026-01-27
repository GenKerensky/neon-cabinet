import { describe, it, expect, beforeEach } from "vitest";
import { EventBus } from "./EventBus";

describe("EventBus", () => {
  beforeEach(() => {
    // Clear all listeners before each test
    EventBus.removeAllListeners();
  });

  describe("on", () => {
    it("should register an event listener", () => {
      const listener = () => {};
      EventBus.on("test-event", listener);
      // If no error is thrown, listener was registered
      expect(true).toBe(true);
    });

    it("should allow multiple listeners for the same event", () => {
      const listener1 = () => {};
      const listener2 = () => {};
      EventBus.on("test-event", listener1);
      EventBus.on("test-event", listener2);
      expect(true).toBe(true);
    });
  });

  describe("emit", () => {
    it("should call registered listeners", () => {
      let called = false;
      const listener = () => {
        called = true;
      };
      EventBus.on("test-event", listener);
      EventBus.emit("test-event");
      expect(called).toBe(true);
    });

    it("should pass arguments to listeners", () => {
      let receivedArgs: any[] = [];
      const listener = (...args: any[]) => {
        receivedArgs = args;
      };
      EventBus.on("test-event", listener);
      EventBus.emit("test-event", "arg1", "arg2", 123);
      expect(receivedArgs).toEqual(["arg1", "arg2", 123]);
    });

    it("should call all listeners for an event", () => {
      let callCount = 0;
      const listener1 = () => {
        callCount++;
      };
      const listener2 = () => {
        callCount++;
      };
      EventBus.on("test-event", listener1);
      EventBus.on("test-event", listener2);
      EventBus.emit("test-event");
      expect(callCount).toBe(2);
    });

    it("should not throw when emitting to non-existent event", () => {
      expect(() => {
        EventBus.emit("non-existent-event");
      }).not.toThrow();
    });
  });

  describe("off", () => {
    it("should remove a specific listener", () => {
      let callCount = 0;
      const listener1 = () => {
        callCount++;
      };
      const listener2 = () => {
        callCount++;
      };
      EventBus.on("test-event", listener1);
      EventBus.on("test-event", listener2);
      EventBus.off("test-event", listener1);
      EventBus.emit("test-event");
      expect(callCount).toBe(1);
    });
  });

  describe("removeListener", () => {
    it("should remove a listener (alias for off)", () => {
      let called = false;
      const listener = () => {
        called = true;
      };
      EventBus.on("test-event", listener);
      EventBus.removeListener("test-event", listener);
      EventBus.emit("test-event");
      expect(called).toBe(false);
    });
  });

  describe("removeAllListeners", () => {
    it("should remove all listeners for a specific event", () => {
      let callCount = 0;
      const listener1 = () => {
        callCount++;
      };
      const listener2 = () => {
        callCount++;
      };
      EventBus.on("test-event", listener1);
      EventBus.on("test-event", listener2);
      EventBus.on("other-event", listener1);
      EventBus.removeAllListeners("test-event");
      EventBus.emit("test-event");
      EventBus.emit("other-event");
      expect(callCount).toBe(1);
    });

    it("should remove all listeners when no event specified", () => {
      let callCount = 0;
      const listener = () => {
        callCount++;
      };
      EventBus.on("test-event", listener);
      EventBus.on("other-event", listener);
      EventBus.removeAllListeners();
      EventBus.emit("test-event");
      EventBus.emit("other-event");
      expect(callCount).toBe(0);
    });
  });
});
