## Context

The game currently generates all textures procedurally at boot time using Phaser's `Graphics.generateTexture()`. Player, enemies, collectibles, and walls are all static single-frame sprites. Phaser 3's animation system (`this.anims.create()`, `sprite.anims.play()`) and particle system are available but unused.

The codebase already has a solid foundation: `Player` and `Enemy` classes extend `GameObjects.Sprite`, movement is grid-based with smooth interpolation, and the `Boot` scene handles all texture generation. The goal is to extend the texture generation into multi-frame sprite sheets and wire them into the existing entity lifecycle.

## Goals / Non-Goals

**Goals:**

- Generate all animation frames procedurally at boot (no external image assets)
- Player: smooth chomp animation while moving, iconic death collapse + explosion
- Ghosts: wavy feet while moving, full-body blue flash during vulnerability (speeds up as timer expires), eye-only sprites when dead
- Effects: particle bursts on pellet pickup, screen flash on power pellet, floating score text
- Minimal changes to existing game logic — animation system sits alongside current code

**Non-Goals:**

- Loading external sprite sheets or image files (stay 100% procedural)
- Changing game mechanics or AI behavior (visuals only)
- Spine/bone-based animation (overkill for Pac-Man style)
- Sound effects (out of scope for this change)

## Decisions

### 1. Frame generation strategy: individual textures per frame

**Decision**: Generate each animation frame as a separate texture key (`player_right_0`, `player_right_1`, etc.) and reference them in `this.anims.create()` as individual frame objects. Do NOT try to pack frames into a single sprite sheet texture.

**Rationale**: Phaser's `generateTexture()` creates single-frame textures. While we could use `textures.addSpriteSheet()` on a canvas, the API for procedural multi-frame sprite sheets in Phaser is awkward. Individual textures are simpler, and for ~60 small 32×32 frames, the memory overhead is negligible (~60KB total).

**Alternatives considered**:

- Canvas-based sprite sheet: More efficient but harder to maintain procedural generation code
- DynamicTexture drawing: Overkill, requires constant redraws
- External assets: Rejected per non-goals

### 2. Animation state machine per entity

**Decision**: Each entity tracks an `animationState` string (e.g., `"walk-right"`, `"death"`, `"vulnerable"`). The `update()` loop checks if the current state differs from the last frame; if so, it calls `sprite.anims.play(newState, true)`.

**Rationale**: This decouples animation from game logic. The Player's `update()` already knows direction; it just needs to translate that into an animation key. The Enemy's `setEnemyState()` is the perfect hook to trigger animation changes.

```
Player animation states:
  idle, walk-up, walk-down, walk-left, walk-right, death

Enemy animation states:
  walk-up, walk-down, walk-left, walk-right,
  vulnerable, vulnerable-flash, eyes-up, eyes-down, eyes-left, eyes-right
```

### 3. Ghost vulnerability flash: tween-based, not animation-based

**Decision**: Instead of creating 20+ animation frames for the vulnerability flash, use Phaser's `tween` system on the sprite's `tint` property. The tween alternates between blue tint and white tint, with the `duration` decreasing as the frightened timer counts down.

**Rationale**: The flash is a color shift, not a shape change. A tween is cleaner than generating dozens of near-identical frames. The tween duration can be dynamically updated by halving it when `frightenedTimer < 3000ms`.

**Implementation**:

```typescript
this.scene.tweens.add({
  targets: this,
  tint: { from: 0x0000ff, to: 0xffffff },
  duration: frightenedTimer > 3000 ? 500 : 200,
  yoyo: true,
  repeat: -1,
});
```

### 4. Death animation sequence: collapse + explosion

**Decision**: Death is a one-shot Phaser animation (~12 frames, 200ms total). On `animationcomplete`, spawn a particle emitter burst and destroy the player sprite.

**Frame sequence** (procedurally drawn):

1.  Full circle (mouth closed)
2.  Mouth slightly open (15° wedge)
3.  Mouth wider (30° wedge)
4.  Mouth wider (45° wedge)
5.  Mouth wider (60° wedge)
6.  Mouth wider (90° wedge)
7.  Mouth wider (120° wedge)
8.  Vertical line (180° wedge)
9.  Thin vertical line
10. Tiny dot
11. Flicker (visible/invisible)
12. Gone

Then: particle explosion burst (10-15 particles, radial outward, yellow/orange)

**Rationale**: Matches the original Pac-Man death sequence. The explosion at the end adds modern flair while honoring the classic.

### 5. Particle effects: Phaser's built-in particle emitters

**Decision**: Use `this.add.particles()` for pickup effects. Each collectible type gets a different particle color:

- Regular pellet: tiny yellow dots (5 particles, short life)
- Power pellet: larger white/blue burst (15 particles, longer life)
- Ghost eaten: score-colored sparkles (10 particles)

**Rationale**: Phaser 3.60+ has a simplified particle API. No need for external particle editors since everything is procedural.

### 6. Floating score text: tweened Text objects

**Decision**: When a ghost is eaten, create a `Phaser.GameObjects.Text` object at the ghost's position, tween it upward while fading out, then destroy it.

**Rationale**: Simple, effective, and uses built-in Phaser APIs. No need for a custom UI system.

## Risks / Trade-offs

- **Performance with many small textures**: ~60 individual 32×32 textures is fine on desktop/mobile, but very low-end devices might struggle. → Mitigation: textures are generated once at boot and reused. If needed, we can switch to canvas sprite sheets later without changing the animation API.

- **Code complexity in Boot.ts**: The texture generation code will grow significantly (~300-400 lines). → Mitigation: Extract texture generation into a dedicated `TextureGenerator` class or helper functions. Keep `Boot.ts` focused on orchestration.

- **Animation frame rate mismatch with movement speed**: If the player moves at 200px/s and tiles are 30px, it takes ~150ms to cross a tile. The chomp animation at 10fps has a 300ms cycle, so the mouth might not align perfectly with tile crossings. → Mitigation: This is actually fine — the original Pac-Man had a fixed animation speed independent of movement. The visual reads as "continuous chomping" regardless.

- **Vulnerability tween desync**: If the frightened timer is paused or modified, the tween might get out of sync. → Mitigation: Tie tween duration to `frightenedTimer` value in the Enemy's `update()` loop, updating the tween each frame.

## Migration Plan

This is a pure additive change. No migration needed. Existing save data, high scores, and game state are unaffected. The only risk is that the Boot scene takes slightly longer to generate textures; this is negligible (<100ms).

## Open Questions

- Should the death animation block player input? (Yes, player should be unable to move during death)
- Should the screen flash on power pellet be a full-screen white overlay or just a camera flash? (Camera flash is cleaner)
- Should ghost eyes animate directionally, or just snap to the facing direction? (Directional is better — eyes look where they're going)
