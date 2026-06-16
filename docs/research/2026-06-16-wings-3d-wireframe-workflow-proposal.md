# Wings 3D Wireframe Workflow Research Proposal

Date: 2026-06-16

## Goal

Validate whether Wings 3D is a practical authoring tool for Starfighter Assault wireframe enemy, ship, cockpit, turret, pickup, and capital-ship models while keeping the runtime format simple enough for Neon Cabinet's current procedural renderer.

The target workflow is:

1. Artists edit low-poly, wireframe-friendly geometry in Wings 3D.
2. Wings exports OBJ plus MTL.
3. Neon Cabinet imports OBJ geometry and a `.wire.json` sidecar.
4. The importer generates `WireframeModel` TypeScript with per-edge color metadata.
5. The game renderer draws each edge using its own resolved color when present.

## Current State

Battle Tanks already has a working OBJ import/export path through `@neon-cabinet/model-tools`. That tool currently supports vertices, `l` line edges, a face fallback that derives edges from `f` records, and a single model color chosen by category or model name.

Starfighter Assault's runtime model type already allows per-edge color:

```ts
export interface Edge {
  start: number;
  end: number;
  color?: number;
}
```

So the main gap is not renderer support. The gap is authoring and preserving semantic color intent across external edits.

HUDs should stay on the SVG path. The new HUD vector-puppet work is a better fit for cockpit overlays, radar shells, instrument labels, shield meters, ammo meters, reticle guides, and sockets for procedural readouts. Wings should be tested for 3D model geometry, not 2D HUD asset editing.

## Format Decision

Use OBJ plus a sidecar JSON file for editable Starfighter wireframes.

Avoid glTF for this particular pipeline even though it is the normal browser-game shipping format. glTF is strong for textured meshes, hierarchy, animation, and PBR materials, but it is too heavy for this retro line-renderer workflow. More importantly, per-segment color does not map cleanly when a shared vertex belongs to adjacent line segments with different colors. If a polyline uses vertices `A -> B -> C`, and segment `A -> B` needs cyan while `B -> C` needs pink, a vertex/material-driven format often forces the shared `B` to become duplicated as `B1` and `B2`. That pollutes the editable geometry and works against the clean line-segment model we want.

Pure OBJ is also not enough by itself. It can carry vertices, line records, object names, group names, material uses, and an MTL file, but there is no dependable edge-specific color contract across tools. The sidecar gives us the missing game-specific semantics without asking artists to use a complex format.

## Proposed Authoring Contract

Wings object names become model parts.

Examples:

- `cockpit`
- `left_wing`
- `right_wing`
- `engine_block`
- `laser_cannon_left`
- `laser_cannon_right`
- `capital_bridge`
- `capital_trench`
- `turret_array`

Wings material names become color roles.

Examples:

- `role_hull`
- `role_accent`
- `role_laser_pink`
- `role_engine_blue`
- `role_weakpoint`
- `role_warning`

The sidecar maps those roles to actual game colors and gives fallback behavior:

```json
{
  "schemaVersion": 1,
  "palette": {
    "hull": "#7be8ff",
    "accent": "#8d5cff",
    "laserPink": "#ff43d6",
    "engineBlue": "#25a7ff",
    "weakpoint": "#ff3b3b"
  },
  "materialRoles": {
    "role_hull": "hull",
    "role_accent": "accent",
    "role_laser_pink": "laserPink",
    "role_engine_blue": "engineBlue",
    "role_weakpoint": "weakpoint"
  },
  "parts": {
    "cockpit": { "defaultColorRole": "hull" },
    "left_wing": { "defaultColorRole": "hull" },
    "right_wing": { "defaultColorRole": "hull" },
    "laser_cannon_left": { "defaultColorRole": "laserPink" },
    "laser_cannon_right": { "defaultColorRole": "laserPink" }
  },
  "edgeOverrides": {}
}
```

Color resolution order should be:

1. Exact edge override in `.wire.json`.
2. OBJ material name through `materialRoles`.
3. OBJ object or group name through `parts`.
4. Existing category/model color fallback.
5. Import warning for unknown role or part.

## Keeping the Sidecar Updated

The sidecar should not depend primarily on vertex indices because DCC tools can reorder vertices during export. Use quantized edge fingerprints for overrides:

```text
round(x1,y1,z1)|round(x2,y2,z2)
```

For undirected wire edges, sort the two endpoints before fingerprinting. That makes overrides more stable when export order changes. If the artist moves an edge far enough that the fingerprint changes, the importer should report it as a stale override instead of silently dropping intent.

New artist-created geometry should usually inherit metadata from object and material names:

- New edges inside object `left_wing` inherit the `left_wing` part default.
- New edges assigned material `role_laser_pink` inherit `laserPink`.
- New edges with unknown object/material names import with fallback color and a warning.

The importer should emit an audit report after every import:

- preserved edge overrides
- new edges by part
- new edges by material role
- unknown objects or groups
- unknown material names
- stale edge overrides
- edges using only category fallback

That audit report is how the artist knows what still needs naming or material assignment.

## Wings 3D Research Findings

Wings is promising because it is lightweight, object-oriented, and comfortable for low-poly modeling. Its mirror modeling and simpler selection model may be a better fit than Blender for this project.

Relevant Wings capabilities found in documentation:

- The Geometry Graph lists scene objects and supports object management such as lock, hide, duplicate, and rename.
- Wings has selection groups for named sets of vertices, edges, or faces.
- Face materials can be created and assigned through Face | Set Material.
- The OBJ export options include scale and an option to create one group per material.
- Forum examples show Wings object names and material names surviving into downstream tooling as meaningful OBJ/MTL names, although exact output should be verified with our own fixture.

Sources checked:

- Wings Select menu and selection groups: https://www.wings3d.com/documentation/user-manual-table-of-contents/main-menu/menu-select/
- Wings manual text on OBJ export option for one group per material: https://en.wikibooks.org/wiki/Wings_3D/User_Manual/Text_Version_%28From_PDF%29
- Wings Face | Set Material documentation: https://en.wikibooks.org/wiki/Wings_3D/User_Manual/Face_Operations_with_Advanced_Menus
- Wings 3D manual PDF, Outliner and Geometry Graph sections: https://sodilinux.itd.cnr.it/sdl6x2/documentazione/wings%203d/wings3d_manual1.6.1.pdf
- Wings forum note on object and material names reaching Unity imports: https://www.wings3d.com/forum/archive/index.php?thread-1590.html=

## Tomorrow's Wings Test

Create a small throwaway Wings model named `wingstest_fighter`.

It should have three obvious parts:

1. `cockpit`
2. `left_wing`
3. `laser_cannon_left`

Assign at least three materials:

1. `role_hull`
2. `role_accent`
3. `role_laser_pink`

The model should include:

- A few simple faces so we can test face-derived wire edges.
- At least one intentionally loose edge if Wings allows it, so we can see whether OBJ exports it as an `l` record.
- One mirrored or duplicated part so we can see how object names survive duplication.
- A material change on adjacent line segments sharing a vertex, so we can confirm whether Wings/OBJ forces geometry duplication or can preserve enough material context for our importer.

Export variants:

1. OBJ with default export settings.
2. OBJ with "one group per material" enabled if available.
3. OBJ plus MTL, with all materials included.
4. Export selected only, if the workflow makes that easier for individual models.

Inspect each exported `.obj` and `.mtl` file directly in a text editor.

Record whether the files contain:

- `o cockpit`, `o left_wing`, or equivalent object records
- `g role_hull`, `g role_laser_pink`, or equivalent group records
- `usemtl role_hull`, `usemtl role_laser_pink`, or equivalent material records
- `l` records for loose edges
- `f` records for face-only geometry
- stable vertex coordinates after re-exporting without edits
- stable object and material names after reopening the `.wings` file

## Pass Criteria

Wings is a good fit if:

- Object names survive export clearly enough to map to parts.
- Material names survive export clearly enough to map to color roles.
- The exported OBJ can preserve loose line edges or face boundaries are clean enough for deriving the wireframe.
- Re-exporting without edits does not cause excessive vertex or object churn.
- The workflow feels faster and less fragile than Blender for low-poly wireframe authoring.

Wings is only partially useful if:

- It preserves object names but not material groupings.
- It preserves material groupings but merges object names too aggressively.
- It only exports faces, but face-derived wireframes are acceptable for our art style.

Wings is not a good fit if:

- Object/material names are not recoverable from export.
- The exporter rewrites geometry so heavily that sidecar overrides cannot stay stable.
- Loose edges and simple face boundaries cannot be represented reliably.
- The artist workflow requires manual OBJ editing after every export.

## Importer Changes If Wings Passes

Extend `@neon-cabinet/model-tools` to parse:

- `o` object names
- `g` group names
- `usemtl` material names
- `mtllib` references, when useful
- `l` records with active object/group/material metadata
- `f` records with active object/group/material metadata

Add sidecar support:

- read `<model>.wire.json` next to `<model>.obj`
- resolve palette roles to numeric colors
- apply per-edge colors during TypeScript generation
- preserve model-level fallback color
- write an import audit report
- export OBJ/MTL/sidecar from TypeScript models where possible

Generated `WireframeModel` edges should look like this when colors are resolved:

```ts
edges: [
  { start: 0, end: 1, color: 0x7be8ff },
  { start: 1, end: 2, color: 0xff43d6 },
],
```

## Open Questions

1. Does Wings export loose edges as OBJ `l` records, or only faces?
2. Does "one group per material" help or hurt object-part naming?
3. When an object has several materials, does Wings emit material changes in a way we can attach to derived face edges?
4. How stable are vertex coordinates and ordering across save/reopen/re-export?
5. Can artists comfortably maintain semantic object and material names in Wings without a custom Neon Cabinet editor?
6. Do we need a small import-preview tool that highlights unknown parts/materials before committing generated TypeScript?

## Recommended Next Step

Run the Wings test above before writing importer code. The highest-value evidence is a real exported OBJ/MTL fixture from Wings with three named parts and three materials. Once that fixture exists, add it to `libs/model-tools` tests and implement parser changes against the exact records Wings produces.
