# Space Defender - Design Documentation

## Overview

Space Defender is a top-down space shooter inspired by the classic Asteroids (1979) arcade game. It uses modern rendering techniques to recreate the distinctive vector graphics aesthetic while adding color, bloom effects, and contemporary gameplay mechanics.

## Core Design Philosophy

### Vector Graphics Aesthetic

The game aims to evoke the feeling of classic vector display games with:

- **Wireframe graphics**: All sprites use line-based drawing, not filled shapes
- **Bright, glowing lines**: High contrast against black backgrounds
- **Phosphor glow effect**: Simulated via bloom shader for that classic persistence
- **Crisp geometric shapes**: Sharp angles and clean lines

See `AGENTS.md` for detailed technical background on vector displays.

### Color vs Monochrome

The game supports two visual modes:

- **Color mode**: Full RGB with cyan accents, colored weapons, nebula backgrounds
- **Monochrome mode**: Classic green/blue-white phosphor look

All assets must work seamlessly in both modes, maintaining appropriate contrast.

## Ship Design

### Razorback-Style Racing Yacht

The player ship is inspired by the Razorback from _The Expanse_:

- **Size**: 50×80 pixels (scaled 2x on title screen)
- **Style**: Wireframe vector drawing with black fill
- **Orientation**: Points upward (nose at top)

### Visual Details

- **Hull**: White outline (`0xffffff`) with 2px stroke
- **Structure**: Grey internal lines (`0xaaaaaa`) for panel lines, cross-bracing, struts
- **Accents**: Cyan (`0x00ffff`) for racing stripes, running lights, engine glow
- **Fill**: Black (`0x000000`) to prevent stars showing through hull

### Key Design Decisions

1. **Wireframe over filled shapes**: Large filled areas wash out due to aggressive bloom shader. Wireframe lines work perfectly with the bloom effect.

2. **Black fill**: Added to prevent background stars from showing through the ship hull, improving visual clarity.

3. **Size increase**: Ship was scaled up from 30×30 to 50×80 for better visibility and detail.

## Ship Physics

### Movement System

- **Thrust-based**: WASD controls acceleration, not direct velocity
- **Drag**: 0.99 damping factor for realistic momentum
- **Max velocity**: 400 pixels/second
- **Thrust speed**: 300 pixels/second²

### Rotational Inertia

The ship has realistic turning lag:

- **Rotation acceleration**: 15 rad/s²
- **Max rotation speed**: 8 rad/s
- **Rotation damping**: 0.92 (friction)

The ship does NOT instantly snap to mouse direction. Instead, it smoothly accelerates rotation toward the target angle, creating more realistic, weighty movement.

### Thrust Effects

- **Main engine** (forward/back): 38px exhaust distance
- **Side thrusters** (strafe): 18px exhaust distance
- Different exhaust positions based on thrust direction relative to ship facing

## Weapon System

### Weapon Progression

Weapons unlock based on score:

1. **Autocannon** (unlocked at start) - Fast-firing tracer rounds
2. **Laser** - Instant-hit beam weapon
3. **Missile** - Explosive area damage
4. **Ray Gun** - Continuous beam with auto-tracking

### Autocannon Design

Originally named "Blaster", renamed to better reflect its role:

- **Bullet**: Thin 8×2px rectangle (tracer-style)
- **Trail**: Very thin 6×1px streak
- **Bloom glow**: Elongated ellipses (10×4, 6×3, 4×2px) for subtle glow
- **Cooldown**: 120ms (fast fire rate)
- **Icon**: Three staggered tracer rounds

**Key decision**: Bullets were made much thinner to match autocannon aesthetic. Large circular glows were replaced with elongated ellipses to maintain the thin tracer look while preserving some visual impact.

## Visual Effects

### Bloom Shader

The game uses an aggressive bloom shader (`VectorShader`) that:

- Applies multiple glow passes (bloom, wide glow, star glow)
- Multiplies brightness significantly (can reach 3x for bright pixels)
- Works best with thin lines, not large filled areas

**Critical insight**: Large filled shapes (like original ship design) wash out completely. Wireframe lines are essential for maintaining visual clarity.

### Starfield Background

- Multiple layers of stars (distant dim, medium, bright, extra bright)
- Slight color variation (blue/white/yellow tints)
- Scrolling effect on title screen

### Nebula Effect

A nebula effect was implemented but later removed. It used:

- Multiple cloud layers with overlapping ellipses
- Purple, magenta, blue, teal color palette
- Wispy tendrils and star-forming region bright spots

## Asteroid Design

- **Variants**: 5 different shapes with varied desaturated blue-green colors
- **Fill colors**: Dark range (`0x1a1d1f` to `0x3d4449`) to prevent wash-out from bloom
- **Style**: Filled polygons with white outlines
- **Splitting**: Asteroids split into smaller pieces when destroyed

## UI Design

### HUD Elements

- **Score**: Top center, white text
- **Lives**: Top left, ship icons (or infinity symbol in cheat mode)
- **Wave**: Top right, white text
- **Controls**: Bottom left, grey text
- **Weapon**: Bottom right, weapon name + icon
- **Cooldown indicator**: Circular progress arc with weapon color

### Title Screen

- Animated ship preview with engine particles
- Scrolling starfield
- Floating asteroids in background
- Pulsing title glow effect
- High score display (if available)

## Technical Architecture

### Scene Structure

- **Boot**: Asset generation (procedural sprites)
- **Title**: Main menu with animated preview
- **Game**: Main gameplay scene
- **Pause**: Pause overlay
- **GameOver**: Game over screen with score

### Asset Generation

All sprites are procedurally generated in `Boot.ts`:

- Ship: Wireframe vector drawing
- Asteroids: Random polygon generation
- Bullets: Simple geometric shapes
- Particles: Small circles/ellipses
- Icons: Weapon representations

### Physics

- Arcade physics for collisions
- Screen wrapping for all objects
- Group-based collision detection

## Key Design Decisions from Development

1. **Wireframe ship**: Changed from filled Donnager-style to wireframe Razorback-style to work with bloom shader

2. **Ship size**: Increased from 30×30 to 50×80 for better visibility

3. **Color palette**: White/grey hull with cyan accents for contrast

4. **Rotational inertia**: Added turning lag for more realistic, weighty feel

5. **Autocannon redesign**: Made bullets much thinner (8×2px) with elongated glow instead of large circles

6. **Black ship fill**: Prevents stars showing through hull

7. **Different exhaust distances**: Main engine vs side thrusters use different offsets

8. **Dark asteroid fills**: Prevents wash-out from aggressive bloom shader

## Future Considerations

- Nebula effect could be re-added with adjusted opacity
- Additional weapon types
- Power-ups or special abilities
- Different asteroid types with varied behaviors
- Boss encounters
