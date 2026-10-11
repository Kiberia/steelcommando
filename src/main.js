import { GAME_WIDTH, GAME_HEIGHT } from "./config.js";
import { BootScene } from "./scenes/BootScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { JungleScene } from "./scenes/JungleScene.js";
import { RangeScene } from "./scenes/RangeScene.js";
import { WinScene } from "./scenes/WinScene.js";
import { GameOverScene } from "./scenes/GameOverScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#4aa3ff",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1800 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, JungleScene, RangeScene, WinScene, GameOverScene],
  input: {
    activePointers: 3,
  },
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
