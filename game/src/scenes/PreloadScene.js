import { CrazyGamesSDK } from '../CrazyGamesSDK.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Show loading bar
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height / 2, 400, 20, 0x333333);
    const bar = this.add.rectangle(width / 2 - 200, height / 2, 0, 20, 0x00ff88);
    bar.setOrigin(0, 0.5);

    this.load.on('progress', (progress) => {
      bar.width = 400 * progress;
    });

    // Generate placeholder pixel art textures programmatically
    // (replaced with real assets in Week 2)
    this.generateTextures();
  }

  generateTextures() {
    // Player: 16x24 green rectangle (placeholder)
    const playerGfx = this.make.graphics({ x: 0, y: 0, add: false });
    playerGfx.fillStyle(0x44ff44);
    playerGfx.fillRect(0, 0, 16, 24);
    playerGfx.fillStyle(0xffffff);
    playerGfx.fillRect(4, 4, 4, 4); // eye
    playerGfx.generateTexture('player', 16, 24);
    playerGfx.destroy();

    // Ground tile: 32x32 dark green
    const groundGfx = this.make.graphics({ x: 0, y: 0, add: false });
    groundGfx.fillStyle(0x225522);
    groundGfx.fillRect(0, 0, 32, 32);
    groundGfx.fillStyle(0x33aa33);
    groundGfx.fillRect(0, 0, 32, 4); // top highlight
    groundGfx.generateTexture('ground', 32, 32);
    groundGfx.destroy();

    // Spike obstacle: 24x24 red triangle-ish
    const spikeGfx = this.make.graphics({ x: 0, y: 0, add: false });
    spikeGfx.fillStyle(0xff3333);
    spikeGfx.fillTriangle(12, 0, 24, 24, 0, 24);
    spikeGfx.generateTexture('spike', 24, 24);
    spikeGfx.destroy();

    // Block obstacle: 32x32 gray
    const blockGfx = this.make.graphics({ x: 0, y: 0, add: false });
    blockGfx.fillStyle(0x888888);
    blockGfx.fillRect(0, 0, 32, 32);
    blockGfx.fillStyle(0xaaaaaa);
    blockGfx.fillRect(2, 2, 28, 4); // highlight
    blockGfx.generateTexture('block', 32, 32);
    blockGfx.destroy();

    // Coin: 12x12 yellow circle
    const coinGfx = this.make.graphics({ x: 0, y: 0, add: false });
    coinGfx.fillStyle(0xffdd00);
    coinGfx.fillCircle(6, 6, 6);
    coinGfx.generateTexture('coin', 12, 12);
    coinGfx.destroy();

    // Background layer 1: sky gradient tiles
    const bg1Gfx = this.make.graphics({ x: 0, y: 0, add: false });
    bg1Gfx.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e);
    bg1Gfx.fillRect(0, 0, 800, 400);
    bg1Gfx.generateTexture('bg1', 800, 400);
    bg1Gfx.destroy();

    // Background layer 2: mountains/hills
    const bg2Gfx = this.make.graphics({ x: 0, y: 0, add: false });
    bg2Gfx.fillStyle(0x112211);
    bg2Gfx.fillTriangle(100, 300, 200, 150, 300, 300);
    bg2Gfx.fillTriangle(250, 300, 380, 100, 500, 300);
    bg2Gfx.fillTriangle(450, 300, 600, 120, 750, 300);
    bg2Gfx.generateTexture('bg2', 800, 400);
    bg2Gfx.destroy();
  }

  create() {
    CrazyGamesSDK.gameLoadingStop();
    this.scene.start('MenuScene');
  }
}
