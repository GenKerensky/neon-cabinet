import type { GameTestHarness } from "@neon-cabinet/phaser-test-harness";

export interface GameStateSnapshot {
  scene: string;
  player?: { x: number; y: number; gridX?: number; gridY?: number };
  enemies?: { x: number; y: number; alive: boolean }[];
  score?: number;
  lives?: number;
  level?: number;
  collectibles?: number;
}

interface ActiveSceneInfo {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instance: any;
}

interface DebugBridge {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  game(): any;
  scene(): ActiveSceneInfo;
  state(): GameStateSnapshot;
  screenshot(): string;
  pause(): void;
  resume(): void;
  inspect(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _game: any = null;

function activeScene(): ActiveSceneInfo {
  if (!_game?.scene?.keys) return { key: "", instance: null };

  const keys: Record<
    string,
    { scene?: { key: string }; sys?: { settings?: { active?: boolean } } }
  > = _game.scene.keys;

  for (const key in keys) {
    const entry = keys[key];
    if (!entry) continue;

    if (entry.sys?.settings?.active) {
      return { key, instance: entry };
    }
  }

  return { key: "", instance: null };
}

export function createDebugBridge(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  game: any,
  harness: GameTestHarness<unknown, unknown>,
  getStateSnapshot?: () => GameStateSnapshot,
): DebugBridge {
  _game = game;

  const screenshot = () => {
    try {
      const canvas = _game.renderer.canvas as HTMLCanvasElement;
      return canvas.toDataURL("image/png");
    } catch {
      return "";
    }
  };

  const bridge: DebugBridge = {
    game: () => _game,
    scene: activeScene,
    state: () => {
      const s = activeScene();
      const custom = getStateSnapshot?.() ?? {};
      return {
        scene: s.key,
        ...custom,
      };
    },
    screenshot,
    pause: () => harness.time.pause(),
    resume: () => harness.time.resume(),
    inspect: () => {
      const state = bridge.state();
      const sc = bridge.scene();
      console.group("⚡ Phaser Debug Bridge");
      console.log("Scene:", sc.key);
      console.log("Game:", _game);
      console.log("State:", state);
      console.groupEnd();
    },
  };

  (window as unknown as Record<string, unknown>).__PHASER_BRIDGE__ = bridge;

  return bridge;
}
