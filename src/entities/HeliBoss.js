export class HeliBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "heli");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.hp = 400;
    this.maxHp = 400;
    this.scoreValue = 5000;
    this.phase = 0;
    this.fireTimer = 500;
    this.hoverY = y;
    this.baseX = x;
    this.setDepth(12);
    this.activeBoss = true;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active || !this.activeBoss) return;

    const t = time / 1000;
    this.y = this.hoverY + Math.sin(t * 2.2) * 36;
    this.x = this.baseX + Math.sin(t * 0.7) * 140;

    const player = this.scene.player;
    if (!player || !player.alive) return;

    this.fireTimer -= delta;
    if (this.fireTimer <= 0) {
      this.phase = (this.phase + 1) % 3;
      if (this.phase === 0) {
        this.fireTimer = 450;
        const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.scene.spawnEnemyBullet(this.x - 40, this.y + 10, ang, 12);
      } else if (this.phase === 1) {
        this.fireTimer = 600;
        for (let i = -2; i <= 2; i++) {
          this.scene.spawnEnemyBullet(this.x, this.y + 16, Math.PI / 2 + i * 0.18, 10);
        }
      } else {
        this.fireTimer = 900;
        this.scene.spawnEnemyBullet(this.x - 50, this.y + 8, Math.PI * 0.85, 14);
        this.scene.spawnEnemyBullet(this.x + 50, this.y + 8, Math.PI * 0.15, 14);
      }
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.setTintFill(0xffaaaa);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
    });
    this.scene.events.emit("boss-hp", this.hp / this.maxHp);
    if (this.hp <= 0) {
      this.activeBoss = false;
      this.scene.spawnExplosion(this.x, this.y);
      this.scene.spawnExplosion(this.x - 30, this.y + 10);
      this.scene.spawnExplosion(this.x + 30, this.y - 8);
      this.scene.onBossDefeated(this);
      this.destroy();
      return true;
    }
    return false;
  }
}
