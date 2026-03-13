import Phaser from 'phaser';

const BLOCK_HEIGHT = 30;
// Warm palette: coral, gold, teal, purple, lime
const COLORS = [0xFF6B6B, 0xFFD93D, 0x4ECDC4, 0xC3A6FF, 0x8BC34A, 0xFF8B94, 0x80DEEA];
const PERFECT_TOLERANCE = 2;
const LS_KEY = 'stackattack_best';

// ─── BootScene ────────────────────────────────────────────────────────────────

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#111122');

    this.add.text(width / 2, height / 2 - 80, 'STACK ATTACK', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#00ff88',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 20, 'by TheGGCompany', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);

    const best = parseInt(localStorage.getItem(LS_KEY) || '0');
    if (best > 0) {
      this.add.text(width / 2, height / 2 + 30, `Best: ${best}`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#FFD93D',
      }).setOrigin(0.5);
    }

    const hint = this.add.text(width / 2, height / 2 + 100, 'Tap to Start', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#00ff88',
    }).setOrigin(0.5);

    this.tweens.add({ targets: hint, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

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
    this.stack = [];           // { x, y, width }
    this.score = 0;
    this.dropCount = 0;
    this.comboCount = 0;       // consecutive perfect drops
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

    // Base block
    const baseWidth = 200;
    const baseY = height - 80;
    this.addBlockToStack(width / 2, baseY, baseWidth);

    // Score — fixed to camera
    this.scoreText = this.add.text(width / 2, 55, '0', {
      fontFamily: 'monospace',
      fontSize: '56px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    // Combo label (hidden initially)
    this.comboText = this.add.text(width / 2, 115, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#FFD93D',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setAlpha(0);

    this.input.on('pointerdown', this.onDrop, this);
    this.input.keyboard.on('keydown-SPACE', this.onDrop, this);

    this.gameRunning = true;
    this.spawnBlock();
    this.cameras.main.setScrollY(this.targetCameraY);
  }

  // ── Block helpers ─────────────────────────────────────────────────────────

  addBlockToStack(cx, cy, w) {
    const colorIndex = this.stack.length % COLORS.length;
    const g = this.add.graphics();
    // Drop shadow
    g.fillStyle(0x000000, 0.28);
    g.fillRect(cx - w / 2 + 4, cy - BLOCK_HEIGHT / 2 + 5, w, BLOCK_HEIGHT);
    // Main block
    g.fillStyle(COLORS[colorIndex]);
    g.fillRect(cx - w / 2, cy - BLOCK_HEIGHT / 2, w, BLOCK_HEIGHT);
    // Highlight stripe
    g.fillStyle(0xffffff, 0.2);
    g.fillRect(cx - w / 2, cy - BLOCK_HEIGHT / 2, w, 5);
    this.stack.push({ x: cx, y: cy, width: w });
    return g;
  }

  spawnBlock() {
    const top = this.stack[this.stack.length - 1];
    const newY = top.y - BLOCK_HEIGHT;
    const newWidth = top.width;
    const { width, height } = this.scale;

    // Camera target: keep new block ~35% from top of viewport
    this.targetCameraY = newY - height * 0.35;

    const movingRight = this.dropCount % 2 === 0;
    const startX = movingRight ? -newWidth / 2 : width + newWidth / 2;
    const endX   = movingRight ? width + newWidth / 2 : -newWidth / 2;

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
    g.fillStyle(0x000000, 0.28);
    g.fillRect(x - width / 2 + 4, y - BLOCK_HEIGHT / 2 + 5, width, BLOCK_HEIGHT);
    g.fillStyle(COLORS[this.currentColorIndex]);
    g.fillRect(x - width / 2, y - BLOCK_HEIGHT / 2, width, BLOCK_HEIGHT);
    g.fillStyle(0xffffff, 0.2);
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

    if (overlapW <= 0) {
      this.comboCount = 0;
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
      this.comboCount++;
      this.showPerfectFlash(blockY);
    } else {
      finalW  = overlapW;
      finalCX = (overlapLeft + overlapRight) / 2;
      this.comboCount = 0;

      const trimW  = blockW - overlapW;
      const trimCX = blockLeft < topLeft
        ? blockLeft + trimW / 2
        : topRight + trimW / 2;
      this.animateTrim(trimCX, blockY, trimW);
    }

    // Update combo display
    this.updateComboDisplay();

    // Score: base 1 + (comboCount - 1) bonus if in combo
    const points = isPerfect ? this.comboCount : 1;
    this.score += points;
    this.dropCount++;
    this.scoreText.setText(this.score.toString());

    this.currentGraphics.destroy();
    this.currentGraphics = null;
    this.addBlockToStack(finalCX, blockY, finalW);

    if (finalW < 10) {
      this.triggerGameOver();
      return;
    }

    this.spawnBlock();
  }

  showPerfectFlash(worldY) {
    const { width } = this.scale;
    const screenY = worldY - this.cameras.main.scrollY;
    const label = this.comboCount > 1 ? `PERFECT  x${this.comboCount}` : 'PERFECT!';

    const text = this.add.text(width / 2, screenY - 10, label, {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#FFD93D',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20);

    this.tweens.add({
      targets: text,
      y: screenY - 70,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  updateComboDisplay() {
    if (this.comboCount >= 2) {
      this.comboText.setText(`COMBO  x${this.comboCount}`);
      this.tweens.killTweensOf(this.comboText);
      this.comboText.setAlpha(1);
    } else {
      this.tweens.add({
        targets: this.comboText,
        alpha: 0,
        duration: 300,
      });
    }
  }

  animateTrim(cx, cy, w) {
    const color = COLORS[this.currentColorIndex];
    const piece = this.add.rectangle(cx, cy, w, BLOCK_HEIGHT, color, 0.85);

    this.tweens.add({
      targets: piece,
      y: cy + 350,
      angle: Phaser.Math.Between(-120, 120),
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeIn',
      onComplete: () => piece.destroy(),
    });
  }

  // ── Game over ─────────────────────────────────────────────────────────────

  triggerGameOver() {
    this.gameRunning = false;
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }
    this.cameras.main.shake(300, 0.012);
    this.time.delayedCall(900, () => {
      this.scene.start('GameOverScene', { score: this.score });
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update() {
    // Smooth camera follow
    const curY  = this.cameras.main.scrollY;
    const nextY = Phaser.Math.Linear(curY, this.targetCameraY, 0.08);
    this.cameras.main.setScrollY(nextY);

    // Background darkens as stack grows (dark blue → near-black at 30 stacks)
    const t = Phaser.Math.Clamp((this.stack.length - 1) / 30, 0, 1);
    const r = Math.round(Phaser.Math.Linear(0x11, 0x04, t));
    const g = Math.round(Phaser.Math.Linear(0x11, 0x04, t));
    const b = Math.round(Phaser.Math.Linear(0x22, 0x08, t));
    this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(r, g, b));
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

    // Read / write high score
    const prevBest = parseInt(localStorage.getItem(LS_KEY) || '0');
    const isNewBest = this.finalScore > prevBest;
    if (isNewBest) {
      localStorage.setItem(LS_KEY, this.finalScore.toString());
    }
    const best = isNewBest ? this.finalScore : prevBest;

    this.add.text(width / 2, height / 2 - 160, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#FF6B6B',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Score — count up animation
    const scoreText = this.add.text(width / 2, height / 2 - 70, 'Score: 0', {
      fontFamily: 'monospace',
      fontSize: '34px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const counter = { val: 0 };
    this.tweens.add({
      targets: counter,
      val: this.finalScore,
      duration: Math.min(1200, Math.max(400, this.finalScore * 25)),
      ease: 'Cubic.easeOut',
      onUpdate: () => scoreText.setText(`Score: ${Math.floor(counter.val)}`),
    });

    // Best score
    this.add.text(width / 2, height / 2 - 10, `Best: ${best}`, {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#888888',
    }).setOrigin(0.5);

    // NEW HIGH SCORE badge
    if (isNewBest && this.finalScore > 0) {
      const badge = this.add.text(width / 2, height / 2 + 45, '★  NEW HIGH SCORE!  ★', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#FFD93D',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);

      this.tweens.add({
        targets: badge,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Tap to restart
    const restart = this.add.text(width / 2, height / 2 + 130, 'Tap to Play Again', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#4ECDC4',
    }).setOrigin(0.5);

    this.tweens.add({ targets: restart, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

    // Delay input slightly so accidental taps don't skip game over screen
    this.time.delayedCall(600, () => {
      this.input.once('pointerdown', () => this.scene.start('GameScene'));
      this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
    });
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
