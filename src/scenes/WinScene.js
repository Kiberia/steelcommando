import { GAME_WIDTH, GAME_HEIGHT } from "../config.js";
import { GameState } from "../state/GameState.js";

export class WinScene extends Phaser.Scene {
  constructor() {
    super("Win");
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x102010);
    this.add.text(GAME_WIDTH / 2, 220, "MISSION COMPLETE", {
      fontFamily: "Courier New",
      fontSize: "52px",
      color: "#88ff88",
      stroke: "#000000",
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 320, `SCORE ${GameState.get().score}`, {
      fontFamily: "Courier New",
      fontSize: "32px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    const btn = this.add.text(GAME_WIDTH / 2, 440, "[ BACK TO TITLE ]", {
      fontFamily: "Courier New",
      fontSize: "22px",
      color: "#ffcc66",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on("pointerdown", () => this.scene.start("Menu"));
    this.input.keyboard.once("keydown-ENTER", () => this.scene.start("Menu"));
  }
}
