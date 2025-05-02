import * as THREE from 'three';

export class ScoreSystem {
    constructor(gameState) {
        this.score = 0;
        this.gameState = gameState;
        this.setupScoreDisplay();
        this.setupLivesDisplay();
        this.setupCoinCounter();
        
        // State tracking for messages
        this.gameOverDisplayed = false;
        this.victoryDisplayed = false;
        this.capturedDisplayed = false;
        
        // Initialize UI elements
        this.initUI();
    }
    
    initUI() {
        // Create score display - already created in constructor
        // this.createScoreDisplay();
        
        // Create coin counter - already created in constructor
        // this.createCoinCounter();
        
        // Create lives display - already created in constructor
        // this.createLivesDisplay();
        
        // Create game over message container (hidden initially)
        this.createGameOverDisplay();
        
        // Create victory message container (hidden initially)
        this.createVictoryDisplay();
        
        // Create invincibility timer display (hidden initially)
        this.createInvincibilityTimerDisplay();
        
        // Create magnet timer display (hidden initially)
        this.createMagnetTimerDisplay();
    }
    
    setupScoreDisplay() {
        // Create a score display element
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.id = 'scoreDisplay';
        this.scoreDisplay.style.position = 'fixed';
        this.scoreDisplay.style.top = '10px';
        this.scoreDisplay.style.right = '10px';
        this.scoreDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.scoreDisplay.style.color = 'gold';
        this.scoreDisplay.style.padding = '10px';
        this.scoreDisplay.style.borderRadius = '5px';
        this.scoreDisplay.style.fontFamily = 'Arial, sans-serif';
        this.scoreDisplay.style.fontSize = '24px';
        this.scoreDisplay.style.fontWeight = 'bold';
        this.scoreDisplay.innerHTML = 'Score: 0';
        document.body.appendChild(this.scoreDisplay);
    }
    
    setupLivesDisplay() {
        // Create a lives display element
        this.livesDisplay = document.createElement('div');
        this.livesDisplay.id = 'livesDisplay';
        this.livesDisplay.style.position = 'fixed';
        this.livesDisplay.style.top = '60px';
        this.livesDisplay.style.right = '10px';
        this.livesDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.livesDisplay.style.color = 'red';
        this.livesDisplay.style.padding = '10px';
        this.livesDisplay.style.borderRadius = '5px';
        this.livesDisplay.style.fontFamily = 'Arial, sans-serif';
        this.livesDisplay.style.fontSize = '24px';
        this.livesDisplay.style.fontWeight = 'bold';
        
        // Create hearts container inside the lives display
        const heartsContainer = document.createElement('div');
        heartsContainer.id = 'hearts-container';
        heartsContainer.style.display = 'inline-block';
        this.livesDisplay.appendChild(heartsContainer);
        
        this.updateLivesDisplay();
        document.body.appendChild(this.livesDisplay);
    }
    
    setupCoinCounter() {
        // Create a coin counter display
        this.coinCounter = document.createElement('div');
        this.coinCounter.id = 'coinCounter';
        this.coinCounter.style.position = 'fixed';
        this.coinCounter.style.top = '110px';
        this.coinCounter.style.right = '10px';
        this.coinCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.coinCounter.style.color = 'gold';
        this.coinCounter.style.padding = '10px';
        this.coinCounter.style.borderRadius = '5px';
        this.coinCounter.style.fontFamily = 'Arial, sans-serif';
        this.coinCounter.style.fontSize = '20px';
        this.coinCounter.style.fontWeight = 'bold';
        this.coinCounter.innerHTML = 'Coins: 0/0';
        document.body.appendChild(this.coinCounter);
    }
    
    updateScoreDisplay() {
        if (this.scoreDisplay) {
            this.scoreDisplay.innerHTML = `Score: ${this.gameState.score}`;
        }
    }
    
    updateCoinCounter() {
        if (this.coinCounter && this.gameState.coinsCollected !== undefined && this.gameState.totalCoins !== undefined) {
            this.coinCounter.innerHTML = `Coins: ${this.gameState.coinsCollected || 0}/${this.gameState.totalCoins || 0}`;
        }
    }
    
    updateScore(points) {
        this.gameState.addScore(points);
        this.updateScoreDisplay();
    }
    
    updateLivesDisplay() {
        // Display hearts based on remaining lives
        const heartsContainer = document.getElementById('hearts-container');
        if (!heartsContainer) return;
        
        heartsContainer.innerHTML = '';
        
        // Add visual hearts based on current lives
        const maxLives = 3; // Default to 3 lives if maxLives not defined
        for (let i = 0; i < maxLives; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart';
            
            // Use filled heart for remaining lives, empty heart for lost lives
            if (i < this.gameState.lives) {
                heart.innerHTML = '❤️';
                heart.classList.add('active');
            } else {
                heart.innerHTML = '🖤';
                heart.classList.add('lost');
            }
            
            heartsContainer.appendChild(heart);
        }
    }
    
    update() {
        // Update score display
        this.updateScoreDisplay();
        
        // Update coin counter
        this.updateCoinCounter();
        
        // Update lives display
        this.updateLivesDisplay();
        
        // Update invincibility timer display
        this.updateInvincibilityTimerDisplay();
        
        // Update magnet timer display
        this.updateMagnetTimerDisplay();
        
        // Update game over/victory display
        if (this.gameState.gameOver) {
            this.showGameOverMessage();
        } else if (this.gameState.gameWon) {
            this.showVictoryMessage();
        } else {
            if (this.gameOverContainer) this.gameOverContainer.style.display = 'none';
            if (this.victoryContainer) this.victoryContainer.style.display = 'none';
        }
        
        // Check if player was just captured
        if (this.gameState.isPlayerCaught && !this.capturedDisplayed) {
            this.showCapturedMessage();
            this.capturedDisplayed = true;
            
            // Reset captured flag after showing message
            setTimeout(() => {
                this.capturedDisplayed = false;
            }, 2000);
        }
    }
    
    showFloatingScore(points, position, camera) {
        // Create a floating text element
        const floatingText = document.createElement('div');
        floatingText.style.position = 'fixed';
        floatingText.style.color = 'gold';
        floatingText.style.fontFamily = 'Arial, sans-serif';
        floatingText.style.fontSize = '20px';
        floatingText.style.fontWeight = 'bold';
        floatingText.style.textShadow = '0 0 3px black';
        floatingText.innerHTML = `+${points}`;
        document.body.appendChild(floatingText);
        
        // Position it at the provided 3D position in screen coordinates
        const vector = position.clone().project(camera);
        floatingText.style.left = (vector.x * window.innerWidth / 2 + window.innerWidth / 2) + 'px';
        floatingText.style.top = (-vector.y * window.innerHeight / 2 + window.innerHeight / 2) + 'px';
        
        // Animate and remove
        let opacity = 1;
        const fadeOut = setInterval(() => {
            opacity -= 0.05;
            floatingText.style.opacity = opacity;
            floatingText.style.transform = `translateY(${(1 - opacity) * -50}px)`;
            
            if (opacity <= 0) {
                clearInterval(fadeOut);
                document.body.removeChild(floatingText);
            }
        }, 50);
    }
    
    showGameOverMessage() {
        // Create or update game over message
        let messageEl = document.getElementById('game-over-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'game-over-message';
            messageEl.style.position = 'fixed';
            messageEl.style.top = '0';
            messageEl.style.left = '0';
            messageEl.style.width = '100%';
            messageEl.style.height = '100%';
            messageEl.style.display = 'flex';
            messageEl.style.justifyContent = 'center';
            messageEl.style.alignItems = 'center';
            messageEl.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            messageEl.style.zIndex = '1000';
            document.body.appendChild(messageEl);
        }
        
        messageEl.innerHTML = `
            <div class="game-message game-over" style="background-color: rgba(0, 0, 0, 0.8); color: red; padding: 40px; border-radius: 10px; text-align: center; font-family: Arial, sans-serif; box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);">
                <h2 style="font-size: 36px; margin-bottom: 20px;">GAME OVER!</h2>
                <p style="font-size: 24px; margin-bottom: 10px;">You lost all your lives!</p>
                <p style="font-size: 18px;">The game will restart shortly...</p>
            </div>
        `;
        messageEl.style.display = 'flex';
        
        // Hide after delay
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }
    
    showVictoryMessage() {
        // Create or update victory message
        let messageEl = document.getElementById('victory-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'victory-message';
            messageEl.style.position = 'fixed';
            messageEl.style.top = '0';
            messageEl.style.left = '0';
            messageEl.style.width = '100%';
            messageEl.style.height = '100%';
            messageEl.style.display = 'flex';
            messageEl.style.justifyContent = 'center';
            messageEl.style.alignItems = 'center';
            messageEl.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            messageEl.style.zIndex = '1000';
            document.body.appendChild(messageEl);
        }
        
        messageEl.innerHTML = `
            <div class="game-message victory" style="background-color: rgba(0, 0, 0, 0.8); color: gold; padding: 40px; border-radius: 10px; text-align: center; font-family: Arial, sans-serif; box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);">
                <h2 style="font-size: 36px; margin-bottom: 20px;">VICTORY!</h2>
                <p style="font-size: 24px; margin-bottom: 10px;">You collected all coins!</p>
                <p style="font-size: 18px;">Final Score: ${this.gameState.score}</p>
                <p style="font-size: 16px; margin-top: 20px;">The game will restart shortly...</p>
            </div>
        `;
        messageEl.style.display = 'flex';
        
        // Hide after delay
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
    
    showCapturedMessage() {
        // Create or update captured message
        let messageEl = document.getElementById('captured-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'captured-message';
            messageEl.style.position = 'fixed';
            messageEl.style.top = '50%';
            messageEl.style.left = '50%';
            messageEl.style.transform = 'translate(-50%, -50%)';
            messageEl.style.padding = '20px';
            messageEl.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            messageEl.style.color = 'red';
            messageEl.style.fontFamily = 'Arial, sans-serif';
            messageEl.style.fontSize = '30px';
            messageEl.style.borderRadius = '10px';
            messageEl.style.textAlign = 'center';
            messageEl.style.zIndex = '1000';
            document.body.appendChild(messageEl);
        }
        
        messageEl.innerHTML = `
            <div class="game-message captured">
                <h2>BUSTED!</h2>
                <p>You lost a life!</p>
            </div>
        `;
        messageEl.style.display = 'block';
        
        // Hide after delay
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 2000);
    }
    
    resetScore() {
        // Reset score and UI elements
        this.updateScoreDisplay();
        this.updateCoinCounter();
        this.updateLivesDisplay();
        
        // Reset message flags
        this.gameOverDisplayed = false;
        this.victoryDisplayed = false;
        this.capturedDisplayed = false;
        
        // Hide any active messages
        const messages = ['game-over-message', 'victory-message', 'captured-message'];
        messages.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        
        // Reset invincibility timer display
        if (this.invincibilityTimerDisplay) {
            this.invincibilityTimerDisplay.style.display = 'none';
        }
        
        // Reset magnet timer display
        if (this.magnetTimerDisplay) {
            this.magnetTimerDisplay.style.display = 'none';
        }
    }
    
    getScore() {
        return this.gameState.score;
    }
    
    createGameOverDisplay() {
        // Create container for game over message (initially hidden)
        this.gameOverContainer = document.createElement('div');
        this.gameOverContainer.id = 'game-over-message';
        this.gameOverContainer.style.position = 'fixed';
        this.gameOverContainer.style.top = '0';
        this.gameOverContainer.style.left = '0';
        this.gameOverContainer.style.width = '100%';
        this.gameOverContainer.style.height = '100%';
        this.gameOverContainer.style.display = 'none';
        this.gameOverContainer.style.justifyContent = 'center';
        this.gameOverContainer.style.alignItems = 'center';
        this.gameOverContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.gameOverContainer.style.zIndex = '1000';
        document.body.appendChild(this.gameOverContainer);
    }
    
    createVictoryDisplay() {
        // Create container for victory message (initially hidden)
        this.victoryContainer = document.createElement('div');
        this.victoryContainer.id = 'victory-message';
        this.victoryContainer.style.position = 'fixed';
        this.victoryContainer.style.top = '0';
        this.victoryContainer.style.left = '0';
        this.victoryContainer.style.width = '100%';
        this.victoryContainer.style.height = '100%';
        this.victoryContainer.style.display = 'none';
        this.victoryContainer.style.justifyContent = 'center';
        this.victoryContainer.style.alignItems = 'center';
        this.victoryContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.victoryContainer.style.zIndex = '1000';
        document.body.appendChild(this.victoryContainer);
    }
    
    createInvincibilityTimerDisplay() {
        // Create a container for the invincibility timer
        this.invincibilityTimerDisplay = document.createElement('div');
        this.invincibilityTimerDisplay.id = 'invincibilityTimer';
        this.invincibilityTimerDisplay.style.position = 'fixed';
        this.invincibilityTimerDisplay.style.top = '80px';
        this.invincibilityTimerDisplay.style.left = '50%';
        this.invincibilityTimerDisplay.style.transform = 'translateX(-50%)';
        this.invincibilityTimerDisplay.style.backgroundColor = 'rgba(255, 20, 147, 0.7)';
        this.invincibilityTimerDisplay.style.color = 'white';
        this.invincibilityTimerDisplay.style.padding = '10px 20px';
        this.invincibilityTimerDisplay.style.borderRadius = '20px';
        this.invincibilityTimerDisplay.style.fontFamily = 'Arial, sans-serif';
        this.invincibilityTimerDisplay.style.fontWeight = 'bold';
        this.invincibilityTimerDisplay.style.fontSize = '18px';
        this.invincibilityTimerDisplay.style.textAlign = 'center';
        this.invincibilityTimerDisplay.style.zIndex = '1000';
        this.invincibilityTimerDisplay.style.display = 'none';
        this.invincibilityTimerDisplay.style.boxShadow = '0 0 15px 5px rgba(255, 105, 180, 0.7)';
        this.invincibilityTimerDisplay.style.textShadow = '0 0 5px white';
        this.invincibilityTimerDisplay.innerHTML = 'INVINCIBLE: 20s';
        
        document.body.appendChild(this.invincibilityTimerDisplay);
    }
    
    updateInvincibilityTimerDisplay() {
        if (!this.invincibilityTimerDisplay) return;
        
        const invincibilityTime = this.gameState.getInvincibilityTimeRemaining();
        
        if (invincibilityTime > 0) {
            // Show the timer and update the value
            this.invincibilityTimerDisplay.style.display = 'block';
            this.invincibilityTimerDisplay.innerHTML = `INVINCIBLE: ${Math.ceil(invincibilityTime)}s`;
            
            // Pulse animation effect
            const pulseFactor = Math.sin(performance.now() * 0.005) * 0.1 + 0.9;
            this.invincibilityTimerDisplay.style.transform = `translateX(-50%) scale(${pulseFactor})`;
            
            // Change color as time runs out
            const greenValue = Math.floor((invincibilityTime / this.gameState.invincibilityDuration) * 255);
            this.invincibilityTimerDisplay.style.backgroundColor = `rgba(255, ${greenValue}, 147, 0.7)`;
        } else {
            // Hide the timer when not invincible
            this.invincibilityTimerDisplay.style.display = 'none';
        }
    }
    
    createMagnetTimerDisplay() {
        // Create a container for the magnet timer
        this.magnetTimerDisplay = document.createElement('div');
        this.magnetTimerDisplay.id = 'magnetTimer';
        this.magnetTimerDisplay.style.position = 'fixed';
        this.magnetTimerDisplay.style.top = '130px';
        this.magnetTimerDisplay.style.left = '50%';
        this.magnetTimerDisplay.style.transform = 'translateX(-50%)';
        this.magnetTimerDisplay.style.backgroundColor = 'rgba(30, 144, 255, 0.7)'; // Dodger Blue
        this.magnetTimerDisplay.style.color = 'white';
        this.magnetTimerDisplay.style.padding = '10px 20px';
        this.magnetTimerDisplay.style.borderRadius = '20px';
        this.magnetTimerDisplay.style.fontFamily = 'Arial, sans-serif';
        this.magnetTimerDisplay.style.fontWeight = 'bold';
        this.magnetTimerDisplay.style.fontSize = '18px';
        this.magnetTimerDisplay.style.textAlign = 'center';
        this.magnetTimerDisplay.style.zIndex = '1000';
        this.magnetTimerDisplay.style.display = 'none';
        this.magnetTimerDisplay.style.boxShadow = '0 0 15px 5px rgba(30, 144, 255, 0.7)';
        this.magnetTimerDisplay.style.textShadow = '0 0 5px white';
        this.magnetTimerDisplay.innerHTML = 'MAGNET: 15s';
        
        document.body.appendChild(this.magnetTimerDisplay);
    }
    
    updateMagnetTimerDisplay() {
        if (!this.magnetTimerDisplay || !this.gameState) return;
        
        if (this.gameState.hasMagnet && this.gameState.magnetTimer > 0) {
            // Show the timer and update the value
            this.magnetTimerDisplay.style.display = 'block';
            this.magnetTimerDisplay.innerHTML = `MAGNET: ${Math.ceil(this.gameState.magnetTimer)}s`;
            
            // Pulse animation effect
            const pulseFactor = Math.sin(performance.now() * 0.005) * 0.1 + 0.9;
            this.magnetTimerDisplay.style.transform = `translateX(-50%) scale(${pulseFactor})`;
            
            // Change color as time runs out
            const blueValue = Math.floor((this.gameState.magnetTimer / this.gameState.magnetDuration) * 255);
            this.magnetTimerDisplay.style.backgroundColor = `rgba(30, ${blueValue}, 255, 0.7)`;
        } else {
            // Hide the timer when magnet is not active
            this.magnetTimerDisplay.style.display = 'none';
        }
    }
} 