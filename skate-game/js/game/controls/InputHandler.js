import * as THREE from 'three';

export class InputHandler {
    constructor(gameState) {
        // Store reference to game state
        this.gameState = gameState;
        
        // Input state
        this.keys = {};
        this.forward = false;
        this.backward = false;
        this.left = false;
        this.right = false;
        this.shift = false; // Track Shift key
        
        // Jump key tracking
        this.spaceHoldStartTime = 0;
        this.isHoldingSpace = false;
        this.jumpPowerStored = 1.0;
        this.jumpKeyWasPressed = false;
        
        // Track previous key state for "just pressed" detection
        this.previousKeys = {};
        
        // Initialize input listeners
        window.addEventListener('keydown', e => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            // Update movement state
            if (key === 'w' || key === 'arrowup') this.forward = true;
            if (key === 's' || key === 'arrowdown') this.backward = true;
            if (key === 'a' || key === 'arrowleft') this.left = true;
            if (key === 'd' || key === 'arrowright') this.right = true;
            if (key === 'shift') this.shift = true;
            
            // Track when space is first pressed down
            if (key === ' ' && !this.isHoldingSpace) {
                this.spaceHoldStartTime = performance.now();
                this.isHoldingSpace = true;
                this.jumpKeyWasPressed = false; // Reset jump flag on new press
                this.jumpPowerStored = 1.0; // Reset power
            }
        });
        
        window.addEventListener('keyup', e => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
            
            // Update movement state
            if (key === 'w' || key === 'arrowup') this.forward = false;
            if (key === 's' || key === 'arrowdown') this.backward = false;
            if (key === 'a' || key === 'arrowleft') this.left = false;
            if (key === 'd' || key === 'arrowright') this.right = false;
            if (key === 'shift') this.shift = false;
            
            // When space is released, calculate and store the final jump power
            if (key === ' ') {
                if (this.isHoldingSpace) {
                    this.jumpPowerStored = this.calculateJumpPower();
                }
                this.isHoldingSpace = false;
                this.jumpKeyWasPressed = true; // Mark that jump should happen
            }
        });
    }
    
    getMoveX() {
        // Check if player is immobilized
        if (this.gameState && this.gameState.isPlayerImmobilized()) {
            return 0;
        }
        
        // Calculate rotation value (not affected by forward/backward)
        const rotateSpeed = 0.03;
        let rotation = 0;
        
        // Fix reversed controls - correct direction for left/right
        if (this.left) rotation += rotateSpeed;  // Positive rotation is counterclockwise
        if (this.right) rotation -= rotateSpeed; // Negative rotation is clockwise
        
        return rotation;
    }
    
    getMoveZ() {
        // Check if player is immobilized
        if (this.gameState && this.gameState.isPlayerImmobilized()) {
            return 0;
        }
        
        // Calculate forward/backward movement
        const speed = 0.2;
        let moveZ = 0;
        
        if (this.forward) moveZ -= speed;
        if (this.backward) moveZ += speed;
        
        return moveZ;
    }
    
    getJump() {
        // Check if player is immobilized
        if (this.gameState && this.gameState.isPlayerImmobilized()) {
            return false;
        }
        
        // Only return true once per key press/release cycle
        if (this.jumpKeyWasPressed) {
            this.jumpKeyWasPressed = false;
            return true;
        }
        return false;
    }
    
    getJumpPower() {
        // Return the stored jump power
        return this.jumpPowerStored;
    }
    
    calculateJumpPower() {
        if (!this.isHoldingSpace) return 1.0;
        
        // Calculate how long space has been held (in milliseconds)
        const holdTime = performance.now() - this.spaceHoldStartTime;
        
        // Map hold time to a jump power multiplier (max out at 500ms for 2x jump power)
        // Minimum power is 1.0 (normal jump), max is 2.0 (double height)
        const maxHoldTime = 500; // ms
        const maxPowerMultiplier = 2.0;
        
        return Math.min(1.0 + (holdTime / maxHoldTime) * (maxPowerMultiplier - 1.0), maxPowerMultiplier);
    }
    
    // Check if a key was just pressed this frame
    isKeyJustPressed(key) {
        const keyLower = key.toLowerCase();
        const justPressed = this.keys[keyLower] === true && this.previousKeys[keyLower] !== true;
        
        // Update previous key state
        this.updatePreviousKeys();
        
        return justPressed;
    }
    
    // Update previous key states at the end of the frame
    updatePreviousKeys() {
        // Copy current keys state to previous
        Object.keys(this.keys).forEach(key => {
            this.previousKeys[key] = this.keys[key];
        });
    }
    
    // Methods for debugging
    isDebugKeyPressed() {
        return this.keys['j'] === true;
    }
    
    resetDebugKey() {
        this.keys['j'] = false;
    }

    isSprinting() {
        // Return true if Shift and Forward are held
        return this.shift && this.forward;
    }
} 