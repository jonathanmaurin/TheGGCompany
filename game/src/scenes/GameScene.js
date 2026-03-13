import { GAME_CONFIG } from '../config.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.distance = 0;
    this.coins = 0;
    this.speed = GAME_CONFIG.INITIAL_SPEED;
    this.isAlive = true;
    this.obstacleTimer = 0;
    this.coinTimer = 0;
    this.nextObstacleIn = 0;
    this.nextCoinIn = 0;
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
    this.input.on('pointerdown', () => this.tryJump());

    // Schedule first obstacle
    this.nextObstacleIn = GAME_CONFIG.OBSTACLE_INITIAL_DELAY;
    this.nextCoinIn = GAME_CONFIG.COIN_INITIAL_DELAY;
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

    // Move obstacles left
    this.obstacles.getChildren().forEach((obj) => {
      obj.x -= this.speed * dt;
      if (obj.x < -100) obj.destroy();
    });

    // Move coins left
    this.coinGroup.getChildren().forEach((obj) => {
      obj.x -= this.speed * dt;
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
    this.obstacles.add(obj);
  }

  spawnCoin() {
    const { width } = this.scale;
    const yOptions = [this.groundY - 20, this.groundY - 60, this.groundY - 100];
    const y = yOptions[Phaser.Math.Between(0, yOptions.length - 1)];
    const coin = this.physics.add.image(width + 30, y, 'coin');
    coin.body.setAllowGravity(false);
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
      const finalDistance = Math.floor(this.distance);
      const highScore = parseInt(localStorage.getItem('pixelDashHighScore') || '0');
      if (finalDistance > highScore) {
        localStorage.setItem('pixelDashHighScore', finalDistance.toString());
      }

      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', { distance: finalDistance, coins: this.coins });
    });
  }

  onCollectCoin(player, coin) {
    coin.destroy();
    this.coins++;
  }
}
