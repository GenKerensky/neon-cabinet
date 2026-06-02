import "fake-indexeddb/auto";

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

globalThis.ResizeObserver ??= ResizeObserverMock;
