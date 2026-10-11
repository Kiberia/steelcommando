import { WEAPON_DAMAGE } from "../config.js";

/**
 * Data-driven weapon stats.
 * damage is shared for now; change per-weapon later if needed.
 */
export const WEAPONS = {
  pistol: {
    id: "pistol",
    label: "PISTOL",
    fireRate: 220,
    bulletSpeed: 720,
    ammo: Infinity,
    pellets: 1,
    spread: 0,
    projectile: "bullet",
    damage: WEAPON_DAMAGE,
  },
  machinegun: {
    id: "machinegun",
    label: "MACHINE GUN",
    fireRate: 80,
    bulletSpeed: 800,
    ammo: 120,
    pellets: 1,
    spread: 0.04,
    projectile: "bullet",
    damage: WEAPON_DAMAGE,
  },
  shotgun: {
    id: "shotgun",
    label: "SHOTGUN",
    fireRate: 450,
    bulletSpeed: 680,
    ammo: 24,
    pellets: 5,
    spread: 0.35,
    projectile: "bullet",
    damage: WEAPON_DAMAGE,
  },
  rocket: {
    id: "rocket",
    label: "ROCKET",
    fireRate: 700,
    bulletSpeed: 420,
    ammo: 8,
    pellets: 1,
    spread: 0,
    projectile: "rocket",
    blastRadius: 96,
    damage: WEAPON_DAMAGE,
  },
};

export const PICKUP_TO_WEAPON = {
  M: "machinegun",
  S: "shotgun",
  R: "rocket",
};

export const WEAPON_TO_PICKUP = {
  machinegun: "M",
  shotgun: "S",
  rocket: "R",
};
