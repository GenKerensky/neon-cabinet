import {
  AudioStudioGameRegistration,
  SoundPatch,
  SoundPatchCategory,
} from "@neon-cabinet/audio-tools";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import { ScrollArea } from "@neon-cabinet/ui/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@neon-cabinet/ui/components/ui/select";
import { ChevronRightIcon, WavesIcon } from "lucide-react";
import { useMemo, useState } from "react";

const CATEGORIES: SoundPatchCategory[] = [
  "Rumble",
  "Weapon",
  "Impact",
  "Explosion",
  "Music Cue",
];

export function PresetBrowser({
  activePatchId,
  games,
  onLoadPatch,
  onSelectGame,
  selectedGame,
  selectedGameId,
}: {
  activePatchId: string;
  games: AudioStudioGameRegistration[];
  onLoadPatch(patch: SoundPatch): void;
  onSelectGame(gameId: string): void;
  selectedGame: AudioStudioGameRegistration;
  selectedGameId: string;
}) {
  const [openCategories, setOpenCategories] = useState<
    Record<SoundPatchCategory, boolean>
  >({
    Explosion: true,
    Impact: true,
    "Music Cue": true,
    Rumble: true,
    Weapon: true,
  });
  const groupedPresets = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        patches: selectedGame.effects.filter(
          (candidate) => candidate.category === category,
        ),
      })),
    [selectedGame.effects],
  );

  return (
    <aside className="preset-browser">
      <div className="brand-block">
        <div className="brand-row">
          <div className="brand-mark">
            <WavesIcon aria-hidden="true" />
          </div>
          <h1>Audio Studio</h1>
        </div>
        <Select onValueChange={onSelectGame} value={selectedGameId}>
          <SelectTrigger aria-label="Select game" className="game-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {games.map((game) => (
              <SelectItem key={game.id} value={game.id}>
                <span className="game-option">
                  <img alt="" src={game.icon.svgDataUri} />
                  {game.title}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="preset-scroll">
        <div aria-label="Sound preset tree" className="preset-tree" role="tree">
          {groupedPresets.map(({ category, patches }) => {
            const isOpen = openCategories[category];
            return (
              <section className="preset-tree-section" key={category}>
                <button
                  aria-expanded={isOpen}
                  className="preset-tree-category"
                  onClick={() =>
                    setOpenCategories((current) => ({
                      ...current,
                      [category]: !current[category],
                    }))
                  }
                  role="treeitem"
                  type="button"
                >
                  <ChevronRightIcon aria-hidden="true" />
                  {category}
                </button>
                {isOpen ? (
                  <div className="preset-tree-children" role="group">
                    {patches.length > 0 ? (
                      patches.map((preset) => (
                        <Button
                          className={
                            preset.id === activePatchId
                              ? "preset active"
                              : "preset"
                          }
                          key={preset.id}
                          onClick={() => onLoadPatch(preset)}
                          type="button"
                          variant="outline"
                        >
                          {preset.name}
                        </Button>
                      ))
                    ) : (
                      <Button
                        className="preset empty"
                        disabled
                        type="button"
                        variant="outline"
                      >
                        No {category.toLowerCase()} effects
                      </Button>
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
