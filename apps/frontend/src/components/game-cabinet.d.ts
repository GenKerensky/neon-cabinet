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
export declare function GameCabinet({
  children,
  cabinetImage,
  cabinetWidth,
  cabinetHeight,
  screenLeft,
  screenTop,
  screenWidth,
  screenHeight,
  marginTop,
}: GameCabinetProps): import("react/jsx-runtime").JSX.Element;
export {};
