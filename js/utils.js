// Utility functions for the Pac-Man game

/**
 * Converts a direction value to a vector
 * @param {number} direction - Direction constant from DIRECTION
 * @returns {Object} Vector with x and y components
 */
function directionToVector(direction) {
    switch (direction) {
        case DIRECTION.UP:
            return { x: 0, y: -1 };
        case DIRECTION.RIGHT:
            return { x: 1, y: 0 };
        case DIRECTION.DOWN:
            return { x: 0, y: 1 };
        case DIRECTION.LEFT:
            return { x: -1, y: 0 };
        default:
            return { x: 0, y: 0 };
    }
}

/**
 * Converts a vector to a direction value
 * @param {Object} vector - Vector with x and y components
 * @returns {number} Direction constant from DIRECTION
 */
function vectorToDirection(vector) {
    if (vector.x === 0 && vector.y === -1) return DIRECTION.UP;
    if (vector.x === 1 && vector.y === 0) return DIRECTION.RIGHT;
    if (vector.x === 0 && vector.y === 1) return DIRECTION.DOWN;
    if (vector.x === -1 && vector.y === 0) return DIRECTION.LEFT;
    return DIRECTION.NONE;
}

/**
 * Gets the opposite direction
 * @param {number} direction - Direction constant from DIRECTION
 * @returns {number} Opposite direction constant
 */
function getOppositeDirection(direction) {
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
 * Calculates the Euclidean distance between two points
 * @param {Object} point1 - First point with x and y coordinates
 * @param {Object} point2 - Second point with x and y coordinates
 * @returns {number} Distance between the points
 */
function calculateDistance(point1, point2) {
    return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
}

/**
 * Calculates the Manhattan distance between two points
 * @param {Object} point1 - First point with x and y coordinates
 * @param {Object} point2 - Second point with x and y coordinates
 * @returns {number} Manhattan distance between the points
 */
function calculateManhattanDistance(point1, point2) {
    return Math.abs(point2.x - point1.x) + Math.abs(point2.y - point1.y);
}

/**
 * Converts pixel coordinates to grid coordinates
 * @param {number} x - X coordinate in pixels
 * @param {number} y - Y coordinate in pixels
 * @returns {Object} Grid coordinates with row and column
 */
function pixelToGrid(x, y) {
    return {
        column: Math.floor(x / SCALED_TILE_SIZE),
        row: Math.floor(y / SCALED_TILE_SIZE)
    };
}

/**
 * Converts grid coordinates to pixel coordinates (center of the tile)
 * @param {number} row - Row in the grid
 * @param {number} column - Column in the grid
 * @returns {Object} Pixel coordinates with x and y
 */
function gridToPixel(row, column) {
    return {
        x: column * SCALED_TILE_SIZE + SCALED_TILE_SIZE / 2,
        y: row * SCALED_TILE_SIZE + SCALED_TILE_SIZE / 2
    };
}

/**
 * Checks if a position is at the center of a tile
 * @param {number} x - X coordinate in pixels
 * @param {number} y - Y coordinate in pixels
 * @returns {boolean} True if at the center of a tile
 */
function isAtTileCenter(x, y) {
    const centerX = Math.floor(x / SCALED_TILE_SIZE) * SCALED_TILE_SIZE + SCALED_TILE_SIZE / 2;
    const centerY = Math.floor(y / SCALED_TILE_SIZE) * SCALED_TILE_SIZE + SCALED_TILE_SIZE / 2;
    
    // Allow for a small margin of error
    const margin = 1;
    return Math.abs(x - centerX) <= margin && Math.abs(y - centerY) <= margin;
}

/**
 * Formats a number as a score string with leading zeros
 * @param {number} score - The score to format
 * @returns {string} Formatted score string
 */
function formatScore(score) {
    return score.toString().padStart(8, '0');
}

/**
 * Gets the level configuration based on the current level
 * @param {number} level - Current game level (1-based)
 * @returns {Object} Level configuration
 */
function getLevelConfig(level) {
    // Adjust level to array index (0-based)
    let index = level - 1;
    
    // Cap at the highest defined level
    if (index >= LEVEL_SPECS.length) {
        index = LEVEL_SPECS.length - 1;
    }
    
    return LEVEL_SPECS[index];
}

/**
 * Gets the ghost mode timings based on the current level
 * @param {number} level - Current game level (1-based)
 * @returns {Array} Array of ghost mode timing objects
 */
function getGhostModeTimings(level) {
    if (level === 1) {
        return GHOST_MODE_TIMINGS[0];
    } else if (level >= 2 && level <= 4) {
        return GHOST_MODE_TIMINGS[1];
    } else {
        return GHOST_MODE_TIMINGS[2];
    }
}

/**
 * Generates a unique ID
 * @returns {string} Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Checks if two rectangles overlap
 * @param {Object} rect1 - First rectangle with x, y, width, and height
 * @param {Object} rect2 - Second rectangle with x, y, width, and height
 * @returns {boolean} True if the rectangles overlap
 */
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

/**
 * Draws a rounded rectangle on a canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Width of the rectangle
 * @param {number} height - Height of the rectangle
 * @param {number} radius - Corner radius
 * @param {boolean} fill - Whether to fill the rectangle
 * @param {boolean} stroke - Whether to stroke the rectangle
 */
function drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fill) {
        ctx.fill();
    }
    
    if (stroke) {
        ctx.stroke();
    }
}
