import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { Skateboard } from './entities/Skateboard.js';
import { Skater } from './entities/Skater.js';
import { Skatepark } from './environment/Skatepark.js';
import { SkyBox } from './environment/SkyBox.js';
import { CloudSystem } from './environment/CloudSystem.js';
import { LightingSystem } from './environment/LightingSystem.js';
import { Decorations } from './environment/Decorations.js';
import { CollisionSystem } from './physics/CollisionSystem.js';
import { ScoreSystem } from './ui/ScoreSystem.js';
import { CoinSystem } from './gameplay/CoinSystem.js';
import { InputHandler } from './controls/InputHandler.js';
import { TextureLoader } from './utils/TextureLoader.js';
import { AudioSystem } from './audio/AudioSystem.js';
import { BoosterSystem } from './gameplay/BoosterSystem.js';
import { JumpPadSystem } from './gameplay/JumpPadSystem.js';
import { SceneDebug } from './DEBUG.js';
import { GameState } from './GameState.js';
import { PoliceSystem } from './gameplay/Police.js';
import { CandySystem } from './gameplay/CandySystem.js';
import { MobileControls } from '../game/ui/MobileControls.js';
import { MagnetSystem } from './gameplay/MagnetSystem.js';

export class SkateGame {
    constructor() {
        try {
            // Initialize core Three.js components
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({
                canvas: document.getElementById('gameCanvas'),
                antialias: true
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;

            // Initialize game state first
            this.gameState = new GameState();
            
            // Debug mode settings - DISABLED
            this.debugMode = false;
            this.preserveDebugObjects = false;

            // Create systems
            this.textureLoader = new TextureLoader();
            this.skybox = new SkyBox(this.scene);
            this.cloudSystem = new CloudSystem(this.scene);
            this.lighting = new LightingSystem(this.scene);
            this.score = new ScoreSystem(this.gameState);
            this.audioSystem = new AudioSystem();
            
            // Create environment
            this.skatepark = new Skatepark(this.scene, this.textureLoader);
            
            // Add decorative elements to environment
            this.decorations = new Decorations(this.scene, this.textureLoader);
            
            // Create player
            this.skateboard = new Skateboard(this.scene);
            this.skater = new Skater(this.scene);
            
            // Setup physics and collision
            this.collisionSystem = new CollisionSystem(this.skateboard);
            
            // Setup gameplay systems
            this.coinSystem = new CoinSystem(this.scene, this.skateboard, this.camera, this.score, this.gameState);
            this.boosterSystem = new BoosterSystem(this.scene, this.skateboard);
            this.jumpPadSystem = new JumpPadSystem(this.scene, this.skateboard);
            
            // Add police officers who will chase the player
            this.policeSystem = new PoliceSystem(this.scene, this.skateboard, this.camera, this.gameState, this.skater);
            
            // Add candy collectibles that grant invincibility
            this.candySystem = new CandySystem(this.scene, this.skateboard, this.camera, this.gameState);
            
            // Add magnet collectibles that attract coins
            this.magnetSystem = new MagnetSystem(this.scene, this.skateboard, this.camera, this.gameState);
            
            // DO NOT add any debug objects
            // this.createDirectDebugObjects();
            
            // Setup controls
            this.inputHandler = new InputHandler(this.gameState);
            
            // Setup mobile controls
            this.mobileControls = new MobileControls(this.inputHandler);
            
            // Camera setup - adjusted for better view with skater
            this.camera.position.set(0, 6, 12);
            this.camera.lookAt(this.skateboard.mesh.position);

            // Camera configuration
            this.cameraOffsetY = 3.0;     // Height above player
            this.cameraDistanceZ = 7;     // Distance behind player
            this.cameraLookOffsetY = 1.0; // Height above skateboard to focus
            this.cameraSmoothness = 0.18; // Increased for tighter yet smooth follow (from 0.12)
            this.cameraTiltSmoothness = 0.08; // Separate smoothness for tilt effects
            
            // Player tracking parameters
            this.minPlayerVisibleDistance = 4; // Minimum distance to keep player visible
            this.playerViewportCheckFrequency = 3; // Check less frequently (was 1)
            this.frameCounter = 0; // For checking player visibility periodically
            this.lastPlayerScreenPosition = new THREE.Vector2(0, 0); // Last known screen position
            this.playerCenterThreshold = 0.3; // Allow slightly more deviation (was 0.25)
            this.cameraCorrectionStrength = 1.5; // How strongly camera corrects towards center
            
            // Camera position history for smoother transitions
            this.cameraPositionHistory = [];
            this.historyLength = 6; // Increased history for smoother tracking (was 4)
            for (let i = 0; i < this.historyLength; i++) {
                this.cameraPositionHistory.push(new THREE.Vector3(0, 6, 12));
            }
            
            // Camera rotation tracking
            this.lastQuaternion = new THREE.Quaternion();
            this.targetQuaternion = new THREE.Quaternion();
            this.lastForward = new THREE.Vector3(0, 0, -1);
            this.rotationSmoothSpeed = 0.15; // Increased for more responsive rotation (from 0.03)
            
            // Optional: debug orbit controls (can be toggled)
            this.useOrbitControls = false;
            if (this.useOrbitControls) {
                this.controls = new OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.target = this.skateboard.mesh.position.clone();
                this.controls.target.y += 1; // Look at skater's torso level
            }

            // Initialize and play audio
            this.audioSystem.initialize();
            
            // Set up audio to start on first user interaction
            const startAudioOnInteraction = () => {
                this.audioSystem.playMusic();
                document.removeEventListener('click', startAudioOnInteraction);
                document.removeEventListener('keydown', startAudioOnInteraction);
            };
            
            document.addEventListener('click', startAudioOnInteraction);
            document.addEventListener('keydown', startAudioOnInteraction);

            // Handle window resize
            window.addEventListener('resize', () => this.handleResize());

            // First-person view toggle
            this.isFirstPerson = false;
            const fpvBtn = document.getElementById('fpvToggle');
            if (fpvBtn) {
                fpvBtn.addEventListener('click', () => {
                    this.isFirstPerson = !this.isFirstPerson;
                    fpvBtn.textContent = this.isFirstPerson ? 'Third Person View' : 'First Person View';
                    
                    // Toggle visibility of player models when switching views
                    if (this.isFirstPerson) {
                        // Hide skater and skateboard in first-person
                        this.skater.mesh.visible = false;
                        // Make skateboard parts invisible but keep collision functional
                        this.skateboard.mesh.traverse(child => {
                            if (child.isMesh) child.visible = false;
                        });
                    } else {
                        // Show skater and skateboard in third-person
                        this.skater.mesh.visible = true;
                        // Restore skateboard visibility
                        this.skateboard.mesh.traverse(child => {
                            if (child.isMesh) child.visible = true;
                        });
                    }
                });
            }

            
            // Start game loop
            this.lastTime = performance.now() * 0.001;
            this.animate();
        } catch (error) {
            console.error("Error initializing game:", error);
            // Try to restore basic rendering
            this.displayErrorMessage("Failed to initialize game: " + error.message);
        }
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        try {
            const time = performance.now() * 0.001;
            const deltaTime = time - this.lastTime;
            this.lastTime = time;
            
            requestAnimationFrame(() => this.animate());

        

            // DEBUG: Log the existence of the update methods only once
            if (this.frameCounter === undefined) {
                this.frameCounter = 0;
            }
            
            this.frameCounter++;

            // Update mobile controls if they exist
            if (this.mobileControls) {
                this.mobileControls.update();
            }

            // Update game state
            this.gameState.update(deltaTime);
            
            // Update UI - with safety check
            if (this.score && typeof this.score.update === 'function') {
                this.score.update();
            } else {
                // Fallback if update method doesn't exist
                if (this.score) {
                    // Manually update UI elements if update method is missing
                    if (typeof this.score.updateLivesDisplay === 'function') {
                        this.score.updateLivesDisplay();
                    }
                    if (typeof this.score.updateScoreDisplay === 'function') {
                        this.score.updateScoreDisplay();
                    }
                    if (typeof this.score.updateCoinCounter === 'function') {
                        this.score.updateCoinCounter();
                    }
                }
            }
            
            // Handle game over
            if (this.gameState.gameOver) {
                // Show game over message and update UI
                if (this.score && typeof this.score.showGameOverMessage === 'function') {
                    this.score.showGameOverMessage();
                }
                
                // Reset game after 3 seconds if not already scheduled
                if (!this.gameOverResetScheduled) {
                    this.gameOverResetScheduled = true;
                    console.log("Scheduling game reset after game over");
                    
                    setTimeout(() => {
                        console.log("Executing game reset after game over");
                        this.resetGame();
                        this.gameOverResetScheduled = false;
                    }, 3000);
                }
                
                // Just render the scene
                this.renderer.render(this.scene, this.camera);
                return;
            }
            
            // Handle win condition
            if (this.gameState.gameWon) {
                // Show victory message if not already shown
                if (this.score && typeof this.score.showVictoryMessage === 'function') {
                    this.score.showVictoryMessage();
                }
                
                // Reset game after 5 seconds
                if (!this.resetTimerStarted) {
                    this.resetTimerStarted = true;
                    setTimeout(() => {
                        this.resetGame();
                        this.resetTimerStarted = false;
                    }, 5000);
                }
                
                // Just render the scene
                this.renderer.render(this.scene, this.camera);
                return;
            }

            // Update player's skateboard and skater
            if (!this.gameState.isPlayerImmobilized()) {
                // Handle input and update physics
                const moveX = this.inputHandler.getMoveX();
                const moveZ = this.inputHandler.getMoveZ();
                const jump = this.inputHandler.getJump();
                const sprint = this.inputHandler.isSprinting();
                const jumpPower = this.inputHandler.getJumpPower();
                
                // Update skateboard physics with deltaTime for frame-rate independence
                this.skateboard.handleInput(moveX, moveZ, jump, sprint, jumpPower, deltaTime);
                this.skateboard.updatePhysics(deltaTime);
                
                // Check collisions with objects in the scene (with deltaTime for frame-rate independence)
                this.collisionSystem.checkCollisions(this.scene.children, deltaTime);
            } else {
                // When immobilized, we still need to maintain skateboard's Y position
                // but without allowing any movement in X and Z directions
                const currentY = this.skateboard.mesh.position.y;
                this.skateboard.mesh.position.copy(this.skateboard.previousPosition);
                this.skateboard.mesh.position.y = currentY;
                
                // Apply gravity only when immobilized
                this.skateboard.applyGravity(0, deltaTime);
                
                // Full stop to prevent any momentum
                this.skateboard.fullStop();
            }
            
            // Update skater position and animations, including invincibility effects
            this.updateSkater();
            
            // Update coins
            if (this.coinSystem) {
                this.coinSystem.update(deltaTime);
            }
            
            // Update boosters
            if (this.boosterSystem) {
                this.boosterSystem.update(deltaTime);
            }
            
            // Update jump pads
            if (this.jumpPadSystem) {
                this.jumpPadSystem.update(deltaTime);
            }
            
            // Update police officers
            if (this.policeSystem) {
                this.policeSystem.update(deltaTime);
            }
            
            // Update candies
            if (this.candySystem) {
                this.candySystem.update(deltaTime);
            }
            
            // Update magnets
            if (this.magnetSystem) {
                this.magnetSystem.update(deltaTime);
            }
            
            // Update skybox and environment
            if (this.skybox && typeof this.skybox.update === 'function') {
                this.skybox.update(deltaTime);
            }

            // Update clouds
            if (this.cloudSystem && typeof this.cloudSystem.update === 'function') {
                this.cloudSystem.update(deltaTime);
            }
            
            // Update skatepark
            if (this.skatepark && typeof this.skatepark.update === 'function') {
                this.skatepark.update(deltaTime);
            }
            
            // Update decorations with camera for distance culling
            if (this.decorations && typeof this.decorations.update === 'function') {
                this.decorations.update(deltaTime, this.camera);
            }
            
            // Update camera
            this.updateCamera();
            
            // Update orbit controls if enabled
            if (this.useOrbitControls && this.controls) {
                this.controls.update();
            }
            
            // Render the scene
            this.renderer.render(this.scene, this.camera);

            this.frame = this.frame || 0;
            this.frame++;
            
            // Remove debug info printing
            // SceneDebug.printSceneInfo(this.scene);

            // Remove debug position logging
            // console.log("Debug positions:", ...);

            // Remove debug counter and periodic logging
            // this.debugCounter = (this.debugCounter || 0) + 1;
            // if (this.debugCounter % 60 === 0) { ... }
        } catch (error) {
            console.error("Error in animation loop:", error);
        }
    }
    
    updateSkater() {
        // Update skater position and orientation to match skateboard
        // Also pass movement input values for better animation
        this.skater.update(
            this.skateboard.getPosition(), 
            this.skateboard.getRotation(),
            this.skateboard.getJumpingState(),
            this.skateboard.getInAirState(),
            this.inputHandler.getMoveX(),
            this.inputHandler.getMoveZ()
        );
        
        // Update invincibility effects
        if (this.skater && typeof this.skater.setInvincibility === 'function') {
            // Set the invincibility state based on the game state
            this.skater.setInvincibility(this.gameState.isPlayerInvincibleFromCandy());
            
            // Update particle effects if invincible
            if (this.gameState.isPlayerInvincibleFromCandy() && typeof this.skater.updateParticles === 'function') {
                this.skater.updateParticles();
            }
        }
    }
    
    updateCamera() {
        // First-person mode
        if (this.isFirstPerson) {
            // Position camera at a better height and slightly forward for clearer view
            const headHeight = 1.7; // Higher eye level for better visibility
            const fpPos = this.skateboard.mesh.position.clone();
            fpPos.y += headHeight;
            
            // Get forward direction and move camera slightly forward from center
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.skateboard.mesh.quaternion);
            fpPos.add(forward.clone().multiplyScalar(0.4)); // Offset forward slightly
            
            this.camera.position.copy(fpPos);
            
            const lookAtPos = fpPos.clone().add(forward);
            this.camera.lookAt(lookAtPos);
            return;
        }
        // Skip if using orbit controls
        if (this.useOrbitControls && this.controls) return;

        // Determine the look target (player position with Y offset)
        const lookTarget = this.skateboard.mesh.position.clone();
        lookTarget.y += this.cameraLookOffsetY;

        // Compute forward vector from the skateboard's orientation
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.skateboard.mesh.quaternion);

        // Calculate desired camera position behind the player
        const desiredPosition = this.skateboard.mesh.position.clone()
            .sub(forward.multiplyScalar(this.cameraDistanceZ));
        desiredPosition.y += this.cameraOffsetY;

        // Smoothly move camera toward the desired position
        this.camera.position.lerp(desiredPosition, this.cameraSmoothness);

        // Create a temporary camera to compute the desired orientation
        const tempCamera = new THREE.PerspectiveCamera();
        tempCamera.position.copy(this.camera.position);
        tempCamera.lookAt(lookTarget);

        // Smoothly rotate camera to face the player
        this.camera.quaternion.slerp(tempCamera.quaternion, this.rotationSmoothSpeed);
    }
    
    // Method to ensure player is always in view
    ensurePlayerVisible(playerPosition) {
        // Project player position to screen space
        const playerScreenPosition = this.worldToScreen(playerPosition);
        this.lastPlayerScreenPosition.copy(playerScreenPosition);
        
        // Calculate distance from center of screen
        const screenCenter = new THREE.Vector2(0.5, 0.5);
        const distanceFromCenter = playerScreenPosition.distanceTo(screenCenter);
        
        // Always adjust camera if player is not close enough to center (stricter threshold)
        if (distanceFromCenter > this.playerCenterThreshold) {
            // Calculate direction toward center from player position
            const direction = new THREE.Vector2()
                .subVectors(screenCenter, playerScreenPosition)
                .normalize();
            
            // Get world direction vectors
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
            
            // Stronger correction forces to keep player centered
            const horizontalStrength = 4.0; // Increased from 3.0
            const verticalStrength = 3.0;   // Increased from 2.0
            
            // Force camera to move to keep player centered
            const correctionForce = new THREE.Vector3()
                .addScaledVector(right, -direction.x * distanceFromCenter * horizontalStrength)
                .addScaledVector(up, -direction.y * distanceFromCenter * verticalStrength);
                
            // Apply immediate correction to current camera position
            this.camera.position.add(correctionForce);
            
            // Update ALL positions in history with the corrected position to maintain the new view
            const updatedPosition = this.camera.position.clone();
            for (let i = 0; i < this.cameraPositionHistory.length; i++) {
                this.cameraPositionHistory[i] = updatedPosition.clone();
            }
            
            // Immediately update camera to look at player
            const lookTarget = new THREE.Vector3();
            lookTarget.copy(playerPosition);
            this.camera.lookAt(lookTarget);
        }
    }
    
    // Helper method to convert world position to normalized screen position
    worldToScreen(worldPosition) {
        // Clone the position to prevent modification
        const position = worldPosition.clone();
        
        // Calculate the vector from camera to position
        const cameraToPosition = position.clone().sub(this.camera.position);
        
        // Get the direction vectors from the camera
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        
        // Calculate screen position (ranges from -1 to 1 for each axis)
        const x = cameraToPosition.dot(right) / (right.length() * cameraToPosition.length());
        const y = cameraToPosition.dot(up) / (up.length() * cameraToPosition.length());
        
        // Convert to normalized screen coordinates (0 to 1)
        return new THREE.Vector2(0.5 + x * 0.5, 0.5 + y * 0.5);
    }
    
    applySceneCameraEffects() {
        // Add slight tilt when turning (but only if camera is relatively stable)
        const tiltAmount = 0.1;
        const turnDirection = this.inputHandler.getMoveX();
        
        if (Math.abs(turnDirection) > 0.01) {
            // Calculate a minor roll effect when turning
            const targetRoll = -turnDirection * tiltAmount;
            
            // Create a temporary quaternion for the tilt
            const tiltQuaternion = new THREE.Quaternion();
            tiltQuaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), targetRoll);
            
            // Apply the tilt to the camera rotation
            const currentRotation = new THREE.Quaternion().copy(this.camera.quaternion);
            currentRotation.slerp(tiltQuaternion, this.cameraTiltSmoothness);
            
            // Apply the rotation
            this.camera.quaternion.copy(currentRotation);
        }
        
        // Very reduced camera shake during jumps
        if (this.skateboard.getJumpingState() || this.skateboard.getInAirState()) {
            const shakeAmount = 0.002; // Further reduced shake amount
            this.camera.position.x += (Math.random() - 0.5) * shakeAmount;
            this.camera.position.y += (Math.random() - 0.5) * shakeAmount;
            this.camera.position.z += (Math.random() - 0.5) * shakeAmount;
        }
    }

    // Debug method - completely disabled
    /*
    createDirectDebugObjects() {
        console.log("Creating DIRECT debug objects in the main game");
        
        // Create a series of brightly colored boxes right in front of the player
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        const positions = [
            [0, 3, -10],    // Red box right in front
            [5, 3, -15],    // Green box to the right
            [-5, 3, -15],   // Blue box to the left
            [0, 8, -10],    // Yellow box above the red one
            [0, 3, -5],     // Magenta box closer
            [0, 3, -20]     // Cyan box further away
        ];
        
        // Create each box
        for (let i = 0; i < positions.length; i++) {
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshBasicMaterial({ color: colors[i] });
            const box = new THREE.Mesh(geometry, material);
            box.position.set(positions[i][0], positions[i][1], positions[i][2]);
            box.name = "direct_debug_box_" + i;
            this.scene.add(box);
            console.log(`Added direct debug box ${i} at ${positions[i]}`);
        }
    }
    */

    setupScene() {
        // ... existing code ...
        
        // Add debug visualization for development
        // SceneDebug.addAxesHelper(this.scene, 10);
        // SceneDebug.addGridHelper(this.scene, 20, 20);
        
        // Debug shapes to visualize important positions
        // SceneDebug.addDebugShape(this.scene, 'sphere', new THREE.Vector3(0, 0, 0), 1, 0xff0000); // Red sphere at origin
        // SceneDebug.addDebugShape(this.scene, 'box', new THREE.Vector3(0, 5, 0), 1, 0x00ff00); // Green box in the air
        // SceneDebug.addDebugShape(this.scene, 'sphere', new THREE.Vector3(5, 2, 5), 1, 0x0000ff); // Blue sphere
        // SceneDebug.addDebugLine(this.scene, new THREE.Vector3(10, 0, 10), 0xffff00); // Yellow line
        
        console.log("Added debug shapes to visualize key positions");
    }

    loadSkater() {
        // ... existing code ...
        
        // After the skater is loaded and added to the scene
        this.skater.traverse((child) => {
            if (child.isMesh) {
                // ... existing code for mesh setup ...
            }
        });
        
        // Add tracking to the skater for visual debugging
        // this.skaterTracker = SceneDebug.trackObject(this.scene, this.skater, 0xff00ff, 'Skater');
        // this.skaterTrail = SceneDebug.addTrail(this.scene, this.skater, 50, 0xff00ff);
    }

    update(time, delta) {
        // ... existing code ...
        
        // If there are any NPCs, birds, or other objects you want to track
        if (this.sheepGroup && this.sheepGroup.children.length > 0 && !this.sheepTracker) {
            // Track the first sheep as an example
            // this.sheepTracker = SceneDebug.trackObject(this.scene, this.sheepGroup.children[0], 0x00ff00, 'Sheep');
        }
        
        if (this.birdGroup && this.birdGroup.children.length > 0 && !this.birdTracker) {
            // Track the first bird as an example
            // this.birdTracker = SceneDebug.trackObject(this.scene, this.birdGroup.children[0], 0x00ffff, 'Bird');
        }
        
        // Log positions periodically for debugging
        // this.debugCounter = (this.debugCounter || 0) + 1;
        // if (this.debugCounter % 60 === 0) { ... }
        
        // ... existing code ...
    }

    // New method to explicitly create and preserve debug objects
    

   
    // Handle game reset
    resetGame() {
        console.log("Performing complete game reset");
        
        // Reset game state first
        this.gameState.reset();
        
        // Reset player position and physics
        this.skateboard.resetPosition();
        this.skateboard.fullStop();
        
        // Remove invincibility effect
        if (this.skater && typeof this.skater.setInvincibility === 'function') {
            this.skater.setInvincibility(false);
        }
        
        // Reset camera position
        this.camera.position.set(0, 6, 12);
        this.camera.lookAt(this.skateboard.mesh.position);
        
        // Update camera history to prevent jarring transitions
        for (let i = 0; i < this.historyLength; i++) {
            this.cameraPositionHistory[i] = new THREE.Vector3(0, 6, 12);
        }
        
        // Reset score
        if (this.score && typeof this.score.resetScore === 'function') {
            this.score.resetScore();
        }
        
        // Reset coins
        if (this.coinSystem && typeof this.coinSystem.resetCoins === 'function') {
            this.coinSystem.resetCoins();
        }
        
        // Reset police
        if (this.policeSystem && typeof this.policeSystem.resetGame === 'function') {
            this.policeSystem.resetGame();
        }
        
        // Reset other systems if needed
        if (this.boosterSystem && typeof this.boosterSystem.reset === 'function') {
            this.boosterSystem.reset();
        }
        
        if (this.jumpPadSystem && typeof this.jumpPadSystem.reset === 'function') {
            this.jumpPadSystem.reset();
        }
        
        // Reset candies
        if (this.candySystem && typeof this.candySystem.initCandies === 'function') {
            this.candySystem.initCandies();
        }
        
        // Reset magnets
        if (this.magnetSystem && typeof this.magnetSystem.initMagnets === 'function') {
            this.magnetSystem.initMagnets();
        }
        
        // Reset any timers or flags
        this.resetTimerStarted = false;
        this.gameOverResetScheduled = false;
        
        console.log("Game reset complete");
    }
}
