import { GAME_CONFIG } from '../config.js';
import { CrazyGamesSDK } from '../CrazyGamesSDK.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.distance = data?.startDistance ?? 0;
    this.coins = data?.startCoins ?? 0;
    this.speed = GAME_CONFIG.INITIAL_SPEED;
    this.isAlive = true;
    this.obstacleTimer = 0;
    this.coinTimer = 0;
    this.nextObstacleIn = 0;
    this.nextCoinIn = 0;
    this.reviveAvailable = !data?.revived; // one revive per run
    this.reviveOverlay = null;
  }

  create() {
    const { width, height } = this.scale;

    // Backgrounds (parallax)
    this.bg1 = this.add.tileSprite(0, 0, width, height, 'bg1').setOrigin(0).setScrollFactor(0);
    this.bg2 = this.add.tileSprite(0, 0, width, height, 'bg2').setOrigin(0).setScrollFactor(0);

    // Ground
    this.groundY = height - 48;
    this.ground = this.physics.add.staticGroup();
    const groundTile = this.add.tileSprite(0, this.groundY, width, 48, 'ground').setOrigin(0);
    this.physics.add.existing(groundTile, true);
    this.ground.add(groundTile);

    // Player
    this.player = this.physics.add.sprite(100, this.groundY - 12, 'player');
    this.player.setOrigin(0.5, 1);
    this.player.setBounce(0);
    this.player.setCollideWorldBounds(true);

    // Collider: player <-> ground
    this.physics.add.collider(this.player, this.ground);

    // Obstacle and coin groups
    this.obstacles = this.physics.add.group();
    this.coinGroup = this.physics.add.group();

    // Overlap: player <-> obstacles → death
    this.physics.add.overlap(this.player, this.obstacles, this.onHitObstacle, null, this);

    // Overlap: player <-> coins → collect
    this.physics.add.overlap(this.player, this.coinGroup, this.onCollectCoin, null, this);

    // Controls
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.input.on('pointerdown', (pointer) => {
      // Ignore taps that land on revive overlay buttons
      if (this.reviveOverlay) return;
      this.tryJump();
    });

    // Schedule first obstacle
    this.nextObstacleIn = GAME_CONFIG.OBSTACLE_INITIAL_DELAY;
    this.nextCoinIn = GAME_CONFIG.COIN_INITIAL_DELAY;

    // Notify SDK that gameplay has started
    CrazyGamesSDK.gameplayStart();
  }

  update(time, delta) {
    if (!this.isAlive) return;

    const dt = delta / 1000; // seconds

    // Update distance (meters)
    this.distance += this.speed * dt;

    // Speed scaling
    const speedTier = Math.floor(this.distance / 500);
    this.speed = GAME_CONFIG.INITIAL_SPEED + speedTier * GAME_CONFIG.SPEED_INCREMENT;
    this.speed = Math.min(this.speed, GAME_CONFIG.MAX_SPEED);

    // Parallax scroll
    this.bg1.tilePositionX += this.speed * 0.1 * dt;
    this.bg2.tilePositionX += this.speed * 0.3 * dt;

    // Jump input
    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) || Phaser.Input.Keyboard.JustDown(this.upKey)) {
      this.tryJump();
    }

    // Spawn obstacles
    this.obstacleTimer += delta;
    if (this.obstacleTimer >= this.nextObstacleIn) {
      this.spawnObstacle();
      this.obstacleTimer = 0;
      this.nextObstacleIn = this.getNextObstacleDelay();
    }

    // Spawn coins
    this.coinTimer += delta;
    if (this.coinTimer >= this.nextCoinIn) {
      this.spawnCoin();
      this.coinTimer = 0;
      this.nextCoinIn = Phaser.Math.Between(800, 2000);
    }

    // Move obstacles left (velocity so physics body + game object stay in sync)
    this.obstacles.getChildren().forEach((obj) => {
      obj.setVelocityX(-this.speed);
      if (obj.x < -100) obj.destroy();
    });

    // Move coins left
    this.coinGroup.getChildren().forEach((obj) => {
      obj.setVelocityX(-this.speed);
      if (obj.x < -50) obj.destroy();
    });

    // Emit distance/coins to UI
    this.events.emit('update-score', { distance: Math.floor(this.distance), coins: this.coins });
  }

  tryJump() {
    if (!this.isAlive) return;
    const onGround = this.player.body.blocked.down;
    if (onGround) {
      this.player.setVelocityY(-GAME_CONFIG.JUMP_VELOCITY);
    }
  }

  spawnObstacle() {
    const { width } = this.scale;
    const type = Math.random() < 0.6 ? 'spike' : 'block';
    const obj = this.physics.add.image(width + 50, this.groundY, type);
    obj.setOrigin(0.5, 1);
    obj.body.setAllowGravity(false);
    obj.body.setImmovable(true);
    obj.setVelocityX(-this.speed);
    this.obstacles.add(obj);
  }

  spawnCoin() {
    const { width } = this.scale;
    const yOptions = [this.groundY - 20, this.groundY - 60, this.groundY - 100];
    const y = yOptions[Phaser.Math.Between(0, yOptions.length - 1)];
    const coin = this.physics.add.image(width + 30, y, 'coin');
    coin.body.setAllowGravity(false);
    coin.setVelocityX(-this.speed);
    this.coinGroup.add(coin);
  }

  getNextObstacleDelay() {
    const minDelay = Math.max(600, 1400 - Math.floor(this.distance / 1000) * 100);
    const maxDelay = minDelay + 800;
    return Phaser.Math.Between(minDelay, maxDelay);
  }

  onHitObstacle() {
    if (!this.isAlive) return;
    this.isAlive = false;

    this.player.setTint(0xff0000);
    this.physics.pause();

    this.time.delayedCall(800, () => {
      if (this.reviveAvailable) {
        this.showReviveDialog();
      } else {
        this.endRun();
      }
    });
  }

  showReviveDialog() {
    const { width, height } = this.scale;

    // Semi-transparent dark overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(10);

    const titleText = this.add.text(width / 2, height * 0.3, 'CONTINUE?', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(11);

    const reviveBtn = this.add.text(width / 2, height * 0.5, '► WATCH AD TO REVIVE', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#44ff44',
      backgroundColor: '#003300',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

    const quitBtn = this.add.text(width / 2, height * 0.68, '✕  QUIT', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ff4444',
      backgroundColor: '#330000',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

    this.reviveOverlay = { overlay, titleText, reviveBtn, quitBtn };

    reviveBtn.on('pointerover', () => reviveBtn.setStyle({ color: '#88ff88' }));
    reviveBtn.on('pointerout', () => reviveBtn.setStyle({ color: '#44ff44' }));
    reviveBtn.on('pointerdown', () => this.onReviveChosen());

    quitBtn.on('pointerover', () => quitBtn.setStyle({ color: '#ff8888' }));
    quitBtn.on('pointerout', () => quitBtn.setStyle({ color: '#ff4444' }));
    quitBtn.on('pointerdown', () => this.endRun());
  }

  async onReviveChosen() {
    if (!this.reviveOverlay) return;

    // Disable buttons to prevent double-tap
    const { overlay, titleText, reviveBtn, quitBtn } = this.reviveOverlay;
    reviveBtn.disableInteractive();
    quitBtn.disableInteractive();
    reviveBtn.setText('Loading ad...');

    CrazyGamesSDK.gameplayStop();
    const rewarded = await CrazyGamesSDK.requestRewardedAd();

    if (rewarded) {
      // Destroy overlay and resume gameplay
      overlay.destroy();
      titleText.destroy();
      reviveBtn.destroy();
      quitBtn.destroy();
      this.reviveOverlay = null;
      this.reviveAvailable = false;

      // Heal and resume
      this.player.clearTint();
      this.physics.resume();
      this.isAlive = true;

      // Brief invincibility flash
      this.tweens.add({
        targets: this.player,
        alpha: 0,
        duration: 150,
        ease: 'Linear',
        yoyo: true,
        repeat: 5,
        onComplete: () => { this.player.setAlpha(1); },
      });

      CrazyGamesSDK.gameplayStart();
    } else {
      // Ad failed or skipped — just end the run
      this.endRun();
    }
  }

  async endRun() {
    // Destroy revive overlay if present
    if (this.reviveOverlay) {
      this.reviveOverlay.overlay.destroy();
      this.reviveOverlay.titleText.destroy();
      this.reviveOverlay.reviveBtn.destroy();
      this.reviveOverlay.quitBtn.destroy();
      this.reviveOverlay = null;
    }

    const finalDistance = Math.floor(this.distance);
    const highScore = parseInt(localStorage.getItem('pixelDashHighScore') || '0');
    if (finalDistance > highScore) {
      localStorage.setItem('pixelDashHighScore', finalDistance.toString());
    }

    CrazyGamesSDK.gameplayStop();
    await CrazyGamesSDK.requestMidgameAd();

    this.scene.stop('UIScene');
    this.scene.start('GameOverScene', { distance: finalDistance, coins: this.coins });
  }

  onCollectCoin(player, coin) {
    coin.destroy();
    this.coins++;
  }
}
