export class Turret extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "turret");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.hp = 50;
    this.scoreValue = 250;
    this.fireTimer = 600;
    this.setDepth(7);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    const player = this.scene.player;
    if (!player || !player.alive) return;

    this.fireTimer -= delta;
    if (this.fireTimer <= 0 && Math.abs(player.x - this.x) < 640) {
      this.fireTimer = 700;
      const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y - 10);
      this.scene.spawnEnemyBullet(this.x, this.y - 4, ang, 10);
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
      this.scene.spawnExplosion(this.x, this.y);
      this.destroy();
      return true;
    }
    return false;
  }
}
