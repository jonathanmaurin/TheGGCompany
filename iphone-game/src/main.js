import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

    // Title text
    this.add.text(width / 2, height / 2 - 40, 'STACK ATTACK', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#00ff88',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 + 20, 'by TheGGCompany', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);

    // Tap to start hint
    const hint = this.add.text(width / 2, height / 2 + 80, 'Tap to Start', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#00ff88',
    }).setOrigin(0.5);

    // Blink animation
    this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  backgroundColor: '#000000',
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 568 },
    max: { width: 430, height: 932 },
  },
  scene: [BootScene],
};

new Phaser.Game(config);
