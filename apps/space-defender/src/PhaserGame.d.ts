import Phaser from "phaser";
export interface IRefPhaserGame {
  game: Phaser.Game | undefined;
  scene: Phaser.Scene | undefined;
}
interface IProps {
  currentActiveScene?: (scene_instance: Phaser.Scene) => void;
}
export declare const PhaserGame: import("react").ForwardRefExoticComponent<
  IProps & import("react").RefAttributes<IRefPhaserGame>
>;
export {};
