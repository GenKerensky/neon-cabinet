import { useRef } from "react";
import type { Scene } from "phaser";
import { PhaserGame, type IRefPhaserGame } from "./PhaserGame";

function App() {
  const phaserRef = useRef<IRefPhaserGame>({
    game: undefined,
    scene: undefined,
  });

  const onCurrentActiveScene = (_scene: Scene) => {
    // Scene ready
  };

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      <PhaserGame ref={phaserRef} currentActiveScene={onCurrentActiveScene} />
    </div>
  );
}

export default App;
