"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { Scene } from "phaser";
import { GameView } from "../../../components/game-view";
import type { IRefPhaserGame } from "battle-tanks";

const PhaserGame = dynamic(
  () =>
    import("battle-tanks").then((mod) => ({
      default: mod.PhaserGame,
    })),
  { ssr: false },
);

export default function BattleTanksPage() {
  const phaserRef = useRef<IRefPhaserGame>({
    game: undefined,
    scene: undefined,
  });

  const onCurrentActiveScene = (_scene: Scene) => {
    // Scene ready
  };

  return (
    <GameView>
      <PhaserGame ref={phaserRef} currentActiveScene={onCurrentActiveScene} />
    </GameView>
  );
}
