import {
  DEFAULT_STUDIO_GAME_ID,
  getStudioGameById,
  getStudioGames,
} from "./studio-registry";

describe("studio-registry", () => {
  it("returns the shared Neon Cabinet games in suite order", () => {
    expect(getStudioGames().map((game) => game.id)).toEqual([
      "battle-tanks",
      "space-defender",
      "mars-lander",
      "maze-runner",
    ]);
    expect(DEFAULT_STUDIO_GAME_ID).toBe("battle-tanks");
  });

  it("exposes icons and Audio Studio theme tokens for every game", () => {
    for (const game of getStudioGames()) {
      expect(game.icon.svgPath).toBe(
        `apps/${game.id}/public/assets/favicon.svg`,
      );
      expect(game.icon.svgDataUri).toMatch(/^data:image\/svg\+xml,/);
      expect(game.theme.primary).toBeTruthy();
      expect(game.theme.accent).toBeTruthy();
      expect(game.theme.audioGrid).toBeTruthy();
      expect(game.theme.audioPanel).toBeTruthy();
      expect(game.theme.audioLine).toBeTruthy();
    }
  });

  it("returns cloned game registrations", () => {
    const first = getStudioGameById("space-defender");
    const second = getStudioGameById("space-defender");

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});
