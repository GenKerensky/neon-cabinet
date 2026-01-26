"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { GameView } from "../../../components/game-view";
import type { IRefPhaserGame } from "@neon-cabinet/space-defender";

const PhaserGame = dynamic(
  () =>
    import("@neon-cabinet/space-defender").then((mod) => ({
      default: mod.PhaserGame,
    })),
  { ssr: false },
);

export default function SpaceDefenderPage() {
  const phaserRef = useRef<IRefPhaserGame>({
    game: undefined,
    scene: undefined,
  });

  const onCurrentActiveScene = (_scene: Phaser.Scene) => {
    // Scene ready; can use for React bridge if needed.
  };

  return (
    <GameView>
      <PhaserGame ref={phaserRef} currentActiveScene={onCurrentActiveScene} />
    </GameView>
  );
}
