export const DEFAULT_STUDIO_GAME_ID = "battle-tanks";

export interface StudioGameIcon {
  label: string;
  svgDataUri: string;
  svgPath: string;
  pngPaths: {
    16: string;
    32: string;
    48: string;
  };
}

export interface StudioGameMetadata {
  description: string;
  href: string;
  status?: "available" | "coming-soon";
}

export interface StudioGameTheme {
  accent: string;
  accentForeground: string;
  audioGrid: string;
  audioLine: string;
  audioPanel: string;
  audioPanelStrong: string;
  background: string;
  border: string;
  foreground: string;
  input: string;
  primary: string;
  primaryForeground: string;
  ring: string;
  secondary: string;
  secondaryForeground: string;
}

export interface StudioGame {
  id: string;
  title: string;
  icon: StudioGameIcon;
  metadata: StudioGameMetadata;
  theme: StudioGameTheme;
}

const registeredGames: StudioGame[] = [
  {
    id: "battle-tanks",
    title: "Battle Tanks",
    icon: createGameIcon("battle-tanks", "Battle Tanks", battleTanksIconSvg()),
    metadata: {
      description:
        "Wireframe 3D tank combat with deep engine rumbles, harsh cannon fire, and arcade battlefield impacts.",
      href: "/games/battle-tanks",
      status: "available",
    },
    theme: {
      accent: "#ffbf5f",
      accentForeground: "#151008",
      audioGrid: "rgba(80, 255, 160, 0.05)",
      audioLine: "#ffbf5f",
      audioPanel: "rgba(8, 14, 16, 0.9)",
      audioPanelStrong: "#111b1d",
      background: "#070b0d",
      border: "rgba(132, 255, 183, 0.22)",
      foreground: "#e8fff3",
      input: "rgba(132, 255, 183, 0.2)",
      primary: "#35ff95",
      primaryForeground: "#03110b",
      ring: "rgba(53, 255, 149, 0.55)",
      secondary: "#10191b",
      secondaryForeground: "#dfffea",
    },
  },
  {
    id: "space-defender",
    title: "Space Defender",
    icon: createGameIcon(
      "space-defender",
      "Space Defender",
      spaceDefenderIconSvg(),
    ),
    metadata: {
      description:
        "Top-down vector space combat with cyan ship accents, weapon energy, and bright arcade impacts.",
      href: "/games/space-defender",
      status: "available",
    },
    theme: {
      accent: "#ff64d8",
      accentForeground: "#160013",
      audioGrid: "rgba(0, 255, 255, 0.055)",
      audioLine: "#66ffff",
      audioPanel: "rgba(7, 11, 22, 0.92)",
      audioPanelStrong: "#10182a",
      background: "#05070d",
      border: "rgba(102, 255, 255, 0.24)",
      foreground: "#eefbff",
      input: "rgba(102, 255, 255, 0.2)",
      primary: "#66ffff",
      primaryForeground: "#031014",
      ring: "rgba(102, 255, 255, 0.5)",
      secondary: "#10182a",
      secondaryForeground: "#e5fbff",
    },
  },
  {
    id: "starfighter-assault",
    title: "Starfighter Assault",
    icon: createGameIcon(
      "starfighter-assault",
      "Starfighter Assault",
      starfighterAssaultIconSvg(),
    ),
    metadata: {
      description:
        "Cockpit-view wireframe rail combat with bounty upgrades, torpedoes, and a capital ship finale.",
      href: "/games/starfighter-assault",
      status: "available",
    },
    theme: {
      accent: "#ff43d6",
      accentForeground: "#150018",
      audioGrid: "rgba(123, 232, 255, 0.06)",
      audioLine: "#ff43d6",
      audioPanel: "rgba(5, 3, 13, 0.92)",
      audioPanelStrong: "#100a28",
      background: "#05030d",
      border: "rgba(123, 232, 255, 0.24)",
      foreground: "#f3fbff",
      input: "rgba(255, 67, 214, 0.2)",
      primary: "#7be8ff",
      primaryForeground: "#020107",
      ring: "rgba(255, 67, 214, 0.5)",
      secondary: "#120d2e",
      secondaryForeground: "#f3fbff",
    },
  },
  {
    id: "mars-lander",
    title: "Mars Lander",
    icon: createGameIcon("mars-lander", "Mars Lander", marsLanderIconSvg()),
    metadata: {
      description:
        "Martian vector lander with orange thrust, cyan instruments, and tense touchdown cues.",
      href: "/games/mars-lander",
      status: "available",
    },
    theme: {
      accent: "#00ddff",
      accentForeground: "#021014",
      audioGrid: "rgba(255, 102, 0, 0.06)",
      audioLine: "#ff9a3d",
      audioPanel: "rgba(20, 8, 7, 0.9)",
      audioPanelStrong: "#1d1110",
      background: "#140807",
      border: "rgba(255, 154, 61, 0.25)",
      foreground: "#fff4ed",
      input: "rgba(255, 154, 61, 0.2)",
      primary: "#ff6600",
      primaryForeground: "#140807",
      ring: "rgba(255, 102, 0, 0.52)",
      secondary: "#241210",
      secondaryForeground: "#fff1e8",
    },
  },
  {
    id: "maze-runner",
    title: "Maze Runner",
    icon: createGameIcon("maze-runner", "Maze Runner", mazeRunnerIconSvg()),
    metadata: {
      description:
        "Neon maze chase audio with pellets, player movement, chase pressure, and hack pickups.",
      href: "/games/maze-runner",
      status: "available",
    },
    theme: {
      accent: "#ffff00",
      accentForeground: "#171704",
      audioGrid: "rgba(39, 61, 255, 0.07)",
      audioLine: "#ffff00",
      audioPanel: "rgba(6, 5, 18, 0.92)",
      audioPanelStrong: "#101130",
      background: "#060512",
      border: "rgba(255, 255, 0, 0.22)",
      foreground: "#f7f5ff",
      input: "rgba(255, 255, 0, 0.18)",
      primary: "#273dff",
      primaryForeground: "#f7f5ff",
      ring: "rgba(39, 61, 255, 0.5)",
      secondary: "#101130",
      secondaryForeground: "#f7f5ff",
    },
  },
];

export function getStudioGames(): StudioGame[] {
  return registeredGames.map(cloneStudioGame);
}

export function getStudioGameById(id: string): StudioGame | undefined {
  const game = registeredGames.find((candidate) => candidate.id === id);
  return game ? cloneStudioGame(game) : undefined;
}

function createGameIcon(
  gameId: string,
  label: string,
  svgMarkup: string,
): StudioGameIcon {
  const basePath = `apps/${gameId}/public/assets`;
  return {
    label,
    pngPaths: {
      16: `${basePath}/favicon-16.png`,
      32: `${basePath}/favicon-32.png`,
      48: `${basePath}/favicon-48.png`,
    },
    svgDataUri: `data:image/svg+xml,${encodeURIComponent(svgMarkup)}`,
    svgPath: `${basePath}/favicon.svg`,
  };
}

function cloneStudioGame(game: StudioGame): StudioGame {
  return JSON.parse(JSON.stringify(game)) as StudioGame;
}

function battleTanksIconSvg(): string {
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="10" fill="#03110b"/><g fill="none" stroke="#35ff95" stroke-linecap="round" stroke-linejoin="round"><rect x="11" y="25" width="42" height="21" rx="3" stroke-width="4"/><rect x="19" y="18" width="28" height="22" rx="3" stroke-width="4"/><path d="M32 18V7" stroke-width="5"/><path d="M27 7h10" stroke-width="4"/><path d="M15 46l-5 7M25 46l-3 8M39 46l3 8M49 46l5 7" stroke-width="3"/><path d="M16 31h10M38 31h10M22 39h26" stroke="#ffbf5f" stroke-width="3"/></g><circle cx="32" cy="32" r="28" fill="none" stroke="#00aa00" stroke-opacity="0.45" stroke-width="2"/></svg>';
}

function spaceDefenderIconSvg(): string {
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="10" fill="#05070d"/><g fill="#05070d" stroke-linecap="round" stroke-linejoin="round"><path d="M32 5 41 30 51 53 37 47 32 59 27 47 13 53 23 30Z" stroke="#f8ffff" stroke-width="4"/><path d="M32 11 36 31 44 45M32 11 28 31 20 45M25 34h14" fill="none" stroke="#9aa5ad" stroke-width="2.5"/><path d="M24 15 18 45M40 15l6 30" fill="none" stroke="#00ffff" stroke-width="3"/><path d="M28 51h8" fill="none" stroke="#66ffff" stroke-width="4"/></g><circle cx="12" cy="13" r="1.8" fill="#ffffff" opacity="0.9"/><circle cx="52" cy="16" r="1.4" fill="#66ffff" opacity="0.8"/><circle cx="50" cy="47" r="1.2" fill="#ffffff" opacity="0.7"/></svg>';
}

function starfighterAssaultIconSvg(): string {
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="10" fill="#05030d"/><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M8 18 25 34 8 46" stroke="#b04cff" stroke-width="4"/><path d="M56 18 39 34 56 46" stroke="#b04cff" stroke-width="4"/><path d="M22 48 32 27 42 48" stroke="#7be8ff" stroke-width="4"/><path d="M25 43h14" stroke="#ff43d6" stroke-width="3"/><ellipse cx="32" cy="50" rx="15" ry="6" stroke="#7be8ff" stroke-width="3"/><path d="M25 20h14M32 13v14" stroke="#ff43d6" stroke-width="3"/></g><circle cx="18" cy="27" r="2" fill="#ff1f35"/><circle cx="46" cy="30" r="2" fill="#ff1f35"/></svg>';
}

function marsLanderIconSvg(): string {
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="10" fill="#140807"/><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 19a12 12 0 0 1 24 0" stroke="#ffffff" stroke-width="4"/><path d="M18 20h28v18H18z" stroke="#ffffff" stroke-width="4"/><path d="M24 38h24l-6 11H30Z" stroke="#888888" stroke-width="3"/><path d="M26 49 12 58M38 49l14 9M19 55h-8M45 55h8" stroke="#ccaa00" stroke-width="4"/><path d="M26 20v18M38 20v18M24 28h16" stroke="#888888" stroke-width="2.5"/><path d="M28 29h8" stroke="#ff6600" stroke-width="5"/><circle cx="32" cy="13" r="3" fill="#00ddff" stroke="#ffffff" stroke-width="1.5"/><path d="M28 59c2-5 6-5 8 0" stroke="#ff6600" stroke-width="4"/></g></svg>';
}

function mazeRunnerIconSvg(): string {
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="10" fill="#060512"/><path d="M11 15h25M48 15h5M11 32h8M32 32h21M11 49h25M48 49h5" fill="none" stroke="#273dff" stroke-linecap="round" stroke-width="5"/><path d="M21 11v10M45 11v18M21 38v11M45 43v10" fill="none" stroke="#273dff" stroke-linecap="round" stroke-width="5"/><path d="M48 32A16 16 0 1 1 21.7 19.8L34 32Z" fill="#ffff00" stroke="#ffaa00" stroke-linejoin="round" stroke-width="4"/><circle cx="35" cy="23" r="3" fill="#050505"/><g fill="#ffffff"><circle cx="11" cy="32" r="2"/><circle cx="53" cy="32" r="2"/><circle cx="39" cy="49" r="2"/></g></svg>';
}
