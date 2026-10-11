import {
  PLAYER_SPEED,
  PLAYER_JUMP,
  PLAYER_MAX_HP,
  PLAYER_DISPLAY_HEIGHT,
  PLAYER_IDLE_FRAME_W,
  PLAYER_IDLE_FRAME_H,
} from "../config.js";
import { WEAPONS } from "../weapons/WeaponDefs.js";
import { GameState } from "../state/GameState.js";

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player_idle", 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    // Scale hi-res frames down for play; LINEAR softens the downscale (source PNGs untouched)
    if (this.texture) {
      this.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    const scale = PLAYER_DISPLAY_HEIGHT / PLAYER_IDLE_FRAME_H;
    this.setScale(scale);

    // Hitbox in source-texture pixels (Arcade scales it with the sprite)
    const bodyW = Math.round(PLAYER_IDLE_FRAME_W * 0.38);
    const bodyH = Math.round(PLAYER_IDLE_FRAME_H * 0.62);
    this.body.setSize(bodyW, bodyH);
    this.body.setOffset(
      Math.round((PLAYER_IDLE_FRAME_W - bodyW) / 2),
      Math.round(PLAYER_IDLE_FRAME_H - bodyH - PLAYER_IDLE_FRAME_H * 0.04)
    );
    this.setDepth(10);
    this.play("player-idle");

    this.facing = 1;
    this.aim = 0; // -1 up, 0 forward
    this.invuln = 0;
    this.fireCooldown = 0;
    this.grenadeCooldown = 0;
    this.alive = true;

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      fire: Phaser.Input.Keyboard.KeyCodes.Z,
      fire2: Phaser.Input.Keyboard.KeyCodes.SPACE,
      jump: Phaser.Input.Keyboard.KeyCodes.X,
      grenade: Phaser.Input.Keyboard.KeyCodes.C,
    });

    this.touch = {
      left: false,
      right: false,
      up: false,
      down: false,
      fire: false,
      jump: false,
      grenade: false,
      jumpPulse: false,
      grenadePulse: false,
    };
  }

  setTouchState(partial) {
    Object.assign(this.touch, partial);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.alive) return;

    const dt = delta;
    if (this.invuln > 0) {
      this.invuln -= dt;
      this.setAlpha(Math.floor(this.invuln / 80) % 2 === 0 ? 1 : 0.4);
    } else {
      this.setAlpha(1);
    }

    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.grenadeCooldown = Math.max(0, this.grenadeCooldown - dt);

    const left = this.cursors.left.isDown || this.keys.left.isDown || this.touch.left;
    const right = this.cursors.right.isDown || this.keys.right.isDown || this.touch.right;
    const up = this.cursors.up.isDown || this.keys.up.isDown || this.touch.up;
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.jump) || this.touch.jumpPulse;
    const fireHeld = this.keys.fire.isDown || this.keys.fire2.isDown || this.touch.fire;
    const grenadePressed = Phaser.Input.Keyboard.JustDown(this.keys.grenade) || this.touch.grenadePulse;

    this.touch.jumpPulse = false;
    this.touch.grenadePulse = false;

    const onFloor = this.body.blocked.down || this.body.touching.down;

    if (left) {
      this.setVelocityX(-PLAYER_SPEED);
      this.facing = -1;
    } else if (right) {
      this.setVelocityX(PLAYER_SPEED);
      this.facing = 1;
    } else {
      this.setVelocityX(0);
    }

    this.setFlipX(this.facing < 0);
    this.aim = up ? -1 : 0;

    const moving = left || right;
    if (onFloor && moving) {
      if (this.anims.currentAnim?.key !== "player-walk") {
        this.play("player-walk");
      } else if (this.anims.isPaused) {
        this.anims.resume();
      } else if (!this.anims.isPlaying) {
        this.play("player-walk");
      }
    } else if (onFloor && !moving) {
      if (this.anims.currentAnim?.key !== "player-idle") {
        this.play("player-idle");
      } else if (this.anims.isPaused) {
        this.anims.resume();
      } else if (!this.anims.isPlaying) {
        this.play("player-idle");
      }
    } else if (this.anims.isPlaying) {
      this.anims.pause();
    }

    if (jumpPressed && onFloor) {
      this.setVelocityY(PLAYER_JUMP);
    }

    if (fireHeld) this.tryFire();
    if (grenadePressed) this.tryGrenade();
  }

  getAimVector() {
    let angle = this.facing > 0 ? 0 : Math.PI;
    if (this.aim < 0) {
      angle = this.facing > 0 ? -Math.PI / 2.6 : Math.PI + Math.PI / 2.6;
    }
    return { x: Math.cos(angle), y: Math.sin(angle), angle };
  }

  muzzle() {
    const { x: ax, y: ay } = this.getAimVector();
    const h = this.displayHeight;
    const ox = h * 0.28;
    const oy = this.aim < 0 ? -h * 0.28 : -h * 0.06;
    return {
      x: this.x + ax * ox + (this.facing > 0 ? h * 0.12 : -h * 0.12),
      y: this.y + oy + ay * (h * 0.08),
    };
  }

  tryFire() {
    const st = GameState.get();
    const def = WEAPONS[st.weaponId] || WEAPONS.pistol;
    if (this.fireCooldown > 0) return;
    if (!GameState.consumeAmmo(1)) return;

    this.fireCooldown = def.fireRate;
    const muzzle = this.muzzle();
    const base = this.getAimVector();

    if (def.projectile === "rocket") {
      this.scene.spawnRocket(muzzle.x, muzzle.y, base.angle, def);
    } else {
      const count = def.pellets;
      const mid = (count - 1) / 2;
      for (let i = 0; i < count; i++) {
        const offset = (i - mid) * (def.spread / Math.max(1, mid || 1));
        const ang = base.angle + offset;
        this.scene.spawnBullet(muzzle.x, muzzle.y, ang, def);
      }
    }

    this.scene.spawnMuzzleFlash(muzzle.x, muzzle.y);
  }

  tryGrenade() {
    if (this.grenadeCooldown > 0) return;
    if (!GameState.throwGrenade()) return;
    this.grenadeCooldown = 400;
    const muzzle = this.muzzle();
    this.scene.spawnGrenade(muzzle.x, muzzle.y, this.facing);
  }

  hurt(amount) {
    if (!this.alive || this.invuln > 0) return false;
    const dead = GameState.damage(amount);
    this.invuln = 900;
    this.setVelocityY(-220);
    this.setVelocityX(-this.facing * 160);
    this.scene.cameras.main.shake(80, 0.004);
    if (dead) {
      this.die();
      return true;
    }
    return false;
  }

  die() {
    this.alive = false;
    this.setVelocity(0, -100);
    this.setTint(0x662222);
    this.scene.onPlayerDeath();
  }

  reviveAtCheckpoint() {
    const st = GameState.get();
    this.alive = true;
    this.clearTint();
    this.setAlpha(1);
    this.invuln = 1500;
    this.setPosition(st.checkpointX, st.checkpointY);
    this.setVelocity(0, 0);
    GameState.fullHeal();
  }

  syncHpVisual() {
    void PLAYER_MAX_HP;
  }
}
