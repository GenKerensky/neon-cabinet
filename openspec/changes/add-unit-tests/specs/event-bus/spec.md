## ADDED Requirements

### Requirement: EventBus emits and receives events

The EventBus SHALL support emit and on for events declared in its event map.

#### Scenario: Listener receives emitted event

- **WHEN** a listener is registered via `on("current-scene-ready", callback)` and the event is emitted with a payload
- **THEN** the callback SHALL be invoked with the emitted payload

### Requirement: EventBus removes listeners

The EventBus SHALL remove a specific listener when `off` is called with that listener reference.

#### Scenario: Listener not called after removal

- **WHEN** a listener is registered, then removed via `off("current-scene-ready", callback)`, and the event is emitted
- **THEN** the callback SHALL NOT be invoked
