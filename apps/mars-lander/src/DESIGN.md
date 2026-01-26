# Mars Lander - Game Design Document

A vector-graphics lunar lander game inspired by the 1979 Atari Lunar Lander arcade, reimagined with a Martian theme and color vector graphics.

## Overview

The player controls a lander spacecraft, using thrust and rotation to safely land on designated landing pads on procedurally generated Martian terrain. The game features increasing difficulty through more challenging terrain and fewer landing zones.

## Visual Style

- **Vector graphics** with glow effects using the shared `VectorShader`
- **Martian color theme**: Orange and red tones for terrain/atmosphere
- **Starfield background**: Regenerates each level for variety
- **Atmosphere gradient**: Dark space transitioning to reddish Martian atmosphere

## Controls

| Input | Action       |
| ----- | ------------ |
| W / ↑ | Thrust       |
| A / ← | Rotate left  |
| D / → | Rotate right |
| ESC   | Pause        |

## Physics Parameters

### Lander

| Parameter        | Value                            |
| ---------------- | -------------------------------- |
| Max fuel         | 100                              |
| Fuel consumption | 15/second when thrusting         |
| Thrust power     | 250                              |
| Rotation speed   | 150°/second                      |
| Max velocity     | 300 (horizontal), 400 (vertical) |
| World gravity    | 50                               |

### Landing Conditions

**Safe landing requires ALL of:**

- Vertical speed ≤ 200 m/s
- Horizontal speed ≤ 30 m/s
- Angle ≤ 15° from vertical
- Must be on a landing pad

**Crash conditions:**

- Vertical speed > 200 m/s → "SPEED TOO HIGH"
- Angle > 15° → "INCORRECT LANDING ANGLE"
- Not on landing pad → "TERRAIN COLLISION"

### HUD Color Indicators

**Vertical speed:**

- Cyan (#00ddff): ≤ 150 m/s (safe)
- Orange (#ff6600): 151-200 m/s (warning)
- Red (#ff0000): > 200 m/s (danger)

**Horizontal speed:**

- Cyan (#00ddff): ≤ 30 m/s (safe)
- Orange (#ff6600): > 30 m/s (warning)

## Difficulty Progression

### Landing Zones per Level

| Level | Landing Zones |
| ----- | ------------- |
| 1     | 4 (fixed)     |
| 2     | 3 (fixed)     |
| 3     | 2 (fixed)     |
| 4+    | 1-4 (random)  |

### Landing Zone Width

```
width = max(80, 150 - effectiveDifficulty * 10)
```

Where `effectiveDifficulty` is capped at 10.

### Landing Zone Placement

- Positions are **randomized** (not evenly spaced)
- After level 1, zones **avoid the center** where the lander spawns
- Zones cannot overlap (40px minimum gap)
- Zones stay within screen margins

## Scoring System

### Landing Score Formula

```
landingScore = (baseScore + fuelBonus) × multiplier
```

Where:

- `baseScore` = 100
- `fuelBonus` = remaining fuel percentage (0-100)
- `multiplier` = 5 - numLandingZones (1-4x)

### Multiplier by Zone Count

| Zones | Multiplier |
| ----- | ---------- |
| 4     | x1         |
| 3     | x2         |
| 2     | x3         |
| 1     | x4         |

## Level Transitions

On successful landing:

1. Display "PERFECT LANDING!" with score breakdown
2. Wait 2.5 seconds
3. Fade out camera
4. Regenerate starfield
5. Regenerate terrain (avoiding center)
6. Reset lander position to top center
7. Reset lander physics (velocity, rotation)
8. **Reset fuel to 100%**
9. Fade in camera
10. Display level announcement

## Terrain Generation

- Procedural generation using Perlin noise
- Max terrain height capped at 30% from top of screen
- Height variation increases with difficulty (capped at 200)
- Spike probability increases with difficulty (capped)
- Landing zones are flat at base height with visual indicators

## File Structure

```
mars-lander/
├── main.ts           # Phaser game config
├── PhaserGame.tsx    # React wrapper component
├── EventBus.ts       # Scene communication
├── objects/
│   ├── Lander.ts     # Player spacecraft
│   └── Terrain.ts    # Procedural terrain + landing zones
├── scenes/
│   ├── Boot.ts       # Texture generation
│   ├── Title.ts      # Title screen
│   ├── Game.ts       # Main gameplay
│   ├── GameOver.ts   # Game over screen
│   └── Pause.ts      # Pause overlay
└── utils/
    ├── font.ts       # Font utilities
    └── settings.ts   # Vector mode settings
```

## Shared Dependencies

- `@/games/_shared/shaders/VectorShader.ts` - Post-processing shader
- `@/games/_shared/shaders/vector.frag` - GLSL fragment shader

## Key Design Decisions

1. **Fuel resets each level** - Encourages aggressive play without punishing fuel-efficient landings

2. **Center avoidance after level 1** - Forces player to actually navigate, prevents trivial "do nothing" wins

3. **Randomized landing zone positions** - Each level feels fresh, prevents memorization

4. **Capture physics before stopping** - Speed/angle checked before zeroing velocity to prevent false safe landings

5. **Crash reasons displayed** - Helps players understand what went wrong and improve

6. **Bold, white controls text** - High visibility for accessibility, drawn at depth 300 to stay above all game elements

7. **Speed thresholds increased** - 200 m/s crash threshold feels more forgiving while still requiring skill
