export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const LEVEL_WIDTH = 9600;
export const LEVEL_HEIGHT = 720;

/** World camera zoom — higher = tighter Metal Slug framing */
export const CAMERA_ZOOM = 2.2;

/** On-screen hero height (hi-res idle sheet is scaled down with linear filter) */
export const PLAYER_DISPLAY_HEIGHT = 88;
export const PLAYER_IDLE_FRAME_W = 480;
export const PLAYER_IDLE_FRAME_H = 822;

/** Basic infantry enemy (enemy_idle_loop_sheet.png) */
export const ENEMY_DISPLAY_HEIGHT = 78;
export const ENEMY_IDLE_FRAME_W = 266;
export const ENEMY_IDLE_FRAME_H = 492;

/** hero/projectile.png (127×123) scaled for world bullets */
export const PROJECTILE_SCALE = 0.22;

/** hero/rocket_projectile.png (233×134) scaled for rockets */
export const ROCKET_SCALE = 0.2;

/** hero/grenade.png (41×48) scaled for thrown grenades */
export const GRENADE_SCALE = 0.38;

/** hero/explosion.png — 8-frame horizontal fireball strip */
export const EXPLOSION_FRAME_W = 64;
export const EXPLOSION_FRAME_H = 62;
export const EXPLOSION_SCALE = 0.95;

export const GRAVITY = 1800;
export const PLAYER_SPEED = 280;
export const PLAYER_JUMP = -620;
export const PLAYER_MAX_HP = 100;
export const START_LIVES = 3;
export const MAX_CONTINUES = 3;
export const CONTINUE_SECONDS = 10;

/** Shared hit damage for all guns (may diverge later). */
export const WEAPON_DAMAGE = 10;

export const GRENADE_DAMAGE = 80;
export const GRENADE_START = 5;
export const GRENADE_PICKUP = 3;
export const HEALTH_PICKUP = 20;

/** Chance (0–100) enemy drops a weapon/health pickup. */
export const ENEMY_DROP_CHANCE = 28;
/** Chance (0–100) current special weapon drops on player death. */
export const PLAYER_WEAPON_DROP_CHANCE = 70;

export const COLORS = {
  skyTop: 0x4aa3ff,
  skyBot: 0x87ceeb,
  dirt: 0x6b3f22,
  grass: 0x3d8b3d,
  player: 0x2a2a2a,
  skin: 0xe8b090,
  enemy: 0x3a6b3a,
  heli: 0x555555,
  hud: "#ffffff",
  fire: 0xd62828,
};
