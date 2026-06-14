import "fake-indexeddb/auto";

class ResizeObserverMock {
  disconnect() {
    return undefined;
  }
  observe() {
    return undefined;
  }
  unobserve() {
    return undefined;
  }
}

globalThis.ResizeObserver ??= ResizeObserverMock;
globalThis.PointerEvent ??= MouseEvent as typeof PointerEvent;

if (globalThis.Element) {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => undefined;
  Element.prototype.setPointerCapture ??= () => undefined;
  Element.prototype.scrollIntoView ??= () => undefined;
}
