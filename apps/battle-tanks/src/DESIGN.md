# Battle Tanks - Design Document

## Game Concept

Battle Tanks is a retro-futuristic wireframe 3D tank combat game inspired by Atari's Battlezone (1980). The game features:

- **First-person perspective** tank combat
- **Wireframe vector graphics** with neon green aesthetic
- **Wave-based progression** with increasing difficulty
- **Pickup system** for armor restoration and weapon acquisition
- **Multiple weapon types** with unique mechanics
- **Terrain obstacles** that affect gameplay and AI pathfinding

## Visual Design

### Color Palette

- **Primary Green**: `0x00ff00` - Player, HUD elements, wireframes
- **Enemy Red**: `0xff0000` - Enemy tanks, projectiles, radar dots
- **Terrain Green**: `0x00ff00` - Obstacles (cubes/pyramids)
- **Armor Pickup Cyan**: `0x00ffff` - Shield pickups, radar dots
- **Weapon Pickup Gold**: `0xffd700` - Weapon pickups, radar dots
- **Laser Beam**: `0xff4400` - Orange-red laser beam effect
- **Atmosphere**: Dark green gradient from horizon (halfway up screen) to black

### Visual Effects

- **Starfield**: Pre-rendered wide field that wraps around player, moves with player rotation, includes parallax perspective effect
- **Atmosphere Gradient**: Dark green glow from horizon (screen center) extending halfway to top, black above
- **Ground Grid**: 2px thick bright green lines with distance-based fade (black gradient overlay from horizon to player)
- **Mountains**: Distant horizon silhouette with black fill, rendered at fixed distance
- **Player Illuminator**: Soft linear green glow emanating outward from camera position (forward direction), very transparent
- **Screen Shake**: Used for explosions, hits, and cannon fire
- **Vector Particles**: Line-based particle effects for explosions, sparks, debris

### Tank Models

- **Player/Enemy Tanks**: M1 Abrams-style wireframe models
  - High detail with turret, hull, barrel, cupola
  - Gun barrel aligned with player crosshairs (y=50)
  - No track skirts (removed for clarity)
  - Taller scale to match player perspective
- **Turrets**: Stationary gun emplacements with polygonal barrel (not just a line), slightly increased detail

## Game Systems

### Player Mechanics

**Movement:**

- WASD or Arrow Keys
- W/↑: Forward
- S/↓: Reverse
- A/D or ←/→: Rotate left/right
- No strafing (authentic tank feel)
- Acceleration/deceleration (not instant)
- Max speed: 150 units/sec
- Max reverse: 80 units/sec

**Combat:**

- SPACE: Fire current weapon
- R: Manual reload (autocannon only)
- Q/E: Cycle weapons (prev/next)

**Armor System:**

- 4 sections: front, rear, left, right
- Each section can take 3 hits
- Damage levels: Green (0 hits) → Yellow (1 hit) → Red (2 hits) → Destroyed (3 hits)
- When any section reaches destroyed, game over
- Armor resets between waves
- No lives system (single life per game)

### Weapon System

**Autocannon (Default):**

- 10 rounds max
- 2000ms reload time
- Manual reload with R key
- Auto-reload when empty
- Projectile-based

**Laser:**

- Charge-based (0-100%)
- 25% charge per shot
- Auto-recharge at 20%/second
- Raycast-based (instant hit)
- No manual reload
- Glowing orange-red beam visual
- Same damage as autocannon

**Weapon Switching:**

- Each weapon maintains independent ammo/recharge state
- Prevents exploit of switching to skip reload/recharge
- Weapon indicator shows all owned weapons with current selection highlighted

### Enemy AI

**Enemy Tanks:**

- **Patrol Mode**: Follow preset waypoint route until player detected
- **Hunt Mode**: Activated when player within detection range
  - Moves toward player at hunt speed
  - Maintains minimum engagement distance
  - Rotates to face player
  - Fires when facing player and in range
  - Returns to patrol if player exits loseTargetRange
- Terrain avoidance: Navigates around obstacles
- Line-of-sight checks before firing

**Turrets:**

- Stationary gun emplacements
- Rotate to face player
- Fire at regular intervals when player in range
- Line-of-sight checks before firing

**Difficulty Scaling:**

- Enemy stats scale with wave number
- **Capped at player limits** (never faster than player):
  - Fire rate: min = player reload time (2000ms)
  - Move speed: max = player max speed (150)
  - Projectile speed: max = player projectile speed (800)

### Terrain System

**Obstacles:**

- Green wireframe cubes and pyramids
- Random sizes (no smaller than turret, reasonable max)
- Independent height/width variation
- Collision detection:
  - Blocks all projectiles
  - Player cannot pass through
  - Enemies cannot pass through
- Enemy AI navigates around obstacles

**Ground Grid:**

- Perspective grid surface
- 2px thick bright green lines
- Fades with distance (gradient overlay from horizon to player)
- Creates depth perception

### Pickup System

**Armor Pickups:**

- Cyan hexagonal shield wireframe model
- Spawn 2-4 per wave, away from player (min 400 units)
- Restore 1 armor point to all damaged sections
- Show as cyan dots on radar
- Rotating animation for visibility

**Weapon Pickups:**

- Gold wireframe models (stylized weapon shapes)
- Spawn every 3 waves (3, 6, 9...) if player doesn't have weapon
- Laser pickup: Stylized ray gun shape
- Show as gold dots on radar
- Rotating animation

### Wave System

**Progression:**

- Wave 1: 3 turrets
- Wave 2: 2 turrets + 1 tank
- Wave 3+: Increasing mix of enemies
- Enemy count increases with wave number
- Spawn distance decreases with difficulty

**Wave Transitions:**

- Dramatic overlay with wave number
- "WAVE CLEARED" → Countdown → "WAVE X" → Active
- Brief pause between waves
- Armor resets between waves

## HUD Layout

### Top Left

- **Score**: "SCORE: 0" (24px font)
- **Wave**: "WAVE 1" (20px font, below score)

### Top Right

- **Speed**: "SPEED: 0" (24px font)
- **Position**: "X: 0 Z: 0" (20px font, below speed)

### Bottom Left

- **Armor Label**: "ARMOR" (centered above icon, with spacing)
- **Armor Icon**: Top-down wireframe tank diagram
  - M1 Abrams-style silhouette
  - 4 outlined sections (front, rear, left, right)
  - Color-coded by damage: Green → Yellow → Red
  - Larger size, vertically centered with radar/ammo

### Bottom Center

- **Radar**: Circular display (100px radius)
  - Dark green background
  - Green border
  - Player dot at center (green)
  - Enemy dots (red)
  - Pickup dots (cyan for armor, gold for weapons)
  - North/facing indicator line
  - Range: 2000 world units

### Bottom Right

- **Weapon Indicator**: List of owned weapons (only shown when 2+ weapons)
  - "WEAPONS" label
  - Current weapon highlighted with brackets: `[WEAPON]`
  - Other weapons: `WEAPON`
- **Ammo Display**:
  - Autocannon: "AMMO: 10"
  - Laser: "CHARGE: 75%"
  - Color: Green (full) → Yellow (low) → Red (empty)
- **Reload Bar**: Horizontal progress bar (180px wide)
  - Only visible when reloading/recharging
  - Green fill, green border
  - Label: "RELOADING" or "RECHARGING"

### Center Screen

- **Crosshairs**: Green wireframe crosshair
- **Horizon Line**: Dark green horizontal line

### Game Over

- **Cracked Windshield**: Green wireframe crack pattern over HUD
- Triggered when last armor plate destroyed
- Brief freeze, then transition to GameOver scene

## Title Screen

- **Visual Style**: Looks like the game
- **Elements**:
  - Grid floor
  - Mountains in background
  - Same lighting effects (atmosphere, starfield, illuminator)
  - Player appears to be moving forward
  - Wireframe green tanks and turrets passing by on either side
  - Random spacing and orientations
  - All text centered on screen
  - No floating tank icon

## Pause Screen

- **Controls Hint**: Between "PRESS ESC TO RESUME" and "PRESS Q TO QUIT"
  - Larger font
  - Each action on new line:
    - `W / ↑ - Forward`
    - `S / ↓ - Reverse`
    - `A / ← - Turn Left`
    - `D / → - Turn Right`
    - `SPACE - Fire`
    - `R - Reload`
  - Reduced whitespace between sections

## Technical Architecture

### 3D Engine

- Custom wireframe 3D engine built on Phaser 3
- Vector3D math library
- Camera3D with perspective projection
- WireframeRenderer for 3D model rendering
- First-person camera locked to tank position

### Collision Detection

- Distance-based for entities
- Line-of-sight checks for projectiles vs terrain
- Point collision for projectiles vs obstacles
- Entity-obstacle push-back logic
- Raycast for laser weapon

### Rendering Order

1. Atmosphere gradient (background)
2. Starfield
3. Ground grid
4. Mountains
5. Terrain obstacles
6. Pickups
7. Enemies and projectiles
8. Player projectiles
9. Laser beams
10. Particles
11. HUD overlay

## Key Design Principles

1. **Authentic Tank Feel**: No strafing, acceleration-based movement
2. **Fair Difficulty**: Enemies never exceed player capabilities
3. **Visual Clarity**: Wireframe style with strategic detail reduction
4. **Consistent Aesthetic**: All elements use wireframe/vector graphics style
5. **Player Feedback**: Clear HUD, visual effects, screen shake
6. **Strategic Depth**: Terrain affects combat, weapon switching has trade-offs

## Future Expansion Points

- Additional weapon types (missile launcher, plasma cannon, etc.)
- More enemy types
- Power-ups beyond armor restoration
- Environmental hazards
- Boss battles
- Multiplayer support
