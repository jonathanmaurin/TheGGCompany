export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, 'bg1').setDisplaySize(width, height);

    this.add.text(width / 2, height * 0.3, 'PIXEL DASH', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#44ff44',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const highScore = localStorage.getItem('pixelDashHighScore') || 0;
    this.add.text(width / 2, height * 0.5, `Best: ${highScore}m`, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffdd00',
    }).setOrigin(0.5);

    const startText = this.add.text(width / 2, height * 0.65, 'PRESS SPACE / TAP TO START', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Blink animation
    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 600,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
    });

    // Keyboard
    this.input.keyboard.once('keydown-SPACE', () => this.startGame());

    // Touch/click
    this.input.once('pointerdown', () => this.startGame());
  }

  startGame() {
    this.scene.start('GameScene');
    this.scene.start('UIScene');
    this.scene.bringToTop('UIScene');
  }
}
