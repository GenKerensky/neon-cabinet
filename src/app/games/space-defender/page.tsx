"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { IRefPhaserGame } from "@/games/space-defender/PhaserGame";

const PhaserGame = dynamic(
  () =>
    import("@/games/space-defender/PhaserGame").then((mod) => ({
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
    <div className="flex h-[calc(100vh-3.5rem)] w-full items-center justify-center [&_#phaser-game]:h-full [&_#phaser-game]:max-h-[768px]">
      <PhaserGame ref={phaserRef} currentActiveScene={onCurrentActiveScene} />
    </div>
  );
}
