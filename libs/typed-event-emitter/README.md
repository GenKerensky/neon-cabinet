# typed-event-emitter

Typed EventEmitter backed by native EventTarget. Optional BroadcastChannel syncs across tabs.

```ts
import { TypedEventEmitter } from "@neon-cabinet/typed-event-emitter";

interface MyEventMap extends Record<string, unknown[]> {
  "user-login": [user: User];
  "game-over": [score: number];
}

// Single-tab (EventTarget only)
const bus = new TypedEventEmitter<MyEventMap>();
bus.on("user-login", (user) => {});
bus.emit("user-login", myUser);

// Cross-tab sync via BroadcastChannel
const syncedBus = new TypedEventEmitter<MyEventMap>({ channel: "game-events" });
```

## Building

`bun nx build typed-event-emitter`

## Tests

`bun nx test typed-event-emitter`
