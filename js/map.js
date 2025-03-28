// Map class for the Pac-Man game

class GameMap {
    constructor() {
        this.grid = [];
        this.dotCount = 0;
        this.powerPellets = [];
        this.tunnels = [];
        this.pacmanSpawn = { row: 0, column: 0 };
        this.ghostSpawns = {
            [GHOST_TYPE.BLINKY]: { row: 0, column: 0 },
            [GHOST_TYPE.PINKY]: { row: 0, column: 0 },
            [GHOST_TYPE.INKY]: { row: 0, column: 0 },
            [GHOST_TYPE.CLYDE]: { row: 0, column: 0 }
        };
        this.ghostHouseTiles = [];
        this.ghostDoorTiles = [];
    }

    /**
     * Initialize the game map with the classic Pac-Man layout
     */
    init() {
        // Classic Pac-Man map layout
        // 0 = empty, 1 = wall, 2 = dot, 3 = power pellet, 4 = ghost house, 5 = ghost door, 6 = tunnel
        // 7 = pacman spawn, 8-11 = ghost spawns (blinky, pinky, inky, clyde)
        this.grid = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
            [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
            [1, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 3, 1],
            [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
            [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
            [1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1],
            [1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1],
            [1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 1],
            [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 5, 5, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 4, 4, 4, 4, 4, 4, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
            [6, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 4, 8, 4, 9, 4, 4, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 6],
            [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 4, 10, 4, 11, 4, 4, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
            [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
            [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
            [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
            [1, 3, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 7, 0, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 3, 1],
            [1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1],
            [1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1],
            [1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 1],
            [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
            [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
            [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];

        // Process the grid to count dots and identify special tiles
        this.processGrid();
    }

    /**
     * Process the grid to count dots and identify special tiles
     */
    processGrid() {
        this.dotCount = 0;
        this.powerPellets = [];
        this.tunnels = [];
        this.ghostHouseTiles = [];
        this.ghostDoorTiles = [];

        for (let row = 0; row < this.grid.length; row++) {
            for (let column = 0; column < this.grid[row].length; column++) {
                const tile = this.grid[row][column];
                
                switch (tile) {
                    case TILE_TYPE.DOT:
                        this.dotCount++;
                        break;
                    case TILE_TYPE.POWER_PELLET:
                        this.powerPellets.push({ row, column });
                        break;
                    case TILE_TYPE.TUNNEL:
                        this.tunnels.push({ row, column });
                        break;
                    case TILE_TYPE.GHOST_HOUSE:
                        this.ghostHouseTiles.push({ row, column });
                        break;
                    case TILE_TYPE.GHOST_DOOR:
                        this.ghostDoorTiles.push({ row, column });
                        break;
                    case TILE_TYPE.PACMAN_SPAWN:
                        this.pacmanSpawn = { row, column };
                        break;
                    case TILE_TYPE.BLINKY_SPAWN:
                        this.ghostSpawns[GHOST_TYPE.BLINKY] = { row, column };
                        break;
                    case TILE_TYPE.PINKY_SPAWN:
                        this.ghostSpawns[GHOST_TYPE.PINKY] = { row, column };
                        break;
                    case TILE_TYPE.INKY_SPAWN:
                        this.ghostSpawns[GHOST_TYPE.INKY] = { row, column };
                        break;
                    case TILE_TYPE.CLYDE_SPAWN:
                        this.ghostSpawns[GHOST_TYPE.CLYDE] = { row, column };
                        break;
                }
            }
        }
    }

    /**
     * Get the tile type at the specified grid position
     * @param {number} row - Row in the grid
     * @param {number} column - Column in the grid
     * @returns {number} Tile type
     */
    getTileAt(row, column) {
        // Handle out of bounds
        if (row < 0 || row >= this.grid.length || column < 0 || column >= this.grid[0].length) {
            return TILE_TYPE.EMPTY;
        }
        
        return this.grid[row][column];
    }

    /**
     * Check if a tile is walkable (not a wall)
     * @param {number} row - Row in the grid
     * @param {number} column - Column in the grid
     * @returns {boolean} True if the tile is walkable
     */
    isWalkable(row, column) {
        const tile = this.getTileAt(row, column);
        return tile !== TILE_TYPE.WALL;
    }

    /**
     * Check if a tile is a ghost door
     * @param {number} row - Row in the grid
     * @param {number} column - Column in the grid
     * @returns {boolean} True if the tile is a ghost door
     */
    isGhostDoor(row, column) {
        return this.getTileAt(row, column) === TILE_TYPE.GHOST_DOOR;
    }

    /**
     * Check if a tile is inside the ghost house
     * @param {number} row - Row in the grid
     * @param {number} column - Column in the grid
     * @returns {boolean} True if the tile is inside the ghost house
     */
    isGhostHouse(row, column) {
        return this.getTileAt(row, column) === TILE_TYPE.GHOST_HOUSE;
    }

    /**
     * Check if a tile is a tunnel
     * @param {number} row - Row in the grid
     * @param {number} column - Column in the grid
     * @returns {boolean} True if the tile is a tunnel
     */
    isTunnel(row, column) {
        return this.getTileAt(row, column) === TILE_TYPE.TUNNEL;
    }

    /**
     * Get the opposite tunnel entrance
     * @param {number} row - Row in the grid
     * @param {number} column - Column in the grid
     * @returns {Object|null} Opposite tunnel coordinates or null if not a tunnel
     */
    getOppositeTunnel(row, column) {
        if (!this.isTunnel(row, column)) return null;
        
        // Find the other tunnel entrance
        for (const tunnel of this.tunnels) {
            if (tunnel.row !== row || tunnel.column !== column) {
                return tunnel;
            }
        }
        
        return null;
    }

    /**
     * Consume a dot at the specified position
     * @param {number} row - Row in the grid
     * @param {number} column - Column in the grid
     * @returns {number} Type of item consumed (0 for nothing, 2 for dot, 3 for power pellet)
     */
    consumeDot(row, column) {
        const tile = this.getTileAt(row, column);
        
        if (tile === TILE_TYPE.DOT) {
            this.grid[row][column] = TILE_TYPE.EMPTY;
            this.dotCount--;
            return TILE_TYPE.DOT;
        } else if (tile === TILE_TYPE.POWER_PELLET) {
            this.grid[row][column] = TILE_TYPE.EMPTY;
            
            // Remove from power pellets array
            this.powerPellets = this.powerPellets.filter(
                pellet => pellet.row !== row || pellet.column !== column
            );
            
            return TILE_TYPE.POWER_PELLET;
        }
        
        return TILE_TYPE.EMPTY;
    }

    /**
     * Reset the map for a new level
     */
    reset() {
        // Restore all dots and power pellets
        for (let row = 0; row < this.grid.length; row++) {
            for (let column = 0; column < this.grid[row].length; column++) {
                const tile = this.grid[row][column];
                
                if (tile === TILE_TYPE.EMPTY) {
                    // Check if this position was originally a dot or power pellet
                    const originalTile = this.getOriginalTile(row, column);
                    if (originalTile === TILE_TYPE.DOT || originalTile === TILE_TYPE.POWER_PELLET) {
                        this.grid[row][column] = originalTile;
                    }
                }
            }
        }
        
        // Reprocess the grid to update counts
        this.processGrid();
    }

    /**
     * Get the original tile type at the specified position
     * @param {number} row - Row in the grid
     * @param {number} column - Column in the grid
     * @returns {number} Original tile type
     */
    getOriginalTile(row, column) {
        // This is a simplified version. In a real implementation, you would store the original map.
        // For now, we'll use a hardcoded check for known dot and power pellet positions.
        
        // Check if it's a power pellet position
        if ((row === 3 && column === 1) || 
            (row === 3 && column === 26) || 
            (row === 24 && column === 1) || 
            (row === 24 && column === 26)) {
            return TILE_TYPE.POWER_PELLET;
        }
        
        // Check if it's a position that should have a dot
        // This is a simplified check - in a real implementation, you would compare with the original map
        if (this.isWalkable(row, column) && 
            !this.isGhostDoor(row, column) && 
            !this.isGhostHouse(row, column) && 
            this.getTileAt(row, column) !== TILE_TYPE.PACMAN_SPAWN) {
            return TILE_TYPE.DOT;
        }
        
        return this.getTileAt(row, column);
    }

    /**
     * Draw the map on the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        for (let row = 0; row < this.grid.length; row++) {
            for (let column = 0; column < this.grid[row].length; column++) {
                const tile = this.grid[row][column];
                const x = column * SCALED_TILE_SIZE;
                const y = row * SCALED_TILE_SIZE;
                
                switch (tile) {
                    case TILE_TYPE.WALL:
                        this.drawWall(ctx, row, column);
                        break;
                    case TILE_TYPE.DOT:
                        this.drawDot(ctx, x, y);
                        break;
                    case TILE_TYPE.POWER_PELLET:
                        this.drawPowerPellet(ctx, x, y);
                        break;
                    case TILE_TYPE.GHOST_DOOR:
                        this.drawGhostDoor(ctx, x, y);
                        break;
                }
            }
        }
    }

    /**
     * Draw a wall tile
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} row - Row in the grid
     * @param {number} column - Column in the grid
     */
    drawWall(ctx, row, column) {
        const x = column * SCALED_TILE_SIZE;
        const y = row * SCALED_TILE_SIZE;
        const size = SCALED_TILE_SIZE;
        const borderWidth = size / 6; // Thickness of the wall border
        
        // Check adjacent tiles to determine wall shape
        const hasWallAbove = this.getTileAt(row - 1, column) === TILE_TYPE.WALL;
        const hasWallBelow = this.getTileAt(row + 1, column) === TILE_TYPE.WALL;
        const hasWallLeft = this.getTileAt(row, column - 1) === TILE_TYPE.WALL;
        const hasWallRight = this.getTileAt(row, column + 1) === TILE_TYPE.WALL;
        
        // Draw the hollow wall with blue border
        ctx.fillStyle = COLORS.WALL;
        
        // Draw the border pieces based on adjacent walls
        // Top border
        if (!hasWallAbove) {
            ctx.fillRect(x, y, size, borderWidth);
        }
        
        // Bottom border
        if (!hasWallBelow) {
            ctx.fillRect(x, y + size - borderWidth, size, borderWidth);
        }
        
        // Left border
        if (!hasWallLeft) {
            ctx.fillRect(x, y, borderWidth, size);
        }
        
        // Right border
        if (!hasWallRight) {
            ctx.fillRect(x + size - borderWidth, y, borderWidth, size);
        }
        
        // Draw corner pieces
        if (!hasWallAbove && !hasWallLeft) {
            ctx.fillRect(x, y, borderWidth, borderWidth);
        }
        
        if (!hasWallAbove && !hasWallRight) {
            ctx.fillRect(x + size - borderWidth, y, borderWidth, borderWidth);
        }
        
        if (!hasWallBelow && !hasWallLeft) {
            ctx.fillRect(x, y + size - borderWidth, borderWidth, borderWidth);
        }
        
        if (!hasWallBelow && !hasWallRight) {
            ctx.fillRect(x + size - borderWidth, y + size - borderWidth, borderWidth, borderWidth);
        }
    }

    /**
     * Draw a dot
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    drawDot(ctx, x, y) {
        const dotSize = SCALED_TILE_SIZE / 5;
        const centerX = x + SCALED_TILE_SIZE / 2;
        const centerY = y + SCALED_TILE_SIZE / 2;
        
        ctx.fillStyle = COLORS.DOT;
        ctx.beginPath();
        ctx.arc(centerX, centerY, dotSize, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a power pellet
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    drawPowerPellet(ctx, x, y) {
        const pelletSize = SCALED_TILE_SIZE / 2;
        const centerX = x + SCALED_TILE_SIZE / 2;
        const centerY = y + SCALED_TILE_SIZE / 2;
        
        // Make power pellets flash
        const isVisible = Math.floor(Date.now() / 200) % 2 === 0;
        
        if (isVisible) {
            ctx.fillStyle = COLORS.POWER_PELLET;
            ctx.beginPath();
            ctx.arc(centerX, centerY, pelletSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Draw a ghost door
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    drawGhostDoor(ctx, x, y) {
        ctx.fillStyle = '#FFA0A0'; // Light pink
        ctx.fillRect(x, y + SCALED_TILE_SIZE / 3, SCALED_TILE_SIZE, SCALED_TILE_SIZE / 3);
    }

    /**
     * Get valid directions from a position
     * @param {number} row - Row in the grid
     * @param {number} column - Column in the grid
     * @param {boolean} canUseGhostDoor - Whether the entity can use ghost doors
     * @returns {Array} Array of valid directions
     */
    getValidDirections(row, column, canUseGhostDoor = false) {
        const validDirections = [];
        
        // Check each direction
        if (this.canMove(row - 1, column, canUseGhostDoor)) {
            validDirections.push(DIRECTION.UP);
        }
        
        if (this.canMove(row, column + 1, canUseGhostDoor)) {
            validDirections.push(DIRECTION.RIGHT);
        }
        
        if (this.canMove(row + 1, column, canUseGhostDoor)) {
            validDirections.push(DIRECTION.DOWN);
        }
        
        if (this.canMove(row, column - 1, canUseGhostDoor)) {
            validDirections.push(DIRECTION.LEFT);
        }
        
        return validDirections;
    }

    /**
     * Check if movement to a position is possible
     * @param {number} row - Row in the grid
     * @param {number} column - Column in the grid
     * @param {boolean} canUseGhostDoor - Whether the entity can use ghost doors
     * @returns {boolean} True if movement is possible
     */
    canMove(row, column, canUseGhostDoor = false) {
        const tile = this.getTileAt(row, column);
        
        if (tile === TILE_TYPE.WALL) {
            return false;
        }
        
        if (tile === TILE_TYPE.GHOST_DOOR && !canUseGhostDoor) {
            return false;
        }
        
        return true;
    }
}

// Create and export a singleton instance
const gameMap = new GameMap();
