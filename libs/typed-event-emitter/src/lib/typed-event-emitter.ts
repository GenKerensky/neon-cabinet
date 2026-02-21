export type Listener<TArgs extends unknown[]> = (...args: TArgs) => void;

export interface TypedEventEmitterOptions {
  /** Channel name for BroadcastChannel. When set, events sync across tabs. */
  channel?: string;
}

/**
 * Typed EventEmitter backed by native EventTarget. Optional BroadcastChannel
 * syncs events across browser tabs.
 *
 * @example
 * ```ts
 * interface MyEventMap extends Record<string, unknown[]> {
 *   "user-login": [user: User];
 *   "game-over": [score: number];
 * }
 * const bus = new TypedEventEmitter<MyEventMap>();
 * bus.on("user-login", (user) => { ... });
 * bus.emit("user-login", myUser);
 *
 * // Cross-tab sync
 * const syncedBus = new TypedEventEmitter<MyEventMap>({ channel: "game-events" });
 * ```
 */
export class TypedEventEmitter<TEventMap extends Record<string, unknown[]>> {
  private readonly target: EventTarget;
  private readonly wrappers = new Map<
    string,
    Map<(...args: unknown[]) => void, (ev: Event) => void>
  >();
  private readonly broadcastChannel: BroadcastChannel | undefined;

  constructor(options?: TypedEventEmitterOptions) {
    this.target = new EventTarget();
    if (options?.channel && typeof BroadcastChannel !== "undefined") {
      this.broadcastChannel = new BroadcastChannel(options.channel);
      this.broadcastChannel.onmessage = (e: MessageEvent) => {
        const { event, args } = e.data as {
          event: keyof TEventMap & string;
          args: unknown[];
        };
        this.target.dispatchEvent(
          new CustomEvent(event, { detail: args, cancelable: false }),
        );
      };
    }
  }

  on<K extends keyof TEventMap & string>(
    event: K,
    listener: Listener<TEventMap[K]>,
  ): void {
    let listeners = this.wrappers.get(event);
    if (!listeners) {
      listeners = new Map();
      this.wrappers.set(event, listeners);
    }
    const wrapper = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as TEventMap[K];
      try {
        (listener as (...args: unknown[]) => void)(...detail);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    };
    listeners.set(listener as (...args: unknown[]) => void, wrapper);
    this.target.addEventListener(event, wrapper);
  }

  off<K extends keyof TEventMap & string>(
    event: K,
    listener: Listener<TEventMap[K]>,
  ): void {
    const listeners = this.wrappers.get(event);
    if (!listeners) return;
    const wrapper = listeners.get(listener as (...args: unknown[]) => void);
    if (wrapper) {
      this.target.removeEventListener(event, wrapper);
      listeners.delete(listener as (...args: unknown[]) => void);
    }
  }

  removeListener<K extends keyof TEventMap & string>(
    event: K,
    listener: Listener<TEventMap[K]>,
  ): void {
    this.off(event, listener);
  }

  emit<K extends keyof TEventMap & string>(
    event: K,
    ...args: TEventMap[K]
  ): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ event, args });
    } else {
      this.target.dispatchEvent(
        new CustomEvent(event, { detail: args, cancelable: false }),
      );
    }
  }

  removeAllListeners(event?: keyof TEventMap & string): void {
    if (event) {
      const listeners = this.wrappers.get(event);
      if (listeners) {
        listeners.forEach((wrapper) => {
          this.target.removeEventListener(event, wrapper);
        });
        this.wrappers.delete(event);
      }
    } else {
      this.wrappers.forEach((listeners, ev) => {
        listeners.forEach((wrapper) => {
          this.target.removeEventListener(ev, wrapper);
        });
      });
      this.wrappers.clear();
    }
  }
}
