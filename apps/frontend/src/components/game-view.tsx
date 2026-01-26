"use client";

import { useState } from "react";
import { GameCabinet } from "./game-cabinet";
import { Button } from "./ui/button";
import type { ReactNode } from "react";

interface GameViewProps {
  children: ReactNode;
  cabinetImage?: string;
  cabinetWidth?: number;
  cabinetHeight?: number;
  screenLeft?: number;
  screenTop?: number;
  screenWidth?: number;
  screenHeight?: number;
  marginTop?: string;
}

export function GameView({
  children,
  cabinetImage,
  cabinetWidth,
  cabinetHeight,
  screenLeft,
  screenTop,
  screenWidth,
  screenHeight,
  marginTop,
}: GameViewProps) {
  const [showCabinet, setShowCabinet] = useState(false);

  if (showCabinet) {
    return (
      <div className="relative">
        <Button
          onClick={() => setShowCabinet(false)}
          variant="secondary"
          size="sm"
          className="absolute right-4 top-4 z-30"
        >
          Hide Cabinet
        </Button>
        <GameCabinet
          cabinetImage={cabinetImage}
          cabinetWidth={cabinetWidth}
          cabinetHeight={cabinetHeight}
          screenLeft={screenLeft}
          screenTop={screenTop}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          marginTop={marginTop}
        >
          {children}
        </GameCabinet>
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)] items-center justify-center">
      <Button
        onClick={() => setShowCabinet(true)}
        variant="secondary"
        size="sm"
        className="absolute right-4 top-4 z-30"
      >
        Show Cabinet
      </Button>
      <div className="flex h-full w-full max-h-[768px] max-w-[1024px] items-center justify-center [&_#phaser-game]:h-full [&_#phaser-game]:w-full [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:object-fill">
        {children}
      </div>
    </div>
  );
}
