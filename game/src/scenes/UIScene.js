export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.distanceText = this.add.text(16, 16, '0m', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
    });

    this.coinText = this.add.text(16, 44, '0 coins', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffdd00',
      stroke: '#000',
      strokeThickness: 2,
    });

    // Listen to game scene events
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('update-score', ({ distance, coins }) => {
      this.distanceText.setText(`${distance}m`);
      this.coinText.setText(`${coins} coins`);
    });
  }
}
