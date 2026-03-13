export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalDistance = data.distance || 0;
    this.finalCoins = data.coins || 0;
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, 'bg1').setDisplaySize(width, height).setAlpha(0.7);

    this.add.text(width / 2, height * 0.25, 'GAME OVER', {
      fontSize: '42px',
      fontFamily: 'monospace',
      color: '#ff3333',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.45, `Distance: ${this.finalDistance}m`, {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.55, `Coins: ${this.finalCoins}`, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffdd00',
    }).setOrigin(0.5);

    const highScore = localStorage.getItem('pixelDashHighScore') || 0;
    this.add.text(width / 2, height * 0.65, `Best: ${highScore}m`, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#44ff44',
    }).setOrigin(0.5);

    const retryText = this.add.text(width / 2, height * 0.8, 'SPACE / TAP TO PLAY AGAIN', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: retryText,
      alpha: 0,
      duration: 500,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown-SPACE', () => this.retry());
    this.input.once('pointerdown', () => this.retry());
  }

  retry() {
    this.scene.stop('GameOverScene');
    this.scene.start('GameScene');
    this.scene.start('UIScene');
    this.scene.bringToTop('UIScene');
  }
}
