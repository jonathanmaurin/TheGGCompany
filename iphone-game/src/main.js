import Phaser from 'phaser';

const BLOCK_HEIGHT = 30;
const COLORS = [0xFF6B6B, 0xFFE66D, 0x4ECDC4, 0xA8E6CF, 0xFF8B94, 0xC3A6FF, 0xFFD93D, 0x95E1D3];
const PERFECT_TOLERANCE = 2;

// ─── BootScene ────────────────────────────────────────────────────────────────

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#111122');

    // Title
    this.add.text(width / 2, height / 2 - 60, 'STACK ATTACK', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#00ff88',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2, 'by TheGGCompany', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);

    // Tap to start hint
    const hint = this.add.text(width / 2, height / 2 + 80, 'Tap to Start', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#00ff88',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.input.once('pointerdown', () => this.scene.start('GameScene'));
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
  }
}

// ─── GameScene ────────────────────────────────────────────────────────────────

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.stack = [];           // Array of { x (center), y (center), width }
    this.score = 0;
    this.dropCount = 0;        // Successful drops
    this.gameRunning = false;
    this.currentBlockData = null;
    this.currentColorIndex = 0;
    this.currentGraphics = null;
    this.moveTween = null;
    this.targetCameraY = 0;
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#111122');

    // Base block near the bottom
    const baseWidth = 200;
    const baseY = height - 80;
    this.addBlockToStack(width / 2, baseY, baseWidth);

    // Score text — fixed to camera (scrollFactor 0)
    this.scoreText = this.add.text(width / 2, 60, '0', {
      fontFamily: 'monospace',
      fontSize: '56px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    // Input
    this.input.on('pointerdown', this.onDrop, this);
    this.input.keyboard.on('keydown-SPACE', this.onDrop, this);

    // Start game
    this.gameRunning = true;
    this.spawnBlock();

    // Snap camera to initial position (no lerp lag at start)
    this.cameras.main.setScrollY(this.targetCameraY);
  }

  // ── Block management ──────────────────────────────────────────────────────

  addBlockToStack(cx, cy, w) {
    const colorIndex = this.stack.length % COLORS.length;
    const g = this.add.graphics();
    g.fillStyle(COLORS[colorIndex]);
    g.fillRect(cx - w / 2, cy - BLOCK_HEIGHT / 2, w, BLOCK_HEIGHT);
    // Subtle highlight stripe at the top
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(cx - w / 2, cy - BLOCK_HEIGHT / 2, w, 5);
    this.stack.push({ x: cx, y: cy, width: w });
    return g;
  }

  spawnBlock() {
    const top = this.stack[this.stack.length - 1];
    const newY = top.y - BLOCK_HEIGHT;
    const newWidth = top.width;
    const { width, height } = this.scale;

    // Update camera target: keep new block at ~35% from top of viewport
    this.targetCameraY = newY - height * 0.35;

    // Direction alternates each drop
    const movingRight = this.dropCount % 2 === 0;
    const startX = movingRight ? -newWidth / 2 : width + newWidth / 2;
    const endX   = movingRight ? width + newWidth / 2 : -newWidth / 2;

    // Speed: increase every 5 drops, min duration 400ms
    const speedLevel = Math.floor(this.dropCount / 5);
    const duration = Math.max(400, 2000 - speedLevel * 150);

    this.currentBlockData = { x: startX, y: newY, width: newWidth };
    this.currentColorIndex = this.stack.length % COLORS.length;

    this.currentGraphics = this.add.graphics();
    this.drawCurrentBlock();

    this.moveTween = this.tweens.add({
      targets: this.currentBlockData,
      x: endX,
      duration,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
      onUpdate: () => this.drawCurrentBlock(),
    });
  }

  drawCurrentBlock() {
    if (!this.currentGraphics || !this.currentBlockData) return;
    const { x, y, width } = this.currentBlockData;
    const g = this.currentGraphics;
    g.clear();
    g.fillStyle(COLORS[this.currentColorIndex]);
    g.fillRect(x - width / 2, y - BLOCK_HEIGHT / 2, width, BLOCK_HEIGHT);
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(x - width / 2, y - BLOCK_HEIGHT / 2, width, 5);
  }

  // ── Drop logic ────────────────────────────────────────────────────────────

  onDrop() {
    if (!this.gameRunning || !this.moveTween || !this.currentBlockData) return;

    this.moveTween.stop();
    this.moveTween = null;

    const top = this.stack[this.stack.length - 1];
    const { x: blockX, y: blockY, width: blockW } = this.currentBlockData;

    const blockLeft  = blockX - blockW / 2;
    const blockRight = blockX + blockW / 2;
    const topLeft    = top.x - top.width / 2;
    const topRight   = top.x + top.width / 2;

    const overlapLeft  = Math.max(blockLeft, topLeft);
    const overlapRight = Math.min(blockRight, topRight);
    const overlapW     = overlapRight - overlapLeft;

    // Complete miss
    if (overlapW <= 0) {
      this.currentGraphics.destroy();
      this.currentGraphics = null;
      this.triggerGameOver();
      return;
    }

    const isPerfect = Math.abs(blockX - top.x) <= PERFECT_TOLERANCE;
    let finalW, finalCX;

    if (isPerfect) {
      finalW  = top.width;
      finalCX = top.x;
    } else {
      finalW  = overlapW;
      finalCX = (overlapLeft + overlapRight) / 2;

      // Animate trimmed piece falling away
      const trimW  = blockW - overlapW;
      const trimCX = blockLeft < topLeft
        ? blockLeft + trimW / 2
        : topRight + trimW / 2;
      this.animateTrim(trimCX, blockY, trimW);
    }

    // Destroy sliding graphics, place settled block
    this.currentGraphics.destroy();
    this.currentGraphics = null;
    this.addBlockToStack(finalCX, blockY, finalW);

    this.score++;
    this.dropCount++;
    this.scoreText.setText(this.score.toString());

    // Game over: block too thin
    if (finalW < 10) {
      this.triggerGameOver();
      return;
    }

    this.spawnBlock();
  }

  animateTrim(cx, cy, w) {
    const colorIndex = this.currentColorIndex;
    const g = this.add.graphics();
    const state = { dy: 0, alpha: 0.85 };

    const redraw = () => {
      g.clear();
      g.fillStyle(COLORS[colorIndex], state.alpha);
      g.fillRect(cx - w / 2, cy - BLOCK_HEIGHT / 2 + state.dy, w, BLOCK_HEIGHT);
    };

    redraw();

    this.tweens.add({
      targets: state,
      dy: 350,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeIn',
      onUpdate: redraw,
      onComplete: () => g.destroy(),
    });
  }

  // ── Game over ─────────────────────────────────────────────────────────────

  triggerGameOver() {
    this.gameRunning = false;
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }

    // Flash effect
    this.cameras.main.shake(300, 0.01);

    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', { score: this.score });
    });
  }

  // ── Update loop ───────────────────────────────────────────────────────────

  update() {
    // Smooth camera follow toward targetCameraY
    const curY  = this.cameras.main.scrollY;
    const nextY = Phaser.Math.Linear(curY, this.targetCameraY, 0.08);
    this.cameras.main.setScrollY(nextY);
  }
}

// ─── GameOverScene ────────────────────────────────────────────────────────────

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#111122');

    this.add.text(width / 2, height / 2 - 120, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#FF6B6B',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 40, `Score: ${this.finalScore}`, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const restart = this.add.text(width / 2, height / 2 + 80, 'Tap to Play Again', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#4ECDC4',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restart,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.input.once('pointerdown', () => this.scene.start('GameScene'));
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
  }
}

// ─── Phaser config ────────────────────────────────────────────────────────────

const config = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  backgroundColor: '#111122',
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 568 },
    max: { width: 430, height: 932 },
  },
  scene: [BootScene, GameScene, GameOverScene],
};

new Phaser.Game(config);
