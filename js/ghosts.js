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
        this.isStuck = false; // Flag to track if ghost is stuck in a tunnel
        this.stuckTimer = 0; // Timer to track how long ghost has been stuck
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
        this.isStuck = false;
        this.stuckTimer = 0;
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
        this.checkTunnel(deltaTime);
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
                    this.direction = DIRECTION.UP;
                    this.nextDirection = DIRECTION.UP;
                } else if (this.x < houseCenterDoorX) {
                    this.direction = DIRECTION.RIGHT;
                    this.nextDirection = DIRECTION.RIGHT;
                } else {
                    this.direction = DIRECTION.LEFT;
                    this.nextDirection = DIRECTION.LEFT;
                }
            }
            
            return;
        }
        
        // Handle leaving house mode
        if (this.mode === GHOST_MODE.LEAVING_HOUSE) {
            // Check if the ghost has left the house
            if (!this.isInGhostHouse() && !this.isAtGhostHouseDoor()) {
                this.mode = ghostManager.currentMode;
                this.exitingHouse = false; // Clear the exiting flag
                
                // Set initial direction based on ghost type
                switch (this.type) {
                    case GHOST_TYPE.BLINKY:
                        this.direction = DIRECTION.LEFT;
                        break;
                    case GHOST_TYPE.PINKY:
                        this.direction = DIRECTION.UP;
                        break;
                    case GHOST_TYPE.INKY:
                        this.direction = DIRECTION.UP;
                        break;
                    case GHOST_TYPE.CLYDE:
                        this.direction = DIRECTION.UP;
                        break;
                }
                
                this.nextDirection = this.direction;
            }
            
            return;
        }
    }

    /**
     * Update the ghost's speed based on mode and location
     * @param {Object} levelConfig - Level configuration
     */
    updateSpeed(levelConfig) {
        // Base speed multiplier from level config
        let speedMultiplier = levelConfig.ghostSpeed;
        
        // Adjust speed based on mode
        if (this.frightened) {
            this.speed = GHOST_FRIGHTENED_SPEED * speedMultiplier;
        } else if (this.eaten) {
            this.speed = GHOST_SPEED * 2 * speedMultiplier; // Eaten ghosts move faster
        } else if (this.isInTunnel()) {
            this.speed = GHOST_TUNNEL_SPEED * speedMultiplier;
        } else if (this.elroyMode === 1) {
            this.speed = levelConfig.elroy1Speed * GHOST_SPEED;
        } else if (this.elroyMode === 2) {
            this.speed = levelConfig.elroy2Speed * GHOST_SPEED;
        } else {
            this.speed = GHOST_SPEED * speedMultiplier;
        }
    }

    /**
     * Update the ghost's target based on mode
     * @param {Object} pacman - Pac-Man object
     * @param {Array} ghosts - Array of all ghosts
     */
    updateTarget(pacman, ghosts) {
        // If the ghost is in the house or leaving the house, target the door
        if (this.mode === GHOST_MODE.HOUSE || this.mode === GHOST_MODE.LEAVING_HOUSE) {
            const doorTile = gameMap.ghostDoorTiles[0];
            const doorPos = gridToPixel(doorTile.row - 1, doorTile.column);
            this.targetX = doorPos.x;
            this.targetY = doorPos.y;
            return;
        }
        
        // If the ghost is eaten, target the ghost house door
        if (this.eaten) {
            const doorTile = gameMap.ghostDoorTiles[0];
            const doorPos = gridToPixel(doorTile.row, doorTile.column);
            this.targetX = doorPos.x;
            this.targetY = doorPos.y;
            return;
        }
        
        // If the ghost is frightened, target is random
        if (this.frightened) {
            // Random target is set when direction changes
            return;
        }
        
        // In scatter mode, target the ghost's corner
        if (this.mode === GHOST_MODE.SCATTER) {
            this.targetX = this.scatterTarget.x;
            this.targetY = this.scatterTarget.y;
            return;
        }
        
        // In chase mode, target depends on ghost type
        if (this.mode === GHOST_MODE.CHASE) {
            switch (this.type) {
                case GHOST_TYPE.BLINKY: // Red ghost - directly targets Pac-Man
                    this.targetX = pacman.x;
                    this.targetY = pacman.y;
                    break;
                    
                case GHOST_TYPE.PINKY: // Pink ghost - targets 4 tiles ahead of Pac-Man
                    const pacmanDir = directionToVector(pacman.direction);
                    this.targetX = pacman.x + pacmanDir.x * SCALED_TILE_SIZE * 4;
                    this.targetY = pacman.y + pacmanDir.y * SCALED_TILE_SIZE * 4;
                    
                    // Recreate the original Pac-Man bug where UP direction also shifts left
                    if (pacman.direction === DIRECTION.UP) {
                        this.targetX -= SCALED_TILE_SIZE * 4;
                    }
                    break;
                    
                case GHOST_TYPE.INKY: // Cyan ghost - complex targeting based on Blinky's position
                    const blinky = ghosts.find(ghost => ghost.type === GHOST_TYPE.BLINKY);
                    if (blinky) {
                        // Get position 2 tiles ahead of Pac-Man
                        const pacmanDirInky = directionToVector(pacman.direction);
                        const aheadX = pacman.x + pacmanDirInky.x * SCALED_TILE_SIZE * 2;
                        const aheadY = pacman.y + pacmanDirInky.y * SCALED_TILE_SIZE * 2;
                        
                        // Same bug as Pinky
                        if (pacman.direction === DIRECTION.UP) {
                            aheadX -= SCALED_TILE_SIZE * 2;
                        }
                        
                        // Vector from Blinky to the position ahead of Pac-Man, doubled
                        const vectorX = aheadX - blinky.x;
                        const vectorY = aheadY - blinky.y;
                        
                        // Target is Blinky's position plus the doubled vector
                        this.targetX = blinky.x + vectorX * 2;
                        this.targetY = blinky.y + vectorY * 2;
                    } else {
                        // Fallback if Blinky is not found
                        this.targetX = pacman.x;
                        this.targetY = pacman.y;
                    }
                    break;
                    
                case GHOST_TYPE.CLYDE: // Orange ghost - targets Pac-Man or scatter corner based on distance
                    const distToPacman = Math.sqrt(
                        Math.pow(this.x - pacman.x, 2) + 
                        Math.pow(this.y - pacman.y, 2)
                    );
                    
                    // If Clyde is far from Pac-Man (>8 tiles), target Pac-Man
                    // If Clyde is close to Pac-Man (<=8 tiles), target scatter corner
                    if (distToPacman > SCALED_TILE_SIZE * 8) {
                        this.targetX = pacman.x;
                        this.targetY = pacman.y;
                    } else {
                        this.targetX = this.scatterTarget.x;
                        this.targetY = this.scatterTarget.y;
                    }
                    break;
            }
        }
    }

    /**
     * Move the ghost
     * @param {number} deltaTime - Time elapsed since the last update
     */
    move(deltaTime) {
        // If in the ghost house, move up and down
        if (this.mode === GHOST_MODE.HOUSE) {
            const dirVector = directionToVector(this.direction);
            this.x += dirVector.x * this.speed;
            this.y += dirVector.y * this.speed;
            return;
        }
        
        // If at a tile center, decide next direction
        if (isAtTileCenter(this.x, this.y)) {
            this.decideNextDirection();
        }
        
        // Move in the current direction
        const dirVector = directionToVector(this.direction);
        this.x += dirVector.x * this.speed;
        this.y += dirVector.y * this.speed;
    }

    /**
     * Decide the next direction for the ghost
     */
    decideNextDirection() {
        const { row, column } = pixelToGrid(this.x, this.y);
        
        // Get possible directions (excluding the opposite of current direction)
        const possibleDirections = this.getPossibleDirections(row, column);
        
        // If frightened, choose a random direction
        if (this.frightened) {
            if (possibleDirections.length > 0) {
                const randomIndex = Math.floor(Math.random() * possibleDirections.length);
                this.direction = possibleDirections[randomIndex];
                this.nextDirection = this.direction;
            }
            return;
        }
        
        // If eaten, choose the direction that gets closest to the ghost house
        if (this.eaten) {
            let bestDirection = this.direction;
            let bestDistance = Infinity;
            
            for (const direction of possibleDirections) {
                const dirVector = directionToVector(direction);
                const nextX = this.x + dirVector.x * SCALED_TILE_SIZE;
                const nextY = this.y + dirVector.y * SCALED_TILE_SIZE;
                
                const distance = Math.sqrt(
                    Math.pow(nextX - this.targetX, 2) + 
                    Math.pow(nextY - this.targetY, 2)
                );
                
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestDirection = direction;
                }
            }
            
            this.direction = bestDirection;
            this.nextDirection = bestDirection;
            return;
        }
        
        // For other modes, choose the direction that gets closest to the target
        let bestDirection = this.direction;
        let bestDistance = Infinity;
        
        for (const direction of possibleDirections) {
            const dirVector = directionToVector(direction);
            const nextX = this.x + dirVector.x * SCALED_TILE_SIZE;
            const nextY = this.y + dirVector.y * SCALED_TILE_SIZE;
            
            const distance = Math.sqrt(
                Math.pow(nextX - this.targetX, 2) + 
                Math.pow(nextY - this.targetY, 2)
            );
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestDirection = direction;
            }
        }
        
        this.direction = bestDirection;
        this.nextDirection = bestDirection;
    }

    /**
     * Get possible directions for the ghost to move
     * @param {number} row - Current row in the grid
     * @param {number} column - Current column in the grid
     * @returns {Array} Array of possible directions
     */
    getPossibleDirections(row, column) {
        const possibleDirections = [];
        const oppositeDirection = this.getOppositeDirection(this.direction);
        
        // Check if the ghost can use ghost doors
        const canUseGhostDoor = this.mode === GHOST_MODE.LEAVING_HOUSE || this.eaten;
        
        // Check each direction
        if (this.canMove(row - 1, column, canUseGhostDoor)) {
            if (this.direction === DIRECTION.UP || this.mode === GHOST_MODE.LEAVING_HOUSE || DIRECTION.UP !== oppositeDirection) {
                possibleDirections.push(DIRECTION.UP);
            }
        }
        
        if (this.canMove(row, column + 1, canUseGhostDoor)) {
            if (this.direction === DIRECTION.RIGHT || this.mode === GHOST_MODE.LEAVING_HOUSE || DIRECTION.RIGHT !== oppositeDirection) {
                possibleDirections.push(DIRECTION.RIGHT);
            }
        }
        
        if (this.canMove(row + 1, column, canUseGhostDoor)) {
            if (this.direction === DIRECTION.DOWN || this.mode === GHOST_MODE.LEAVING_HOUSE || DIRECTION.DOWN !== oppositeDirection) {
                possibleDirections.push(DIRECTION.DOWN);
            }
        }
        
        if (this.canMove(row, column - 1, canUseGhostDoor)) {
            if (this.direction === DIRECTION.LEFT || this.mode === GHOST_MODE.LEAVING_HOUSE || DIRECTION.LEFT !== oppositeDirection) {
                possibleDirections.push(DIRECTION.LEFT);
            }
        }
        
        // If no directions are possible (should be rare), allow reversing
        if (possibleDirections.length === 0) {
            possibleDirections.push(oppositeDirection);
        }
        
        return possibleDirections;
    }

    /**
     * Check if the ghost can move to the specified position
     * @param {number} row - Row in the grid
     * @param {number} column - Column in the grid
     * @param {boolean} canUseGhostDoor - Whether the ghost can use ghost doors
     * @returns {boolean} True if the ghost can move to the position
     */
    canMove(row, column, canUseGhostDoor) {
        // Check if the tile is walkable
        if (!gameMap.isWalkable(row, column)) {
            return false;
        }
        
        // Check if the tile is a ghost door
        if (gameMap.isGhostDoor(row, column) && !canUseGhostDoor) {
            return false;
        }
        
        return true;
    }

    /**
     * Get the opposite direction
     * @param {number} direction - Direction
     * @returns {number} Opposite direction
     */
    getOppositeDirection(direction) {
        switch (direction) {
            case DIRECTION.UP:
                return DIRECTION.DOWN;
            case DIRECTION.RIGHT:
                return DIRECTION.LEFT;
            case DIRECTION.DOWN:
                return DIRECTION.UP;
            case DIRECTION.LEFT:
                return DIRECTION.RIGHT;
            default:
                return DIRECTION.NONE;
        }
    }

    /**
     * Reverse the ghost's direction
     */
    reverseDirection() {
        this.direction = this.getOppositeDirection(this.direction);
        this.nextDirection = this.direction;
    }

    /**
     * Check if the ghost is in the ghost house
     * @returns {boolean} True if the ghost is in the ghost house
     */
    isInGhostHouse() {
        const { row, column } = pixelToGrid(this.x, this.y);
        return gameMap.isGhostHouse(row, column);
    }

    /**
     * Check if the ghost is at the ghost house door
     * @returns {boolean} True if the ghost is at the ghost house door
     */
    isAtGhostHouseDoor() {
        const { row, column } = pixelToGrid(this.x, this.y);
        return gameMap.isGhostDoor(row, column);
    }

    /**
     * Check if the ghost is in a tunnel
     * @returns {boolean} True if the ghost is in a tunnel
     */
    isInTunnel() {
        const { row, column } = pixelToGrid(this.x, this.y);
        return gameMap.isTunnel(row, column);
    }

    /**
     * Check if the ghost should leave the house
     * @param {number} dotsEaten - Number of dots eaten
     * @returns {boolean} True if the ghost should leave the house
     */
    shouldLeaveHouse(dotsEaten) {
        // Blinky starts outside the house
        if (this.type === GHOST_TYPE.BLINKY) {
            return true; // Force Blinky to leave immediately
        }
        
        // Check if enough dots have been eaten for this ghost to leave
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
     * Check for tunnel teleportation
     * @param {number} deltaTime - Time elapsed since the last update
     */
    checkTunnel(deltaTime) {
        const { row, column } = pixelToGrid(this.x, this.y);
        
        // Enhanced tunnel detection - check if we're in a tunnel tile
        if (gameMap.isTunnel(row, column)) {
            // Update stuck timer if in tunnel
            if (this.isStuck) {
                this.stuckTimer += deltaTime;
            } else {
                this.isStuck = true;
                this.stuckTimer = 0;
            }
            
            // Only teleport when at the center of the tunnel tile or if stuck for too long
            if (isAtTileCenter(this.x, this.y) || this.stuckTimer > 1000) {
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
                    
                    // Reset stuck status after teleporting
                    this.isStuck = false;
                    this.stuckTimer = 0;
                    
                    console.log(`${this.type} ghost teleported through tunnel`);
                }
            }
        } else {
            // Reset stuck status when not in tunnel
            this.isStuck = false;
            this.stuckTimer = 0;
        }
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
        if (this.eaten) {
            // Draw eyes only for eaten ghosts
            return;
        } else if (this.frightened) {
            if (this.blinking) {
                ctx.fillStyle = COLORS.FRIGHTENED_ENDING;
            } else {
                ctx.fillStyle = COLORS.FRIGHTENED;
            }
        } else {
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
        
        // Draw ghost body (semi-circle + rectangle)
        const radius = SCALED_TILE_SIZE / 2;
        
        // Draw semi-circle for top half
        ctx.beginPath();
        ctx.arc(0, 0, radius, Math.PI, 0, false);
        ctx.lineTo(radius, radius);
        
        // Draw wavy bottom
        const waveHeight = radius / 4;
        const waveCount = 3;
        const waveWidth = (radius * 2) / waveCount;
        
        for (let i = 0; i < waveCount; i++) {
            const startX = radius - (i * waveWidth);
            const endX = radius - ((i + 1) * waveWidth);
            
            if (i % 2 === 0) {
                ctx.lineTo(endX, radius);
            } else {
                ctx.lineTo(endX, radius + waveHeight);
            }
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
        if (this.frightened && !this.eaten) {
            // Draw frightened eyes (small white dots)
            ctx.fillStyle = '#FFFFFF';
            
            // Left eye
            ctx.beginPath();
            ctx.arc(-SCALED_TILE_SIZE / 5, -SCALED_TILE_SIZE / 8, SCALED_TILE_SIZE / 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Right eye
            ctx.beginPath();
            ctx.arc(SCALED_TILE_SIZE / 5, -SCALED_TILE_SIZE / 8, SCALED_TILE_SIZE / 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw frightened mouth
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            // Wavy line for mouth
            const mouthY = SCALED_TILE_SIZE / 5;
            const mouthWidth = SCALED_TILE_SIZE / 3;
            ctx.moveTo(-mouthWidth, mouthY);
            
            for (let i = 0; i < 4; i++) {
                const cpX = -mouthWidth + (i + 0.5) * (mouthWidth * 2) / 4;
                const cpY = mouthY + (i % 2 === 0 ? -1 : 1) * SCALED_TILE_SIZE / 10;
                const x = -mouthWidth + (i + 1) * (mouthWidth * 2) / 4;
                const y = mouthY;
                
                ctx.quadraticCurveTo(cpX, cpY, x, y);
            }
            
            ctx.stroke();
        } else {
            // Draw normal eyes (white circles with pupils)
            ctx.fillStyle = '#FFFFFF';
            
            // Eye positions
            const eyeSpacing = SCALED_TILE_SIZE / 4;
            const eyeY = -SCALED_TILE_SIZE / 8;
            const eyeRadius = SCALED_TILE_SIZE / 6;
            
            // Left eye
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Right eye
            ctx.beginPath();
            ctx.arc(eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw pupils based on direction
            ctx.fillStyle = '#000000';
            const pupilRadius = eyeRadius / 2;
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
            
            // Left pupil
            ctx.beginPath();
            ctx.arc(-eyeSpacing + pupilOffsetX, eyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Right pupil
            ctx.beginPath();
            ctx.arc(eyeSpacing + pupilOffsetX, eyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/**
 * Ghost Manager class for managing all ghosts
 */
class GhostManager {
    constructor() {
        this.ghosts = [];
        this.currentMode = GHOST_MODE.SCATTER;
        this.modeTimer = 0;
        this.modeIndex = 0;
        this.modeTimings = [];
    }

    /**
     * Initialize the ghost manager
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
        
        // Reset mode
        this.currentMode = GHOST_MODE.SCATTER;
        this.modeTimer = 0;
        this.modeIndex = 0;
    }

    /**
     * Reset the ghost manager for a new life
     */
    reset() {
        // Reset each ghost
        this.ghosts.forEach(ghost => ghost.reset());
        
        // Reset mode
        this.currentMode = GHOST_MODE.SCATTER;
        this.modeTimer = 0;
        this.modeIndex = 0;
    }

    /**
     * Set the mode timings based on the level
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
        // Update ghost mode
        this.updateMode(deltaTime);
        
        // Update Blinky's elroy mode
        this.updateElroyMode(dotsEaten, totalDots, levelConfig);
        
        // Update each ghost
        this.ghosts.forEach(ghost => {
            ghost.update(deltaTime, pacman, this.ghosts, dotsEaten, totalDots, levelConfig);
        });
        
        // Check for collisions with Pac-Man
        this.checkCollisions(pacman);
    }

    /**
     * Update the ghost mode
     * @param {number} deltaTime - Time elapsed since the last update
     */
    updateMode(deltaTime) {
        // Don't update mode if all ghosts are frightened
        if (this.ghosts.every(ghost => ghost.frightened)) {
            return;
        }
        
        // Update mode timer
        this.modeTimer += deltaTime;
        
        // Check if it's time to switch modes
        if (this.modeTimer >= this.modeTimings[this.modeIndex].duration) {
            // Reset timer
            this.modeTimer = 0;
            
            // Move to next mode
            this.modeIndex = (this.modeIndex + 1) % this.modeTimings.length;
            
            // Set new mode
            this.currentMode = this.modeTimings[this.modeIndex].mode;
            
            // Update ghosts that aren't in special modes
            this.ghosts.forEach(ghost => {
                if (!ghost.frightened && !ghost.eaten && ghost.mode !== GHOST_MODE.HOUSE && ghost.mode !== GHOST_MODE.LEAVING_HOUSE) {
                    ghost.mode = this.currentMode;
                    ghost.reverseDirection();
                }
            });
        }
    }

    /**
     * Update Blinky's elroy mode
     * @param {number} dotsEaten - Number of dots eaten
     * @param {number} totalDots - Total number of dots in the level
     * @param {Object} levelConfig - Level configuration
     */
    updateElroyMode(dotsEaten, totalDots, levelConfig) {
        const dotsRemaining = totalDots - dotsEaten;
        const blinky = this.ghosts.find(ghost => ghost.type === GHOST_TYPE.BLINKY);
        
        if (blinky && !blinky.frightened && !blinky.eaten) {
            if (dotsRemaining <= levelConfig.elroy2DotsLeft) {
                blinky.elroyMode = 2;
            } else if (dotsRemaining <= levelConfig.elroy1DotsLeft) {
                blinky.elroyMode = 1;
            } else {
                blinky.elroyMode = 0;
            }
        }
    }

    /**
     * Make all ghosts enter frightened mode
     * @param {number} duration - Duration of frightened mode in milliseconds
     */
    enterFrightenedMode(duration) {
        this.ghosts.forEach(ghost => {
            if (!ghost.eaten && ghost.mode !== GHOST_MODE.HOUSE && ghost.mode !== GHOST_MODE.LEAVING_HOUSE) {
                ghost.frightened = true;
                ghost.blinkTimer = 0;
                ghost.blinking = false;
                ghost.previousMode = ghost.mode;
                ghost.reverseDirection();
            }
        });
    }

    /**
     * Check for collisions between ghosts and Pac-Man
     * @param {Object} pacman - Pac-Man object
     */
    checkCollisions(pacman) {
        if (pacman.isDying) {
            return;
        }
        
        const pacmanRect = {
            x: pacman.x - SCALED_TILE_SIZE / 2,
            y: pacman.y - SCALED_TILE_SIZE / 2,
            width: SCALED_TILE_SIZE,
            height: SCALED_TILE_SIZE
        };
        
        this.ghosts.forEach(ghost => {
            if (ghost.mode === GHOST_MODE.HOUSE || ghost.mode === GHOST_MODE.LEAVING_HOUSE) {
                return;
            }
            
            const ghostRect = {
                x: ghost.x - SCALED_TILE_SIZE / 2,
                y: ghost.y - SCALED_TILE_SIZE / 2,
                width: SCALED_TILE_SIZE,
                height: SCALED_TILE_SIZE
            };
            
            if (checkCollision(pacmanRect, ghostRect)) {
                if (ghost.frightened) {
                    // Pac-Man eats the ghost
                    ghost.eaten = true;
                    ghost.frightened = false;
                    
                    // Add score based on how many ghosts have been eaten
                    const scoreIndex = Math.min(pacman.ghostsEaten, SCORE.GHOST.length - 1);
                    pacman.score += SCORE.GHOST[scoreIndex];
                    pacman.ghostsEaten++;
                    
                    // Play ghost eaten sound
                    audioManager.play('eatGhost');
                } else if (!ghost.eaten) {
                    // Ghost kills Pac-Man
                    pacman.die();
                    game.state = GAME_STATE.DYING;
                }
            }
        });
    }

    /**
     * Draw all ghosts
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        // Draw ghosts in order (so Blinky is on top)
        this.ghosts.forEach(ghost => {
            ghost.draw(ctx);
        });
    }
}

// Create and export a singleton instance
const ghostManager = new GhostManager();
