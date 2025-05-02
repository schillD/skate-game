import * as THREE from 'three';

export class CoinSystem {
    constructor(scene, skateboard, camera, scoreSystem, gameState) {
        this.scene = scene;
        this.skateboard = skateboard;
        this.camera = camera;
        this.scoreSystem = scoreSystem;
        this.gameState = gameState;
        this.coins = [];
        this.initialCoinCount = 0;
        this.collectedCoins = 0;
        
        this.setupCoins();
    }
    
    setupCoins() {
        // Create a gold coin texture/material
        const coinMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700, 
            metalness: 1.0,
            roughness: 0.2,
            emissive: 0x996500,
            emissiveIntensity: 0.2
        });
        
        // Create coin geometry (a thin cylinder)
        const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        
        // Define coin positions around the expanded skatepark
        const coinPositions = [
            // Ramps
            [25, 3, 0], [-25, 3, 0], // Original ramps (moved)
            [0, 4, 60], // New central ramp
            
            // Fun Boxes
            [30, 2.5, -45], // Original fun box (moved)
            [-30, 2.5, 20], // New fun box
            
            // Rails
            [0, 1.5, 15], [1.5, 1.5, 15], [-1.5, 1.5, 15], // Original rail (moved)
            [50, 1.5, -10], [50, 1.5, -5], [50, 1.5, 0], // New long rail
            [-50, 1.5, 10], [-50, 1.5, 15], [-50, 1.5, 5], // New angled rail
            
            // Stairs
            [45, 0.5, 30], [45, 1.0, 30.8], [45, 1.5, 31.6], [45, 2.0, 32.4], // Original stairs (moved)
            
            // Half Pipe
            [-40, 1, -35], [-40, 4, -40], [-40, 1, -45], // Original half pipe (moved)
            
            // Quarter Pipes
            [0, 3, -30], [3, 1, -30], [-3, 1, -30], // Original QP (moved)
            [60, 4, 0], [63, 1, 0], [57, 1, 0],    // New large QP
            [-60, 4, 0], [-63, 1, 0], [-57, 1, 0],   // New large mirrored QP
            
            // Bowl
            [-15, 2.5, 45], [-18, 0, 45], [-12, 0, 45], // Original bowl (moved)
            [-15, 1, 48], [-15, 1, 42],             // More bowl coins

            // Kickers
            [10, 1.5, 30], [-10, 1.5, -30],

            // Manual Pad
            [0, 1, -55], [0, 1, -60], [0, 1, -65],
            
            // Banks
            [70, 3, 50], [-70, 3, -50],
            
            // General positions in open areas
            [50, 1, 50], [-50, 1, -50], [0, 1, 0], // Center
            [75, 1, 25], [-75, 1, -25], [25, 1, 75], [-25, 1, -75],
            [0, 5, 0], // High center coin
            [90, 1, 90], [-90, 1, -90] // Far corners
        ];
        
        // Create coins at the specified positions
        coinPositions.forEach((pos, index) => {
            const coin = new THREE.Mesh(coinGeometry, coinMaterial);
            coin.position.set(pos[0], pos[1], pos[2]);
            coin.rotation.x = Math.PI / 2; // Make the coin face up
            coin.name = `coin_${index}`;
            coin.castShadow = true;
            
            // Add to the scene and to our coins array
            this.scene.add(coin);
            this.coins.push(coin);
        });
        
        // Store initial coin count for win condition
        this.initialCoinCount = this.coins.length;
        // Update GameState with total coin count
        if (this.gameState) {
            this.gameState.setTotalCoins(this.initialCoinCount);
        }
        console.log(`Initialized ${this.initialCoinCount} coins`);
    }
    
    update(deltaTime) {
        // Skip if game is over or player is caught
        if (this.gameState && (this.gameState.gameOver || this.gameState.gameWon)) {
            return;
        }
        
        // Rotate the coins
        this.coins.forEach(coin => {
            coin.rotation.z += deltaTime * 2; // Rotate around vertical axis
            
            // Make coins hover up and down slightly
            coin.position.y += Math.sin(Date.now() * 0.003 + coin.position.x) * 0.003;
            
            // Apply magnet attraction if player has magnet power-up
            if (this.gameState && this.gameState.hasMagnet && !this.gameState.isPlayerImmobilized()) {
                const skaterPosition = this.skateboard.mesh.position.clone();
                const coinPosition = coin.position.clone();
                const distance = skaterPosition.distanceTo(coinPosition);
                
                // Check if coin is within the magnet's attraction radius
                if (distance < this.gameState.magnetAttractionRadius) {
                    // Create direction vector from coin to player
                    const direction = new THREE.Vector3().subVectors(skaterPosition, coinPosition).normalize();
                    
                    // Apply attraction force (stronger when closer)
                    const attractionStrength = this.gameState.magnetAttractionForce * (1 - distance / this.gameState.magnetAttractionRadius);
                    
                    // Move coin towards player
                    coin.position.add(direction.multiplyScalar(attractionStrength * deltaTime));
                }
            }
        });
        
        // Check for coin collection
        if (this.coins.length > 0 && (!this.gameState || !this.gameState.isPlayerImmobilized())) {
            const coinCollectDistance = 1.2;
            const skaterPosition = this.skateboard.mesh.position.clone();
            
            for (let i = this.coins.length - 1; i >= 0; i--) {
                const coin = this.coins[i];
                const distance = skaterPosition.distanceTo(coin.position);
                
                if (distance < coinCollectDistance) {
                    // Collect the coin
                    this.scene.remove(coin);
                    this.coins.splice(i, 1);
                    this.collectedCoins++;
                    
                    // Update GameState
                    if (this.gameState) {
                        this.gameState.collectCoin();
                    }
                    
                    // Play a collection sound
                    this.playCoinSound();
                    
                    // Update score
                    if (this.scoreSystem) {
                        this.scoreSystem.updateScore(10);
                        
                        // Show floating score text
                        const scorePosition = coin.position.clone();
                        scorePosition.y += 1;
                        this.scoreSystem.showFloatingScore(10, scorePosition, this.camera);
                    }
                }
            }
        }
    }
    
    handleWin() {
        // This is now handled directly by the GameState's collectCoin method
        console.log("All coins collected! Player wins!");
    }
    
    showWinMessage() {
        // Create winner text display
        const winDisplay = document.createElement('div');
        winDisplay.id = 'winDisplay';
        winDisplay.style.position = 'fixed';
        winDisplay.style.top = '50%';
        winDisplay.style.left = '50%';
        winDisplay.style.transform = 'translate(-50%, -50%)';
        winDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        winDisplay.style.color = 'gold';
        winDisplay.style.padding = '20px';
        winDisplay.style.borderRadius = '10px';
        winDisplay.style.fontFamily = 'Arial, sans-serif';
        winDisplay.style.fontSize = '36px';
        winDisplay.style.fontWeight = 'bold';
        winDisplay.style.textAlign = 'center';
        winDisplay.style.zIndex = '1000';
        winDisplay.innerHTML = 'YOU WIN!<br><span style="font-size: 24px">All coins collected!</span>';
        document.body.appendChild(winDisplay);
        
        // Remove after 5 seconds
        setTimeout(() => {
            document.body.removeChild(winDisplay);
        }, 5000);
    }
    
    resetCoins() {
        // Remove any remaining coins
        this.coins.forEach(coin => {
            this.scene.remove(coin);
        });
        this.coins = [];
        this.collectedCoins = 0;
        
        // Recreate all coins
        this.setupCoins();
    }
    
    playCoinSound() {
        // Create an audio context and a simple oscillator for a coin sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create an oscillator
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Set oscillator type and frequency
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
            oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1); // A6
            
            // Set volume envelope
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Start and stop the sound
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log("Audio not supported or blocked by browser");
        }
    }
    
    getTotalCoinCount() {
        return this.initialCoinCount;
    }
    
    getCollectedCoinCount() {
        return this.collectedCoins;
    }
    
    getRemainingCoinCount() {
        return this.coins.length;
    }
} 