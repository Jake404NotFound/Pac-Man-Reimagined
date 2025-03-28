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
        this.exitingHouse = false; // New flag to track exit state
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
                // Changed: Start Blinky in HOUSE mode instead of SCATTER to fix the issue
                this.mode = GHOST_MODE.HOUSE;
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
        this.exitingHouse = false;
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
                
                // Optional: Snap to a specific spot inside the house
                const spawn = gameMap.ghostSpawns[this.type];
                const spawnPixel = gridToPixel(spawn.row, spawn.column);
                this.x = spawnPixel.x;
                this.y = spawnPixel.y;
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
                this.exitingHouse = true; // Set the exiting flag
                
                // Initial direction should be towards the door's horizontal center, then UP
                const doorTile = gameMap.ghostDoorTiles[0]; // Assuming door is at [0]
                const doorPos = gridToPixel(doorTile.row, doorTile.column); // Targets row 13, col 13
                const houseCenterDoorX = gridToPixel(13, 13.5).x; // Center X between door tiles
                
                if (Math.abs(this.x - houseCenterDoorX) < 5) { // If already near center X
                    this.x = houseCenterDoorX; // Snap X
                    this.direction = DIRECTION.UP;
                    this.nextDirection = DIRECTION.UP;
                } else { // Move horizontally first
                    this.direction = this.x < houseCenterDoorX ? DIRECTION.RIGHT : DIRECTION.LEFT;
                    this.nextDirection = this.direction;
                }
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
        // Adjust speed to account for deltaTime (60 is the target FPS)
        const speedFactor = 60 * (deltaTime / 1000);
        const nextX = this.x + dirVector.x * this.speed * speedFactor;
        const nextY = this.y + dirVector.y * this.speed * speedFactor;
        const nextGrid = pixelToGrid(nextX, nextY);
        
        // Check if the next position is valid
        const canUseGhostDoor = this.mode === GHOST_MODE.LEAVING_HOUSE || this.eaten || this.exitingHouse;
        
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
        // Simplified ghost house movement
        if (this.mode === GHOST_MODE.HOUSE) {
            // Simple up and down bobbing motion
            const dirVector = directionToVector(this.direction);
            // Adjust speed to account for deltaTime (60 is the target FPS)
            const speedFactor = 60 * (deltaTime / 1000);
            this.y += dirVector.y * this.speed * speedFactor;
            
            // Reverse direction at boundaries
            const spawnPixelY = this.housePosition.y;
            if (this.y <= spawnPixelY - 8) {
                this.y = spawnPixelY - 8;
                this.direction = DIRECTION.DOWN;
                this.nextDirection = DIRECTION.DOWN;
            } else if (this.y >= spawnPixelY + 8) {
                this.y = spawnPixelY + 8;
                this.direction = DIRECTION.UP;
                this.nextDirection = DIRECTION.UP;
            }
            
            // Keep X fixed to spawn column
            this.x = this.housePosition.x;
            return;
        }
        
        // Simplified exit logic for LEAVING_HOUSE mode
        if (this.mode === GHOST_MODE.LEAVING_HOUSE) {
            // Get door position
            const doorTile = gameMap.ghostDoorTiles[0];
            const doorPos = gridToPixel(doorTile.row, doorTile.column);
            
            // Target position is directly above the door
            const targetX = doorPos.x;
            const targetY = doorPos.y - SCALED_TILE_SIZE;
            
            // Calculate direction to target
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            
            // Adjust speed to account for deltaTime (60 is the target FPS)
            const speedFactor = 60 * (deltaTime / 1000);
            
            // Determine primary movement direction
            if (Math.abs(dx) > 2) {
                // Need to move horizontally first
                this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
                const dirVector = directionToVector(this.direction);
                this.x += dirVector.x * this.speed * speedFactor;
            } else {
                // Aligned horizontally, move up
                this.x = targetX; // Snap to exact X position
                this.direction = DIRECTION.UP;
                const dirVector = directionToVector(this.direction);
                this.y += dirVector.y * this.speed * speedFactor;
                
                // Check if we've reached the target position
                if (this.y <= targetY) {
                    // Successfully exited the house
                    this.y = targetY;
                    this.mode = GHOST_MODE.SCATTER;
                    this.direction = DIRECTION.LEFT;
                    this.nextDirection = DIRECTION.LEFT;
                    this.exitingHouse = false; // Clear the exiting flag
                    
                    console.log(`${this.type} ghost has exited the house`);
                }
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
        const validDirections = gameMap.getValidDirections(row, column, this.eaten || this.exitingHouse);
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
        
        // Enhanced tunnel detection - check if we're in a tunnel tile
        if (gameMap.isTunnel(row, column)) {
            // Only teleport when at the center of the tunnel tile
            if (isAtTileCenter(this.x, this.y)) {
                const oppositeTunnel = gameMap.getOppositeTunnel(row, column);
                
                if (oppositeTunnel) {
                    // Get the new position at the opposite tunnel
                    const newPos = gridToPixel(oppositeTunnel.row, oppositeTunnel.column);
                    
                    // Store current direction before teleporting
                    const currentDirection = this.direction;
                    
                    // Teleport to the opposite tunnel
                    this.x = newPos.x;
                    this.y = newPos.y;
                    
                    // Maintain the same direction after teleporting
                    this.direction = currentDirection;
                    this.nextDirection = currentDirection;
                    
                    console.log(`${this.type} ghost teleported through tunnel`);
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
        // Blinky starts outside - but we need to make sure he actually leaves
        if (this.type === GHOST_TYPE.BLINKY) {
            // Force immediate release for Blinky
            return true;
        }
        
        // Add a timer-based release mechanism
        this.releaseTimer += 1;
        
        // Force release after a certain time
        const forceReleaseTime = {
            [GHOST_TYPE.PINKY]: 2 * 60, // 2 seconds at 60 fps (reduced from 3)
            [GHOST_TYPE.INKY]: 4 * 60,  // 4 seconds at 60 fps (reduced from 5)
            [GHOST_TYPE.CLYDE]: 6 * 60  // 6 seconds at 60 fps (reduced from 7)
        };
        
        if (this.releaseTimer >= forceReleaseTime[this.type]) {
            console.log(`${this.type} ghost released by timer`);
            return true;
        }
        
        // Check dot counter for other ghosts
        switch (this.type) {
            case GHOST_TYPE.PINKY:
                if (dotsEaten >= GHOST_RELEASE_DOTS.PINKY) {
                    console.log(`${this.type} ghost released by dots (${dotsEaten})`);
                    return true;
                }
                break;
            case GHOST_TYPE.INKY:
                if (dotsEaten >= GHOST_RELEASE_DOTS.INKY) {
                    console.log(`${this.type} ghost released by dots (${dotsEaten})`);
                    return true;
                }
                break;
            case GHOST_TYPE.CLYDE:
                if (dotsEaten >= GHOST_RELEASE_DOTS.CLYDE) {
                    console.log(`${this.type} ghost released by dots (${dotsEaten})`);
                    return true;
                }
                break;
        }
        
        return false;
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
        
        // Check if ghost is at the door position
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
     * Draw the ghost on the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.save();
        
        // Draw ghost body
        if (this.frightened) {
            // Draw frightened ghost
            ctx.fillStyle = this.blinking ? COLORS.FRIGHTENED_ENDING : COLORS.FRIGHTENED;
        } else if (this.eaten) {
            // Draw eyes only for eaten ghost
            this.drawEyes(ctx);
            ctx.restore();
            return;
        } else {
            // Draw normal ghost with color based on type
            switch (this.type) {
                case GHOST_TYPE.BLINKY:
                    ctx.fillStyle = COLORS.BLINKY;
                    break;
                case GHOST_TYPE.PINKY:
                    ctx.fillStyle = COLORS.PINKY;
                    break;
                case GHOST_TYPE.INKY:
                    ctx.fillStyle = COLORS.INKY;
                    break;
                case GHOST_TYPE.CLYDE:
                    ctx.fillStyle = COLORS.CLYDE;
                    break;
            }
        }
        
        // Draw ghost body
        ctx.beginPath();
        
        // Draw semi-circle for the top of the ghost
        ctx.arc(
            this.x,
            this.y,
            SCALED_TILE_SIZE / 2,
            Math.PI,
            0,
            false
        );
        
        // Draw the bottom of the ghost with waves
        const ghostBottom = this.y + SCALED_TILE_SIZE / 2;
        const waveHeight = SCALED_TILE_SIZE / 4;
        const ghostLeft = this.x - SCALED_TILE_SIZE / 2;
        const ghostWidth = SCALED_TILE_SIZE;
        
        // Draw wavy bottom (3 waves)
        ctx.lineTo(ghostLeft + ghostWidth, ghostBottom);
        ctx.lineTo(ghostLeft + ghostWidth * 5/6, ghostBottom - waveHeight);
        ctx.lineTo(ghostLeft + ghostWidth * 4/6, ghostBottom);
        ctx.lineTo(ghostLeft + ghostWidth * 3/6, ghostBottom - waveHeight);
        ctx.lineTo(ghostLeft + ghostWidth * 2/6, ghostBottom);
        ctx.lineTo(ghostLeft + ghostWidth * 1/6, ghostBottom - waveHeight);
        ctx.lineTo(ghostLeft, ghostBottom);
        
        ctx.closePath();
        ctx.fill();
        
        // Draw eyes (unless frightened and blinking)
        if (!this.frightened || (this.frightened && this.blinking)) {
            this.drawEyes(ctx);
        }
        
        // Draw mouth for frightened ghost
        if (this.frightened) {
            ctx.fillStyle = '#FFFFFF';
            
            // Draw mouth
            if (!this.blinking) {
                ctx.beginPath();
                ctx.moveTo(this.x - SCALED_TILE_SIZE / 4, this.y + SCALED_TILE_SIZE / 6);
                ctx.lineTo(this.x - SCALED_TILE_SIZE / 12, this.y + SCALED_TILE_SIZE / 12);
                ctx.lineTo(this.x + SCALED_TILE_SIZE / 12, this.y + SCALED_TILE_SIZE / 12);
                ctx.lineTo(this.x + SCALED_TILE_SIZE / 4, this.y + SCALED_TILE_SIZE / 6);
                ctx.lineTo(this.x + SCALED_TILE_SIZE / 12, this.y + SCALED_TILE_SIZE / 4);
                ctx.lineTo(this.x - SCALED_TILE_SIZE / 12, this.y + SCALED_TILE_SIZE / 4);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        ctx.restore();
    }

    /**
     * Draw the ghost's eyes
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawEyes(ctx) {
        // Draw white part of eyes
        ctx.fillStyle = '#FFFFFF';
        
        // Left eye
        ctx.beginPath();
        ctx.arc(
            this.x - SCALED_TILE_SIZE / 6,
            this.y - SCALED_TILE_SIZE / 6,
            SCALED_TILE_SIZE / 6,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(
            this.x + SCALED_TILE_SIZE / 6,
            this.y - SCALED_TILE_SIZE / 6,
            SCALED_TILE_SIZE / 6,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw pupils (black part of eyes)
        ctx.fillStyle = '#000000';
        
        // Determine pupil offset based on direction
        let pupilOffsetX = 0;
        let pupilOffsetY = 0;
        
        switch (this.direction) {
            case DIRECTION.UP:
                pupilOffsetY = -SCALED_TILE_SIZE / 12;
                break;
            case DIRECTION.RIGHT:
                pupilOffsetX = SCALED_TILE_SIZE / 12;
                break;
            case DIRECTION.DOWN:
                pupilOffsetY = SCALED_TILE_SIZE / 12;
                break;
            case DIRECTION.LEFT:
                pupilOffsetX = -SCALED_TILE_SIZE / 12;
                break;
        }
        
        // Left pupil
        ctx.beginPath();
        ctx.arc(
            this.x - SCALED_TILE_SIZE / 6 + pupilOffsetX,
            this.y - SCALED_TILE_SIZE / 6 + pupilOffsetY,
            SCALED_TILE_SIZE / 12,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Right pupil
        ctx.beginPath();
        ctx.arc(
            this.x + SCALED_TILE_SIZE / 6 + pupilOffsetX,
            this.y - SCALED_TILE_SIZE / 6 + pupilOffsetY,
            SCALED_TILE_SIZE / 12,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

/**
 * Ghost Manager class to manage all ghosts
 */
class GhostManager {
    constructor() {
        this.ghosts = [];
        this.modeTimer = 0;
        this.modeIndex = 0;
        this.modeTimings = [];
    }

    /**
     * Initialize all ghosts
     */
    init() {
        // Create ghosts
        this.ghosts = [
            new Ghost(GHOST_TYPE.BLINKY),
            new Ghost(GHOST_TYPE.PINKY),
            new Ghost(GHOST_TYPE.INKY),
            new Ghost(GHOST_TYPE.CLYDE)
        ];
        
        // Initialize each ghost
        this.ghosts.forEach(ghost => ghost.init());
        
        // Reset mode timer
        this.modeTimer = 0;
        this.modeIndex = 0;
    }

    /**
     * Reset all ghosts for a new life
     */
    reset() {
        this.ghosts.forEach(ghost => ghost.reset());
        
        // Reset mode timer
        this.modeTimer = 0;
        this.modeIndex = 0;
    }

    /**
     * Set mode timings based on level
     * @param {number} level - Current level
     */
    setModeTimings(level) {
        // Get the appropriate mode timings for the level
        if (level <= 1) {
            this.modeTimings = GHOST_MODE_TIMINGS[0];
        } else if (level <= 4) {
            this.modeTimings = GHOST_MODE_TIMINGS[1];
        } else {
            this.modeTimings = GHOST_MODE_TIMINGS[2];
        }
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
        // Update mode timer
        this.updateModeTimer(deltaTime);
        
        // Update each ghost
        this.ghosts.forEach(ghost => {
            ghost.update(deltaTime, pacman, this.ghosts, dotsEaten, totalDots, levelConfig);
            
            // Check for collision with Pac-Man
            this.checkPacManCollision(ghost, pacman);
        });
    }

    /**
     * Update the mode timer and change ghost modes accordingly
     * @param {number} deltaTime - Time elapsed since the last update
     */
    updateModeTimer(deltaTime) {
        // Don't update mode timer if all ghosts are frightened or eaten
        if (this.ghosts.every(ghost => ghost.frightened || ghost.eaten || ghost.mode === GHOST_MODE.HOUSE || ghost.mode === GHOST_MODE.LEAVING_HOUSE)) {
            return;
        }
        
        // Update timer
        this.modeTimer += deltaTime;
        
        // Check if it's time to change mode
        if (this.modeIndex < this.modeTimings.length && this.modeTimer >= this.modeTimings[this.modeIndex].duration) {
            // Reset timer
            this.modeTimer = 0;
            
            // Get next mode
            const nextMode = this.modeTimings[this.modeIndex].mode;
            
            // Update ghosts that are not frightened, eaten, or in the house
            this.ghosts.forEach(ghost => {
                if (!ghost.frightened && !ghost.eaten && ghost.mode !== GHOST_MODE.HOUSE && ghost.mode !== GHOST_MODE.LEAVING_HOUSE) {
                    ghost.previousMode = ghost.mode;
                    ghost.mode = nextMode;
                    
                    // Reverse direction when changing modes
                    ghost.reverseDirection();
                }
            });
            
            // Move to next mode
            this.modeIndex++;
        }
    }

    /**
     * Make all ghosts enter frightened mode
     * @param {number} duration - Duration of frightened mode in milliseconds
     */
    enterFrightenedMode(duration) {
        this.ghosts.forEach(ghost => {
            // Only ghosts that are not eaten or in the house can be frightened
            if (!ghost.eaten && ghost.mode !== GHOST_MODE.HOUSE && ghost.mode !== GHOST_MODE.LEAVING_HOUSE) {
                ghost.previousMode = ghost.mode;
                ghost.frightened = true;
                ghost.blinkTimer = 0;
                ghost.blinking = false;
                
                // Reverse direction when entering frightened mode
                ghost.reverseDirection();
            }
        });
    }

    /**
     * Check for collision between a ghost and Pac-Man
     * @param {Object} ghost - Ghost object
     * @param {Object} pacman - Pac-Man object
     */
    checkPacManCollision(ghost, pacman) {
        // Skip if Pac-Man is dying
        if (pacman.isDying) {
            return;
        }
        
        // Calculate distance between ghost and Pac-Man
        const distance = calculateDistance(
            { x: ghost.x, y: ghost.y },
            { x: pacman.x, y: pacman.y }
        );
        
        // Check for collision (if distance is less than sum of radii)
        if (distance < SCALED_TILE_SIZE * 0.8) {
            if (ghost.frightened) {
                // Pac-Man eats the ghost
                ghost.eaten = true;
                ghost.frightened = false;
                
                // Add score based on number of ghosts eaten
                const scoreIndex = Math.min(pacman.ghostsEaten, SCORE.GHOST.length - 1);
                pacman.score += SCORE.GHOST[scoreIndex];
                pacman.ghostsEaten++;
                
                // Play ghost eaten sound
                audioManager.play('eatGhost');
            } else if (!ghost.eaten) {
                // Ghost catches Pac-Man
                pacman.die();
            }
        }
    }

    /**
     * Draw all ghosts
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        // Draw ghosts in order (so Blinky is always on top)
        this.ghosts.forEach(ghost => ghost.draw(ctx));
    }
}

// Create and export a singleton instance
const ghostManager = new GhostManager();
