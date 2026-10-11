import {
  GAME_WIDTH,
  GAME_HEIGHT,
  LEVEL_WIDTH,
  LEVEL_HEIGHT,
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
import { Turret } from "../entities/Turret.js";
import { HeliBoss } from "../entities/HeliBoss.js";
import { HUD } from "../ui/HUD.js";
import { TouchControls } from "../ui/TouchControls.js";
import { ContinueOverlay } from "../ui/ContinueOverlay.js";

export class JungleScene extends Phaser.Scene {
  constructor() {
    super("Jungle");
  }

  create() {
    this.dying = false;
    this.bossSpawned = false;
    this.won = false;

    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
    this.cameras.main.setBackgroundColor("#4aa3ff");

    this.buildWorld();
    this.setupGroups();

    const st = GameState.get();
    this.player = new Player(this, st.checkpointX, st.checkpointY);
    this.physics.add.collider(this.player, this.ground);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 60);

    this.hud = new HUD(this);
    this.touch = new TouchControls(this, this.player);
    this.continueUI = new ContinueOverlay(this);

    this.physics.add.collider(this.enemies, this.ground);
    this.physics.add.overlap(this.playerBullets, this.enemies, this.onBulletHitEnemy, null, this);
    this.physics.add.overlap(this.rockets, this.enemies, this.onRocketHitEnemy, null, this);
    this.physics.add.overlap(this.enemyBullets, this.player, this.onEnemyBulletHitPlayer, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouchEnemy, null, this);
    this.physics.add.overlap(this.player, this.pickups, this.onPickup, null, this);
    this.physics.add.overlap(this.grenades, this.enemies, this.onGrenadeHitEnemy, null, this);
    this.physics.add.collider(this.grenades, this.ground, this.onGrenadeGround, null, this);
    this.physics.add.collider(this.rockets, this.ground, this.onRocketGround, null, this);

    this.events.on("boss-hp", (ratio) => this.hud.setBossHp(ratio));

    this.spawnLevelContent();
  }

  buildWorld() {
    // Solid sky + light parallax band
    this.add.rectangle(LEVEL_WIDTH / 2, LEVEL_HEIGHT / 2, LEVEL_WIDTH, LEVEL_HEIGHT, 0x4aa3ff).setDepth(-30);
    this.add.rectangle(LEVEL_WIDTH / 2, 120, LEVEL_WIDTH, 240, 0x6bb6ff).setScrollFactor(0.2).setDepth(-25);

    for (let i = 0; i < 40; i++) {
      const x = 100 + i * 240 + Phaser.Math.Between(-40, 40);
      this.add.image(x, LEVEL_HEIGHT - 140 - Phaser.Math.Between(0, 40), "palm")
        .setScrollFactor(0.4)
        .setAlpha(0.7)
        .setDepth(-10)
        .setScale(Phaser.Math.FloatBetween(1.1, 1.8));
    }

    this.ground = this.physics.add.staticGroup();
    const tileW = 64;
    for (let x = 0; x < LEVEL_WIDTH; x += tileW) {
      const g = this.ground.create(x + tileW / 2, LEVEL_HEIGHT - 32, "ground");
      g.refreshBody();
    }

    // Platforms / bunkers
    const plats = [
      [520, 520], [780, 440], [1100, 500], [1500, 420],
      [1900, 500], [2300, 380], [2700, 460], [3200, 400],
      [3700, 480], [4200, 360], [4700, 440], [5200, 400],
      [5800, 480], [6400, 420], [7000, 460], [7600, 400],
      [8200, 480], [8800, 420],
    ];
    plats.forEach(([x, y]) => {
      const p = this.ground.create(x, y, "platform");
      p.refreshBody();
    });

    // Foreground dirt strip decoration
    this.add.rectangle(LEVEL_WIDTH / 2, LEVEL_HEIGHT - 10, LEVEL_WIDTH, 20, 0x3d8b3d).setDepth(5);
  }

  setupGroups() {
    this.enemies = this.physics.add.group({ runChildUpdate: true });
    this.playerBullets = this.physics.add.group({ runChildUpdate: false });
    this.rockets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.grenades = this.physics.add.group();
    this.pickups = this.physics.add.group();
  }

  spawnLevelContent() {
    // Checkpoints
    this.checkpoints = [
      { x: 80, y: 500 },
      { x: 2400, y: 500 },
      { x: 4800, y: 500 },
      { x: 7200, y: 500 },
    ];
    this.checkpoints.forEach((c, i) => {
      if (i === 0) return;
      const flag = this.add.rectangle(c.x, LEVEL_HEIGHT - 90, 12, 56, 0xffcc00).setDepth(6);
      this.physics.add.existing(flag, true);
      this.physics.add.overlap(this.player, flag, () => {
        GameState.setCheckpoint(c.x, c.y);
        flag.fillColor = 0x88ff88;
      });
    });

    // Infantry waves
    const infantryXs = [
      600, 900, 1200, 1600, 2000, 2500, 2800, 3100, 3500, 3900,
      4300, 4600, 5000, 5400, 5900, 6300, 6800, 7300, 7800, 8300,
    ];
    infantryXs.forEach((x) => this.spawnInfantry(x, 500));

    // Turrets
    [1000, 2100, 3400, 4500, 5600, 6900, 8000].forEach((x) => {
      this.spawnTurret(x, LEVEL_HEIGHT - 90);
    });

    // Pickups along the level
    const drops = [
      [700, 480, "M"], [1400, 380, "H"], [2200, 340, "S"],
      [3000, 360, "H"], [4000, 320, "R"], [5100, 360, "M"],
      [6100, 400, "S"], [7200, 380, "H"], [8000, 400, "R"],
    ];
    drops.forEach(([x, y, type]) => this.spawnPickup(x, y, type));

    // Boss trigger zone near end
    this.bossTriggerX = 9000;
  }

  spawnInfantry(x, y) {
    const e = new Infantry(this, x, y);
    this.enemies.add(e);
    return e;
  }

  spawnTurret(x, y) {
    const e = new Turret(this, x, y);
    this.enemies.add(e);
    return e;
  }

  spawnPickup(x, y, type) {
    const key =
      type === "H" ? "crate_h" :
      type === "G" ? "crate_g" :
      type === "M" ? "crate_m" :
      type === "S" ? "crate_s" : "crate_r";
    const p = this.pickups.create(x, y, key);
    p.setData("type", type);
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
    return this.spawnPickup(x, y - 10, letter);
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
    this.physics.velocityFromRotation(angle, 380, b.body.velocity);
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
    for (let i = 0; i < 3; i++) {
      const p = this.add.image(x, y, "particle").setDepth(16);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-20, 20),
        y: y + Phaser.Math.Between(-30, 10),
        alpha: 0,
        duration: 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  spawnExplosion(x, y) {
    const e = this.add.image(x, y, "explosion").setDepth(20).setScale(0.5);
    this.cameras.main.shake(120, 0.008);
    this.tweens.add({
      targets: e,
      scale: 1.6,
      alpha: 0,
      duration: 280,
      onComplete: () => e.destroy(),
    });
  }

  blastAt(x, y, radius, damage, fromRocket = false) {
    this.spawnExplosion(x, y);
    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) return;
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) {
        if (typeof enemy.takeDamage === "function") enemy.takeDamage(damage);
      }
    });
    if (fromRocket && this.player && this.player.alive) {
      // no self-damage for jam feel
    }
  }

  onBulletHitEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    const dmg = bullet.getData("damage") || WEAPONS.pistol.damage;
    bullet.destroy();
    if (typeof enemy.takeDamage === "function") enemy.takeDamage(dmg);
  }

  onRocketHitEnemy(rocket, enemy) {
    if (!rocket.active) return;
    const dmg = rocket.getData("damage");
    const blast = rocket.getData("blast");
    const { x, y } = rocket;
    rocket.destroy();
    this.blastAt(x, y, blast, dmg, true);
  }

  onRocketGround(rocket) {
    if (!rocket.active) return;
    const dmg = rocket.getData("damage");
    const blast = rocket.getData("blast");
    const { x, y } = rocket;
    rocket.destroy();
    this.blastAt(x, y, blast, dmg, true);
  }

  onGrenadeHitEnemy(grenade, enemy) {
    if (!grenade.active) return;
    this.explodeGrenade(grenade);
  }

  onGrenadeGround(grenade) {
    // bounce; fuse handled in update
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
    const dmg = bullet.getData("damage") || 10;
    bullet.destroy();
    player.hurt(dmg);
  }

  onPlayerTouchEnemy(player, enemy) {
    if (!player.alive || !enemy.active) return;
    player.hurt(12);
  }

  onPickup(player, pickup) {
    if (!pickup.active) return;
    const type = pickup.getData("type");
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
    GameState.addScore(50);
  }

  onEnemyKilled(enemy) {
    GameState.addScore(enemy.scoreValue || 100);
    this.spawnExplosion(enemy.x, enemy.y - 10);
    if (Phaser.Math.Between(1, 100) <= ENEMY_DROP_CHANCE) {
      const roll = Phaser.Math.Between(1, 100);
      let type = "H";
      if (roll <= 30) type = "M";
      else if (roll <= 55) type = "S";
      else if (roll <= 75) type = "R";
      else if (roll <= 88) type = "G";
      this.spawnPickup(enemy.x, enemy.y - 20, type);
    }
  }

  onBossDefeated(boss) {
    GameState.addScore(boss.scoreValue || 5000);
    this.hud.showBossBar(false);
    this.won = true;
    this.time.delayedCall(1200, () => this.scene.start("Win"));
  }

  onPlayerDeath() {
    if (this.dying) return;
    this.dying = true;
    this.maybeDropPlayerWeapon(this.player.x, this.player.y);
    GameState.loseLife();
    this.time.delayedCall(600, () => {
      this.dying = false;
      this.continueUI.show();
    });
  }

  onContinueAccepted() {
    this.player.reviveAtCheckpoint();
    this.enemyBullets.clear(true, true);
  }

  trySpawnBoss() {
    if (this.bossSpawned || this.won) return;
    if (this.player.x < this.bossTriggerX) return;
    this.bossSpawned = true;
    this.hud.showBossBar(true);
    this.hud.setBossHp(1);
    const boss = new HeliBoss(this, this.player.x + 280, 180);
    this.enemies.add(boss);
    this.cameras.main.flash(400, 255, 200, 80);
  }

  update(time, delta) {
    this.hud.update();
    this.trySpawnBoss();

    // Cull old player bullets
    this.playerBullets.getChildren().forEach((b) => {
      let life = b.getData("life") - delta;
      b.setData("life", life);
      if (life <= 0 || b.x < this.cameras.main.scrollX - 40 || b.x > this.cameras.main.scrollX + GAME_WIDTH + 40) {
        b.destroy();
      }
    });

    this.enemyBullets.getChildren().forEach((b) => {
      if (b.x < this.cameras.main.scrollX - 80 || b.x > this.cameras.main.scrollX + GAME_WIDTH + 80 || b.y > LEVEL_HEIGHT) {
        b.destroy();
      }
    });

    this.grenades.getChildren().forEach((g) => {
      let fuse = g.getData("fuse") - delta;
      g.setData("fuse", fuse);
      g.rotation += delta * 0.01;
      if (fuse <= 0) this.explodeGrenade(g);
    });

    // Keep pickup labels glued
    this.pickups.getChildren().forEach((p) => {
      const label = p.getData("label");
      if (label && label.active) label.setPosition(p.x, p.y - 22);
    });
  }
}
