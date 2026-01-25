import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Game } from "@/lib/games";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Link href={game.href} className="block group">
      <Card className="overflow-hidden border-border/60 bg-card/80 transition-all duration-200 hover:scale-[1.02] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <Image
            src={game.thumbnail}
            alt={game.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <CardHeader>
          <CardTitle className="text-foreground transition-colors group-hover:text-primary">
            {game.name}
          </CardTitle>
          <CardDescription>{game.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
