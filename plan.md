# Steel Commando — Jam Plan

Updated: 2026-10-11

## Status legend

- `[ ]` pending · `[~]` in progress · `[x]` done

## Phase A — HTML / Phaser (this week)

- [x] 1. Setup — HTML/Phaser scaffold, README, `plan.md`, `serve.ps1`
- [x] 2. Player + controls — move/jump/aim up, keyboard + touch (crouch removed)
- [x] 3. Combat core — pistol / MG / shotgun / rocket + grenades + HUD
- [x] 4. Enemies — infantry + turret
- [x] 5. Jungle level — long stage, waves, camera, parallax stubs
- [x] 6. Lives / Continue — checkpoints, CONTINUE? stub, Game Over
- [x] 7. Power-ups — M / S / R + health
- [x] 8. Boss — helicopter + win
- [x] 9. Juice + menus — muzzle/explosions, title/win/game over

## Phase B — Godot port (later, main PC)

- [ ] 10. Port systems to Godot 4 + Android APK export

## Locked decisions

- Web-first (Phaser 3 CDN, no Node/Godot on temp PC)
- One longer jungle level (~9600px)
- Weapons: pistol (default), M machinegun, S shotgun (5-pellet arc), R rocket (AoE); shared `WEAPON_DAMAGE`
- Continue via rewarded-ad stub (~1s fake wait)

## How to play

```powershell
.\serve.ps1
```

Open http://localhost:8080

## Notes / changelog

- 2026-10-11: Scaffold + full vertical slice playable in browser (placeholder art)
- 2026-10-11: Removed crouch; added Weapon Range test stand; weapon can drop from player on death (70%) and from enemies (28%); swap drops previous gun
- Tuning left: balance, art, SFX, level pacing polish
