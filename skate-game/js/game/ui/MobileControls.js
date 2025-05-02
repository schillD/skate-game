import * as THREE from 'three';

export class MobileControls {
    constructor(inputHandler) {
        this.inputHandler = inputHandler;
        this.isMobile = this.detectMobile();
        this.touchState = {
            up: false,
            down: false,
            left: false,
            right: false,
            jump: false,
            sprint: false
        };
        
        // Add a flag to track sprint toggle state
        this.sprintActive = false;
        
        // Add joystick state with touch identifier tracking
        this.joystick = {
            active: false,
            touchId: null, // Store the identifier of the touch controlling the joystick
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0,
            angle: 0,
            intensity: 0,
            maxRadius: 65  // Increased for the larger joystick
        };
        
        // Show or hide mobile instructions based on device type
        const mobileInstructions = document.getElementById('mobile-instructions');
        if (mobileInstructions) {
            mobileInstructions.style.display = this.isMobile ? 'inline' : 'none';
        }
        
        // Don't create controls if not on mobile
        if (!this.isMobile) return;
        
        this.createMobileUI();
        this.setupEventListeners();
        this.preventDefaultTouchBehavior();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 800 || window.orientation !== undefined;
    }
    
    createMobileUI() {
        // Create container for mobile controls
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.id = 'mobile-controls';
        this.controlsContainer.style.position = 'fixed';
        this.controlsContainer.style.bottom = '10px'; // Moved closer to bottom of screen
        this.controlsContainer.style.left = '0';
        this.controlsContainer.style.width = '100%';
        this.controlsContainer.style.display = 'flex';
        this.controlsContainer.style.justifyContent = 'space-between';
        this.controlsContainer.style.zIndex = '1000';
        this.controlsContainer.style.pointerEvents = 'none'; // Container doesn't block clicks
        document.body.appendChild(this.controlsContainer);
        
        // Create left side (joystick)
        this.joystickContainer = document.createElement('div');
        this.joystickContainer.style.position = 'relative';
        this.joystickContainer.style.width = '180px';  // Increased width
        this.joystickContainer.style.height = '180px';  // Increased height
        this.joystickContainer.style.margin = '0 0 100px 20px';  // Increased bottom margin significantly
        this.joystickContainer.style.pointerEvents = 'none';
        this.controlsContainer.appendChild(this.joystickContainer);
        
        // Create joystick base (the outer circle) - larger for better usability
        this.joystickBase = document.createElement('div');
        this.joystickBase.style.position = 'absolute';
        this.joystickBase.style.width = '150px';  // Increased size
        this.joystickBase.style.height = '150px';  // Increased size
        this.joystickBase.style.borderRadius = '50%';
        this.joystickBase.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';  // Slightly more visible
        this.joystickBase.style.border = '3px solid rgba(255, 255, 255, 0.5)';  // Thicker border
        this.joystickBase.style.top = '15px';
        this.joystickBase.style.left = '15px';
        this.joystickBase.style.pointerEvents = 'auto';
        this.joystickBase.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';  // Add shadow for better visibility
        this.joystickBase.id = 'joystick-base';
        this.joystickContainer.appendChild(this.joystickBase);
        
        // Create joystick handle (the inner circle) - larger for better visibility
        this.joystickHandle = document.createElement('div');
        this.joystickHandle.style.position = 'absolute';
        this.joystickHandle.style.width = '70px';  // Increased size
        this.joystickHandle.style.height = '70px';  // Increased size
        this.joystickHandle.style.borderRadius = '50%';
        this.joystickHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';  // More visible
        this.joystickHandle.style.border = '3px solid rgba(255, 255, 255, 0.9)';  // Thicker border
        this.joystickHandle.style.top = '60px'; // Centered for the larger base (150-70)/2 + 15
        this.joystickHandle.style.left = '60px';
        this.joystickHandle.style.pointerEvents = 'none';
        this.joystickHandle.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.3)';  // Glowing effect
        this.joystickHandle.id = 'joystick-handle';
        this.joystickContainer.appendChild(this.joystickHandle);
        
        // Create right side (action buttons)
        this.actionContainer = document.createElement('div');
        this.actionContainer.style.display = 'flex';
        this.actionContainer.style.flexDirection = 'column';
        this.actionContainer.style.gap = '10px';
        this.actionContainer.style.margin = '0 20px 0 0';
        this.actionContainer.style.pointerEvents = 'none';
        this.controlsContainer.appendChild(this.actionContainer);
        
        // Action buttons (larger)
        const actionButtonStyle = {
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            userSelect: 'none',
            touchAction: 'none',
            pointerEvents: 'auto'
        };
        
        // Jump button
        this.jumpButton = document.createElement('div');
        Object.assign(this.jumpButton.style, actionButtonStyle);
        this.jumpButton.style.backgroundColor = 'rgba(0, 200, 0, 0.4)';
        this.jumpButton.style.border = '3px solid rgba(0, 200, 0, 0.7)';
        this.jumpButton.innerHTML = 'JUMP';
        this.jumpButton.id = 'mobile-jump';
        this.actionContainer.appendChild(this.jumpButton);
        
        // Sprint button (updated for toggle functionality)
        this.sprintButton = document.createElement('div');
        Object.assign(this.sprintButton.style, actionButtonStyle);
        this.sprintButton.style.backgroundColor = 'rgba(0, 100, 255, 0.4)';
        this.sprintButton.style.border = '3px solid rgba(0, 100, 255, 0.7)';
        this.sprintButton.innerHTML = 'SPRINT<br>OFF';
        this.sprintButton.id = 'mobile-sprint';
        this.actionContainer.appendChild(this.sprintButton);
        
        // Add info text for jump button
        const jumpInfo = document.createElement('div');
        jumpInfo.style.textAlign = 'center';
        jumpInfo.style.color = 'white';
        jumpInfo.style.fontSize = '12px';
        jumpInfo.style.marginTop = '5px';
        jumpInfo.innerHTML = 'Hold to jump higher';
        this.actionContainer.appendChild(jumpInfo);
        
        // Finally add a toggle button to show/hide mobile controls
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'toggle-mobile-controls';
        this.toggleButton.innerHTML = 'Hide Controls';
        this.toggleButton.style.position = 'fixed';
        this.toggleButton.style.top = '50px'; // Position below the minimized instruction panel
        this.toggleButton.style.left = '10px';
        this.toggleButton.style.padding = '8px 12px';
        this.toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.toggleButton.style.color = 'white';
        this.toggleButton.style.border = '1px solid white';
        this.toggleButton.style.borderRadius = '5px';
        this.toggleButton.style.zIndex = '1001';
        document.body.appendChild(this.toggleButton);
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.adjustControlsForOrientation(), 300);
        });
        this.adjustControlsForOrientation();
    }
    
    adjustControlsForOrientation() {
        if (window.innerHeight > window.innerWidth) {
            // Portrait
            this.controlsContainer.style.flexDirection = 'column';
            this.controlsContainer.style.alignItems = 'center';
            this.controlsContainer.style.bottom = '80px';
            
            this.joystickContainer.style.margin = '0 0 20px 0';
            this.actionContainer.style.flexDirection = 'row';
            this.actionContainer.style.margin = '0';
        } else {
            // Landscape
            this.controlsContainer.style.flexDirection = 'row';
            this.controlsContainer.style.alignItems = 'flex-end';
            this.controlsContainer.style.bottom = '20px';
            
            this.joystickContainer.style.margin = '0 0 0 20px';
            this.actionContainer.style.flexDirection = 'column';
            this.actionContainer.style.margin = '0 20px 0 0';
        }
    }
    
    setupEventListeners() {
        // Set up joystick event handlers - using touch identifier tracking
        this.joystickBase.addEventListener('touchstart', (event) => {
            event.preventDefault();
            
            // Only process if joystick isn't already active
            if (!this.joystick.active) {
                // Get base position
                const rect = this.joystickBase.getBoundingClientRect();
                const baseX = rect.left + rect.width / 2;
                const baseY = rect.top + rect.height / 2;
                
                // Initialize joystick
                this.joystick.active = true;
                this.joystick.startX = baseX;
                this.joystick.startY = baseY;
                
                // Set initial touch position and store touch identifier
                if (event.touches.length > 0) {
                    const touch = event.touches[0];
                    this.joystick.touchId = touch.identifier; // Store the touch identifier
                    this.joystick.currentX = touch.clientX;
                    this.joystick.currentY = touch.clientY;
                    
                    console.log("Joystick activated with touch ID: " + this.joystick.touchId);
                    
                    // Update joystick visually
                    this.updateJoystickPosition();
                }
            }
        }, { passive: false });
        
        // Handle joystick movement - now with touch identifier tracking
        document.addEventListener('touchmove', (event) => {
            if (!this.joystick.active || this.joystick.touchId === null) return;
            
            event.preventDefault();
            
            // Find the specific touch that's controlling the joystick
            for (let i = 0; i < event.touches.length; i++) {
                const touch = event.touches[i];
                if (touch.identifier === this.joystick.touchId) {
                    // This is our joystick touch
                    this.joystick.currentX = touch.clientX;
                    this.joystick.currentY = touch.clientY;
                    
                    // Update joystick visually and input state
                    this.updateJoystickPosition();
                    break; // Found the right touch, no need to keep searching
                }
            }
        }, { passive: false });
        
        // Handle joystick release with proper touch identifier tracking
        document.addEventListener('touchend', (event) => {
            if (!this.joystick.active || this.joystick.touchId === null) return;
            
            // Check if the specific joystick touch has ended
            let joystickTouchEnded = true;
            
            // Look through all remaining touches to see if our joystick touch is still active
            for (let i = 0; i < event.touches.length; i++) {
                if (event.touches[i].identifier === this.joystick.touchId) {
                    // The joystick touch is still active
                    joystickTouchEnded = false;
                    break;
                }
            }
            
            // Also check the ended touches in changedTouches to confirm it was our joystick touch
            let foundEndedTouch = false;
            for (let i = 0; i < event.changedTouches.length; i++) {
                if (event.changedTouches[i].identifier === this.joystick.touchId) {
                    foundEndedTouch = true;
                    break;
                }
            }
            
            // Only reset the joystick if our specific touch ended
            if (joystickTouchEnded && foundEndedTouch) {
                console.log("Joystick deactivated, touch ID: " + this.joystick.touchId + " ended");
                
                // Reset joystick position and state
                this.joystick.active = false;
                this.joystick.touchId = null;
                this.resetJoystick();
                
                // Reset directional state
                this.touchState.up = false;
                this.touchState.down = false;
                this.touchState.left = false;
                this.touchState.right = false;
                
                // Update input handler
                this.updateInputHandlerState();
            }
        }, { passive: false });
        
        document.addEventListener('touchcancel', (event) => {
            if (!this.joystick.active || this.joystick.touchId === null) return;
            
            // Check if the specific joystick touch has been canceled
            let joystickTouchCanceled = false;
            
            // Check changedTouches to see if our joystick touch was canceled
            for (let i = 0; i < event.changedTouches.length; i++) {
                if (event.changedTouches[i].identifier === this.joystick.touchId) {
                    // Our joystick touch was canceled
                    joystickTouchCanceled = true;
                    break;
                }
            }
            
            // Only reset the joystick if our specific touch was canceled
            if (joystickTouchCanceled) {
                console.log("Joystick deactivated, touch ID: " + this.joystick.touchId + " canceled");
                
                // Reset joystick position and state
                this.joystick.active = false;
                this.joystick.touchId = null;
                this.resetJoystick();
                
                // Reset directional state
                this.touchState.up = false;
                this.touchState.down = false;
                this.touchState.left = false;
                this.touchState.right = false;
                
                // Update input handler
                this.updateInputHandlerState();
            }
        }, { passive: false });

        // Jump button has special handling for hold functionality
        this.jumpButton.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.touchState.jump = true;
            this.jumpButton.style.transform = 'scale(0.9)';
            this.jumpButton.style.opacity = '1';
            
            // Start jump power calculation
            if (this.inputHandler) {
                this.inputHandler.spaceHoldStartTime = performance.now();
                this.inputHandler.isHoldingSpace = true;
                this.inputHandler.jumpKeyWasPressed = false;
                this.inputHandler.jumpPowerStored = 1.0;
            }
            
            this.updateInputHandlerState();
        }, { passive: false });
        
        this.jumpButton.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.touchState.jump = false;
            this.jumpButton.style.transform = 'scale(1)';
            this.jumpButton.style.opacity = '0.7';
            
            // Calculate jump power and release
            if (this.inputHandler) {
                this.inputHandler.jumpPowerStored = this.inputHandler.calculateJumpPower();
                this.inputHandler.isHoldingSpace = false;
                this.inputHandler.jumpKeyWasPressed = true;
            }
            
            this.updateInputHandlerState();
        }, { passive: false });
        
        this.jumpButton.addEventListener('touchcancel', (event) => {
            event.preventDefault();
            this.touchState.jump = false;
            this.jumpButton.style.transform = 'scale(1)';
            this.jumpButton.style.opacity = '0.7';
            
            if (this.inputHandler) {
                this.inputHandler.jumpPowerStored = this.inputHandler.calculateJumpPower();
                this.inputHandler.isHoldingSpace = false;
                this.inputHandler.jumpKeyWasPressed = true;
            }
            
            this.updateInputHandlerState();
        }, { passive: false });
        
        // Sprint button with toggle functionality
        this.sprintButton.addEventListener('touchstart', (event) => {
            event.preventDefault();
            
            // Toggle the sprint state
            this.sprintActive = !this.sprintActive;
            this.touchState.sprint = this.sprintActive;
            
            // Update the button appearance
            if (this.sprintActive) {
                this.sprintButton.style.backgroundColor = 'rgba(0, 200, 255, 0.7)';
                this.sprintButton.style.border = '3px solid rgba(0, 220, 255, 0.9)';
                this.sprintButton.innerHTML = 'SPRINT<br>ON';
                this.sprintButton.style.boxShadow = '0 0 15px rgba(0, 220, 255, 0.7)';
            } else {
                this.sprintButton.style.backgroundColor = 'rgba(0, 100, 255, 0.4)';
                this.sprintButton.style.border = '3px solid rgba(0, 100, 255, 0.7)';
                this.sprintButton.innerHTML = 'SPRINT<br>OFF';
                this.sprintButton.style.boxShadow = 'none';
            }
            
            // Apply visual feedback
            this.sprintButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.sprintButton.style.transform = 'scale(1)';
            }, 150);
            
            this.updateInputHandlerState();
        }, { passive: false });
        
        // Toggle button for showing/hiding controls
        this.toggleButton.addEventListener('click', () => {
            if (this.controlsContainer.style.display === 'none') {
                this.controlsContainer.style.display = 'flex';
                this.toggleButton.innerHTML = 'Hide Controls';
            } else {
                this.controlsContainer.style.display = 'none';
                this.toggleButton.innerHTML = 'Show Controls';
            }
        });
    }
    
    updateJoystickPosition() {
        if (!this.joystick.active) return;
        
        // Calculate delta from center
        this.joystick.deltaX = this.joystick.currentX - this.joystick.startX;
        this.joystick.deltaY = this.joystick.currentY - this.joystick.startY;
        
        // Calculate distance from center
        const distance = Math.sqrt(this.joystick.deltaX * this.joystick.deltaX + this.joystick.deltaY * this.joystick.deltaY);
        
        // Limit to max radius
        this.joystick.intensity = Math.min(distance / this.joystick.maxRadius, 1.0);
        
        // Calculate the clamped position
        let moveX = this.joystick.deltaX;
        let moveY = this.joystick.deltaY;
        
        if (distance > this.joystick.maxRadius) {
            const ratio = this.joystick.maxRadius / distance;
            moveX *= ratio;
            moveY *= ratio;
        }
        
        // Update handle position visually
        this.joystickHandle.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        
        // Calculate angle in degrees
        this.joystick.angle = Math.atan2(this.joystick.deltaY, this.joystick.deltaX) * (180 / Math.PI);
        
        // Update directional state based on joystick components and intensity
        if (this.joystick.intensity > 0.3) {
            // Normalize the joystick components to create smooth directional control
            const normalizedX = this.joystick.deltaX / (distance || 1);
            const normalizedY = this.joystick.deltaY / (distance || 1);
            
            // Apply a threshold to each axis separately - lowered for better responsiveness
            const threshold = 0.2;
            
            // Reset all directions first
            this.touchState.up = false;
            this.touchState.down = false;
            this.touchState.left = false;
            this.touchState.right = false;
            
            // Determine direction based on component magnitudes
            // This allows diagonal movement (e.g., up+right simultaneously)
            if (normalizedY < -threshold) {
                this.touchState.up = true;
            } else if (normalizedY > threshold) {
                this.touchState.down = true;
            }
            
            if (normalizedX < -threshold) {
                this.touchState.left = true;
            } else if (normalizedX > threshold) {
                this.touchState.right = true;
            }
        } else {
            // Reset all directions when intensity is too low
            this.touchState.up = false;
            this.touchState.down = false;
            this.touchState.left = false;
            this.touchState.right = false;
        }
        
        // Update input handler with current state
        this.updateInputHandlerState();
    }
    
    resetJoystick() {
        // Reset handle to center position
        this.joystickHandle.style.transform = 'translate3d(0px, 0px, 0)';
        
        // Reset joystick state
        this.joystick.deltaX = 0;
        this.joystick.deltaY = 0;
        this.joystick.angle = 0;
        this.joystick.intensity = 0;
        // Don't reset touchId here - that's handled in the touchend/cancel handlers
    }
    
    updateInputHandlerState() {
        if (!this.inputHandler) return;
        
        // Update direction state
        this.inputHandler.forward = this.touchState.up;
        this.inputHandler.backward = this.touchState.down;
        this.inputHandler.left = this.touchState.left;
        this.inputHandler.right = this.touchState.right;
        
        // Update sprint state
        this.inputHandler.shift = this.touchState.sprint;
    }
    
    update() {
        // This method can be called per frame to handle any continuous updates
        if (!this.isMobile) return;
        
        // Check if the player is moving forward to properly sync sprint state
        if (this.sprintActive && !this.touchState.up) {
            // If sprint is active but player is not moving forward,
            // we still keep the sprint toggle on but don't enable sprint
            // in the input handler unless we're pressing forward
            this.inputHandler.shift = false;
        } else if (this.sprintActive && this.touchState.up) {
            // Re-enable sprint when moving forward again
            this.inputHandler.shift = true;
        }
    }
    
    // Helper method to check if a point is inside a rectangle
    isPointInRect(x, y, rect) {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    preventDefaultTouchBehavior() {
        // Prevent unwanted touch scrolling/zooming on mobile devices
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            gameCanvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
            gameCanvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
            gameCanvas.addEventListener('touchend', e => e.preventDefault(), { passive: false });
        }
        
        // Prevent all default touch actions on the document
        document.addEventListener('touchmove', e => {
            if (e.target.id !== 'toggle-mobile-controls') {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Disable overscroll/bounce effects
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.overscrollBehavior = 'none';
    }
} 