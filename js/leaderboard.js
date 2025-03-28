// Leaderboard manager for the Pac-Man game

class LeaderboardManager {
    constructor() {
        this.leaderboard = [];
        this.maxEntries = 10;
    }

    /**
     * Initialize the leaderboard
     */
    init() {
        this.loadLeaderboard();
    }

    /**
     * Load the leaderboard from storage
     */
    loadLeaderboard() {
        chrome.storage.local.get(['leaderboard'], (result) => {
            if (result.leaderboard) {
                this.leaderboard = result.leaderboard;
            }
        });
    }

    /**
     * Save the leaderboard to storage
     */
    saveLeaderboard() {
        chrome.storage.local.set({ leaderboard: this.leaderboard });
    }

    /**
     * Add a score to the leaderboard
     * @param {string} name - Player name
     * @param {number} score - Player score
     */
    addScore(name, score) {
        // Create new entry
        const entry = {
            name,
            score,
            date: new Date().toISOString()
        };
        
        // Add to leaderboard
        this.leaderboard.push(entry);
        
        // Sort by score (descending)
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // Trim to max entries
        if (this.leaderboard.length > this.maxEntries) {
            this.leaderboard = this.leaderboard.slice(0, this.maxEntries);
        }
        
        // Save to storage
        this.saveLeaderboard();
    }

    /**
     * Get the leaderboard
     * @returns {Array} Leaderboard entries
     */
    getLeaderboard() {
        return this.leaderboard;
    }

    /**
     * Clear the leaderboard
     */
    clearLeaderboard() {
        this.leaderboard = [];
        this.saveLeaderboard();
    }

    /**
     * Check if a score qualifies for the leaderboard
     * @param {number} score - Score to check
     * @returns {boolean} True if the score qualifies
     */
    qualifiesForLeaderboard(score) {
        if (this.leaderboard.length < this.maxEntries) {
            return true;
        }
        
        return score > this.leaderboard[this.leaderboard.length - 1].score;
    }
}

// Create and export a singleton instance
const leaderboardManager = new LeaderboardManager();
