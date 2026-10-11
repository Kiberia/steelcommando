import { GAME_WIDTH, GAME_HEIGHT } from "../config.js";
import { GameState } from "../state/GameState.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a2a1a);
    for (let i = 0; i < 12; i++) {
      this.add.image(80 + i * 110, GAME_HEIGHT - 40, "palm").setAlpha(0.35).setScale(1.2);
    }

    this.add.text(GAME_WIDTH / 2, 160, "STEEL COMMANDO", {
      fontFamily: "Courier New",
      fontSize: "64px",
      color: "#f0f0f0",
      stroke: "#000000",
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 230, "OLD-SCHOOL RUN AND GUN", {
      fontFamily: "Courier New",
      fontSize: "20px",
      color: "#ffcc66",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    const play = this.makeButton(GAME_WIDTH / 2, 360, "[ PLAY JUNGLE ]", "#88ff88", () => {
      GameState.resetRun();
      this.scene.start("Jungle");
    });

    const range = this.makeButton(GAME_WIDTH / 2, 430, "[ WEAPON RANGE ]", "#88ccff", () => {
      this.scene.start("Range");
    });

    this.add.text(GAME_WIDTH / 2, 540, "Z/Space Fire · X Jump · C Grenade · Arrows/WASD Move · Up Aim", {
      fontFamily: "Courier New",
      fontSize: "15px",
      color: "#cccccc",
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [play, range],
      alpha: 0.45,
      duration: 550,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once("keydown-ENTER", () => {
      GameState.resetRun();
      this.scene.start("Jungle");
    });
  }

  makeButton(x, y, label, color, onClick) {
    const btn = this.add.text(x, y, label, {
      fontFamily: "Courier New",
      fontSize: "26px",
      color,
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on("pointerdown", onClick);
    return btn;
  }
}
