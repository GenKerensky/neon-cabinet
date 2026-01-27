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
export declare function GameView({
  children,
  cabinetImage,
  cabinetWidth,
  cabinetHeight,
  screenLeft,
  screenTop,
  screenWidth,
  screenHeight,
  marginTop,
}: GameViewProps): import("react/jsx-runtime").JSX.Element;
export {};
