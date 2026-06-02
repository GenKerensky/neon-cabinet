"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { Scene } from "phaser";
import { GameView } from "../../../components/game-view";
import type { IRefPhaserGame } from "maze-runner";

const PhaserGame = dynamic(
  () =>
    import("maze-runner").then((mod) => ({
      default: mod.PhaserGame,
    })),
  { ssr: false },
);

export default function MazeRunnerPage() {
  const phaserRef = useRef<IRefPhaserGame>({
    game: undefined,
    scene: undefined,
  });

  const onCurrentActiveScene = (_scene: Scene) => {
    // Scene ready; can use for React bridge if needed.
  };

  return (
    <GameView>
      <PhaserGame
        ref={phaserRef}
        assetBaseUrl="/maze-runner-assets"
        currentActiveScene={onCurrentActiveScene}
      />
    </GameView>
  );
}
