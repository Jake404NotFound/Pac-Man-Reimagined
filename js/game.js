// Game class for the Pac-Man game

class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.state = GAME_STATE.READY;
        this.level = 1;
        this.score = 0;
        this.highScore = 0;
        this.lastFrameTime = 0;
        this.isPaused = false;
        this.keyState = {};
        this.fruitTimer = 0;
        this.fruitVisible = false;
        this.fruitEaten = false;
        this.fruitPosition = { x: 0, y: 0 };
        this.fruitType = 0;
        this.readyTimer = 0;
        this.levelCompleteTimer = 0;
        this.gameOverTimer = 0;
    }

    /**
     * Initialize the game
     */
    async init() {
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.width = CANVAS_WIDTH;
        this.height = CANVAS_HEIGHT;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Initialize audio
        await audioManager.init();
        
        // Initialize map
        gameMap.init();
        
        // Initialize Pac-Man
        pacman.resetGame();
        
        // Initialize ghosts
        ghostManager.init();
        ghostManager.setModeTimings(this.level);
        
        // Load high score from storage
        this.loadHighScore();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start game loop
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Set up event listeners for keyboard input
     */
    setupEventListeners() {
        // Keyboard event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Prevent default behavior for arrow keys and WASD
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'p', 'Enter', 'Escape'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        this.keyState[e.key] = true;
        
        // Start game when Enter is pressed
        if (e.key === 'Enter' && this.state === GAME_STATE.READY) {
            this.startGame();
        }
        
        // Restart game when Enter is pressed after game over
        if (e.key === 'Enter' && this.state === GAME_STATE.GAME_OVER) {
            this.resetGame();
        }
        
        // Continue to next level when Enter is pressed after level complete
        if (e.key === 'Enter' && this.state === GAME_STATE.LEVEL_COMPLETE) {
            this.startNextLevel();
        }
        
        // Toggle pause when P is pressed
        if (e.key === 'p' && this.state === GAME_STATE.PLAYING) {
            this.togglePause();
        }
        
        // Show leaderboard when L is pressed
        if (e.key === 'l') {
            this.toggleLeaderboard();
        }
        
        // Hide leaderboard when Escape is pressed
        if (e.key === 'Escape' && document.getElementById('leaderboardScreen').classList.contains('hidden') === false) {
            this.hideLeaderboard();
        }
        
        // Set Pac-Man direction based on arrow keys or WASD
        if (this.state === GAME_STATE.PLAYING && !this.isPaused) {
            if (e.key === 'ArrowUp' || e.key === 'w') {
                pacman.setDirection(DIRECTION.UP);
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                pacman.setDirection(DIRECTION.RIGHT);
            } else if (e.key === 'ArrowDown' || e.key === 's') {
                pacman.setDirection(DIRECTION.DOWN);
            } else if (e.key === 'ArrowLeft' || e.key === 'a') {
                pacman.setDirection(DIRECTION.LEFT);
            }
        }
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyUp(e) {
        this.keyState[e.key] = false;
    }

    /**
     * Start the game
     */
    startGame() {
        this.state = GAME_STATE.PLAYING;
        this.readyTimer = 0;
        
        // Hide start screen
        document.getElementById('startScreen').classList.add('hidden');
        
        // Play start sound
        audioManager.play('start');
    }

    /**
     * Reset the game for a new game
     */
    resetGame() {
        this.level = 1;
        this.score = 0;
        
        // Reset map
        gameMap.init();
        
        // Reset Pac-Man
        pacman.resetGame();
        
        // Reset ghosts
        ghostManager.init();
        ghostManager.setModeTimings(this.level);
        
        // Reset fruit
        this.fruitTimer = 0;
        this.fruitVisible = false;
        this.fruitEaten = false;
        
        // Hide game over screen
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        // Show start screen
        document.getElementById('startScreen').classList.remove('hidden');
        
        this.state = GAME_STATE.READY;
    }

    /**
     * Start the next level
     */
    startNextLevel() {
        this.level++;
        
        // Reset map
        gameMap.reset();
        
        // Reset Pac-Man position
        pacman.reset();
        
        // Reset ghosts
        ghostManager.reset();
        ghostManager.setModeTimings(this.level);
        
        // Reset fruit
        this.fruitTimer = 0;
        this.fruitVisible = false;
        this.fruitEaten = false;
        
        // Hide level complete screen
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        
        // Show ready screen briefly
        document.getElementById('startScreen').classList.remove('hidden');
        
        this.state = GAME_STATE.READY;
        this.readyTimer = 0;
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            document.getElementById('pauseScreen').classList.remove('hidden');
            audioManager.pauseMusic();
        } else {
            document.getElementById('pauseScreen').classList.add('hidden');
            audioManager.resumeMusic();
        }
    }

    /**
     * Toggle leaderboard visibility
     */
    toggleLeaderboard() {
        const leaderboardScreen = document.getElementById('leaderboardScreen');
        
        if (leaderboardScreen.classList.contains('hidden')) {
            // Show leaderboard
            leaderboardScreen.classList.remove('hidden');
            
            // Populate leaderboard entries
            this.populateLeaderboard();
            
            // Pause game if playing
            if (this.state === GAME_STATE.PLAYING && !this.isPaused) {
                this.togglePause();
            }
        } else {
            this.hideLeaderboard();
        }
    }

    /**
     * Hide the leaderboard
     */
    hideLeaderboard() {
        document.getElementById('leaderboardScreen').classList.add('hidden');
    }

    /**
     * Populate the leaderboard with entries
     */
    populateLeaderboard() {
        const leaderboardEntries = document.getElementById('leaderboardEntries');
        leaderboardEntries.innerHTML = '';
        
        // Get leaderboard data
        const leaderboard = leaderboardManager.getLeaderboard();
        
        if (leaderboard.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.textContent = 'No high scores yet!';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '20px';
            leaderboardEntries.appendChild(emptyMessage);
            return;
        }
        
        // Create entries
        leaderboard.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'leaderboard-entry';
            
            const rankElement = document.createElement('div');
            rankElement.className = 'leaderboard-rank';
            rankElement.textContent = `${index + 1}.`;
            
            const nameElement = document.createElement('div');
            nameElement.className = 'leaderboard-name';
            nameElement.textContent = entry.name;
            
            const scoreElement = document.createElement('div');
            scoreElement.className = 'leaderboard-score';
            scoreElement.textContent = formatScore(entry.score);
            
            entryElement.appendChild(rankElement);
            entryElement.appendChild(nameElement);
            entryElement.appendChild(scoreElement);
            
            leaderboardEntries.appendChild(entryElement);
        });
    }

    /**
     * Load the high score from storage
     */
    loadHighScore() {
        chrome.storage.local.get(['highScore'], (result) => {
            if (result.highScore) {
                this.highScore = result.highScore;
                this.updateScoreDisplay();
            }
        });
    }

    /**
     * Save the high score to storage
     */
    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            chrome.storage.local.set({ highScore: this.highScore });
            
            // Add to leaderboard
            const playerName = 'PLAYER'; // In a real game, you would prompt for a name
            leaderboardManager.addScore(playerName, this.score);
        }
    }

    /**
     * Update the score display
     */
    updateScoreDisplay() {
        document.getElementById('score').textContent = formatScore(this.score);
        document.getElementById('highScore').textContent = formatScore(this.highScore);
        document.getElementById('finalScore').textContent = formatScore(this.score);
    }

    /**
     * Update the lives display
     */
    updateLivesDisplay() {
        const livesContainer = document.getElementById('lives');
        livesContainer.innerHTML = '';
        
        pacman.drawLives(this.ctx, 0, 0);
    }

    /**
     * Game loop
     * @param {number} timestamp - Current timestamp
     */
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Update game state
        this.update(deltaTime);
        
        // Draw game
        this.draw();
        
        // Continue game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Update game state
     * @param {number} deltaTime - Time elapsed since the last update
     */
    update(deltaTime) {
        // Update score display
        this.updateScoreDisplay();
        
        // Update lives display
        this.updateLivesDisplay();
        
        // Handle different game states
        switch (this.state) {
            case GAME_STATE.READY:
                this.updateReadyState(deltaTime);
                break;
                
            case GAME_STATE.PLAYING:
                if (!this.isPaused) {
                    this.updatePlayingState(deltaTime);
                }
                break;
                
            case GAME_STATE.DYING:
                this.updateDyingState(deltaTime);
                break;
                
            case GAME_STATE.LEVEL_COMPLETE:
                this.updateLevelCompleteState(deltaTime);
                break;
                
            case GAME_STATE.GAME_OVER:
                this.updateGameOverState(deltaTime);
                break;
        }
    }

    /**
     * Update the ready state
     * @param {number} deltaTime - Time elapsed since the last update
     */
    updateReadyState(deltaTime) {
        this.readyTimer += deltaTime;
        
        // Start game after 2 seconds
        if (this.readyTimer >= 2000 && document.getElementById('startScreen').classList.contains('hidden')) {
            this.state = GAME_STATE.PLAYING;
        }
    }

    /**
     * Update the playing state
     * @param {number} deltaTime - Time elapsed since the last update
     */
    updatePlayingState(deltaTime) {
        // Update Pac-Man
        pacman.update(deltaTime);
        
        // Update ghosts
        ghostManager.update(
            deltaTime,
            pacman,
            pacman.dotCount,
            gameMap.dotCount + pacman.dotCount,
            getLevelConfig(this.level)
        );
        
        // Update fruit
        this.updateFruit(deltaTime);
        
        // Check for level complete
        if (pacman.dotCount >= gameMap.dotCount) {
            this.onLevelComplete();
        }
        
        // Update score
        this.score = pacman.score;
    }

    /**
     * Update the dying state
     * @param {number} deltaTime - Time elapsed since the last update
     */
    updateDyingState(deltaTime) {
        // Pac-Man's death animation is handled in the Pac-Man class
        pacman.update(deltaTime);
    }

    /**
     * Update the level complete state
     * @param {number} deltaTime - Time elapsed since the last update
     */
    updateLevelCompleteState(deltaTime) {
        this.levelCompleteTimer += deltaTime;
        
        // Start next level after 3 seconds
        if (this.levelCompleteTimer >= 3000) {
            this.startNextLevel();
        }
    }

    /**
     * Update the game over state
     * @param {number} deltaTime - Time elapsed since the last update
     */
    updateGameOverState(deltaTime) {
        this.gameOverTimer += deltaTime;
    }

    /**
     * Update the fruit
     * @param {number} deltaTime - Time elapsed since the last update
     */
    updateFruit(deltaTime) {
        // Update fruit timer
        this.fruitTimer += deltaTime;
        
        // Determine when to show fruit based on dots eaten
        const dotsEaten = pacman.dotCount;
        const totalDots = gameMap.dotCount + pacman.dotCount;
        
        // Show first fruit at 70 dots eaten
        if (!this.fruitVisible && !this.fruitEaten && dotsEaten >= 70 && dotsEaten < 170) {
            this.showFruit();
        }
        
        // Show second fruit at 170 dots eaten
        if (!this.fruitVisible && this.fruitEaten && dotsEaten >= 170) {
            this.showFruit();
            this.fruitEaten = false; // Reset for next level
        }
        
        // Hide fruit after 10 seconds
        if (this.fruitVisible && this.fruitTimer >= 10000) {
            this.hideFruit();
        }
        
        // Check if Pac-Man ate the fruit
        if (this.fruitVisible) {
            const pacmanRect = {
                x: pacman.x - SCALED_TILE_SIZE / 2,
                y: pacman.y - SCALED_TILE_SIZE / 2,
                width: SCALED_TILE_SIZE,
                height: SCALED_TILE_SIZE
            };
            
            const fruitRect = {
                x: this.fruitPosition.x - SCALED_TILE_SIZE / 2,
                y: this.fruitPosition.y - SCALED_TILE_SIZE / 2,
                width: SCALED_TILE_SIZE,
                height: SCALED_TILE_SIZE
            };
            
            if (checkCollision(pacmanRect, fruitRect)) {
                this.eatFruit();
            }
        }
    }

    /**
     * Show the fruit
     */
    showFruit() {
        this.fruitVisible = true;
        this.fruitTimer = 0;
        
        // Set fruit position (middle of the ghost house)
        const fruitRow = 17;
        const fruitColumn = 14;
        const fruitPos = gridToPixel(fruitRow, fruitColumn);
        this.fruitPosition = { x: fruitPos.x, y: fruitPos.y };
        
        // Set fruit type based on level
        const levelConfig = getLevelConfig(this.level);
        this.fruitType = levelConfig.fruit;
    }

    /**
     * Hide the fruit
     */
    hideFruit() {
        this.fruitVisible = false;
    }

    /**
     * Eat the fruit
     */
    eatFruit() {
        this.fruitVisible = false;
        this.fruitEaten = true;
        
        // Add score based on fruit type
        pacman.score += SCORE.FRUIT[this.fruitType];
        
        // Play fruit eaten sound
        audioManager.play('fruit');
    }

    /**
     * Handle Pac-Man death
     */
    onPacManDeathComplete() {
        if (pacman.lives <= 0) {
            this.gameOver();
        } else {
            // Reset positions
            pacman.reset();
            ghostManager.reset();
            
            // Show ready screen briefly
            document.getElementById('startScreen').classList.remove('hidden');
            
            this.state = GAME_STATE.READY;
            this.readyTimer = 0;
        }
    }

    /**
     * Handle level complete
     */
    onLevelComplete() {
        this.state = GAME_STATE.LEVEL_COMPLETE;
        this.levelCompleteTimer = 0;
        
        // Show level complete screen
        document.getElementById('levelCompleteScreen').classList.remove('hidden');
        
        // Play intermission sound
        audioManager.play('intermission');
    }

    /**
     * Handle game over
     */
    gameOver() {
        this.state = GAME_STATE.GAME_OVER;
        this.gameOverTimer = 0;
        
        // Show game over screen
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        // Save high score
        this.saveHighScore();
    }

    /**
     * Draw the game
     */
    draw() {
        // Draw map
        gameMap.draw(this.ctx);
        
        // Draw fruit
        if (this.fruitVisible) {
            this.drawFruit();
        }
        
        // Draw Pac-Man
        pacman.draw(this.ctx);
        
        // Draw ghosts
        ghostManager.draw(this.ctx);
    }

    /**
     * Draw the fruit
     */
    drawFruit() {
        const fruitSize = SCALED_TILE_SIZE * 0.8;
        const x = this.fruitPosition.x - fruitSize / 2;
        const y = this.fruitPosition.y - fruitSize / 2;
        
        // Draw different fruits based on level
        switch (this.fruitType) {
            case 0: // Cherry
                this.ctx.fillStyle = '#FF0000';
                this.ctx.beginPath();
                this.ctx.arc(x + fruitSize * 0.3, y + fruitSize * 0.7, fruitSize * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(x + fruitSize * 0.7, y + fruitSize * 0.5, fruitSize * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = '#00FF00';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(x + fruitSize * 0.3, y + fruitSize * 0.4);
                this.ctx.quadraticCurveTo(x + fruitSize * 0.5, y, x + fruitSize * 0.7, y + fruitSize * 0.2);
                this.ctx.stroke();
                break;
                
            case 1: // Strawberry
                this.ctx.fillStyle = '#FF0000';
                this.ctx.beginPath();
                this.ctx.arc(x + fruitSize / 2, y + fruitSize / 2, fruitSize * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add seeds
                this.ctx.fillStyle = '#FFFF00';
                for (let i = 0; i < 8; i++) {
                    const angle = i * Math.PI / 4;
                    const seedX = x + fruitSize / 2 + Math.cos(angle) * fruitSize * 0.25;
                    const seedY = y + fruitSize / 2 + Math.sin(angle) * fruitSize * 0.25;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(seedX, seedY, fruitSize * 0.05, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // Add stem
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillRect(x + fruitSize * 0.4, y, fruitSize * 0.2, fruitSize * 0.2);
                break;
                
            case 2: // Orange
                this.ctx.fillStyle = '#FFA500';
                this.ctx.beginPath();
                this.ctx.arc(x + fruitSize / 2, y + fruitSize / 2, fruitSize * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add stem
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillRect(x + fruitSize * 0.4, y, fruitSize * 0.2, fruitSize * 0.2);
                break;
                
            case 3: // Apple
                this.ctx.fillStyle = '#FF0000';
                this.ctx.beginPath();
                this.ctx.arc(x + fruitSize * 0.35, y + fruitSize / 2, fruitSize * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(x + fruitSize * 0.65, y + fruitSize / 2, fruitSize * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add stem
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillRect(x + fruitSize * 0.45, y, fruitSize * 0.1, fruitSize * 0.2);
                break;
                
            case 4: // Melon
                this.ctx.fillStyle = '#00FF00';
                this.ctx.beginPath();
                this.ctx.arc(x + fruitSize / 2, y + fruitSize / 2, fruitSize * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add stripes
                this.ctx.strokeStyle = '#008800';
                this.ctx.lineWidth = 2;
                for (let i = -2; i <= 2; i++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x + fruitSize / 2 - fruitSize * 0.4, y + fruitSize / 2 + i * fruitSize * 0.1);
                    this.ctx.lineTo(x + fruitSize / 2 + fruitSize * 0.4, y + fruitSize / 2 + i * fruitSize * 0.1);
                    this.ctx.stroke();
                }
                break;
                
            case 5: // Galaxian
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.beginPath();
                this.ctx.moveTo(x + fruitSize / 2, y);
                this.ctx.lineTo(x + fruitSize, y + fruitSize * 0.7);
                this.ctx.lineTo(x + fruitSize * 0.7, y + fruitSize);
                this.ctx.lineTo(x + fruitSize * 0.3, y + fruitSize);
                this.ctx.lineTo(x, y + fruitSize * 0.7);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Add details
                this.ctx.fillStyle = '#FF0000';
                this.ctx.beginPath();
                this.ctx.arc(x + fruitSize / 2, y + fruitSize / 2, fruitSize * 0.2, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 6: // Bell
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.beginPath();
                this.ctx.arc(x + fruitSize / 2, y + fruitSize * 0.4, fruitSize * 0.4, Math.PI, 0, false);
                this.ctx.lineTo(x + fruitSize * 0.7, y + fruitSize * 0.9);
                this.ctx.lineTo(x + fruitSize * 0.3, y + fruitSize * 0.9);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Add clapper
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(x + fruitSize / 2, y + fruitSize * 0.8, fruitSize * 0.1, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 7: // Key
                this.ctx.fillStyle = '#0000FF';
                
                // Key head
                this.ctx.beginPath();
                this.ctx.arc(x + fruitSize * 0.3, y + fruitSize * 0.3, fruitSize * 0.2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Key shaft
                this.ctx.fillRect(x + fruitSize * 0.3, y + fruitSize * 0.3, fruitSize * 0.5, fruitSize * 0.15);
                
                // Key teeth
                this.ctx.fillRect(x + fruitSize * 0.6, y + fruitSize * 0.3, fruitSize * 0.1, fruitSize * 0.4);
                this.ctx.fillRect(x + fruitSize * 0.75, y + fruitSize * 0.3, fruitSize * 0.1, fruitSize * 0.3);
                break;
        }
    }
}

// Create and export a singleton instance
const game = new Game();
