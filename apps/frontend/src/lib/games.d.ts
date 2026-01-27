export interface Game {
  id: string;
  name: string;
  description: string;
  href: string;
  thumbnail: string;
  comingSoon?: boolean;
}
export declare const games: Game[];
