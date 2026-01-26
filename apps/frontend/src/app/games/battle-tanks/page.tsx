"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { IRefPhaserGame } from "@neon-cabinet/battle-tanks";
import { GameView } from "../../../components/game-view";

const PhaserGame = dynamic(
  () =>
    import("@neon-cabinet/battle-tanks").then((mod) => ({
      default: mod.PhaserGame,
    })),
  { ssr: false },
);

export default function BattleTanksPage() {
  const phaserRef = useRef<IRefPhaserGame>({
    game: undefined,
    scene: undefined,
  });

  const onCurrentActiveScene = (_scene: Phaser.Scene) => {
    // Scene ready
  };

  return (
    <GameView>
      <PhaserGame ref={phaserRef} currentActiveScene={onCurrentActiveScene} />
    </GameView>
  );
}
