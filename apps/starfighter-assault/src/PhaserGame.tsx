import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import type { Game, Scene } from "phaser";
import { EventBus } from "./game/EventBus";
import { initializeGame } from "./game/main";

export interface IRefPhaserGame {
  game: Game | undefined;
  scene: Scene | undefined;
}

interface IProps {
  currentActiveScene?: (scene: Scene) => void;
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(
  function PhaserGame({ currentActiveScene }, ref) {
    const game = useRef<Game | undefined>(undefined);

    useLayoutEffect(() => {
      if (game.current === undefined) {
        const phaserGame = initializeGame();
        game.current = phaserGame;

        if (typeof ref === "function") {
          ref({ game: game.current, scene: undefined });
        } else if (ref) {
          ref.current = { game: game.current, scene: undefined };
        }
      }

      return () => {
        if (game.current) {
          game.current.destroy(true);
          game.current = undefined;
        }
      };
    }, [ref]);

    useEffect(() => {
      const handleSceneReady = (sceneInstance: Scene) => {
        currentActiveScene?.(sceneInstance);

        if (typeof ref === "function") {
          ref({ game: game.current, scene: sceneInstance });
        } else if (ref) {
          ref.current = { game: game.current, scene: sceneInstance };
        }
      };

      EventBus.on("current-scene-ready", handleSceneReady);

      return () => {
        EventBus.removeListener("current-scene-ready", handleSceneReady);
      };
    }, [currentActiveScene, ref]);

    return (
      <div
        id="phaser-game"
        tabIndex={0}
        style={{ outline: "none", fontFamily: "Orbitron, sans-serif" }}
        onMouseDown={(event) => {
          event.currentTarget.focus();
        }}
      />
    );
  },
);
