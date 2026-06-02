import "fake-indexeddb/auto";

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

globalThis.ResizeObserver ??= ResizeObserverMock;
globalThis.PointerEvent ??= MouseEvent as typeof PointerEvent;

if (globalThis.Element) {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => undefined;
  Element.prototype.setPointerCapture ??= () => undefined;
  Element.prototype.scrollIntoView ??= () => undefined;
}
