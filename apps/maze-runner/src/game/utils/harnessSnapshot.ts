import { formatScore, readHighScore } from "./highScore";
import {
  getCellCenter,
  getCenterTolerance,
  getPenGeometry,
  isAtCellCenter,
  isPenExitCell,
  isPenGateCell,
  isPenInteriorCell,
} from "./gridGeometry";

type SceneLike = {
  scene?: { key?: string };
  sys?: { settings?: { key?: string } };
  key?: string;
  registry?: { get?: (key: string) => unknown };
  player?: PlayerLike;
  enemies?: EnemyLike[];
  scoreValue?: number;
  livesValue?: number;
  levelValue?: number;
  collectibleManager?: { getCollectibles?: () => unknown[] };
  gridWidth?: number;
  gridHeight?: number;
  tileSize?: number;
  offsetX?: number;
  offsetY?: number;
  children?: { list?: Array<{ mask?: { geometryMask?: unknown } | unknown }> };
  scoreText?: HudTextLike;
  levelText?: HudTextLike;
  highScoreText?: HudTextLike;
  lifeIcons?: LifeIconLike[];
  ghostsFrozen?: boolean;
};

type HudTextLike = {
  text?: string;
  x?: number;
  y?: number;
  originX?: number;
  originY?: number;
};

type LifeIconLike = {
  x?: number;
  y?: number;
};

type PlayerLike = {
  x: number;
  y: number;
  scaleX?: number;
  scaleY?: number;
  getGridX: () => number;
  getGridY: () => number;
  getCurrentDirection: () => number;
  isDyingState: () => boolean;
};

type EnemyLike = {
  texture?: { key?: string };
  textureName?: string;
  getState?: () => unknown;
  x: number;
  y: number;
  scaleX?: number;
  scaleY?: number;
  getGridX?: () => number;
  gridX?: number;
  getGridY?: () => number;
  gridY?: number;
  getCurrentDirection?: () => number;
  isExitingPen?: () => boolean;
};

const EPSILON = 0.001;

const matchesScale = (actual: number, expected: number): boolean =>
  Math.abs(actual - expected) <= EPSILON;

const getSceneKey = (scene: SceneLike): string => {
  return scene?.scene?.key ?? scene?.sys?.settings?.key ?? scene?.key ?? "";
};

const getActiveScenes = (gameInstance: unknown): SceneLike[] => {
  return (
    (
      gameInstance as {
        scene?: { getScenes?: (active: boolean) => SceneLike[] };
      }
    )?.scene?.getScenes?.(true) ?? []
  );
};

const getSnapshotRegistry = (
  activeScenes: SceneLike[],
): { get: (key: string) => unknown } | undefined => {
  const gameScene = activeScenes.find((scene) => getSceneKey(scene) === "Game");
  const registry = gameScene?.registry ?? activeScenes[0]?.registry;
  return registry?.get
    ? (registry as { get: (key: string) => unknown })
    : undefined;
};

const getTransitionState = (registry?: {
  get?: (key: string) => unknown;
}): string => {
  const transitionState = registry?.get
    ? registry.get("transitionState")
    : "idle";
  return typeof transitionState === "string" && transitionState
    ? transitionState
    : "idle";
};

export function getMazeRunnerStateSnapshot(gameInstance: unknown) {
  try {
    const activeScenes = getActiveScenes(gameInstance);
    const registry = getSnapshotRegistry(activeScenes);
    const highScore = readHighScore(registry);
    const snapshot: Record<string, unknown> = {
      activeScenes: activeScenes.map(getSceneKey).filter(Boolean),
      highScore,
      formattedHighScore: formatScore(highScore),
      transitionState: getTransitionState(registry),
    };

    const gameScene = activeScenes.find(
      (scene) => getSceneKey(scene) === "Game" && scene?.player,
    );

    const titleScene = activeScenes.find(
      (scene) => getSceneKey(scene) === "Title",
    );
    if (titleScene) {
      const displayList = titleScene.children?.list ?? [];
      const maskApplied = displayList.some((item) => {
        const mask = item?.mask;
        if (!mask) {
          return false;
        }
        if (typeof mask === "object" && "geometryMask" in mask) {
          return true;
        }
        return true;
      });
      snapshot.titleAttract = {
        bounds: { x: 80, y: 40, width: 864, height: 120 },
        maskApplied,
        playerCount: 1,
        ghostCount: 3,
      };
    }

    if (!gameScene?.player) {
      return snapshot;
    }

    const tileSize = gameScene.tileSize ?? 30;
    const expectedScale = tileSize / 30;
    const offsetX = gameScene.offsetX ?? 0;
    const offsetY = gameScene.offsetY ?? 0;
    const gridWidth = gameScene.gridWidth ?? 0;
    const gridHeight = gameScene.gridHeight ?? 0;
    const centerTolerance = getCenterTolerance(tileSize);

    const playerGridX = gameScene.player.getGridX();
    const playerGridY = gameScene.player.getGridY();
    const playerCenter = getCellCenter(
      playerGridX,
      playerGridY,
      tileSize,
      offsetX,
      offsetY,
    );

    snapshot.tileSize = tileSize;
    snapshot.expectedScale = expectedScale;
    snapshot.player = {
      gridX: playerGridX,
      gridY: playerGridY,
      x: gameScene.player.x,
      y: gameScene.player.y,
      direction: gameScene.player.getCurrentDirection(),
      isDying: gameScene.player.isDyingState(),
      scale: {
        x: gameScene.player.scaleX ?? 0,
        y: gameScene.player.scaleY ?? 0,
        matchesExpected:
          matchesScale(gameScene.player.scaleX ?? 0, expectedScale) &&
          matchesScale(gameScene.player.scaleY ?? 0, expectedScale),
      },
      centerline: {
        isCentered: isAtCellCenter(
          gameScene.player.x,
          gameScene.player.y,
          playerGridX,
          playerGridY,
          tileSize,
          offsetX,
          offsetY,
          centerTolerance,
        ),
        deltaX: gameScene.player.x - playerCenter.x,
        deltaY: gameScene.player.y - playerCenter.y,
        tolerance: centerTolerance,
      },
    };
    snapshot.enemies = (gameScene.enemies ?? []).map((enemy) => ({
      texture: enemy.texture?.key ?? enemy.textureName ?? "",
      state: enemy.getState?.() ?? "",
      x: enemy.x,
      y: enemy.y,
      gridX: enemy.getGridX?.() ?? enemy.gridX ?? 0,
      gridY: enemy.getGridY?.() ?? enemy.gridY ?? 0,
      direction: enemy.getCurrentDirection?.() ?? 0,
      scale: {
        x: enemy.scaleX ?? 0,
        y: enemy.scaleY ?? 0,
        matchesExpected:
          matchesScale(enemy.scaleX ?? 0, expectedScale) &&
          matchesScale(enemy.scaleY ?? 0, expectedScale),
      },
      pen: {
        inPen: isPenInteriorCell(
          enemy.getGridX?.() ?? enemy.gridX ?? 0,
          enemy.getGridY?.() ?? enemy.gridY ?? 0,
          gridWidth,
          gridHeight,
        ),
        exitingPen: enemy.isExitingPen?.() ?? false,
        atGate: isPenGateCell(
          enemy.getGridX?.() ?? enemy.gridX ?? 0,
          enemy.getGridY?.() ?? enemy.gridY ?? 0,
          gridWidth,
          gridHeight,
        ),
        atExit: isPenExitCell(
          enemy.getGridX?.() ?? enemy.gridX ?? 0,
          enemy.getGridY?.() ?? enemy.gridY ?? 0,
          gridWidth,
          gridHeight,
        ),
      },
      centerline: (() => {
        const enemyGridX = enemy.getGridX?.() ?? enemy.gridX ?? 0;
        const enemyGridY = enemy.getGridY?.() ?? enemy.gridY ?? 0;
        const enemyCenter = getCellCenter(
          enemyGridX,
          enemyGridY,
          tileSize,
          offsetX,
          offsetY,
        );
        return {
          isCentered: isAtCellCenter(
            enemy.x,
            enemy.y,
            enemyGridX,
            enemyGridY,
            tileSize,
            offsetX,
            offsetY,
            centerTolerance,
          ),
          deltaX: enemy.x - enemyCenter.x,
          deltaY: enemy.y - enemyCenter.y,
          tolerance: centerTolerance,
        };
      })(),
    }));
    snapshot.score = gameScene.scoreValue ?? 0;
    snapshot.lives = gameScene.livesValue ?? 0;
    snapshot.level = gameScene.levelValue ?? 0;
    snapshot.collectibles =
      gameScene.collectibleManager?.getCollectibles?.()?.length ?? 0;
    snapshot.pen = getPenGeometry(gridWidth, gridHeight);
    snapshot.hud = {
      score: {
        text: gameScene.scoreText?.text ?? "",
        x: gameScene.scoreText?.x ?? 0,
        y: gameScene.scoreText?.y ?? 0,
        originX: gameScene.scoreText?.originX ?? 0,
        originY: gameScene.scoreText?.originY ?? 0,
      },
      level: {
        text: gameScene.levelText?.text ?? "",
        x: gameScene.levelText?.x ?? 0,
        y: gameScene.levelText?.y ?? 0,
        originX: gameScene.levelText?.originX ?? 0,
        originY: gameScene.levelText?.originY ?? 0,
      },
      highScore: {
        text: gameScene.highScoreText?.text ?? "",
        x: gameScene.highScoreText?.x ?? 0,
        y: gameScene.highScoreText?.y ?? 0,
        originX: gameScene.highScoreText?.originX ?? 0,
        originY: gameScene.highScoreText?.originY ?? 0,
      },
      livesIcons: {
        count: (gameScene.lifeIcons ?? []).length,
        centers: (gameScene.lifeIcons ?? []).map((icon, index: number) => ({
          index,
          x: icon?.x ?? 0,
          y: icon?.y ?? 0,
        })),
      },
    };
    snapshot.scene = gameScene.scene?.key ?? "";
    snapshot.ghostsFrozen = gameScene.ghostsFrozen ?? false;

    return snapshot;
  } catch {
    return {
      activeScenes: [],
      highScore: 0,
      formattedHighScore: "000000",
      transitionState: "idle",
    };
  }
}
