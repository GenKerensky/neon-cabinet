"use client";

import Image from "next/image";
import type { ReactNode } from "react";

interface GameCabinetProps {
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

export function GameCabinet({
  children,
  cabinetImage = "/assets/arcade-cabinet.png",
  cabinetWidth = 2552,
  cabinetHeight = 3426,
  screenLeft = 768,
  screenTop = 370,
  screenWidth = 1024,
  screenHeight = 768,
  marginTop = "-6%",
}: GameCabinetProps) {
  const cabinetAspect = cabinetWidth / cabinetHeight;

  // Convert to percentages for responsive positioning
  const screenLeftPercent = (screenLeft / cabinetWidth) * 100;
  const screenTopPercent = (screenTop / cabinetHeight) * 100;
  const screenWidthPercent = (screenWidth / cabinetWidth) * 100;
  const screenHeightPercent = (screenHeight / cabinetHeight) * 100;

  return (
    <div className="relative flex h-[calc(100vh-4rem)] items-start justify-center overflow-hidden">
      {/* Cabinet container - rendered at 1:1 scale, shrinks only when hitting screen width */}
      <div
        className="relative flex-shrink-0"
        style={{
          width: `${cabinetWidth}px`,
          maxWidth: "100vw",
          aspectRatio: `${cabinetAspect}`,
          marginTop,
        }}
      >
        {/* Game canvas - positioned in screen area */}
        <div
          className="absolute z-10 overflow-hidden"
          style={{
            top: `${screenTopPercent}%`,
            left: `${screenLeftPercent}%`,
            width: `${screenWidthPercent}%`,
            height: `${screenHeightPercent}%`,
          }}
        >
          <div className="flex h-full w-full items-center justify-center [&_#phaser-game]:h-full [&_#phaser-game]:w-full [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:object-fill">
            {children}
          </div>
        </div>

        {/* Cabinet overlay - on top of game */}
        <Image
          src={cabinetImage}
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
