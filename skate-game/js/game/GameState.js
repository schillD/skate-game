/**
 * GameState class - handles overall game state
 */
export class GameState {
    constructor() {
        this.paused = false;
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.timeElapsed = 0;
        
        // Player lives system
        this.lives = 3;
        this.maxLives = 3;
        this.isPlayerCaught = false;
        this.captureRecoveryTime = 2; // seconds player is immobilized
        this.captureTimer = 0;
        this.lastCaptureEndTime = 0; // Timestamp when player was last released
        this.gameWon = false;
        
        // Immunity system - new addition
        this.isPlayerImmune = false;
        this.immunityDuration = 5; // seconds of immunity after being caught
        this.immunityTimer = 0;
        this.isImmunityVisible = true; // For flashing effect
        this.immunityFlashInterval = 0.2; // seconds between flashes
        this.flashTimer = 0;
        
        // Candy Invincibility system
        this.isPlayerInvincible = false;
        this.invincibilityDuration = 20; // seconds of invincibility from candy
        this.invincibilityTimer = 0;
        this.isInvincibilityVisible = true; // For flashing effect (slower than immunity)
        this.invincibilityFlashInterval = 0.4; // seconds between flashes
        this.invincibilityFlashTimer = 0;
        
        // Magnet system
        this.hasMagnet = false;
        this.magnetDuration = 15; // seconds that magnet is active
        this.magnetTimer = 0;
        this.magnetAttractionRadius = 15; // radius in which coins are attracted
        this.magnetAttractionForce = 20; // force with which coins are attracted
        
        // Coin tracking
        this.coinsCollected = 0;
        this.totalCoins = 0;
        
        // For animal animation tracking
        this.animalsInitialized = false;
        this.sheepCount = 0;
        this.birdCount = 0;
        
        //console.log("GameState initialized");
    }
    
    update(deltaTime) {
        if (this.paused || this.gameOver || this.gameWon) return;
        
        this.timeElapsed += deltaTime;
        
        // Update capture timer if player is caught
        if (this.isPlayerCaught) {
            this.captureTimer -= deltaTime;
            if (this.captureTimer <= 0) {
                this.releasePlayer();
            }
        }
        
        // Update immunity timer if player is immune
        if (this.isPlayerImmune) {
            this.immunityTimer -= deltaTime;
            
            // Update flash effect for visual feedback
            this.flashTimer -= deltaTime;
            if (this.flashTimer <= 0) {
                this.isImmunityVisible = !this.isImmunityVisible;
                this.flashTimer = this.immunityFlashInterval;
            }
            
            // End immunity when timer expires
            if (this.immunityTimer <= 0) {
                this.isPlayerImmune = false;
                this.isImmunityVisible = true; // Ensure player is visible when immunity ends
                //console.log("Immunity ended");
            }
        }
        
        // Update invincibility timer if player is invincible from candy
        if (this.isPlayerInvincible) {
            this.invincibilityTimer -= deltaTime;
            
            // Update flash effect for visual feedback - this is a different effect than immunity
            this.invincibilityFlashTimer -= deltaTime;
            if (this.invincibilityFlashTimer <= 0) {
                this.isInvincibilityVisible = !this.isInvincibilityVisible;
                this.invincibilityFlashTimer = this.invincibilityFlashInterval;
            }
            
            // End invincibility when timer expires
            if (this.invincibilityTimer <= 0) {
                this.isPlayerInvincible = false;
                this.isInvincibilityVisible = true; // Ensure player is visible when invincibility ends
                //console.log("Candy invincibility ended");
            }
        }
        
        // Update magnet timer if magnet is active
        if (this.hasMagnet) {
            this.magnetTimer -= deltaTime;
            
            // End magnet effect when timer expires
            if (this.magnetTimer <= 0) {
                this.hasMagnet = false;
                //console.log("Magnet effect ended");
            }
        }
    }
    
    playerCaught() {
        // If player is invincible from candy, they can't be caught
        if (this.isPlayerCaught || this.gameOver || this.isPlayerImmune || this.isPlayerInvincible) return false;
        
        this.isPlayerCaught = true;
        this.captureTimer = this.captureRecoveryTime;
        this.lives--;
        
        console.log(`Player caught! Lives remaining: ${this.lives}`);
        
        // Check for game over
        if (this.lives <= 0) {
            this.gameOver = true;
            console.log("Game over - out of lives!");
            return true; // Signal game over
        }
        
        return false; // Not game over yet
    }
    
    releasePlayer() {
        this.isPlayerCaught = false;
        this.lastCaptureEndTime = performance.now(); // Record timestamp of release
        
        // Grant immunity period
        this.isPlayerImmune = true;
        this.immunityTimer = this.immunityDuration;
        this.isImmunityVisible = true;
        this.flashTimer = this.immunityFlashInterval;
        
        console.log(`Player released from capture. Immune for ${this.immunityDuration} seconds`);
    }
    
    isPlayerImmobilized() {
        const immobilized = this.isPlayerCaught || this.gameOver || this.gameWon;
        if (immobilized && this.isPlayerCaught) {
            // Only log this occasionally to avoid console spam
            if (Math.random() < 0.01) {
                console.log("Player is immobilized due to being caught. Remaining timer: " + this.captureTimer.toFixed(1));
            }
        }
        return immobilized;
    }
    
    // New method to check immunity
    isPlayerImmuneFromCapture() {
        // Now checks both regular immunity and candy invincibility
        return this.isPlayerImmune || this.isPlayerInvincible;
    }
    
    // New method to get visibility state for flashing effect
    getImmunityVisibility() {
        // Candy invincibility takes precedence for visual effect
        if (this.isPlayerInvincible) {
            return this.isInvincibilityVisible;
        }
        return this.isImmunityVisible;
    }
    
    // New method to specifically check candy invincibility
    isPlayerInvincibleFromCandy() {
        return this.isPlayerInvincible;
    }
    
    // New method to get remaining invincibility time
    getInvincibilityTimeRemaining() {
        if (this.isPlayerInvincible) {
            return this.invincibilityTimer;
        }
        return 0;
    }
    
    // New method to activate candy invincibility
    activateInvincibility() {
        this.isPlayerInvincible = true;
        this.invincibilityTimer = this.invincibilityDuration;
        this.isInvincibilityVisible = true;
        this.invincibilityFlashTimer = this.invincibilityFlashInterval;
        
        // Cancel regular immunity if it's active (candy power-up is stronger)
        if (this.isPlayerImmune) {
            this.isPlayerImmune = false;
        }
        
        console.log(`Player is now INVINCIBLE for ${this.invincibilityDuration} seconds!`);
    }
    
    collectCoin() {
        this.coinsCollected++;
        return this.checkWinCondition();
    }
    
    setTotalCoins(count) {
        this.totalCoins = count;
        console.log(`Total coins in level: ${count}`);
    }
    
    checkWinCondition() {
        if (this.totalCoins > 0 && this.coinsCollected === this.totalCoins) {
            this.gameWon = true;
            console.log("Game won! All coins collected!");
            return true;
        }
        return false;
    }
    
    pause() {
        this.paused = true;
        console.log("Game paused");
    }
    
    resume() {
        this.paused = false;
        console.log("Game resumed");
    }
    
    reset() {
        this.paused = false;
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.gameWon = false;
        this.timeElapsed = 0;
        this.lives = this.maxLives;
        this.isPlayerCaught = false;
        this.captureTimer = 0;
        this.lastCaptureEndTime = 0; // Reset the last capture end timestamp
        
        // Reset immunity
        this.isPlayerImmune = false;
        this.immunityTimer = 0;
        this.isImmunityVisible = true;
        
        // Reset invincibility
        this.isPlayerInvincible = false;
        this.invincibilityTimer = 0;
        this.isInvincibilityVisible = true;
        
        // Reset magnet
        this.hasMagnet = false;
        this.magnetTimer = 0;
        
        this.coinsCollected = 0;
        console.log("Game reset");
    }
    
    addScore(points) {
        this.score += points;
        console.log(`Score: ${this.score}`);
    }
    
    setLevel(level) {
        this.level = level;
        console.log(`Level set to ${level}`);
    }
    
    trackAnimals(sheepCount, birdCount) {
        this.sheepCount = sheepCount;
        this.birdCount = birdCount;
        this.animalsInitialized = true;
        console.log(`Tracking animals: ${sheepCount} sheep and ${birdCount} birds`);
    }
    
    activateMagnet() {
        this.hasMagnet = true;
        this.magnetTimer = this.magnetDuration;
        console.log(`Magnet activated for ${this.magnetDuration} seconds!`);
    }
} 