import { CrazyGamesSDK } from '../CrazyGamesSDK.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalDistance = data.distance || 0;
    this.finalCoins = data.coins || 0;
  }

  async create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, 'bg1').setDisplaySize(width, height).setAlpha(0.7);

    this.add.text(width / 2, height * 0.2, 'GAME OVER', {
      fontSize: '42px',
      fontFamily: 'monospace',
      color: '#ff3333',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.35, `Distance: ${this.finalDistance}m`, {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.43, `Coins: ${this.finalCoins}`, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffdd00',
    }).setOrigin(0.5);

    const highScore = parseInt(localStorage.getItem('pixelDashHighScore') || '0');
    const isNewHigh = this.finalDistance >= highScore;
    const bestLabel = isNewHigh ? '★ NEW BEST!' : `Best: ${highScore}m`;
    this.add.text(width / 2, height * 0.51, bestLabel, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: isNewHigh ? '#ffdd00' : '#44ff44',
    }).setOrigin(0.5);

    // Submit score to CrazyGames leaderboard
    if (isNewHigh) {
      CrazyGamesSDK.submitScore(this.finalDistance);
    }

    // Share button
    this._addShareButton(width, height);

    // Leaderboard section (async)
    this._addLeaderboard(width, height);

    const retryText = this.add.text(width / 2, height * 0.88, 'SPACE / TAP TO PLAY AGAIN', {
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
    this.input.once('pointerdown', (pointer) => {
      // Only retry if not clicking the share button area
      if (!this._shareHitArea || !this._shareHitArea.getBounds().contains(pointer.x, pointer.y)) {
        this.retry();
      }
    });
  }

  _addShareButton(width, height) {
    const shareBtn = this.add.text(width / 2, height * 0.62, '🐦 SHARE SCORE', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#1da1f2',
      backgroundColor: '#0d1a26',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this._shareHitArea = shareBtn;

    shareBtn.on('pointerover', () => shareBtn.setStyle({ color: '#60c8ff' }));
    shareBtn.on('pointerout', () => shareBtn.setStyle({ color: '#1da1f2' }));
    shareBtn.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      const text = `I just ran ${this.finalDistance}m in Pixel Dash! 🎮 Can you beat my score?`;
      const url = encodeURIComponent('https://theggcompany.github.io/pixel-dash/');
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
      window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    });
  }

  async _addLeaderboard(width, height) {
    const scores = await CrazyGamesSDK.getLeaderboard();
    if (!scores || scores.length === 0) return;

    this.add.text(width / 2, height * 0.7, 'TOP SCORES', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    scores.slice(0, 3).forEach((entry, i) => {
      const name = entry.name ? entry.name.substring(0, 10) : '???';
      const score = entry.score ?? 0;
      this.add.text(width / 2, height * 0.74 + i * 20, `${i + 1}. ${name}  ${score}m`, {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: i === 0 ? '#ffdd00' : '#cccccc',
      }).setOrigin(0.5);
    });
  }

  retry() {
    this.scene.stop('GameOverScene');
    this.scene.start('GameScene');
    this.scene.start('UIScene');
    this.scene.bringToTop('UIScene');
  }
}
