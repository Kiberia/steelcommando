import { PLAYER_MAX_HP, START_LIVES, MAX_CONTINUES, GRENADE_START } from "../config.js";
import { WEAPONS } from "../weapons/WeaponDefs.js";

const state = {
  score: 0,
  lives: START_LIVES,
  continuesLeft: MAX_CONTINUES,
  hp: PLAYER_MAX_HP,
  weaponId: "pistol",
  ammo: Infinity,
  grenades: GRENADE_START,
  checkpointX: 80,
  checkpointY: 500,
};

export const GameState = {
  get() {
    return state;
  },

  resetRun() {
    state.score = 0;
    state.lives = START_LIVES;
    state.continuesLeft = MAX_CONTINUES;
    state.hp = PLAYER_MAX_HP;
    state.weaponId = "pistol";
    state.ammo = Infinity;
    state.grenades = GRENADE_START;
    state.checkpointX = 80;
    state.checkpointY = 500;
  },

  addScore(n) {
    state.score += n;
  },

  setCheckpoint(x, y) {
    state.checkpointX = x;
    state.checkpointY = y;
  },

  /** @returns {{ id: string, ammo: number } | null} previous special weapon, if any */
  setWeapon(id) {
    const def = WEAPONS[id];
    if (!def) return null;
    const prev =
      state.weaponId !== "pistol" && state.weaponId !== id && state.ammo > 0
        ? { id: state.weaponId, ammo: state.ammo }
        : null;
    state.weaponId = id;
    state.ammo = def.ammo;
    return prev;
  },

  /** Snapshot + clear special weapon (for death drops). */
  extractSpecialWeapon() {
    if (state.weaponId === "pistol") return null;
    const drop = { id: state.weaponId, ammo: state.ammo };
    state.weaponId = "pistol";
    state.ammo = Infinity;
    return drop;
  },

  consumeAmmo(amount = 1) {
    if (state.ammo === Infinity) return true;
    if (state.ammo < amount) return false;
    state.ammo -= amount;
    if (state.ammo <= 0) {
      state.weaponId = "pistol";
      state.ammo = Infinity;
    }
    return true;
  },

  heal(amount) {
    state.hp = Math.min(PLAYER_MAX_HP, state.hp + amount);
  },

  damage(amount) {
    state.hp = Math.max(0, state.hp - amount);
    return state.hp <= 0;
  },

  fullHeal() {
    state.hp = PLAYER_MAX_HP;
  },

  loseLife() {
    state.lives = Math.max(0, state.lives - 1);
    return state.lives;
  },

  useContinue() {
    if (state.continuesLeft <= 0) return false;
    state.continuesLeft -= 1;
    state.hp = PLAYER_MAX_HP;
    state.weaponId = "pistol";
    state.ammo = Infinity;
    return true;
  },

  addGrenades(n) {
    state.grenades += n;
  },

  throwGrenade() {
    if (state.grenades <= 0) return false;
    state.grenades -= 1;
    return true;
  },
};
