import {
  BATTLE_TANKS_AUDIO_PATCHES,
  SoundPatch,
  SoundPatchCategory,
} from "@neon-cabinet/audio-tools";
import { Button } from "@neon-cabinet/ui/components/ui/button";
import { ScrollArea } from "@neon-cabinet/ui/components/ui/scroll-area";
import { WavesIcon } from "lucide-react";
import { useMemo } from "react";

const CATEGORIES: SoundPatchCategory[] = [
  "Rumble",
  "Weapon",
  "Impact",
  "Explosion",
  "Music Cue",
];

export function PresetBrowser({
  activePatchId,
  onLoadPatch,
}: {
  activePatchId: string;
  onLoadPatch(patch: SoundPatch): void;
}) {
  const groupedPresets = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        patches: BATTLE_TANKS_AUDIO_PATCHES.filter(
          (candidate) => candidate.category === category,
        ),
      })),
    [],
  );

  return (
    <aside className="preset-browser">
      <div className="brand-row">
        <div className="brand-mark">
          <WavesIcon aria-hidden="true" />
        </div>
        <h1>Audio Studio</h1>
      </div>
      <ScrollArea className="preset-scroll">
        {groupedPresets.map(({ category, patches }) => (
          <section className="preset-section" key={category}>
            <h2>{category}</h2>
            <div className="preset-list">
              {patches.map((preset) => (
                <Button
                  className={
                    preset.id === activePatchId ? "preset active" : "preset"
                  }
                  key={preset.id}
                  onClick={() => onLoadPatch(preset)}
                  type="button"
                  variant="outline"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </section>
        ))}
      </ScrollArea>
    </aside>
  );
}
