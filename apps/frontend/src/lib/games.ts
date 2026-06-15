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
    href: "/games/battle-tanks",
    thumbnail: "/assets/battle-tanks-cabinet.png",
  },
  {
    id: "mars-lander",
    name: "Mars Lander",
    description:
      "Master thrust and gravity to touch down on the red planet. Inspired by Atari's 1979 vector classic that demanded precision over firepower.",
    href: "/games/mars-lander",
    thumbnail: "/assets/mars-lander-cabinet.png",
  },
  {
    id: "maze-runner",
    name: "Maze Runner",
    description:
      "Navigate neon corridors, devour dots, and outwit relentless pursuers. A fresh take on the 1980 maze chase that conquered arcades worldwide.",
    href: "/games/maze-runner",
    thumbnail: "/assets/maze-runner-cabinet.png",
  },
  {
    id: "starfighter-assault",
    name: "Starfighter Assault",
    description:
      "Climb into a bounty hunter cockpit for a neon wireframe assault on a Star Destroyer-like capital ship.",
    href: "/games/starfighter-assault",
    thumbnail: "/assets/starfighter-assault-cabinet.png",
  },
];
