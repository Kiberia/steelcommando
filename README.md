# Steel Commando

2D Metal Slug–inspired run-and-gun jam prototype (HTML5 / Phaser 3).

## Play

ES modules need a local HTTP server (not `file://`).

**PowerShell** (from this folder):

```powershell
.\serve.ps1
```

Then open http://localhost:8080

Or any static server pointed at this directory.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move / aim up | Arrows or WASD | D-pad |
| Fire | Z / Space | FIRE |
| Jump | X | JUMP |
| Grenade | C | GRENADE |

Menu: **Play Jungle** or **Weapon Range** (all guns + dummies, ESC = menu).

## Stack

- Phaser 3 (CDN)
- Plain ES modules — no npm/Node required
- Godot port planned later (see `plan.md`)

## Progress

Track stages in [`plan.md`](plan.md).
