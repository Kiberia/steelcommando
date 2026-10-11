export class Infantry extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "enemy");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(26, 44);
    this.setCollideWorldBounds(true);
    this.hp = 30;
    this.scoreValue = 100;
    this.fireTimer = Phaser.Math.Between(400, 1200);
    this.dir = -1;
    this.setDepth(8);
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
    this.setFlipX(this.dir > 0);

    if (Math.abs(dx) > 80 && Math.abs(dx) < 520) {
      this.setVelocityX(this.dir * 70);
    } else {
      this.setVelocityX(0);
    }

    this.fireTimer -= delta;
    if (this.fireTimer <= 0 && Math.abs(dx) < 560) {
      this.fireTimer = Phaser.Math.Between(900, 1600);
      const ang = this.dir > 0 ? 0 : Math.PI;
      this.scene.spawnEnemyBullet(this.x + this.dir * 18, this.y - 10, ang, 8);
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
