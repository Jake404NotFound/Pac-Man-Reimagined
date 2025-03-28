// Ghost class for the Pac-Man game

class Ghost {
    constructor(type) {
        this.type = type;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.direction = DIRECTION.NONE;
        this.nextDirection = DIRECTION.NONE;
        this.speed = GHOST_SPEED;
        this.mode = GHOST_MODE.HOUSE;
        this.previousMode = GHOST_MODE.SCATTER;
        this.frightened = false;
        this.eaten = false;
        this.blinkTimer = 0;
        this.blinking = false;
        this.releaseTimer = 0;
        this.dotCounter = 0;
        this.housePosition = { x: 0, y: 0 };
        this.scatterTarget = { x: 0, y: 0 };
        this.elroyMode = 0; // 0 = not elroy, 1 = elroy 1, 2 = elroy 2
    }

    /**
     * Initialize the ghost at its spawn position
     */
    init() {
        // Set spawn position based on ghost type
        const spawn = gameMap.ghostSpawns[this.type];
        const spawnPixel = gridToPixel(spawn.row, spawn.column);
        
        this.x = spawnPixel.x;
        this.y = spawnPixel.y;
        this.housePosition = { x: this.x, y: this.y };
        
        // Set initial direction based on ghost type
        switch (this.type) {
            case GHOST_TYPE.BLINKY:
                this.direction = DIRECTION.LEFT;
                this.mode = GHOST_MODE.SCATTER;
                this.scatterTarget = gridToPixel(0, COLUMNS - 1); // Top-right corner
                break;
            case GHOST_TYPE.PINKY:
                this.direction = DIRECTION.DOWN;
                this.mode = GHOST_MODE.HOUSE;
                this.scatterTarget = gridToPixel(0, 0); // Top-left corner
                break;
            case GHOST_TYPE.INKY:
                this.direction = DIRECTION.UP;
                this.mode = GHOST_MODE.HOUSE;
                this.scatterTarget = gridToPixel(ROWS - 1, COLUMNS - 1); // Bottom-right corner
                break;
            case GHOST_TYPE.CLYDE:
                this.direction = DIRECTION.UP;
                this.mode = GHOST_MODE.HOUSE;
                this.scatterTarget = gridToPixel(ROWS - 1, 0); // Bottom-left corner
                break;
        }
        
        this.nextDirection = this.direction;
        this.frightened = false;
        this.eaten = false;
        this.blinkTimer = 0;
        this.blinking = false;
        this.releaseTimer = 0;
        this.dotCounter = 0;
        this.elroyMode = 0;
    }

    /**
     * Reset the ghost for a new life
     */
    reset() {
        this.init();
    }

    /**
     * Update the ghost's state
     * @param {number} deltaTime - Time elapsed since the last update
     * @param {Object} pacman - Pac-Man object
     * @param {Array} ghosts - Array of all ghosts
     * @param {number} dotsEaten - Number of dots eaten
     * @param {number} totalDots - Total number of dots in the level
     * @param {Object} levelConfig - Level configuration
     */
    update(deltaTime, pacman, ghosts, dotsEaten, totalDots, levelConfig) {
        // Update ghost mode based on current state
        this.updateMode(deltaTime, dotsEaten, totalDots, levelConfig);
        
        // Update ghost speed based on mode and location
        this.updateSpeed(levelConfig);
        
        // Update ghost target based on mode
        this.updateTarget(pacman, ghosts);
        
        // Move the ghost
        this.move(deltaTime);
        
        // Check for tunnel teleportation
        this.checkTunnel();
    }

    /**
     * Update the ghost's mode
     * @param {number} deltaTime - Time elapsed since the last update
     * @param {number} dotsEaten - Number of dots eaten
     * @param {number} totalDots - Total number of dots in the level
     * @param {Object} levelConfig - Level configuration
     */
    updateMode(deltaTime, dotsEaten, totalDots, levelConfig) {
        // Handle frightened mode
        if (this.frightened) {
            this.blinkTimer += deltaTime;
            
            // Check if frightened mode should end
            if (this.blinkTimer >= levelConfig.frightTime) {
                this.frightened = false;
                this.blinking = false;
                this.mode = this.previousMode;
                
                // Reverse direction when exiting frightened mode
                this.reverseDirection();
            } 
            // Start blinking near the end of frightened mode
            else if (this.blinkTimer >= levelConfig.frightTime - 2000 && levelConfig.frightFlashes > 0) {
                this.blinking = Math.floor(this.blinkTimer / 200) % 2 === 0;
            }
            
            return;
        }
        
        // Handle eaten mode
        if (this.eaten) {
            // If the ghost has reached the ghost house
            if (this.isAtGhostHouseDoor()) {
                this.eaten = false;
                this.mode = GHOST_MODE.HOUSE;
                this.direction = DIRECTION.DOWN;
                this.nextDirection = DIRECTION.DOWN;
            }
            
            return;
        }
        
        // Handle ghost house mode
        if (this.mode === GHOST_MODE.HOUSE) {
            // Move up and down in the ghost house
            if (this.y <= this.housePosition.y - 8) {
                this.direction = DIRECTION.DOWN;
                this.nextDirection = DIRECTION.DOWN;
            } else if (this.y >= this.housePosition.y + 8) {
                this.direction = DIRECTION.UP;
                this.nextDirection = DIRECTION.UP;
            }
            
            // Check if the ghost should leave the house
            if (this.shouldLeaveHouse(dotsEaten)) {
                this.mode = GHOST_MODE.LEAVING_HOUSE;
                this.direction = DIRECTION.UP;
                this.nextDirection = DIRECTION.UP;
            }
            
            return;
        }
        
        // Handle leaving house mode
        if (this.mode === GHOST_MODE.LEAVING_HOUSE) {
            // If the ghost has reached the ghost house door
            if (this.isAtGhostHouseDoor()) {
                this.mode = GHOST_MODE.SCATTER;
                this.direction = DIRECTION.LEFT;
                this.nextDirection = DIRECTION.LEFT;
            }
            
            return;
        }
        
        // Check if Blinky should enter Elroy mode
        if (this.type === GHOST_TYPE.BLINKY) {
            const remainingDots = totalDots - dotsEaten;
            
            if (remainingDots <= levelConfig.elroy1DotsLeft && this.elroyMode < 1) {
                this.elroyMode = 1;
            }
            
            if (remainingDots <= levelConfig.elroy2DotsLeft && this.elroyMode < 2) {
                this.elroyMode = 2;
            }
        }
    }

    /**
     * Update the ghost's speed
     * @param {Object} levelConfig - Level configuration
     */
    updateSpeed(levelConfig) {
        // Base speed adjusted by level
        let baseSpeed = GHOST_SPEED * levelConfig.ghostSpeed;
        
        // Adjust speed based on mode
        if (this.frightened) {
            this.speed = GHOST_FRIGHTENED_SPEED * levelConfig.ghostSpeed;
        } else if (this.eaten) {
            this.speed = GHOST_SPEED * 2 * levelConfig.ghostSpeed; // Eaten ghosts move faster
        } else if (gameMap.isTunnel(pixelToGrid(this.x, this.y).row, pixelToGrid(this.x, this.y).column)) {
            this.speed = GHOST_TUNNEL_SPEED * levelConfig.ghostSpeed; // Slower in tunnels
        } else if (this.elroyMode === 1) {
            this.speed = baseSpeed * levelConfig.elroy1Speed;
        } else if (this.elroyMode === 2) {
            this.speed = baseSpeed * levelConfig.elroy2Speed;
        } else {
            this.speed = baseSpeed;
        }
    }

    /**
     * Update the ghost's target based on mode
     * @param {Object} pacman - Pac-Man object
     * @param {Array} ghosts - Array of all ghosts
     */
    updateTarget(pacman, ghosts) {
        if (this.frightened) {
            // In frightened mode, ghosts move randomly
            // Target is set in the chooseNextDirection method
            return;
        }
        
        if (this.eaten) {
            // When eaten, target the ghost house door
            const doorTile = gameMap.ghostDoorTiles[0];
            const doorPos = gridToPixel(doorTile.row, doorTile.column);
            this.targetX = doorPos.x;
            this.targetY = doorPos.y;
            return;
        }
        
        if (this.mode === GHOST_MODE.HOUSE || this.mode === GHOST_MODE.LEAVING_HOUSE) {
            // When in the house or leaving, target is set by the movement logic
            return;
        }
        
        if (this.mode === GHOST_MODE.SCATTER) {
            // In scatter mode, target the ghost's corner
            this.targetX = this.scatterTarget.x;
            this.targetY = this.scatterTarget.y;
            return;
        }
        
        // In chase mode, target depends on ghost type
        switch (this.type) {
            case GHOST_TYPE.BLINKY:
                // Blinky targets Pac-Man directly
                this.targetX = pacman.x;
                this.targetY = pacman.y;
                break;
                
            case GHOST_TYPE.PINKY:
                // Pinky targets 4 tiles ahead of Pac-Man
                const pacDir = directionToVector(pacman.direction);
                this.targetX = pacman.x + pacDir.x * 4 * SCALED_TILE_SIZE;
                this.targetY = pacman.y + pacDir.y * 4 * SCALED_TILE_SIZE;
                
                // Recreate the original Pac-Man bug where UP direction also shifts 4 tiles left
                if (pacman.direction === DIRECTION.UP) {
                    this.targetX -= 4 * SCALED_TILE_SIZE;
                }
                break;
                
            case GHOST_TYPE.INKY:
                // Inky targets a position that is the reflection of Blinky's position about a point 2 tiles ahead of Pac-Man
                const blinky = ghosts.find(ghost => ghost.type === GHOST_TYPE.BLINKY);
                const pacDirInky = directionToVector(pacman.direction);
                
                // Point 2 tiles ahead of Pac-Man
                const pivotX = pacman.x + pacDirInky.x * 2 * SCALED_TILE_SIZE;
                const pivotY = pacman.y + pacDirInky.y * 2 * SCALED_TILE_SIZE;
                
                // Recreate the original Pac-Man bug where UP direction also shifts 2 tiles left
                if (pacman.direction === DIRECTION.UP) {
                    this.targetX -= 2 * SCALED_TILE_SIZE;
                }
                
                // Vector from pivot to Blinky
                const vectorX = pivotX - blinky.x;
                const vectorY = pivotY - blinky.y;
                
                // Target is pivot + vector (reflection of Blinky about pivot)
                this.targetX = pivotX + vectorX;
                this.targetY = pivotY + vectorY;
                break;
                
            case GHOST_TYPE.CLYDE:
                // Clyde targets Pac-Man directly if far away, otherwise targets his scatter corner
                const distance = calculateDistance({ x: this.x, y: this.y }, { x: pacman.x, y: pacman.y });
                
                if (distance > 8 * SCALED_TILE_SIZE) {
                    // If far from Pac-Man, target him directly
                    this.targetX = pacman.x;
                    this.targetY = pacman.y;
                } else {
                    // If close to Pac-Man, target scatter corner
                    this.targetX = this.scatterTarget.x;
                    this.targetY = this.scatterTarget.y;
                }
                break;
        }
    }

    /**
     * Move the ghost
     * @param {number} deltaTime - Time elapsed since the last update
     */
    move(deltaTime) {
        // Special movement for ghosts in the house
        if (this.mode === GHOST_MODE.HOUSE || this.mode === GHOST_MODE.LEAVING_HOUSE) {
            this.moveInHouse(deltaTime);
            return;
        }
        
        const { row, column } = pixelToGrid(this.x, this.y);
        
        // Choose next direction at tile centers
        if (isAtTileCenter(this.x, this.y)) {
            this.chooseNextDirection(row, column);
        }
        
        // Move in the current direction
        const dirVector = directionToVector(this.direction);
        const nextX = this.x + dirVector.x * this.speed;
        const nextY = this.y + dirVector.y * this.speed;
        const nextGrid = pixelToGrid(nextX, nextY);
        
        // Check if the next position is valid
        const canUseGhostDoor = this.mode === GHOST_MODE.LEAVING_HOUSE || this.eaten;
        
        if (gameMap.canMove(nextGrid.row, nextGrid.column, canUseGhostDoor)) {
            this.x = nextX;
            this.y = nextY;
        } else {
            // If we hit a wall, align to the center of the current tile
            const centerPos = gridToPixel(row, column);
            this.x = centerPos.x;
            this.y = centerPos.y;
            
            // Choose a new direction
            this.chooseNextDirection(row, column);
        }
    }

    /**
     * Move the ghost in the ghost house
     * @param {number} deltaTime - Time elapsed since the last update
     */
    moveInHouse(deltaTime) {
        // Move up and down in the ghost house
        const dirVector = directionToVector(this.direction);
        this.x += dirVector.x * this.speed * 0.5; // Slower movement in house
        this.y += dirVector.y * this.speed * 0.5;
        
        // If leaving the house, move towards the door
        if (this.mode === GHOST_MODE.LEAVING_HOUSE) {
            const doorTile = gameMap.ghostDoorTiles[0];
            const doorPos = gridToPixel(doorTile.row, doorTile.column);
            
            // If at the same column as the door, move up
            if (Math.abs(this.x - doorPos.x) < 2) {
                this.x = doorPos.x;
                this.direction = DIRECTION.UP;
                this.nextDirection = DIRECTION.UP;
                
                // If close enough to the door vertically, guide the ghost through the door
                // but don't force position or mode change
                if (Math.abs(this.y - doorPos.y) < 10) {
                    // Slightly increase upward movement speed to help ghost pass through door
                    this.y += dirVector.y * this.speed * 0.5;
                }
            } 
            // Otherwise, move horizontally towards the door
            else if (this.y <= doorPos.y) {
                this.y = doorPos.y;
                this.direction = this.x < doorPos.x ? DIRECTION.RIGHT : DIRECTION.LEFT;
                this.nextDirection = this.direction;
            }
        }
    }

    /**
     * Choose the next direction for the ghost
     * @param {number} row - Current row in the grid
     * @param {number} column - Current column in the grid
     */
    chooseNextDirection(row, column) {
        // Get valid directions (excluding the opposite of the current direction)
        const validDirections = gameMap.getValidDirections(row, column, this.eaten);
        const oppositeDir = getOppositeDirection(this.direction);
        
        // Ghosts cannot reverse direction unless they just changed modes
        const filteredDirections = validDirections.filter(dir => dir !== oppositeDir);
        
        // If no valid directions (other than reversing), allow reversing
        const directions = filteredDirections.length > 0 ? filteredDirections : validDirections;
        
        if (directions.length === 0) {
            return; // No valid directions
        }
        
        // In frightened mode, choose a random direction
        if (this.frightened) {
            const randomIndex = Math.floor(Math.random() * directions.length);
            this.direction = directions[randomIndex];
            this.nextDirection = this.direction;
            return;
        }
        
        // Choose the direction that minimizes the distance to the target
        let bestDirection = directions[0];
        let bestDistance = Infinity;
        
        for (const dir of directions) {
            const dirVector = directionToVector(dir);
            const nextRow = row + dirVector.y;
            const nextColumn = column + dirVector.x;
            const nextPos = gridToPixel(nextRow, nextColumn);
            
            // Calculate distance to target
            const distance = calculateDistance(
                { x: nextPos.x, y: nextPos.y },
                { x: this.targetX, y: this.targetY }
            );
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestDirection = dir;
            }
        }
        
        this.direction = bestDirection;
        this.nextDirection = bestDirection;
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
     * Check if the ghost should leave the house
     * @param {number} dotsEaten - Number of dots eaten
     * @returns {boolean} True if the ghost should leave the house
     */
    shouldLeaveHouse(dotsEaten) {
        // Blinky starts outside
        if (this.type === GHOST_TYPE.BLINKY) {
            return true;
        }
        
        // Add a timer-based release mechanism
        this.releaseTimer += 1;
        
        // Force release after a certain time
        const forceReleaseTime = {
            [GHOST_TYPE.PINKY]: 3 * 60, // 3 seconds at 60 fps
            [GHOST_TYPE.INKY]: 5 * 60,  // 5 seconds at 60 fps
            [GHOST_TYPE.CLYDE]: 7 * 60  // 7 seconds at 60 fps
        };
        
        if (this.releaseTimer >= forceReleaseTime[this.type]) {
            return true;
        }
        
        // Check dot counter for other ghosts
        switch (this.type) {
            case GHOST_TYPE.PINKY:
                return dotsEaten >= GHOST_RELEASE_DOTS.PINKY;
            case GHOST_TYPE.INKY:
                return dotsEaten >= GHOST_RELEASE_DOTS.INKY;
            case GHOST_TYPE.CLYDE:
                return dotsEaten >= GHOST_RELEASE_DOTS.CLYDE;
            default:
                return false;
        }
    }

    /**
     * Check if the ghost is at the ghost house door
     * @returns {boolean} True if the ghost is at the ghost house door
     */
    isAtGhostHouseDoor() {
        if (gameMap.ghostDoorTiles.length === 0) {
            return false;
        }
        
        const doorTile = gameMap.ghostDoorTiles[0];
        const doorPos = gridToPixel(doorTile.row, doorTile.column);
        
        // Check if ghost is at the door position (not above it)
        // This ensures consistent detection with the actual door position
        return Math.abs(this.x - doorPos.x) < 5 && Math.abs(this.y - doorPos.y) < 5;
    }

    /**
     * Reverse the ghost's direction
     */
    reverseDirection() {
        this.direction = getOppositeDirection(this.direction);
        this.nextDirection = this.direction;
    }

    /**
     * Enter frightened mode
     * @param {number} duration - Duration of frightened mode in milliseconds
     */
    enterFrightenedMode(duration) {
        if (this.eaten) {
            return; // Already eaten, don't enter frightened mode
        }
        
        this.previousMode = this.mode;
        this.frightened = true;
        this.blinkTimer = 0;
        this.blinking = false;
        this.mode = GHOST_MODE.FRIGHTENED;
        
        // Reverse direction when entering frightened mode
        this.reverseDirection();
    }

    /**
     * Get eaten by Pac-Man
     */
    getEaten() {
        this.frightened = false;
        this.eaten = true;
        this.mode = GHOST_MODE.EATEN;
    }

    /**
     * Draw the ghost on the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.save();
        
        // Move to ghost's position
        ctx.translate(this.x, this.y);
        
        // Draw ghost body
        this.drawBody(ctx);
        
        // Draw ghost eyes
        this.drawEyes(ctx);
        
        ctx.restore();
    }

    /**
     * Draw the ghost's body
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawBody(ctx) {
        // Determine ghost color based on mode
        let color;
        
        if (this.eaten) {
            // Draw only eyes when eaten
            return;
        } else if (this.frightened) {
            color = this.blinking ? COLORS.FRIGHTENED_ENDING : COLORS.FRIGHTENED;
        } else {
            // Normal color based on ghost type
            switch (this.type) {
                case GHOST_TYPE.BLINKY:
                    color = COLORS.BLINKY;
                    break;
                case GHOST_TYPE.PINKY:
                    color = COLORS.PINKY;
                    break;
                case GHOST_TYPE.INKY:
                    color = COLORS.INKY;
                    break;
                case GHOST_TYPE.CLYDE:
                    color = COLORS.CLYDE;
                    break;
            }
        }
        
        ctx.fillStyle = color;
        
        // Draw ghost body (semi-circle + rectangle with wavy bottom)
        const radius = SCALED_TILE_SIZE / 2;
        
        // Draw semi-circle for top half
        ctx.beginPath();
        ctx.arc(0, 0, radius, Math.PI, 0, false);
        ctx.lineTo(radius, radius);
        
        // Draw wavy bottom
        const waveHeight = radius / 4;
        const waveCount = 3;
        const waveWidth = (radius * 2) / waveCount;
        
        // Animation for the waves
        const waveOffset = Math.floor(Date.now() / 200) % 2 === 0 ? 0 : waveWidth / 2;
        
        for (let i = 0; i < waveCount; i++) {
            const x = radius - (i * waveWidth) - waveOffset;
            ctx.lineTo(x, radius + waveHeight);
            ctx.lineTo(x - waveWidth / 2, radius);
        }
        
        ctx.lineTo(-radius, radius);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw the ghost's eyes
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawEyes(ctx) {
        const eyeRadius = SCALED_TILE_SIZE / 6;
        const pupilRadius = eyeRadius / 2;
        const eyeOffset = SCALED_TILE_SIZE / 5;
        
        // Draw white part of eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-eyeOffset, -eyeOffset, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(eyeOffset, -eyeOffset, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Determine pupil position based on direction
        let pupilOffsetX = 0;
        let pupilOffsetY = 0;
        
        switch (this.direction) {
            case DIRECTION.UP:
                pupilOffsetY = -pupilRadius;
                break;
            case DIRECTION.RIGHT:
                pupilOffsetX = pupilRadius;
                break;
            case DIRECTION.DOWN:
                pupilOffsetY = pupilRadius;
                break;
            case DIRECTION.LEFT:
                pupilOffsetX = -pupilRadius;
                break;
        }
        
        // Draw pupils
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(-eyeOffset + pupilOffsetX, -eyeOffset + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(eyeOffset + pupilOffsetX, -eyeOffset + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Ghost manager class
class GhostManager {
    constructor() {
        this.ghosts = [
            new Ghost(GHOST_TYPE.BLINKY),
            new Ghost(GHOST_TYPE.PINKY),
            new Ghost(GHOST_TYPE.INKY),
            new Ghost(GHOST_TYPE.CLYDE)
        ];
        this.modeTimer = 0;
        this.currentModeIndex = 0;
        this.modeTimings = [];
    }

    /**
     * Initialize all ghosts
     */
    init() {
        this.ghosts.forEach(ghost => ghost.init());
        this.modeTimer = 0;
        this.currentModeIndex = 0;
    }

    /**
     * Reset all ghosts for a new life
     */
    reset() {
        this.ghosts.forEach(ghost => ghost.reset());
        this.modeTimer = 0;
        this.currentModeIndex = 0;
    }

    /**
     * Set the mode timings based on the current level
     * @param {number} level - Current game level
     */
    setModeTimings(level) {
        this.modeTimings = getGhostModeTimings(level);
        this.currentModeIndex = 0;
        this.modeTimer = 0;
    }

    /**
     * Update all ghosts
     * @param {number} deltaTime - Time elapsed since the last update
     * @param {Object} pacman - Pac-Man object
     * @param {number} dotsEaten - Number of dots eaten
     * @param {number} totalDots - Total number of dots in the level
     * @param {Object} levelConfig - Level configuration
     */
    update(deltaTime, pacman, dotsEaten, totalDots, levelConfig) {
        // Update ghost mode timer
        this.updateModeTimer(deltaTime);
        
        // Update each ghost
        this.ghosts.forEach(ghost => {
            ghost.update(deltaTime, pacman, this.ghosts, dotsEaten, totalDots, levelConfig);
        });
        
        // Check for collisions with Pac-Man
        this.checkPacManCollisions(pacman);
    }

    /**
     * Update the ghost mode timer
     * @param {number} deltaTime - Time elapsed since the last update
     */
    updateModeTimer(deltaTime) {
        if (this.modeTimings.length === 0) {
            return;
        }
        
        this.modeTimer += deltaTime;
        
        // Check if it's time to switch modes
        const currentMode = this.modeTimings[this.currentModeIndex];
        
        if (this.modeTimer >= currentMode.duration) {
            this.modeTimer = 0;
            this.currentModeIndex = (this.currentModeIndex + 1) % this.modeTimings.length;
            
            // Update ghost modes
            const newMode = this.modeTimings[this.currentModeIndex].mode;
            
            this.ghosts.forEach(ghost => {
                // Only update ghosts that are not frightened, eaten, or in the house
                if (!ghost.frightened && !ghost.eaten && 
                    ghost.mode !== GHOST_MODE.HOUSE && 
                    ghost.mode !== GHOST_MODE.LEAVING_HOUSE) {
                    ghost.mode = newMode;
                    ghost.reverseDirection();
                }
            });
        }
    }

    /**
     * Check for collisions between ghosts and Pac-Man
     * @param {Object} pacman - Pac-Man object
     */
    checkPacManCollisions(pacman) {
        if (pacman.isDying) {
            return;
        }
        
        const pacmanRect = {
            x: pacman.x - SCALED_TILE_SIZE / 2,
            y: pacman.y - SCALED_TILE_SIZE / 2,
            width: SCALED_TILE_SIZE,
            height: SCALED_TILE_SIZE
        };
        
        for (const ghost of this.ghosts) {
            const ghostRect = {
                x: ghost.x - SCALED_TILE_SIZE / 2,
                y: ghost.y - SCALED_TILE_SIZE / 2,
                width: SCALED_TILE_SIZE,
                height: SCALED_TILE_SIZE
            };
            
            if (checkCollision(pacmanRect, ghostRect)) {
                if (ghost.frightened) {
                    // Pac-Man eats the ghost
                    ghost.getEaten();
                    pacman.ghostsEaten++;
                    pacman.score += SCORE.GHOST[Math.min(pacman.ghostsEaten - 1, 3)];
                    
                    // Play ghost eaten sound
                    audioManager.play('ghost');
                } else if (!ghost.eaten) {
                    // Ghost catches Pac-Man
                    pacman.die();
                    return;
                }
            }
        }
    }

    /**
     * Enter frightened mode for all ghosts
     * @param {number} duration - Duration of frightened mode in milliseconds
     */
    enterFrightenedMode(duration) {
        this.ghosts.forEach(ghost => ghost.enterFrightenedMode(duration));
    }

    /**
     * Draw all ghosts
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        this.ghosts.forEach(ghost => ghost.draw(ctx));
    }
}

// Create and export a singleton instance
const ghostManager = new GhostManager();
