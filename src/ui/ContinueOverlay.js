import { GAME_WIDTH, GAME_HEIGHT, CONTINUE_SECONDS } from "../config.js";
import { GameState } from "../state/GameState.js";
import { markAsUI } from "../util/setupZoomCameras.js";

export class ContinueOverlay {
  constructor(scene) {
    this.scene = scene;
    this.root = markAsUI(scene.add.container(0, 0).setScrollFactor(0).setDepth(200).setVisible(false));
    this.timer = CONTINUE_SECONDS;
    this.active = false;
    this.tick = null;

    const dim = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65);
    this.title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, "CONTINUE?", {
      fontFamily: "Courier New",
      fontSize: "48px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.countdown = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, "10", {
      fontFamily: "Courier New",
      fontSize: "64px",
      color: "#ffcc00",
      stroke: "#000000",
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.info = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, "", {
      fontFamily: "Courier New",
      fontSize: "18px",
      color: "#dddddd",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.btnWatch = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, "[ WATCH AD TO CONTINUE ]", {
      fontFamily: "Courier New",
      fontSize: "22px",
      color: "#88ff88",
      backgroundColor: "#113311",
      padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.btnSkip = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 160, "[ GIVE UP ]", {
      fontFamily: "Courier New",
      fontSize: "18px",
      color: "#ff8888",
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.btnWatch.on("pointerdown", () => this.onWatch());
    this.btnSkip.on("pointerdown", () => this.onGiveUp());

    this.root.add([dim, this.title, this.countdown, this.info, this.btnWatch, this.btnSkip]);
  }

  show() {
    const st = GameState.get();
    if (st.continuesLeft <= 0) {
      this.scene.scene.start("GameOver");
      return;
    }
    this.active = true;
    this.timer = CONTINUE_SECONDS;
    this.root.setVisible(true);
    this.info.setText(`Continues left: ${st.continuesLeft}`);
    this.scene.physics.pause();
    this.tick = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timer -= 1;
        this.countdown.setText(String(this.timer));
        if (this.timer <= 0) this.onGiveUp();
      },
    });
    this.countdown.setText(String(this.timer));
  }

  hide() {
    this.active = false;
    this.root.setVisible(false);
    if (this.tick) {
      this.tick.remove(false);
      this.tick = null;
    }
  }

  onWatch() {
    if (!this.active) return;
    this.btnWatch.setText("[ PLAYING AD... ]");
    this.scene.time.delayedCall(1000, () => {
      if (!GameState.useContinue()) {
        this.hide();
        this.scene.scene.start("GameOver");
        return;
      }
      this.hide();
      this.btnWatch.setText("[ WATCH AD TO CONTINUE ]");
      this.scene.physics.resume();
      this.scene.onContinueAccepted();
    });
  }

  onGiveUp() {
    if (!this.active) return;
    this.hide();
    this.scene.physics.resume();
    this.scene.scene.start("GameOver");
  }
}
