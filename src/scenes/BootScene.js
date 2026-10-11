import {
  PLAYER_DISPLAY_HEIGHT,
  PLAYER_IDLE_FRAME_W,
  PLAYER_IDLE_FRAME_H,
  ENEMY_IDLE_FRAME_W,
  ENEMY_IDLE_FRAME_H,
  EXPLOSION_FRAME_W,
  EXPLOSION_FRAME_H,
} from "../config.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    // Full-res sheets (do not substitute the tiny nearest-neighbor bake)
    this.load.spritesheet("player_idle", "assets/hero/hero_idle_loop_sheet.png", {
      frameWidth: PLAYER_IDLE_FRAME_W,
      frameHeight: PLAYER_IDLE_FRAME_H,
    });
    this.load.spritesheet("player_walk", "assets/hero/hero_walk_loop_sheet.png", {
      frameWidth: PLAYER_IDLE_FRAME_W,
      frameHeight: PLAYER_IDLE_FRAME_H,
    });
    this.load.spritesheet("enemy_idle", "assets/enemy/enemy_idle_loop_sheet.png", {
      frameWidth: ENEMY_IDLE_FRAME_W,
      frameHeight: ENEMY_IDLE_FRAME_H,
    });
    this.load.image("bullet", "assets/hero/projectile.png");
    this.load.image("rocket", "assets/hero/rocket_projectile.png");
    this.load.image("grenade", "assets/hero/grenade.png");
    this.load.spritesheet("explosion", "assets/hero/explosion.png", {
      frameWidth: EXPLOSION_FRAME_W,
      frameHeight: EXPLOSION_FRAME_H,
    });
    for (let i = 1; i <= 5; i++) {
      this.load.image(`plx-${i}`, `assets/map/l1_jungle/background/plx-${i}.png`);
    }
  }

  create() {
    // Smooth downscale in-game — keeps source pixels; only filtering changes
    for (const key of ["player_idle", "player_walk", "enemy_idle", "bullet", "rocket", "grenade", "explosion"]) {
      const tex = this.textures.get(key);
      if (tex) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    this.upscaleParallaxLayers(4);
    this.makeTextures();
    this.createAnims();
    this.scene.start("Menu");
  }

  /** Smooth-upscale tiny plx tiles so world scale isn't a harsh pixel stretch. */
  upscaleParallaxLayers(scale) {
    for (let i = 1; i <= 5; i++) {
      const key = `plx-${i}`;
      if (!this.textures.exists(key)) continue;
      const src = this.textures.get(key).getSourceImage();
      const w = src.width * scale;
      const h = src.height * scale;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(src, 0, 0, w, h);

      this.textures.remove(key);
      this.textures.addCanvas(key, canvas);
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
  }

  createAnims() {
    if (!this.anims.exists("player-idle")) {
      this.anims.create({
        key: "player-idle",
        frames: this.anims.generateFrameNumbers("player_idle", { start: 0, end: 4 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists("player-walk")) {
      this.anims.create({
        key: "player-walk",
        frames: this.anims.generateFrameNumbers("player_walk", { start: 0, end: 9 }),
        frameRate: 12,
        repeat: -1,
      });
    }
    if (!this.anims.exists("enemy-idle")) {
      this.anims.create({
        key: "enemy-idle",
        frames: this.anims.generateFrameNumbers("enemy_idle", { start: 0, end: 4 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists("explosion-burst")) {
      this.anims.create({
        key: "explosion-burst",
        frames: this.anims.generateFrameNumbers("explosion", { start: 0, end: 7 }),
        frameRate: 16,
        repeat: 0,
      });
    }
  }

  makeTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const rect = (key, w, h, color, outline = 0x111111) => {
      g.clear();
      g.fillStyle(color, 1);
      g.fillRect(0, 0, w, h);
      g.lineStyle(2, outline, 1);
      g.strokeRect(1, 1, w - 2, h - 2);
      g.generateTexture(key, w, h);
    };

    const dispW = Math.round(PLAYER_IDLE_FRAME_W * (PLAYER_DISPLAY_HEIGHT / PLAYER_IDLE_FRAME_H));
    // Fallback / physics reference size (idle sheet is the real look)
    rect("player", dispW, PLAYER_DISPLAY_HEIGHT, 0x2c2c2c);
    rect("player_crouch", 40, 34, 0x2c2c2c);
    rect("enemy", 32, 48, 0x3a6b3a);
    rect("turret", 48, 36, 0x4a4a2a);
    rect("heli", 120, 48, 0x555555);
    rect("ground", 64, 64, 0x6b3f22);
    rect("platform", 96, 20, 0x5a4a2a);
    rect("crate_m", 28, 28, 0x2266aa);
    rect("crate_s", 28, 28, 0xaa8822);
    rect("crate_r", 28, 28, 0xaa2222);
    rect("crate_h", 28, 28, 0x22aa44);
    rect("crate_g", 28, 28, 0x88aa22);
    rect("dummy", 36, 56, 0x886644);
    rect("palm", 24, 80, 0x2d6b2d);
    rect("particle", 4, 4, 0xffcc44);

    g.destroy();
  }
}
