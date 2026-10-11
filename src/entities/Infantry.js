import {
  ENEMY_DISPLAY_HEIGHT,
  ENEMY_IDLE_FRAME_W,
  ENEMY_IDLE_FRAME_H,
} from "../config.js";

export class Infantry extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "enemy_idle", 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (this.texture) {
      this.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    const scale = ENEMY_DISPLAY_HEIGHT / ENEMY_IDLE_FRAME_H;
    this.setScale(scale);

    const bodyW = Math.round(ENEMY_IDLE_FRAME_W * 0.42);
    const bodyH = Math.round(ENEMY_IDLE_FRAME_H * 0.68);
    this.body.setSize(bodyW, bodyH);
    this.body.setOffset(
      Math.round((ENEMY_IDLE_FRAME_W - bodyW) / 2),
      Math.round(ENEMY_IDLE_FRAME_H - bodyH - ENEMY_IDLE_FRAME_H * 0.03)
    );

    this.setCollideWorldBounds(true);
    this.hp = 30;
    this.scoreValue = 100;
    this.fireTimer = Phaser.Math.Between(400, 1200);
    this.dir = -1;
    this.setDepth(8);
    this.useSpriteAnim = true;
    this.play("enemy-idle");
  }

  /** Range dummies / placeholder: drop sprite anim and use a simple texture. */
  usePlaceholder(textureKey = "dummy") {
    this.useSpriteAnim = false;
    this.anims.stop();
    this.setTexture(textureKey);
    this.setScale(1);
    this.body.setSize(26, 44);
    this.body.setOffset(5, 6);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;

    const player = this.scene.player;
    if (!player || !player.alive) {
      this.setVelocityX(0);
      return;
    }

    const dx = player.x - this.x;
    this.dir = dx < 0 ? -1 : 1;
    // Sheet faces right; flip when aiming left
    this.setFlipX(this.dir < 0);

    const moving = Math.abs(dx) > 80 && Math.abs(dx) < 520;
    if (moving) {
      this.setVelocityX(this.dir * 70);
    } else {
      this.setVelocityX(0);
    }

    if (this.useSpriteAnim) {
      // Idle-only for now; hold a frame while sliding toward the player
      if (!moving) {
        if (this.anims.currentAnim?.key !== "enemy-idle") {
          this.play("enemy-idle");
        } else if (this.anims.isPaused) {
          this.anims.resume();
        } else if (!this.anims.isPlaying) {
          this.play("enemy-idle");
        }
      } else if (this.anims.isPlaying) {
        this.anims.pause();
      }
    }

    this.fireTimer -= delta;
    if (this.fireTimer <= 0 && Math.abs(dx) < 560) {
      this.fireTimer = Phaser.Math.Between(900, 1600);
      const ang = this.dir > 0 ? 0 : Math.PI;
      const muzzleX = this.x + this.dir * (this.displayWidth * 0.35);
      const muzzleY = this.y - this.displayHeight * 0.12;
      this.scene.spawnEnemyBullet(muzzleX, muzzleY, ang, 8);
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(40, () => {
      if (this.active) this.clearTint();
    });
    if (this.hp <= 0) {
      this.scene.onEnemyKilled(this);
      this.destroy();
      return true;
    }
    return false;
  }
}
