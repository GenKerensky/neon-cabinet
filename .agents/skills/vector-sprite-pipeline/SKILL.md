---
name: vector-sprite-pipeline
description: Use when creating, editing, rendering, critiquing, or integrating Neon Cabinet vector art assets, SVG sprites, Phaser VectorPuppet assets, UAD metadata, socket/collider overlays, Vector Studio previews, or game art that must match existing design docs.
---

# Vector Sprite Pipeline

## Overview

Use this studio workflow for Neon Cabinet art assets whose source of truth is SVG. Keep Artist and Art Critic roles separate, use the Renderer role when preview tooling is needed, and never advance to the next sprite until the current one has critic approval and user approval.

## Source Context

Before drawing, read the user prompt and the relevant visual language:

- Nearby game docs such as `apps/<game>/src/DESIGN.md`, `apps/<game>/src/AGENTS.md`, and other markdown under the target app.
- Site and brand docs such as `apps/frontend/UI Design.md` when cabinet, launcher, or shared-brand assets are involved.
- Existing assets near the target path, especially `apps/*/public/assets/**/*.svg`.
- Vector Studio docs in `apps/vector-studio/README.md` and sprite tooling docs in `libs/sprite-tools/README.md` when UAD or rendering behavior matters.

Summarize the intended sprite in a brief art brief: purpose, target game/screen, dimensions or viewBox, palette, silhouette, animation needs, sockets, colliders, and prompt-specific requirements.

## Studio Roles

When subagent tools are available, spawn distinct role agents. If a renderer subagent would add overhead, run renderer steps locally, but keep the Artist and Art Critic perspectives separate.

If no subagent tool is available, simulate the roles sequentially in the same session and label each pass as `Artist`, `Renderer`, or `Art Critic`.

Artist:

- Owns SVG drafting and SVG edits.
- Creates declarative vector art using simple shapes, clean paths, low layer count, and prompt-faithful color.
- Adds UAD metadata when useful: animation, sockets, colliders, material bloom, and directional behavior.
- Applies Art Critic feedback without changing unrelated files.

Renderer:

- Converts SVGs to PNG previews with overlays.
- Runs Vector Studio and captures browser screenshots with shaders and procedural animation visible.
- Uses Chrome DevTools/browser inspection first. Check for a dev-mode Chrome instance at `127.0.0.1:9222` and inspect open tabs before falling back to Playwright or another browser tool.
- Does not critique art quality except to report rendering, parsing, or screenshot issues.

Art Critic:

- Independently validates visual quality, prompt fidelity, design-language fit, silhouette, color, line weight, legibility, collider fit, socket placement, and animation feasibility.
- Reviews both the raw SVG shape/color and rendered previews.
- Returns either the exact word `APPROVED` or a bullet list of required fixes. Partial approval does not advance the workflow.
- Must be satisfied before the workflow proceeds to the next phase.

## Workflow

1. Create the art brief.
2. Artist creates or edits the SVG source.
3. Renderer makes a fast PNG preview:

   ```bash
   bun run libs/sprite-tools/src/bin/render-svg.ts <input.svg> <output.png>
   ```

4. Art Critic reviews the SVG and PNG. Iterate Artist -> Renderer -> Art Critic until raw shape, colors, overlays, and UAD metadata are `APPROVED`.
5. Renderer starts Vector Studio:

   ```bash
   bun nx serve vector-studio
   ```

6. Renderer opens `http://localhost:4300/?asset=<workspace-relative-svg-path>`, enables or verifies shader/procedural preview, tests direction controls when relevant, and captures a screenshot with Chrome DevTools/browser tooling. Capture at least one screenshot with shaders enabled; when direction or animation metadata exists, verify one changed direction or animation-visible frame before critic review.
7. Art Critic reviews the Vector Studio screenshot for shader-pass legibility, scale, motion readability, bloom/scanline survival, prompt fidelity, and design-language fit. Iterate until `APPROVED`.
8. Present the approved SVG path, PNG preview path, and Vector Studio screenshot to the user. Ask: "Do you approve this sprite, or would you like changes before I continue?"
9. Only after user approval, continue to the next asset or integration task.

For multiple sprites, process one sprite completely through both critic gates and the user approval gate before starting the next one.

## SVG And UAD Rules

- Keep SVG as the source of truth. Do not replace vector sprites with generated bitmap art.
- Prefer stroke-based retro-arcade geometry, readable silhouettes, and 3-5 primary visual layers.
- Use a stable `viewBox`, deterministic IDs, and group-level `translate()` transforms where they clarify positioning.
- Close filled paths with `Z`.
- Keep colliders honest: solid gameplay body only, not glow, UI decoration, or empty visual space.
- Place sockets where attachments logically originate, such as muzzles, thrusters, hands, or eye anchors.
- Use bloom and shader metadata sparingly enough that the studio screenshot remains readable.

Useful UAD attributes:

| Attribute                  | Purpose                       | Example                                   |
| -------------------------- | ----------------------------- | ----------------------------------------- |
| `data-anim-wave`           | Procedural sine-wave morphing | `frequency:2 amplitude:5 points:20`       |
| `data-anim-wobble`         | Structural oscillation        | `frequency:1 amplitude:3`                 |
| `data-anim-chomp`          | Mouth or opening motion       | `frequency:5 range:30`                    |
| `data-slide-range`         | Directional eye/layer slide   | `data-slide-range="4"`                    |
| `data-direction-bend`      | Directional layer bend        | `data-direction-bend="5"`                 |
| `data-direction-rotation`  | Direction-based rotation      | `data-direction-rotation="true"`          |
| `class="physics-collider"` | Arcade Physics body           | `<circle class="physics-collider" ... />` |
| `id="socket_*"`            | Attachment point              | `<g id="socket_muzzle" ... />`            |
| `data-material-bloom`      | Shader glow intensity         | `data-material-bloom="2.0"`               |

## Verification

Always keep the render artifacts inspectable in a predictable location such as `test-results/vector-sprite-pipeline/<asset-name>-raw.png` and `<asset-name>-studio.png`.

Run `bun nx test sprite-tools` when UAD metadata, parser behavior, VectorPuppet behavior, or sprite-tools code is touched. For asset-only work, the minimum verification is successful fast PNG rendering plus a Vector Studio screenshot reviewed by the Art Critic.

When browser automation is needed, honor the repo debugging rule: try Chrome DevTools first, check `127.0.0.1:9222`, inspect open tabs for the running app, and only then use a fallback while noting why.
