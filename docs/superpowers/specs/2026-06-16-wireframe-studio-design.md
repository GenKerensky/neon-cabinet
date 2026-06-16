# Wireframe Studio Design

## Goal

Create a standalone `Wireframe Studio` app for previewing checked-in OBJ plus optional `.wire.json` sidecar assets with the same custom wireframe render path and vector shader used by Neon Cabinet games. The first version is a read-only asset preview tool: artists and developers can select committed models, inspect how they will render in game, rotate the camera around them, zoom, and enable a slow auto-orbit mode for hands-free review.

## Scope

Wireframe Studio will be a new app under `apps/wireframe-studio`, modeled after `apps/vector-studio` but focused only on 3D wireframe asset preview.

Included in v1:

- Discover checked-in OBJ assets from game model folders.
- Parse OBJ files in browser-safe TypeScript.
- Load an optional sibling sidecar file named `<model>.wire.json`.
- Render the parsed asset through a Phaser preview scene using `Camera3D`, `WireframeRenderer`, `WireframeModel`, Phaser `Graphics`, and `VectorShader`.
- Provide camera orbit, zoom, reset, and auto-orbit controls.
- Show asset metadata: source path, vertices, edges, bounds, color roles, and sidecar status.
- Support shader, grid, axes, and edge color toggles.

Not included in v1:

- Local file picker or drag-and-drop import.
- Editing OBJ geometry or sidecar metadata.
- Saving or exporting models.
- Multi-model scene composition.
- Replacing existing `model-tools` CLI import/export flows.

## User Experience

The app should follow Vector Studio's broad layout:

- Left sidebar: game selector and grouped checked-in model tree.
- Center stage: large preview viewport with the Phaser canvas.
- Right inspector: camera controls, visual toggles, model stats, and sidecar summary.

The first screen should be the tool itself, not a landing page. If assets exist, the first available model for the selected game should load immediately. If no models exist for a game, the stage should show a compact empty state explaining that no checked-in OBJ assets were found.

Camera interactions:

- Left-drag on the preview stage orbits the camera around the model.
- Mouse wheel zooms in and out.
- Reset reframes the current model using its bounds.
- Auto-orbit toggles a slow continuous yaw rotation around the model. Manual drag should temporarily pause auto-orbit while the pointer is active, then resume if the toggle remains enabled.

The viewport should feel like an inspection tool: dense, quiet, and accurate. Avoid decorative cards inside the stage. Use icon buttons with tooltips for camera reset, auto-orbit, shader, grid, axes, and color toggles.

## Asset Discovery

The v1 manifest should discover committed OBJ assets using Vite glob imports. Initial target patterns:

- `apps/*/src/game/models/**/*.obj`
- Later-compatible with `apps/*/public/assets/models/**/*.obj` if a game adopts public model assets.

Each discovered asset should expose:

- `id`
- `gameId`
- `label`
- `folder`
- `source`
- `relativePath`
- `legacyPath`
- optional `sidecarSource`

The app should reuse `@neon-cabinet/studio-registry` for game metadata, theme values, and game selection. Grouping should match Vector Studio's asset browser behavior, using folder paths under each game's model root.

## OBJ And Sidecar Loading

The browser loader should share behavior with `@neon-cabinet/model-tools` where practical, but it should not import Node-only modules such as `fs` or `path`. The clean boundary is a browser-safe parser module that can be used by both Wireframe Studio tests and future model-tool refactors.

OBJ parser requirements:

- Parse `v` vertices.
- Parse `l` line edges.
- Parse `f` faces and derive unique boundary edges when no explicit `l` records exist.
- Parse `o`, `g`, `usemtl`, and `mtllib` enough to attach part/material context to edges where available.
- Preserve source-order edge data so sidecar matching can remain deterministic.

Sidecar requirements:

- Absence of a sidecar is valid.
- A sidecar can define fallback model color, material role colors, part role colors, and explicit edge overrides.
- Edge overrides should use stable edge fingerprints where possible, not raw vertex indices as the primary identity.
- Invalid sidecar JSON should not crash the app; show a warning in the inspector and render the OBJ using fallback colors.

The model emitted to the preview scene should match the game renderer contract:

```ts
interface WireframeModel {
  vertices: Vector3D[];
  edges: Array<{ start: number; end: number; color?: number }>;
  color: number;
}
```

## Preview Renderer

Wireframe Studio should use a Phaser controller similar to `VectorPreviewController`:

- Create a Phaser `Game` inside the central stage container.
- Register `VectorShader` as a post pipeline when WebGL is available.
- Own a preview scene that creates a `Camera3D` and `WireframeRenderer`.
- Render the selected model at the origin.
- Position the camera from model bounds so assets are framed consistently.
- Draw optional grid and axes using Phaser graphics.

The renderer should use the same visual assumptions as the games: line segments drawn through `WireframeRenderer`, per-edge colors where present, model fallback color otherwise, depth alpha from the camera, and the shared vector shader pipeline.

Because the game `Camera3D` currently supports yaw but not pitch, Wireframe Studio should add orbit math in the preview scene rather than changing game behavior broadly. The preview scene can transform model vertices into a temporary view orientation before rendering, or it can introduce a local preview camera adapter that supports yaw/pitch while preserving the `WireframeRenderer` projection and line drawing behavior. The implementation should keep this isolated unless a shared 3D camera upgrade is explicitly needed later.

## Controls And State

Preview state should include:

- selected asset label and source path
- vertex count
- edge count
- sidecar status
- bounds dimensions
- yaw
- pitch
- zoom distance
- auto-orbit enabled
- shader enabled
- grid enabled
- axes enabled
- edge colors enabled
- status and warnings

Inspector controls:

- Auto-orbit toggle.
- Reset camera button.
- Shader toggle.
- Grid toggle.
- Axes toggle.
- Edge colors toggle.
- Zoom slider.
- Optional numeric yaw and pitch readouts.

Auto-orbit behavior:

- Runs only while a model is loaded.
- Rotates yaw slowly and continuously using frame delta.
- Does not mutate the model.
- Pauses during active pointer drag.
- Resumes after drag if the toggle is still on.
- Uses a conservative speed suitable for asset review, not arcade motion.

## Error Handling

The app should handle:

- No OBJ assets for the selected game.
- OBJ fetch failure.
- Malformed OBJ with no vertices or no edges.
- Missing sidecar.
- Invalid sidecar JSON.
- Sidecar references to missing materials, parts, or edge fingerprints.
- WebGL shader pipeline unavailable.

Errors that prevent rendering should show a compact empty/error state in the stage and a status line in the inspector. Non-fatal issues should render the model with warnings.

## Testing

Unit tests should cover:

- Model asset manifest creation and selection resolution.
- OBJ parsing for vertices, explicit line edges, face-derived edges, object/group/material context.
- Sidecar application for fallback color, material role color, part role color, and explicit edge override.
- Bounds and framing calculations.
- Auto-orbit state updates, including pointer-drag pause and resume behavior.

Browser verification should cover:

- App loads.
- First discovered checked-in asset renders.
- Drag changes orbit.
- Wheel changes zoom.
- Auto-orbit changes camera yaw over time.
- Shader toggle does not break rendering.

## Implementation Boundaries

Keep Wireframe Studio read-only in v1. Do not add model editing, local file loading, or export actions until the preview loop is proven. The first app should establish a repeatable preview surface that can later become the visual half of an artist workflow.

Keep browser-safe OBJ/sidecar parsing separate from React components and Phaser scene code. React should handle selection and controls; the preview controller should handle render state; parser modules should handle data conversion. This keeps the tool testable without requiring browser screenshots for every parser case.

## Open Follow-Ups

- Decide whether Starfighter Assault should move its current procedural ship/threat wireframes into checked-in OBJ fixtures for Studio preview.
- Decide whether the sidecar schema should be formalized with JSON Schema after the first real Wings 3D test asset lands.
- Decide whether future versions should add local file picker support for artist iteration before commit.
