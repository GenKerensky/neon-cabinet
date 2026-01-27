import { describe, it, expect } from "vitest";
import { games, type Game } from "./games";

describe("games", () => {
  describe("games array", () => {
    it("should be an array", () => {
      expect(Array.isArray(games)).toBe(true);
    });

    it("should have at least one game", () => {
      expect(games.length).toBeGreaterThan(0);
    });

    it("should contain all required game properties", () => {
      games.forEach((game) => {
        expect(game).toHaveProperty("id");
        expect(game).toHaveProperty("name");
        expect(game).toHaveProperty("description");
        expect(game).toHaveProperty("href");
        expect(game).toHaveProperty("thumbnail");
        expect(typeof game.id).toBe("string");
        expect(typeof game.name).toBe("string");
        expect(typeof game.description).toBe("string");
        expect(typeof game.href).toBe("string");
        expect(typeof game.thumbnail).toBe("string");
      });
    });

    it("should have unique game IDs", () => {
      const ids = games.map((game) => game.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have space-defender game", () => {
      const spaceDefender = games.find((game) => game.id === "space-defender");
      expect(spaceDefender).toBeDefined();
      expect(spaceDefender?.name).toBe("Space Defender");
    });

    it("should have battle-tanks game", () => {
      const battleTanks = games.find((game) => game.id === "battle-tanks");
      expect(battleTanks).toBeDefined();
      expect(battleTanks?.name).toBe("Battle Tanks");
    });

    it("should have mars-lander game", () => {
      const marsLander = games.find((game) => game.id === "mars-lander");
      expect(marsLander).toBeDefined();
      expect(marsLander?.name).toBe("Mars Lander");
    });

    it("should have comingSoon property for future games", () => {
      const comingSoonGames = games.filter((game) => game.comingSoon === true);
      expect(comingSoonGames.length).toBeGreaterThan(0);
      comingSoonGames.forEach((game) => {
        expect(game.href).toBe("#");
      });
    });

    it("should have valid hrefs for available games", () => {
      const availableGames = games.filter((game) => !game.comingSoon);
      availableGames.forEach((game) => {
        expect(game.href).toMatch(/^\/games\//);
      });
    });

    it("should have valid thumbnail paths", () => {
      games.forEach((game) => {
        expect(game.thumbnail).toMatch(/^\/assets\//);
        expect(game.thumbnail).toMatch(/\.png$/);
      });
    });
  });

  describe("Game type", () => {
    it("should match the Game interface structure", () => {
      const sampleGame: Game = games[0];
      expect(sampleGame).toHaveProperty("id");
      expect(sampleGame).toHaveProperty("name");
      expect(sampleGame).toHaveProperty("description");
      expect(sampleGame).toHaveProperty("href");
      expect(sampleGame).toHaveProperty("thumbnail");
    });
  });
});
