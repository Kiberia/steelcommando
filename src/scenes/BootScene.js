export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    // Placeholder textures generated at runtime in create()
  }

  create() {
    this.makeTextures();
    this.scene.start("Menu");
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

    rect("player", 36, 52, 0x2c2c2c);
    rect("player_crouch", 40, 34, 0x2c2c2c);
    rect("enemy", 32, 48, 0x3a6b3a);
    rect("turret", 48, 36, 0x4a4a2a);
    rect("heli", 120, 48, 0x555555);
    rect("bullet", 8, 4, 0xfff2a8, 0xaa8800);
    rect("rocket", 16, 8, 0xff5533, 0x881100);
    rect("grenade", 10, 10, 0x336633);
    rect("ground", 64, 64, 0x6b3f22);
    rect("platform", 96, 20, 0x5a4a2a);
    rect("crate_m", 28, 28, 0x2266aa);
    rect("crate_s", 28, 28, 0xaa8822);
    rect("crate_r", 28, 28, 0xaa2222);
    rect("crate_h", 28, 28, 0x22aa44);
    rect("crate_g", 28, 28, 0x88aa22);
    rect("dummy", 36, 56, 0x886644);
    rect("palm", 24, 80, 0x2d6b2d);
    rect("explosion", 48, 48, 0xff8800);
    rect("particle", 4, 4, 0xffcc44);

    g.destroy();
  }
}
