import { BATTLE_TANKS_AUDIO_PATCHES } from "./battle-tanks-presets";
import { MARS_LANDER_AUDIO_PATCHES } from "./mars-lander-presets";
import { SPACE_DEFENDER_AUDIO_PATCHES } from "./space-defender-presets";
import { AudioStudioGameRegistration } from "./types";

export const DEFAULT_AUDIO_STUDIO_GAME_ID = "battle-tanks";

const registeredGames: AudioStudioGameRegistration[] = [];

export function registerAudioStudioGame(
  game: AudioStudioGameRegistration,
): AudioStudioGameRegistration {
  const existingIndex = registeredGames.findIndex(
    (candidate) => candidate.id === game.id,
  );
  if (existingIndex >= 0) {
    registeredGames[existingIndex] = game;
  } else {
    registeredGames.push(game);
  }
  return game;
}

export function getAudioStudioGames(): AudioStudioGameRegistration[] {
  return registeredGames.map(cloneGameRegistration);
}

export function getAudioStudioGameById(
  id: string,
): AudioStudioGameRegistration | undefined {
  const game = registeredGames.find((candidate) => candidate.id === id);
  return game ? cloneGameRegistration(game) : undefined;
}

export const AUDIO_STUDIO_GAMES = registeredGames;

registerAudioStudioGame({
  id: "battle-tanks",
  title: "Battle Tanks",
  icon: createGameIcon("battle-tanks", "Battle Tanks", battleTanksIconSvg()),
  metadata: {
    description:
      "Wireframe 3D tank combat with deep engine rumbles, harsh cannon fire, and arcade battlefield impacts.",
    href: "/games/battle-tanks",
    status: "available",
  },
  effects: BATTLE_TANKS_AUDIO_PATCHES,
  defaultEffectId: "battle-tanks-cannon-bang",
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
});

registerAudioStudioGame({
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
  effects: SPACE_DEFENDER_AUDIO_PATCHES,
  defaultEffectId: "space-defender-thrust-loop",
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
});

registerAudioStudioGame({
  id: "mars-lander",
  title: "Mars Lander",
  icon: createGameIcon("mars-lander", "Mars Lander", marsLanderIconSvg()),
  metadata: {
    description:
      "Martian vector lander with orange thrust, cyan instruments, and tense touchdown cues.",
    href: "/games/mars-lander",
    status: "available",
  },
  effects: MARS_LANDER_AUDIO_PATCHES,
  defaultEffectId: "mars-lander-thrust-loop",
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
});

registerAudioStudioGame({
  id: "maze-runner",
  title: "Maze Runner",
  icon: createGameIcon("maze-runner", "Maze Runner", mazeRunnerIconSvg()),
  metadata: {
    description:
      "Neon maze chase audio with pellets, player movement, chase pressure, and hack pickups.",
    href: "/games/maze-runner",
    status: "available",
  },
  effects: [],
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
});

function createGameIcon(
  gameId: string,
  label: string,
  svgMarkup: string,
): AudioStudioGameRegistration["icon"] {
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

function cloneGameRegistration(
  game: AudioStudioGameRegistration,
): AudioStudioGameRegistration {
  return JSON.parse(JSON.stringify(game)) as AudioStudioGameRegistration;
}

function battleTanksIconSvg(): string {
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="10" fill="#03110b"/><g fill="none" stroke="#35ff95" stroke-linecap="round" stroke-linejoin="round"><rect x="11" y="25" width="42" height="21" rx="3" stroke-width="4"/><rect x="19" y="18" width="28" height="22" rx="3" stroke-width="4"/><path d="M32 18V7" stroke-width="5"/><path d="M27 7h10" stroke-width="4"/><path d="M15 46l-5 7M25 46l-3 8M39 46l3 8M49 46l5 7" stroke-width="3"/><path d="M16 31h10M38 31h10M22 39h26" stroke="#ffbf5f" stroke-width="3"/></g><circle cx="32" cy="32" r="28" fill="none" stroke="#00aa00" stroke-opacity="0.45" stroke-width="2"/></svg>';
}

function spaceDefenderIconSvg(): string {
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="10" fill="#05070d"/><g fill="#05070d" stroke-linecap="round" stroke-linejoin="round"><path d="M32 5 41 30 51 53 37 47 32 59 27 47 13 53 23 30Z" stroke="#f8ffff" stroke-width="4"/><path d="M32 11 36 31 44 45M32 11 28 31 20 45M25 34h14" fill="none" stroke="#9aa5ad" stroke-width="2.5"/><path d="M24 15 18 45M40 15l6 30" fill="none" stroke="#00ffff" stroke-width="3"/><path d="M28 51h8" fill="none" stroke="#66ffff" stroke-width="4"/></g><circle cx="12" cy="13" r="1.8" fill="#ffffff" opacity="0.9"/><circle cx="52" cy="16" r="1.4" fill="#66ffff" opacity="0.8"/><circle cx="50" cy="47" r="1.2" fill="#ffffff" opacity="0.7"/></svg>';
}

function marsLanderIconSvg(): string {
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="10" fill="#140807"/><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 19a12 12 0 0 1 24 0" stroke="#ffffff" stroke-width="4"/><path d="M18 20h28v18H18z" stroke="#ffffff" stroke-width="4"/><path d="M24 38h24l-6 11H30Z" stroke="#888888" stroke-width="3"/><path d="M26 49 12 58M38 49l14 9M19 55h-8M45 55h8" stroke="#ccaa00" stroke-width="4"/><path d="M26 20v18M38 20v18M24 28h16" stroke="#888888" stroke-width="2.5"/><path d="M28 29h8" stroke="#ff6600" stroke-width="5"/><circle cx="32" cy="13" r="3" fill="#00ddff" stroke="#ffffff" stroke-width="1.5"/><path d="M28 59c2-5 6-5 8 0" stroke="#ff6600" stroke-width="4"/></g></svg>';
}

function mazeRunnerIconSvg(): string {
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="10" fill="#060512"/><path d="M11 15h25M48 15h5M11 32h8M32 32h21M11 49h25M48 49h5" fill="none" stroke="#273dff" stroke-linecap="round" stroke-width="5"/><path d="M21 11v10M45 11v18M21 38v11M45 43v10" fill="none" stroke="#273dff" stroke-linecap="round" stroke-width="5"/><path d="M48 32A16 16 0 1 1 21.7 19.8L34 32Z" fill="#ffff00" stroke="#ffaa00" stroke-linejoin="round" stroke-width="4"/><circle cx="35" cy="23" r="3" fill="#050505"/><g fill="#ffffff"><circle cx="11" cy="32" r="2"/><circle cx="53" cy="32" r="2"/><circle cx="39" cy="49" r="2"/></g></svg>';
}
