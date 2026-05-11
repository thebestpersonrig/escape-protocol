# 🔐 Escape Protocol

A browser-based escape room set in an abandoned research laboratory. Solve puzzles, find clues, and escape before time runs out.

## ▶ How to Run

Requires a local HTTP server (ES modules won't work on `file://`):

```bash
cd escape-protocol
python -m http.server 8000
# Open http://localhost:8000
```

Or use VS Code Live Server.

## 🎮 Controls

| Action | Input |
|--------|-------|
| Interact / pick up | Left click |
| Use item on object | Select from inventory, then click object |
| Deselect item | Click inventory item again or click empty space |
| Laser puzzle | WASD or Arrow Keys |
| Close puzzle | ESC or ✕ |

## 🧩 Puzzles

1. Keypad — find the hidden 4-digit code
2. Symbol Match — flip card pairs
3. Wire Connect — drag wires to correct terminals
4. Memory Sequence — repeat the symbol order
5. Terminal Hack — type the password
6. Lever Combination — set levers per the diagram
7. Laser Avoidance — navigate moving beams (canvas minigame)

## ✨ Features

- 60-minute timer · 3 hints · Alarm system (5 mistakes = 60s security countdown)
- Randomised clue locations every run (seeded RNG)
- 9 achievements · 4 unique endings · Secret hidden room
- Auto-save / Continue · Procedural audio (Web Audio API, no files needed)
- Dust/smoke/spark particles · Flickering lights

## 🛠 Stack

Pure HTML5 + CSS3 + Vanilla JS (ES Modules). No build tools, no dependencies.
