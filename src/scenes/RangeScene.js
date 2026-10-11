import {
  GAME_WIDTH,
  GAME_HEIGHT,
  HEALTH_PICKUP,
  GRENADE_DAMAGE,
  GRENADE_PICKUP,
  ENEMY_DROP_CHANCE,
  PLAYER_WEAPON_DROP_CHANCE,
} from "../config.js";
import { WEAPONS, PICKUP_TO_WEAPON, WEAPON_TO_PICKUP } from "../weapons/WeaponDefs.js";
import { GameState } from "../state/GameState.js";
import { Player } from "../entities/Player.js";
import { Infantry } from "../entities/Infantry.js";
import { HUD } from "../ui/HUD.js";
import { TouchControls } from "../ui/TouchControls.js";

const RANGE_W = 2800;
const RANGE_H = 720;

/**
 * Weapon test stand: all guns + grenades, dummy targets, instant revive.
 */
export class RangeScene extends Phaser.Scene {
  constructor() {
    super("Range");
  }

  create() {
    this.dying = false;

    GameState.resetRun();
    GameState.setCheckpoint(120, 500);
    GameState.addGrenades(20);

    this.physics.world.setBounds(0, 0, RANGE_W, RANGE_H);
    this.cameras.main.setBounds(0, 0, RANGE_W, RANGE_H);
    this.cameras.main.setBackgroundColor("#3a4a3a");

    this.buildWorld();
    this.setupGroups();

    this.player = new Player(this, 120, 500);
    this.physics.add.collider(this.player, this.ground);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.hud = new HUD(this);
    this.touch = new TouchControls(this, this.player);

    this.physics.add.collider(this.enemies, this.ground);
    this.physics.add.overlap(this.playerBullets, this.enemies, this.onBulletHitEnemy, null, this);
    this.physics.add.overlap(this.rockets, this.enemies, this.onRocketHitEnemy, null, this);
    this.physics.add.overlap(this.enemyBullets, this.player, this.onEnemyBulletHitPlayer, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouchEnemy, null, this);
    this.physics.add.overlap(this.player, this.pickups, this.onPickup, null, this);
    this.physics.add.overlap(this.grenades, this.enemies, this.onGrenadeHitEnemy, null, this);
    this.physics.add.collider(this.grenades, this.ground);
    this.physics.add.collider(this.rockets, this.ground, this.onRocketGround, null, this);

    this.placeWeaponRack();
    this.spawnDummies();

    this.add.text(24, 96, "WEAPON RANGE  ·  ESC = menu", {
      fontFamily: "Courier New",
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    }).setScrollFactor(0).setDepth(100);

    this.input.keyboard.on("keydown-ESC", () => this.scene.start("Menu"));
  }

  buildWorld() {
    this.add.rectangle(RANGE_W / 2, RANGE_H / 2, RANGE_W, RANGE_H, 0x4a5a3a).setDepth(-30);
    this.ground = this.physics.add.staticGroup();
    for (let x = 0; x < RANGE_W; x += 64) {
      this.ground.create(x + 32, RANGE_H - 32, "ground").refreshBody();
    }
    // shooting platforms
    [[600, 480], [1000, 400], [1400, 480], [1800, 360], [2200, 440]].forEach(([x, y]) => {
      this.ground.create(x, y, "platform").refreshBody();
    });
    this.add.rectangle(RANGE_W / 2, RANGE_H - 10, RANGE_W, 20, 0x3d8b3d).setDepth(5);
  }

  setupGroups() {
    this.enemies = this.physics.add.group({ runChildUpdate: true });
    this.playerBullets = this.physics.add.group();
    this.rockets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.grenades = this.physics.add.group();
    this.pickups = this.physics.add.group();
  }

  placeWeaponRack() {
    const rackY = RANGE_H - 100;
    const items = [
      { x: 280, type: "M", label: "MACHINE GUN" },
      { x: 400, type: "S", label: "SHOTGUN" },
      { x: 520, type: "R", label: "ROCKET" },
      { x: 640, type: "H", label: "HEALTH" },
      { x: 760, type: "G", label: "GRENADES" },
    ];
    items.forEach((item) => {
      this.spawnPickup(item.x, rackY, item.type, true);
      this.add.text(item.x, rackY - 48, item.label, {
        fontFamily: "Courier New",
        fontSize: "12px",
        color: "#ffeeaa",
        stroke: "#000000",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(7);
    });

    this.add.text(520, 160, "PICK UP WEAPONS → SHOOT DUMMIES → DIE TO TEST DROP", {
      fontFamily: "Courier New",
      fontSize: "16px",
      color: "#dddddd",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  spawnDummies() {
    this.dummySpawns = [900, 1200, 1500, 1900, 2300, 2500];
    this.dummySpawns.forEach((x) => this.spawnDummy(x));
  }

  spawnDummy(x) {
    const e = new Infantry(this, x, 500);
    e.setTexture("dummy");
    e.hp = 40;
    e.scoreValue = 10;
    e.setData("spawnX", x);
    this.enemies.add(e);
    return e;
  }

  spawnPickup(x, y, type, respawn = false) {
    const key =
      type === "H" ? "crate_h" :
      type === "G" ? "crate_g" :
      type === "M" ? "crate_m" :
      type === "S" ? "crate_s" : "crate_r";
    const p = this.pickups.create(x, y, key);
    p.setData("type", type);
    p.setData("respawn", respawn);
    p.setData("homeX", x);
    p.setData("homeY", y);
    p.body.setAllowGravity(false);
    p.setDepth(6);
    this.tweens.add({
      targets: p,
      y: y - 8,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
    const label = this.add.text(x, y - 22, type, {
      fontFamily: "Courier New",
      fontSize: "16px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(7);
    p.setData("label", label);
    return p;
  }

  dropWeaponPickup(x, y, weaponId) {
    const letter = WEAPON_TO_PICKUP[weaponId];
    if (!letter) return null;
    return this.spawnPickup(x, y - 10, letter, false);
  }

  maybeDropPlayerWeapon(x, y) {
    if (Phaser.Math.Between(1, 100) > PLAYER_WEAPON_DROP_CHANCE) {
      GameState.extractSpecialWeapon();
      return null;
    }
    const drop = GameState.extractSpecialWeapon();
    if (!drop) return null;
    return this.dropWeaponPickup(x, y, drop.id);
  }

  spawnBullet(x, y, angle, def) {
    const b = this.playerBullets.create(x, y, "bullet");
    b.body.setAllowGravity(false);
    b.setDepth(15);
    b.setData("damage", def.damage);
    b.setData("life", 1200);
    this.physics.velocityFromRotation(angle, def.bulletSpeed, b.body.velocity);
    b.rotation = angle;
  }

  spawnRocket(x, y, angle, def) {
    const r = this.rockets.create(x, y, "rocket");
    r.body.setAllowGravity(false);
    r.setDepth(15);
    r.setData("damage", def.damage);
    r.setData("blast", def.blastRadius || 96);
    this.physics.velocityFromRotation(angle, def.bulletSpeed, r.body.velocity);
    r.rotation = angle;
  }

  spawnEnemyBullet(x, y, angle, damage) {
    const b = this.enemyBullets.create(x, y, "bullet");
    b.setTint(0xff6666);
    b.body.setAllowGravity(false);
    b.setDepth(14);
    b.setData("damage", damage);
    this.physics.velocityFromRotation(angle, 320, b.body.velocity);
  }

  spawnGrenade(x, y, facing) {
    const g = this.grenades.create(x, y, "grenade");
    g.setDepth(14);
    g.setBounce(0.35);
    g.setVelocity(facing * 320, -360);
    g.setData("fuse", 1200);
    g.setData("damage", GRENADE_DAMAGE);
  }

  spawnMuzzleFlash(x, y) {
    const f = this.add.circle(x, y, 6, 0xffee88, 0.9).setDepth(16);
    this.tweens.add({
      targets: f,
      alpha: 0,
      scale: 2,
      duration: 80,
      onComplete: () => f.destroy(),
    });
  }

  spawnExplosion(x, y) {
    const e = this.add.image(x, y, "explosion").setDepth(20).setScale(0.5);
    this.cameras.main.shake(100, 0.006);
    this.tweens.add({
      targets: e,
      scale: 1.6,
      alpha: 0,
      duration: 280,
      onComplete: () => e.destroy(),
    });
  }

  blastAt(x, y, radius, damage) {
    this.spawnExplosion(x, y);
    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) return;
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) {
        if (typeof enemy.takeDamage === "function") enemy.takeDamage(damage);
      }
    });
  }

  onBulletHitEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    const dmg = bullet.getData("damage") || WEAPONS.pistol.damage;
    bullet.destroy();
    if (typeof enemy.takeDamage === "function") enemy.takeDamage(dmg);
  }

  onRocketHitEnemy(rocket) {
    if (!rocket.active) return;
    const dmg = rocket.getData("damage");
    const blast = rocket.getData("blast");
    const { x, y } = rocket;
    rocket.destroy();
    this.blastAt(x, y, blast, dmg);
  }

  onRocketGround(rocket) {
    this.onRocketHitEnemy(rocket);
  }

  onGrenadeHitEnemy(grenade) {
    this.explodeGrenade(grenade);
  }

  explodeGrenade(grenade) {
    if (!grenade.active) return;
    const dmg = grenade.getData("damage");
    const { x, y } = grenade;
    grenade.destroy();
    this.blastAt(x, y, 80, dmg);
  }

  onEnemyBulletHitPlayer(player, bullet) {
    if (!bullet.active || !player.alive) return;
    bullet.destroy();
    player.hurt(bullet.getData("damage") || 8);
  }

  onPlayerTouchEnemy(player, enemy) {
    if (!player.alive || !enemy.active) return;
    player.hurt(10);
  }

  onPickup(player, pickup) {
    if (!pickup.active) return;
    const type = pickup.getData("type");
    const respawn = pickup.getData("respawn");
    const homeX = pickup.getData("homeX");
    const homeY = pickup.getData("homeY");
    const label = pickup.getData("label");
    if (label) label.destroy();
    const px = pickup.x;
    const py = pickup.y;
    pickup.destroy();

    if (type === "H") {
      GameState.heal(HEALTH_PICKUP);
    } else if (type === "G") {
      GameState.addGrenades(GRENADE_PICKUP);
    } else if (PICKUP_TO_WEAPON[type]) {
      const prev = GameState.setWeapon(PICKUP_TO_WEAPON[type]);
      if (prev) this.dropWeaponPickup(px - 36, py, prev.id);
    }

    if (respawn) {
      this.time.delayedCall(2500, () => this.spawnPickup(homeX, homeY, type, true));
    }
  }

  onEnemyKilled(enemy) {
    GameState.addScore(enemy.scoreValue || 10);
    this.spawnExplosion(enemy.x, enemy.y - 10);
    const spawnX = enemy.getData("spawnX") || enemy.x;

    if (Phaser.Math.Between(1, 100) <= ENEMY_DROP_CHANCE) {
      const types = ["M", "S", "R", "G", "H"];
      this.spawnPickup(enemy.x, enemy.y - 20, Phaser.Utils.Array.GetRandom(types), false);
    }

    this.time.delayedCall(1800, () => {
      if (this.scene.isActive("Range")) this.spawnDummy(spawnX);
    });
  }

  onPlayerDeath() {
    if (this.dying) return;
    this.dying = true;
    this.maybeDropPlayerWeapon(this.player.x, this.player.y);
    this.time.delayedCall(700, () => {
      this.dying = false;
      GameState.fullHeal();
      GameState.setWeapon("pistol");
      this.player.reviveAtCheckpoint();
      this.enemyBullets.clear(true, true);
    });
  }

  update(time, delta) {
    this.hud.update();

    this.playerBullets.getChildren().forEach((b) => {
      let life = b.getData("life") - delta;
      b.setData("life", life);
      if (life <= 0) b.destroy();
    });

    this.enemyBullets.getChildren().forEach((b) => {
      if (b.y > RANGE_H || b.x < -40 || b.x > RANGE_W + 40) b.destroy();
    });

    this.grenades.getChildren().forEach((g) => {
      let fuse = g.getData("fuse") - delta;
      g.setData("fuse", fuse);
      g.rotation += delta * 0.01;
      if (fuse <= 0) this.explodeGrenade(g);
    });

    this.pickups.getChildren().forEach((p) => {
      const label = p.getData("label");
      if (label && label.active) label.setPosition(p.x, p.y - 22);
    });
  }
}
