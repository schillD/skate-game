updateLives() {
    // Clear previous hearts
    const heartsContainer = document.getElementById('hearts-container');
    if (!heartsContainer) return;
    
    heartsContainer.innerHTML = '';
    
    // Add visual hearts based on current lives
    for (let i = 0; i < this.gameState.maxLives; i++) {
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
};

showGameOverMessage() {
    // Create or update game over message
    let messageEl = document.getElementById('game-over-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'game-over-message';
        document.body.appendChild(messageEl);
    }
    
    messageEl.innerHTML = `
        <div class="game-message game-over">
            <h2>GAME OVER!</h2>
            <p>You lost all your lives!</p>
            <p>The game will restart shortly...</p>
        </div>
    `;
    messageEl.style.display = 'flex';
    
    // Hide after delay
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
};

showVictoryMessage() {
    // Create or update victory message
    let messageEl = document.getElementById('victory-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'victory-message';
        document.body.appendChild(messageEl);
    }
    
    messageEl.innerHTML = `
        <div class="game-message victory">
            <h2>VICTORY!</h2>
            <p>You collected all coins!</p>
            <p>The game will restart shortly...</p>
        </div>
    `;
    messageEl.style.display = 'flex';
    
    // Hide after delay
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
};

showCapturedMessage() {
    // Create or update captured message
    let messageEl = document.getElementById('captured-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'captured-message';
        document.body.appendChild(messageEl);
    }
    
    messageEl.innerHTML = `
        <div class="game-message captured">
            <h2>BUSTED!</h2>
            <p>You lost a life!</p>
        </div>
    `;
    messageEl.style.display = 'flex';
    
    // Hide after delay
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 2000);
};

update() {
    // Update score display
    this.updateScoreDisplay();
    
    // Update coin counter
    this.updateCoinCounter();
    
    // Update lives display
    this.updateLives();
    
    // Check for game over
    if (this.gameState.gameOver && !this.gameOverDisplayed) {
        this.showGameOverMessage();
        this.gameOverDisplayed = true;
    }
    
    // Check for victory
    if (this.gameState.gameWon && !this.victoryDisplayed) {
        this.showVictoryMessage();
        this.victoryDisplayed = true;
    }
    
    // Check if player was just captured
    if (this.gameState.isPlayerCaptured && !this.capturedDisplayed) {
        this.showCapturedMessage();
        this.capturedDisplayed = true;
        
        // Reset captured flag after showing message
        setTimeout(() => {
            this.capturedDisplayed = false;
        }, 2000);
    }
};

resetScore() {
    // Reset score and UI elements
    this.score = 0;
    this.updateScoreDisplay();
    this.updateCoinCounter();
    this.updateLives();
    
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
}; 