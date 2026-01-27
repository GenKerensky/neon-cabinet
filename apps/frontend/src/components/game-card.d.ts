import type { Game } from "../lib/games";
interface GameCardProps {
  game: Game;
  index?: number;
}
export declare function GameCard({
  game,
  index,
}: GameCardProps): import("react/jsx-runtime").JSX.Element;
export {};
