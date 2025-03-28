// Pac-Man class for the Pac-Man game

class PacMan {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.speed = PACMAN_SPEED;
        this.direction = DIRECTION.NONE;
        this.nextDirection = DIRECTION.NONE;
        this.angle = 0;
        this.mouthOpen = 0;
        this.mouthDir = 1;
        this.lives = 3;
        this.score = 0;
        this.dotCount = 0;
        this.powerMode = false;
        this.powerModeTime = 0;
        this.powerModeEndTime = 0;
        this.ghostsEaten = 0;
        this.isDying = false;
        this.deathAnimationFrame = 0;
        this.deathAnimationTime = 0;
    }

    /**
     * Initialize Pac-Man at the spawn position
     */
    init() {
        const spawn = gameMap.pacmanSpawn;
        const spawnPixel = gridToPixel(spawn.row, spawn.column);
        
        this.x = spawnPixel.x;
        this.y = spawnPixel.y;
        this.direction = DIRECTION.LEFT;
        this.nextDirection = DIRECTION.LEFT;
        this.angle = Math.PI;
        this.mouthOpen = 0;
        this.mouthDir = 1;
        this.isDying = false;
        this.deathAnimationFrame = 0;
        this.deathAnimationTime = 0;
        this.ghostsEaten = 0;
    }

    /**
     * Reset Pac-Man for a new life
     */
    reset() {
        this.init();
        this.powerMode = false;
        this.powerModeTime = 0;
        this.powerModeEndTime = 0;
    }

    /**
     * Reset Pac-Man for a new game
     */
    resetGame() {
        this.reset();
        this.lives = 3;
        this.score = 0;
        this.dotCount = 0;
    }

    /**
     * Update Pac-Man's state
     * @param {number} deltaTime - Time elapsed since the last update
     */
    update(deltaTime) {
        if (this.isDying) {
            this.updateDeathAnimation(deltaTime);
            return;
        }

        // Update mouth animation
        this.mouthOpen += this.mouthDir * 0.15;
        if (this.mouthOpen >= 0.5) {
            this.mouthDir = -1;
        } else if (this.mouthOpen <= 0) {
            this.mouthDir = 1;
        }

        // Update power mode timer
        if (this.powerMode) {
            this.powerModeTime += deltaTime;
            if (this.powerModeTime >= this.powerModeEndTime) {
                this.powerMode = false;
                this.ghostsEaten = 0;
            }
        }

        // Try to change direction if requested
        if (this.nextDirection !== this.direction) {
            this.tryChangeDirection();
        }

        // Move in the current direction
        this.move(deltaTime);

        // Check for dots and power pellets
        this.checkCollectibles();

        // Check for tunnel teleportation
        this.checkTunnel();
    }

    /**
     * Try to change Pac-Man's direction
     */
    tryChangeDirection() {
        const { row, column } = pixelToGrid(this.x, this.y);
        
        // Only allow direction changes at tile centers
        if (!isAtTileCenter(this.x, this.y)) {
            return;
        }
        
        // Check if the next direction is valid
        const nextDir = directionToVector(this.nextDirection);
        const nextRow = row + nextDir.y;
        const nextColumn = column + nextDir.x;
        
        if (gameMap.canMove(nextRow, nextColumn)) {
            this.direction = this.nextDirection;
            
            // Update angle based on direction
            switch (this.direction) {
                case DIRECTION.UP:
                    this.angle = -Math.PI / 2;
                    break;
                case DIRECTION.RIGHT:
                    this.angle = 0;
                    break;
                case DIRECTION.DOWN:
                    this.angle = Math.PI / 2;
                    break;
                case DIRECTION.LEFT:
                    this.angle = Math.PI;
                    break;
            }
        }
    }

    /**
     * Move Pac-Man in the current direction
     * @param {number} deltaTime - Time elapsed since the last update
     */
    move(deltaTime) {
        if (this.direction === DIRECTION.NONE) {
            return;
        }
        
        const { row, column } = pixelToGrid(this.x, this.y);
        const dirVector = directionToVector(this.direction);
        
        // Calculate next position
        const nextX = this.x + dirVector.x * this.speed;
        const nextY = this.y + dirVector.y * this.speed;
        const nextGrid = pixelToGrid(nextX, nextY);
        
        // Check if the next position is valid
        if (gameMap.canMove(nextGrid.row, nextGrid.column)) {
            this.x = nextX;
            this.y = nextY;
        } else {
            // If we hit a wall, align to the center of the current tile
            const centerPos = gridToPixel(row, column);
            this.x = centerPos.x;
            this.y = centerPos.y;
            this.direction = DIRECTION.NONE;
        }
    }

    /**
     * Check for collectible items (dots and power pellets)
     */
    checkCollectibles() {
        const { row, column } = pixelToGrid(this.x, this.y);
        
        // Only check at tile centers
        if (!isAtTileCenter(this.x, this.y)) {
            return;
        }
        
        const consumed = gameMap.consumeDot(row, column);
        
        if (consumed === TILE_TYPE.DOT) {
            this.score += SCORE.DOT;
            this.dotCount++;
            audioManager.play('munch');
        } else if (consumed === TILE_TYPE.POWER_PELLET) {
            this.score += SCORE.POWER_PELLET;
            this.activatePowerMode();
            audioManager.play('munch');
        }
    }

    /**
     * Activate power mode
     */
    activatePowerMode() {
        this.powerMode = true;
        this.powerModeTime = 0;
        this.ghostsEaten = 0;
        
        // Get the duration based on the current level
        const levelConfig = getLevelConfig(game.level);
        this.powerModeEndTime = levelConfig.frightTime;
        
        // Make ghosts frightened
        ghostManager.enterFrightenedMode(this.powerModeEndTime);
    }

    /**
     * Check for tunnel teleportation
     */
    checkTunnel() {
        const { row, column } = pixelToGrid(this.x, this.y);
        
        if (gameMap.isTunnel(row, column)) {
            // Only teleport when at the center of the tunnel tile
            if (isAtTileCenter(this.x, this.y)) {
                const oppositeTunnel = gameMap.getOppositeTunnel(row, column);
                
                if (oppositeTunnel) {
                    const newPos = gridToPixel(oppositeTunnel.row, oppositeTunnel.column);
                    this.x = newPos.x;
                    this.y = newPos.y;
                }
            }
        }
    }

    /**
     * Start the death animation
     */
    die() {
        this.isDying = true;
        this.deathAnimationFrame = 0;
        this.deathAnimationTime = 0;
        this.lives--;
        
        audioManager.play('death');
    }

    /**
     * Update the death animation
     * @param {number} deltaTime - Time elapsed since the last update
     */
    updateDeathAnimation(deltaTime) {
        this.deathAnimationTime += deltaTime;
        
        // Update animation frame every 100ms
        if (this.deathAnimationTime >= 100) {
            this.deathAnimationFrame++;
            this.deathAnimationTime = 0;
            
            // Animation complete after 11 frames
            if (this.deathAnimationFrame >= 11) {
                this.isDying = false;
                game.onPacManDeathComplete();
            }
        }
    }

    /**
     * Set the next direction based on user input
     * @param {number} direction - New direction
     */
    setDirection(direction) {
        this.nextDirection = direction;
    }

    /**
     * Draw Pac-Man on the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        if (this.isDying) {
            this.drawDeathAnimation(ctx);
        } else {
            this.drawNormal(ctx);
        }
    }

    /**
     * Draw Pac-Man in normal state
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawNormal(ctx) {
        ctx.save();
        
        // Move to Pac-Man's position
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw Pac-Man
        ctx.fillStyle = COLORS.PACMAN;
        ctx.beginPath();
        
        // Mouth angle based on animation
        const mouthAngle = this.mouthOpen * Math.PI;
        
        // Draw the Pac-Man circle with a mouth
        ctx.arc(0, 0, SCALED_TILE_SIZE / 2, mouthAngle, 2 * Math.PI - mouthAngle);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * Draw Pac-Man's death animation
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawDeathAnimation(ctx) {
        ctx.save();
        
        // Move to Pac-Man's position
        ctx.translate(this.x, this.y);
        
        // Draw Pac-Man's death animation
        ctx.fillStyle = COLORS.PACMAN;
        ctx.beginPath();
        
        // Animation progress from 0 to 1
        const progress = Math.min(this.deathAnimationFrame / 10, 1);
        
        // Mouth opens fully and then rotates clockwise
        const startAngle = progress * Math.PI;
        const endAngle = 2 * Math.PI - startAngle;
        
        ctx.arc(0, 0, SCALED_TILE_SIZE / 2, startAngle, endAngle);
        
        if (progress < 1) {
            ctx.lineTo(0, 0);
        }
        
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * Draw Pac-Man's lives
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X coordinate to start drawing
     * @param {number} y - Y coordinate to start drawing
     */
    drawLives(ctx, x, y) {
        for (let i = 0; i < this.lives; i++) {
            ctx.fillStyle = COLORS.PACMAN;
            ctx.beginPath();
            ctx.arc(
                x + i * (SCALED_TILE_SIZE + 5), 
                y, 
                SCALED_TILE_SIZE / 2 - 2, 
                0.2 * Math.PI, 
                1.8 * Math.PI
            );
            ctx.lineTo(x + i * (SCALED_TILE_SIZE + 5), y);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// Create and export a singleton instance
const pacman = new PacMan();
