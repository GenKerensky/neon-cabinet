# Neon Cabinet

A virtual web arcade for retro-style games. Play classics like Space Defender and more.

- **Arcade homepage** — Browse games in a dark purple/blue themed lobby.
- **Game library** — Large thumbnails; each game links to its play page.
- **Auth (coming soon)** — Login and user profiles via Supabase.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/)

### Installation

```bash
git clone <repo-url>
cd neon-cabinet

bun install
```

### Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
bun run build
bun run start
```

### Linting & Formatting

```bash
bun run lint
bun run format
```

## Project Structure

```
neon-cabinet/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, Navbar, metadata
│   │   ├── page.tsx            # Arcade homepage (game grid)
│   │   ├── globals.css         # Tailwind + dark purple/blue theme
│   │   └── games/
│   │       └── space-defender/
│   │           └── page.tsx    # Space Defender (Phaser)
│   ├── components/
│   │   ├── ui/                 # shadcn (button, card, etc.)
│   │   ├── navbar.tsx
│   │   └── game-card.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   └── games.ts            # Game list for arcade
│   ├── games/                  # One folder per game
│   │   ├── _shared/
│   │   │   └── shaders/        # Shared (e.g. CRT), reused across games
│   │   └── space-defender/
│   │       ├── PhaserGame.tsx  # React–Phaser bridge
│   │       ├── EventBus.ts
│   │       ├── main.ts
│   │       ├── objects/
│   │       ├── scenes/
│   │       └── utils/
│   └── types/
├── public/
│   └── assets/                 # Placeholder SVGs (thumbnails, logo, favicon)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── components.json             # shadcn
└── eslint.config.js
```

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** — App Router, React 19
- **[Tailwind CSS](https://tailwindcss.com/)** — Styling
- **[shadcn/ui](https://ui.shadcn.com/)** — UI components
- **[Phaser 3.90](https://phaser.io/)** — HTML5 game framework
- **[TypeScript 5.7](https://www.typescriptlang.org/)** — Type-safe JavaScript
- **WebGL** — Custom CRT post-processing shader (Space Defender)

---

## Games

### Space Defender

A retro-style arcade space shooter. Defend the galaxy from endless waves of asteroids using an arsenal of upgradeable weapons.

#### Features

- **Classic Asteroids Gameplay** — Destroy asteroids that split into smaller pieces
- **Mouse Aiming** — Precise aiming with WASD movement for fluid twin-stick style controls
- **3 Weapon Types**:
  - **Blaster** — Fast-firing green plasma bolts (starting weapon)
  - **Laser** — Instant red beam that cuts through asteroids (unlocks at 1000 pts)
  - **Missile** — Homing projectiles that track your cursor and explode on impact (unlocks at 2000 pts)
- **CRT Shader Effect** — Authentic retro visuals with scanlines, screen curvature, chromatic aberration, and bloom
- **Procedural Graphics** — All sprites generated at runtime, no external assets needed
- **Cheat Mode** — For testing (press C to toggle)

#### Controls

| Key   | Action                |
| ----- | --------------------- |
| W     | Thrust forward        |
| S     | Thrust backward       |
| A     | Strafe left           |
| D     | Strafe right          |
| Mouse | Aim                   |
| Click | Fire weapon           |
| Q     | Cycle weapons         |
| C     | Toggle cheat mode     |
| ESC   | Return to title (G/O) |

#### Scoring

| Asteroid Size | Points |
| ------------- | ------ |
| Large         | 20     |
| Medium        | 50     |
| Small         | 100    |

#### Weapon Unlocks

| Weapon  | Unlock Score | Cooldown |
| ------- | ------------ | -------- |
| Blaster | 0 (starting) | 200ms    |
| Laser   | 1000         | 500ms    |
| Missile | 2000         | 800ms    |

#### Waves

Each wave spawns `3 + wave_number` large asteroids. Asteroids spawn away from the player's position.
