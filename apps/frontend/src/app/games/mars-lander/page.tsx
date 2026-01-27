"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { Scene } from "phaser";
import type { IRefPhaserGame } from "mars-lander";
import { GameView } from "../../../components/game-view";

const PhaserGame = dynamic(
  () =>
    import("mars-lander").then((mod) => ({
      default: mod.PhaserGame,
    })),
  { ssr: false },
);

export default function MarsLanderPage() {
  const phaserRef = useRef<IRefPhaserGame>({
    game: undefined,
    scene: undefined,
  });

  const onCurrentActiveScene = (_scene: Scene) => {
    // Scene ready; can use for React bridge if needed.
  };

  return (
    <GameView>
      <PhaserGame ref={phaserRef} currentActiveScene={onCurrentActiveScene} />
    </GameView>
  );
}
