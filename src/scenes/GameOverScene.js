import { GAME_WIDTH, GAME_HEIGHT } from "../config.js";
import { GameState } from "../state/GameState.js";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x200808);
    this.add.text(GAME_WIDTH / 2, 240, "GAME OVER", {
      fontFamily: "Courier New",
      fontSize: "64px",
      color: "#ff4444",
      stroke: "#000000",
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 340, `SCORE ${GameState.get().score}`, {
      fontFamily: "Courier New",
      fontSize: "28px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    const btn = this.add.text(GAME_WIDTH / 2, 450, "[ TRY AGAIN ]", {
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
