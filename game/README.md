# Pixel Dash

A fast-paced hyper-casual endless runner by TheGGCompany.

## Tech Stack

| Tool | Version | Reason |
|------|---------|--------|
| [Phaser.js](https://phaser.io) | 3.x | Battle-tested HTML5 game engine, MIT license, CrazyGames compatible |
| [Vite](https://vitejs.dev) | 6.x | Fast HMR dev server, optimal tree-shaking for production builds |
| JavaScript | ES2020+ | No transpile overhead, broad browser support, fast iteration |

## Project Structure

```
game/
├── index.html           # Entry point
├── vite.config.js       # Build config (base='./' for GitHub Pages)
├── package.json
├── public/
│   └── assets/          # Static assets (sprites, audio) — Week 2
└── src/
    ├── main.js          # Phaser game config + scene registry
    ├── config.js        # Tunable game constants
    └── scenes/
        ├── BootScene.js      # Minimal boot, goes to PreloadScene
        ├── PreloadScene.js   # Generates placeholder textures (no external assets needed)
        ├── MenuScene.js      # Title screen + high score display
        ├── GameScene.js      # Core game loop (player, obstacles, coins, scoring)
        ├── UIScene.js        # HUD overlay (distance + coins, runs parallel to GameScene)
        └── GameOverScene.js  # Death screen + retry
```

## Development

```bash
cd game
npm install
npm run dev       # http://localhost:8080
```

## Build

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build locally
```

The `dist/` folder is a fully static build ready for GitHub Pages or Netlify drop.

## Controls

| Platform | Control |
|----------|---------|
| Desktop | Spacebar or ↑ to jump |
| Mobile | Tap anywhere to jump |

## Game Constants (`src/config.js`)

- `INITIAL_SPEED`: 200 px/sec
- `MAX_SPEED`: 600 px/sec
- `SPEED_INCREMENT`: +30 px/sec every 500m
- `JUMP_VELOCITY`: 520 px/sec
