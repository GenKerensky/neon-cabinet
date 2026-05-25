## 1. Player Texture Generation

- [x] 1.1 Generate 3 chomp frames for right-facing player (mouth closed, half-open, open)
- [x] 1.2 Generate 3 chomp frames for left-facing player
- [x] 1.3 Generate 3 chomp frames for up-facing player
- [x] 1.4 Generate 3 chomp frames for down-facing player
- [x] 1.5 Generate ~12 death collapse frames (full circle → thin line → flicker → gone)
- [x] 1.6 Register all player frames as Phaser animations in Boot.ts

## 2. Ghost Texture Generation

- [x] 2.1 Generate 2 movement frames per ghost color for all 4 directions (wavy feet)
- [x] 2.2 Generate vulnerability texture (blue body, white eyes) for each ghost
- [x] 2.3 Generate 4 directional eye-only textures for dead ghost state
- [x] 2.4 Register all ghost frames as Phaser animations in Boot.ts

## 3. Player Animation Integration

- [x] 3.1 Add animation state tracking to Player class
- [x] 3.2 Play directional chomp animation based on current movement direction
- [x] 3.3 Pause animation on idle (show full-circle frame)
- [x] 3.4 Trigger death animation on enemy collision
- [x] 3.5 Block player input during death animation
- [x] 3.6 Spawn particle explosion when death animation completes

## 7. Verify All Tests Pass

- [x] 7.1 Run full test suite and fix any failures
- [x] 7.2 Manually verify all animations look correct in gameplay
