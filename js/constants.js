// Game constants
const TILE_SIZE = 8; // Base tile size
const SCALE = 2; // Scale factor for the game (reduced from 3 to 2)
const SCALED_TILE_SIZE = TILE_SIZE * SCALE;
const ROWS = 36; // Number of rows in the game map
const COLUMNS = 28; // Number of columns in the game map
const CANVAS_WIDTH = COLUMNS * SCALED_TILE_SIZE;
const CANVAS_HEIGHT = ROWS * SCALED_TILE_SIZE;

// Game speeds
const PACMAN_SPEED = 2; // Base speed for Pac-Man
const GHOST_SPEED = 1.75; // Base speed for ghosts
const GHOST_FRIGHTENED_SPEED = 0.9; // Speed for frightened ghosts
const GHOST_TUNNEL_SPEED = 0.5; // Speed for ghosts in tunnels

// Game states
const GAME_STATE = {
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    DYING: 'dying',
    GAME_OVER: 'gameOver',
    LEVEL_COMPLETE: 'levelComplete'
};

// Direction constants
const DIRECTION = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3,
    NONE: 4
};

// Ghost modes
const GHOST_MODE = {
    CHASE: 'chase',
    SCATTER: 'scatter',
    FRIGHTENED: 'frightened',
    EATEN: 'eaten',
    HOUSE: 'house',
    LEAVING_HOUSE: 'leavingHouse'
};

// Ghost types
const GHOST_TYPE = {
    BLINKY: 'blinky', // Red ghost - Shadow
    PINKY: 'pinky',   // Pink ghost - Speedy
    INKY: 'inky',     // Cyan ghost - Bashful
    CLYDE: 'clyde'    // Orange ghost - Pokey
};

// Tile types
const TILE_TYPE = {
    EMPTY: 0,
    WALL: 1,
    DOT: 2,
    POWER_PELLET: 3,
    GHOST_HOUSE: 4,
    GHOST_DOOR: 5,
    TUNNEL: 6,
    PACMAN_SPAWN: 7,
    BLINKY_SPAWN: 8,
    PINKY_SPAWN: 9,
    INKY_SPAWN: 10,
    CLYDE_SPAWN: 11
};

// Colors
const COLORS = {
    PACMAN: '#FFFF00', // Yellow
    BLINKY: '#FF0000', // Red
    PINKY: '#FFB8FF',  // Pink
    INKY: '#00FFFF',   // Cyan
    CLYDE: '#FFB851',  // Orange
    FRIGHTENED: '#2121FF', // Blue
    FRIGHTENED_ENDING: '#FFFFFF', // White (flashing)
    WALL: '#2121FF',   // Blue
    DOT: '#FFB8FF',    // Pink
    POWER_PELLET: '#FFB8FF', // Pink
    TEXT: '#FFFFFF'    // White
};

// Scoring
const SCORE = {
    DOT: 10,
    POWER_PELLET: 50,
    GHOST: [200, 400, 800, 1600], // Points for eating ghosts in sequence
    FRUIT: [100, 300, 500, 700, 1000, 2000, 3000, 5000] // Points for different fruits by level
};

// Level-specific constants
const LEVEL_SPECS = [
    // Level 1
    {
        ghostSpeed: 0.75,
        pacmanSpeed: 0.8,
        dotCount: 244,
        elroy1DotsLeft: 20,
        elroy1Speed: 0.8,
        elroy2DotsLeft: 10,
        elroy2Speed: 0.85,
        frightTime: 6000,
        frightFlashes: 5,
        fruit: 0 // Cherry
    },
    // Level 2
    {
        ghostSpeed: 0.85,
        pacmanSpeed: 0.9,
        dotCount: 244,
        elroy1DotsLeft: 30,
        elroy1Speed: 0.9,
        elroy2DotsLeft: 15,
        elroy2Speed: 0.95,
        frightTime: 5000,
        frightFlashes: 5,
        fruit: 1 // Strawberry
    },
    // Levels 3-4
    {
        ghostSpeed: 0.95,
        pacmanSpeed: 1.0,
        dotCount: 244,
        elroy1DotsLeft: 40,
        elroy1Speed: 1.0,
        elroy2DotsLeft: 20,
        elroy2Speed: 1.05,
        frightTime: 4000,
        frightFlashes: 5,
        fruit: 2 // Orange
    },
    // Levels 5-7
    {
        ghostSpeed: 1.05, // Increased from 0.95
        pacmanSpeed: 1.0,
        dotCount: 244,
        elroy1DotsLeft: 40,
        elroy1Speed: 1.1, // Increased from 1.0
        elroy2DotsLeft: 20,
        elroy2Speed: 1.15, // Increased from 1.05
        frightTime: 3000,
        frightFlashes: 5,
        fruit: 3 // Apple
    },
    // Levels 8-10
    {
        ghostSpeed: 1.15, // Increased from 0.95
        pacmanSpeed: 1.0,
        dotCount: 244,
        elroy1DotsLeft: 40,
        elroy1Speed: 1.2, // Increased from 1.0
        elroy2DotsLeft: 20,
        elroy2Speed: 1.25, // Increased from 1.05
        frightTime: 2000,
        frightFlashes: 5,
        fruit: 4 // Melon
    },
    // Levels 11-13
    {
        ghostSpeed: 1.25, // Increased from 0.95
        pacmanSpeed: 1.0,
        dotCount: 244,
        elroy1DotsLeft: 40,
        elroy1Speed: 1.3, // Increased from 1.0
        elroy2DotsLeft: 20,
        elroy2Speed: 1.35, // Increased from 1.05
        frightTime: 1000,
        frightFlashes: 3,
        fruit: 5 // Galaxian
    },
    // Levels 14-16
    {
        ghostSpeed: 1.35, // Increased from 0.95
        pacmanSpeed: 1.0,
        dotCount: 244,
        elroy1DotsLeft: 40,
        elroy1Speed: 1.4, // Increased from 1.0
        elroy2DotsLeft: 20,
        elroy2Speed: 1.45, // Increased from 1.05
        frightTime: 1000,
        frightFlashes: 3,
        fruit: 6 // Bell
    },
    // Levels 17+
    {
        ghostSpeed: 1.45, // Increased from 0.95
        pacmanSpeed: 1.0,
        dotCount: 244,
        elroy1DotsLeft: 40,
        elroy1Speed: 1.5, // Increased from 1.0
        elroy2DotsLeft: 20,
        elroy2Speed: 1.55, // Increased from 1.05
        frightTime: 0, // No frightened mode
        frightFlashes: 0,
        fruit: 7 // Key
    }
];

// Ghost mode timing (in milliseconds)
const GHOST_MODE_TIMINGS = [
    // Level 1
    [
        { mode: GHOST_MODE.SCATTER, duration: 7000 },
        { mode: GHOST_MODE.CHASE, duration: 20000 },
        { mode: GHOST_MODE.SCATTER, duration: 7000 },
        { mode: GHOST_MODE.CHASE, duration: 20000 },
        { mode: GHOST_MODE.SCATTER, duration: 5000 },
        { mode: GHOST_MODE.CHASE, duration: 20000 },
        { mode: GHOST_MODE.SCATTER, duration: 5000 },
        { mode: GHOST_MODE.CHASE, duration: Infinity }
    ],
    // Level 2-4
    [
        { mode: GHOST_MODE.SCATTER, duration: 7000 },
        { mode: GHOST_MODE.CHASE, duration: 20000 },
        { mode: GHOST_MODE.SCATTER, duration: 7000 },
        { mode: GHOST_MODE.CHASE, duration: 20000 },
        { mode: GHOST_MODE.SCATTER, duration: 5000 },
        { mode: GHOST_MODE.CHASE, duration: 1033000 },
        { mode: GHOST_MODE.SCATTER, duration: 1 },
        { mode: GHOST_MODE.CHASE, duration: Infinity }
    ],
    // Level 5+
    [
        { mode: GHOST_MODE.SCATTER, duration: 5000 },
        { mode: GHOST_MODE.CHASE, duration: 20000 },
        { mode: GHOST_MODE.SCATTER, duration: 5000 },
        { mode: GHOST_MODE.CHASE, duration: 20000 },
        { mode: GHOST_MODE.SCATTER, duration: 5000 },
        { mode: GHOST_MODE.CHASE, duration: 1037000 },
        { mode: GHOST_MODE.SCATTER, duration: 1 },
        { mode: GHOST_MODE.CHASE, duration: Infinity }
    ]
];

// Ghost release timing (in dots eaten)
const GHOST_RELEASE_DOTS = {
    PINKY: 0,    // Pinky leaves immediately
    INKY: 30,    // Inky leaves after 30 dots
    CLYDE: 60    // Clyde leaves after 60 dots
};
