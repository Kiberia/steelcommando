import { GAME_WIDTH, GAME_HEIGHT } from "../config.js";
import { markAsUI } from "../util/setupZoomCameras.js";

export class TouchControls {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.root = markAsUI(scene.add.container(0, 0).setScrollFactor(0).setDepth(110));

    const alpha = 0.35;
    const baseY = GAME_HEIGHT - 110;

    this.pad = scene.add.circle(110, baseY, 70, 0x888888, alpha).setStrokeStyle(3, 0xffffff, 0.5);
    this.knob = scene.add.circle(110, baseY, 28, 0xcccccc, 0.5);
    this.padCenter = { x: 110, y: baseY };

    this.btnFire = this.makeBtn(GAME_WIDTH - 110, baseY, 56, 0xd62828, "FIRE");
    this.btnJump = this.makeBtn(GAME_WIDTH - 230, baseY + 10, 42, 0x2a6fdb, "JUMP");
    this.btnGrenade = this.makeBtn(GAME_WIDTH - 200, baseY - 70, 36, 0x2d6b2d, "G");

    this.root.add([this.pad, this.knob, this.btnFire.circle, this.btnFire.label, this.btnJump.circle, this.btnJump.label, this.btnGrenade.circle, this.btnGrenade.label]);

    this.padPointerId = null;
    this.setupPad();
    this.setupButton(this.btnFire, "fire", false);
    this.setupButton(this.btnJump, "jump", true);
    this.setupButton(this.btnGrenade, "grenade", true);
  }

  makeBtn(x, y, r, color, text) {
    const circle = this.scene.add.circle(x, y, r, color, 0.4).setStrokeStyle(3, 0xffffff, 0.55);
    const label = this.scene.add.text(x, y, text, {
      fontFamily: "Courier New",
      fontSize: r > 45 ? "20px" : "14px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);
    return { circle, label, x, y, r };
  }

  setupPad() {
    this.pad.setInteractive({ draggable: false, useHandCursor: true });
    this.scene.input.on("pointerdown", (p) => {
      if (this.padPointerId !== null) return;
      const d = Phaser.Math.Distance.Between(p.x, p.y, this.padCenter.x, this.padCenter.y);
      if (d <= 90) {
        this.padPointerId = p.id;
        this.updatePad(p);
      }
    });
    this.scene.input.on("pointermove", (p) => {
      if (p.id === this.padPointerId) this.updatePad(p);
    });
    this.scene.input.on("pointerup", (p) => {
      if (p.id === this.padPointerId) {
        this.padPointerId = null;
        this.knob.setPosition(this.padCenter.x, this.padCenter.y);
        this.player.setTouchState({ left: false, right: false, up: false, down: false });
      }
    });
  }

  updatePad(p) {
    const dx = p.x - this.padCenter.x;
    const dy = p.y - this.padCenter.y;
    const len = Math.hypot(dx, dy) || 1;
    const max = 48;
    const clamped = Math.min(len, max);
    this.knob.setPosition(this.padCenter.x + (dx / len) * clamped, this.padCenter.y + (dy / len) * clamped);

    const dead = 18;
    this.player.setTouchState({
      left: dx < -dead,
      right: dx > dead,
      up: dy < -dead,
      down: dy > dead,
    });
  }

  setupButton(btn, action, pulse) {
    btn.circle.setInteractive({ useHandCursor: true });
    btn.circle.on("pointerdown", () => {
      if (pulse) {
        const key = action === "jump" ? "jumpPulse" : "grenadePulse";
        this.player.setTouchState({ [key]: true });
      } else {
        this.player.setTouchState({ [action]: true });
      }
      btn.circle.setAlpha(0.7);
      if (navigator.vibrate) navigator.vibrate(12);
    });
    const release = () => {
      if (!pulse) this.player.setTouchState({ [action]: false });
      btn.circle.setAlpha(0.4);
    };
    btn.circle.on("pointerup", release);
    btn.circle.on("pointerout", release);
  }
}
