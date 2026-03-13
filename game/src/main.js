import Phaser from 'phaser';
import { CrazyGamesSDK } from './CrazyGamesSDK.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// Initialize CrazyGames SDK as early as possible
CrazyGamesSDK.init();

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 400,
  backgroundColor: '#1a1a2e',
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 160 },
    max: { width: 1920, height: 960 },
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, UIScene, GameOverScene],
};

new Phaser.Game(config);
