export interface Game {
  id: string;
  name: string;
  description: string;
  href: string;
  thumbnail: string;
  comingSoon?: boolean;
}

export const games: Game[] = [
  {
    id: "space-defender",
    name: "Space Defender",
    description:
      "Defend the galaxy from endless waves of asteroids using an arsenal of upgradeable weapons.",
    href: "/games/space-defender",
    thumbnail: "/assets/space-defender-cabinet.png",
  },
  {
    id: "battle-tanks",
    name: "Battle Tanks",
    description:
      "Command your tank through a wireframe battlefield. The pioneering 1980 arcade hit brought 3D combat to life—now rebuilt with modern firepower.",
    href: "#",
    thumbnail: "/assets/battle-tanks-cabinet.png",
    comingSoon: true,
  },
  {
    id: "mars-lander",
    name: "Mars Lander",
    description:
      "Master thrust and gravity to touch down on the red planet. Inspired by Atari's 1979 vector classic that demanded precision over firepower.",
    href: "#",
    thumbnail: "/assets/mars-lander-cabinet.png",
    comingSoon: true,
  },
  {
    id: "maze-runner",
    name: "Maze Runner",
    description:
      "Navigate neon corridors, devour dots, and outwit relentless pursuers. A fresh take on the 1980 maze chase that conquered arcades worldwide.",
    href: "#",
    thumbnail: "/assets/maze-runner-cabinet.png",
    comingSoon: true,
  },
  {
    id: "starfighter-assault",
    name: "Starfighter Assault",
    description:
      "Climb into the cockpit for a vector-drawn assault on an enemy superstructure. Inspired by Atari's legendary 1983 trench run.",
    href: "#",
    thumbnail: "/assets/starfighter-assault-cabinet.png",
    comingSoon: true,
  },
];
