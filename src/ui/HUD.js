import { GAME_WIDTH, PLAYER_MAX_HP } from "../config.js";
import { WEAPONS } from "../weapons/WeaponDefs.js";
import { GameState } from "../state/GameState.js";
import { markAsUI } from "../util/setupZoomCameras.js";

export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.root = markAsUI(scene.add.container(0, 0).setScrollFactor(0).setDepth(100));

    this.scoreText = scene.add.text(24, 16, "SCORE 0", {
      fontFamily: "Courier New",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });

    this.ammoText = scene.add.text(GAME_WIDTH - 24, 16, "AMMO --", {
      fontFamily: "Courier New",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(1, 0);

    this.weaponText = scene.add.text(GAME_WIDTH - 24, 42, "", {
      fontFamily: "Courier New",
      fontSize: "16px",
      color: "#ffdd66",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(1, 0).setVisible(false);

    this.livesText = scene.add.text(24, 42, "LIVES 3", {
      fontFamily: "Courier New",
      fontSize: "16px",
      color: "#ffaaaa",
      stroke: "#000000",
      strokeThickness: 3,
    });

    this.hpBg = scene.add.rectangle(GAME_WIDTH / 2, 28, 320, 18, 0x222222, 0.85).setStrokeStyle(2, 0x000000);
    this.hpFill = scene.add.rectangle(GAME_WIDTH / 2 - 158, 28, 316, 14, 0xe63900, 1).setOrigin(0, 0.5);

    this.bossBg = scene.add.rectangle(GAME_WIDTH / 2, 58, 400, 12, 0x222222, 0.9).setStrokeStyle(2, 0x000000).setVisible(false);
    this.bossFill = scene.add.rectangle(GAME_WIDTH / 2 - 198, 58, 396, 8, 0xffcc00, 1).setOrigin(0, 0.5).setVisible(false);
    this.bossLabel = scene.add.text(GAME_WIDTH / 2, 72, "BOSS", {
      fontFamily: "Courier New",
      fontSize: "14px",
      color: "#ffcc00",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setVisible(false);

    this.root.add([
      this.scoreText, this.ammoText, this.weaponText, this.livesText,
      this.hpBg, this.hpFill, this.bossBg, this.bossFill, this.bossLabel,
    ]);
  }

  showBossBar(show) {
    this.bossBg.setVisible(show);
    this.bossFill.setVisible(show);
    this.bossLabel.setVisible(show);
  }

  setBossHp(ratio) {
    this.bossFill.width = Math.max(0, 396 * ratio);
  }

  update() {
    const st = GameState.get();
    const def = WEAPONS[st.weaponId] || WEAPONS.pistol;
    const isPistol = st.weaponId === "pistol";
    this.scoreText.setText(`SCORE ${st.score}`);
    this.livesText.setText(`LIVES ${st.lives}`);
    // Default handgun is always available — only show special weapons
    this.weaponText.setVisible(!isPistol);
    this.weaponText.setText(isPistol ? "" : def.label);
    this.ammoText.setText(isPistol ? `G ${st.grenades}` : `AMMO ${st.ammo}  G ${st.grenades}`);
    this.hpFill.width = Math.max(0, 316 * (st.hp / PLAYER_MAX_HP));
    const r = st.hp / PLAYER_MAX_HP;
    this.hpFill.fillColor = r > 0.5 ? 0xe63900 : r > 0.25 ? 0xff8800 : 0xff2222;
  }
}
