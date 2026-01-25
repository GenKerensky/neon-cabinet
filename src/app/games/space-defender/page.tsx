"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef } from "react";
import type { IRefPhaserGame } from "@/games/space-defender/PhaserGame";

const PhaserGame = dynamic(
  () =>
    import("@/games/space-defender/PhaserGame").then((mod) => ({
      default: mod.PhaserGame,
    })),
  { ssr: false },
);

// Cabinet image dimensions (actual PNG size)
const CABINET_WIDTH = 2552;
const CABINET_HEIGHT = 3426;
const CABINET_ASPECT = CABINET_WIDTH / CABINET_HEIGHT;

// Game screen dimensions (exactly 1024x768 within the cabinet)
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 768;

// Screen position within cabinet (pixels from cabinet image)
// Screen is horizontally centered: (2552 - 1024) / 2 = 764
const SCREEN_LEFT_PX = 768;
// Screen top position (estimated from image)
const SCREEN_TOP_PX = 370;

// Convert to percentages for responsive positioning
const SCREEN_LEFT = (SCREEN_LEFT_PX / CABINET_WIDTH) * 100;
const SCREEN_TOP = (SCREEN_TOP_PX / CABINET_HEIGHT) * 100;
const SCREEN_WIDTH = (GAME_WIDTH / CABINET_WIDTH) * 100;
const SCREEN_HEIGHT = (GAME_HEIGHT / CABINET_HEIGHT) * 100;

export default function SpaceDefenderPage() {
  const phaserRef = useRef<IRefPhaserGame>({
    game: undefined,
    scene: undefined,
  });

  const onCurrentActiveScene = (_scene: Phaser.Scene) => {
    // Scene ready; can use for React bridge if needed.
  };

  return (
    <div className="relative flex h-[calc(100vh-4rem)] items-start justify-center overflow-hidden">
      {/* Cabinet container - rendered at 1:1 scale, shrinks only when hitting screen width */}
      <div
        className="relative flex-shrink-0"
        style={{
          width: `${CABINET_WIDTH}px`,
          maxWidth: "100vw",
          aspectRatio: `${CABINET_ASPECT}`,
          marginTop: "-6%",
        }}
      >
        {/* Game canvas - positioned in screen area */}
        <div
          className="absolute z-10 overflow-hidden"
          style={{
            top: `${SCREEN_TOP}%`,
            left: `${SCREEN_LEFT}%`,
            width: `${SCREEN_WIDTH}%`,
            height: `${SCREEN_HEIGHT}%`,
          }}
        >
          <div className="flex h-full w-full items-center justify-center [&_#phaser-game]:h-full [&_#phaser-game]:w-full [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:object-fill">
            <PhaserGame
              ref={phaserRef}
              currentActiveScene={onCurrentActiveScene}
            />
          </div>
        </div>

        {/* Cabinet overlay - on top of game */}
        <Image
          src="/assets/arcade-cabinet.png"
          alt="Arcade Cabinet"
          fill
          priority
          unoptimized
          className="pointer-events-none z-20 object-contain object-top"
        />
      </div>
    </div>
  );
}
