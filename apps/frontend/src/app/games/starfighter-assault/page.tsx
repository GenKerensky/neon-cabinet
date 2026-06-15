"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { Scene } from "phaser";
import { GameView } from "../../../components/game-view";
import type { IRefPhaserGame } from "starfighter-assault";

const PhaserGame = dynamic(
  () =>
    import("starfighter-assault").then((mod) => ({
      default: mod.PhaserGame,
    })),
  { ssr: false },
);

export default function StarfighterAssaultPage() {
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
