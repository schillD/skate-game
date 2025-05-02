import { System } from '../System.js';

/**
 * Input System for handling keyboard, mouse, touch, and gamepad inputs
 */
export class InputSystem extends System {
    constructor() {
        super('InputSystem');
        
        // Input state
        this.keys = new Map();
        this.previousKeys = new Map();
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            buttons: new Map(),
            previousButtons: new Map(),
            wheel: 0,
            isLocked: false
        };
        this.touch = {
            touches: new Map(),
            previousTouches: new Map(),
            active: false
        };
        this.gamepads = new Map();
        this.previousGamepads = new Map();
        
        // Input mapping
        this.actionMap = new Map();
        this.axisMap = new Map();
        
        // Input recording
        this.isRecording = false;
        this.recordedInputs = [];
        this.playbackIndex = 0;
        this.isPlayingBack = false;
        
        // Event listeners
        this.boundHandlers = {
            keydown: this.handleKeyDown.bind(this),
            keyup: this.handleKeyUp.bind(this),
            mousedown: this.handleMouseDown.bind(this),
            mouseup: this.handleMouseUp.bind(this),
            mousemove: this.handleMouseMove.bind(this),
            wheel: this.handleMouseWheel.bind(this),
            touchstart: this.handleTouchStart.bind(this),
            touchend: this.handleTouchEnd.bind(this),
            touchmove: this.handleTouchMove.bind(this),
            touchcancel: this.handleTouchCancel.bind(this),
            contextmenu: event => event.preventDefault(),
            pointerlockchange: this.handlePointerLockChange.bind(this),
            blur: this.handleBlur.bind(this)
        };
    }

    /**
     * Initialize the input system
     * @param {Scene} scene - The scene this system belongs to
     */
    init(scene) {
        super.init(scene);
        
        // Get canvas element
        this.canvas = this.scene.game.canvas;
        
        // Add event listeners
        this.addEventListeners();
        
        // Start gamepad polling
        this.startGamepadPolling();
    }

    /**
     * Add event listeners to the canvas and window
     */
    addEventListeners() {
        // Keyboard events (window)
        window.addEventListener('keydown', this.boundHandlers.keydown);
        window.addEventListener('keyup', this.boundHandlers.keyup);
        
        // Mouse events (canvas)
        this.canvas.addEventListener('mousedown', this.boundHandlers.mousedown);
        this.canvas.addEventListener('mouseup', this.boundHandlers.mouseup);
        this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });
        
        // Touch events (canvas)
        this.canvas.addEventListener('touchstart', this.boundHandlers.touchstart, { passive: false });
        this.canvas.addEventListener('touchend', this.boundHandlers.touchend, { passive: false });
        this.canvas.addEventListener('touchmove', this.boundHandlers.touchmove, { passive: false });
        this.canvas.addEventListener('touchcancel', this.boundHandlers.touchcancel);
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', this.boundHandlers.contextmenu);
        
        // Pointer lock change
        document.addEventListener('pointerlockchange', this.boundHandlers.pointerlockchange);
        
        // Window blur
        window.addEventListener('blur', this.boundHandlers.blur);
    }

    /**
     * Remove event listeners from the canvas and window
     */
    removeEventListeners() {
        // Keyboard events (window)
        window.removeEventListener('keydown', this.boundHandlers.keydown);
        window.removeEventListener('keyup', this.boundHandlers.keyup);
        
        // Mouse events (canvas)
        this.canvas.removeEventListener('mousedown', this.boundHandlers.mousedown);
        this.canvas.removeEventListener('mouseup', this.boundHandlers.mouseup);
        this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.removeEventListener('wheel', this.boundHandlers.wheel);
        
        // Touch events (canvas)
        this.canvas.removeEventListener('touchstart', this.boundHandlers.touchstart);
        this.canvas.removeEventListener('touchend', this.boundHandlers.touchend);
        this.canvas.removeEventListener('touchmove', this.boundHandlers.touchmove);
        this.canvas.removeEventListener('touchcancel', this.boundHandlers.touchcancel);
        
        // Prevent context menu on right click
        this.canvas.removeEventListener('contextmenu', this.boundHandlers.contextmenu);
        
        // Pointer lock change
        document.removeEventListener('pointerlockchange', this.boundHandlers.pointerlockchange);
        
        // Window blur
        window.removeEventListener('blur', this.boundHandlers.blur);
    }

    /**
     * Start polling for gamepad input
     */
    startGamepadPolling() {
        this.gamepadPollInterval = setInterval(() => {
            this.pollGamepads();
        }, 16); // ~60fps
    }

    /**
     * Stop polling for gamepad input
     */
    stopGamepadPolling() {
        if (this.gamepadPollInterval) {
            clearInterval(this.gamepadPollInterval);
            this.gamepadPollInterval = null;
        }
    }

    /**
     * Poll for gamepad input
     */
    pollGamepads() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        
        // Update previous gamepads
        this.previousGamepads = new Map(this.gamepads);
        
        // Clear current gamepads
        this.gamepads.clear();
        
        // Update current gamepads
        for (const gamepad of gamepads) {
            if (gamepad) {
                this.gamepads.set(gamepad.index, {
                    id: gamepad.id,
                    buttons: gamepad.buttons.map(b => b.pressed),
                    axes: Array.from(gamepad.axes)
                });
            }
        }
    }

    /**
     * Handle key down event
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        // Prevent default for certain keys (e.g. space, arrow keys)
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
            event.preventDefault();
        }
        
        // Update key state
        this.keys.set(event.code, true);
        
        // Record input if recording
        if (this.isRecording) {
            this.recordedInputs.push({
                type: 'keydown',
                code: event.code,
                timestamp: performance.now()
            });
        }
    }

    /**
     * Handle key up event
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyUp(event) {
        // Update key state
        this.keys.set(event.code, false);
        
        // Record input if recording
        if (this.isRecording) {
            this.recordedInputs.push({
                type: 'keyup',
                code: event.code,
                timestamp: performance.now()
            });
        }
    }

    /**
     * Handle mouse down event
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseDown(event) {
        event.preventDefault();
        
        // Update mouse button state
        this.mouse.buttons.set(event.button, true);
        
        // Record input if recording
        if (this.isRecording) {
            this.recordedInputs.push({
                type: 'mousedown',
                button: event.button,
                x: event.clientX,
                y: event.clientY,
                timestamp: performance.now()
            });
        }
    }

    /**
     * Handle mouse up event
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseUp(event) {
        event.preventDefault();
        
        // Update mouse button state
        this.mouse.buttons.set(event.button, false);
        
        // Record input if recording
        if (this.isRecording) {
            this.recordedInputs.push({
                type: 'mouseup',
                button: event.button,
                x: event.clientX,
                y: event.clientY,
                timestamp: performance.now()
            });
        }
    }

    /**
     * Handle mouse move event
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseMove(event) {
        // Get canvas position
        const rect = this.canvas.getBoundingClientRect();
        
        // Calculate mouse position relative to canvas
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Calculate mouse delta
        const deltaX = this.mouse.isLocked ? 
            event.movementX : 
            x - this.mouse.x;
        
        const deltaY = this.mouse.isLocked ? 
            event.movementY : 
            y - this.mouse.y;
        
        // Update mouse position and delta
        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.deltaX = deltaX;
        this.mouse.deltaY = deltaY;
        
        // Record input if recording
        if (this.isRecording) {
            this.recordedInputs.push({
                type: 'mousemove',
                x: x,
                y: y,
                deltaX: deltaX,
                deltaY: deltaY,
                timestamp: performance.now()
            });
        }
    }

    /**
     * Handle mouse wheel event
     * @param {WheelEvent} event - The wheel event
     */
    handleMouseWheel(event) {
        event.preventDefault();
        
        // Update mouse wheel
        this.mouse.wheel = event.deltaY;
        
        // Record input if recording
        if (this.isRecording) {
            this.recordedInputs.push({
                type: 'wheel',
                deltaY: event.deltaY,
                timestamp: performance.now()
            });
        }
    }

    /**
     * Handle touch start event
     * @param {TouchEvent} event - The touch event
     */
    handleTouchStart(event) {
        event.preventDefault();
        
        // Update touch state
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            
            // Get canvas position
            const rect = this.canvas.getBoundingClientRect();
            
            // Calculate touch position relative to canvas
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Add touch to touches map
            this.touch.touches.set(touch.identifier, { x, y });
        }
        
        // Set touch active flag
        this.touch.active = this.touch.touches.size > 0;
        
        // Record input if recording
        if (this.isRecording) {
            this.recordedInputs.push({
                type: 'touchstart',
                touches: Array.from(this.touch.touches.entries()),
                timestamp: performance.now()
            });
        }
    }

    /**
     * Handle touch end event
     * @param {TouchEvent} event - The touch event
     */
    handleTouchEnd(event) {
        event.preventDefault();
        
        // Update touch state
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            
            // Remove touch from touches map
            this.touch.touches.delete(touch.identifier);
        }
        
        // Set touch active flag
        this.touch.active = this.touch.touches.size > 0;
        
        // Record input if recording
        if (this.isRecording) {
            this.recordedInputs.push({
                type: 'touchend',
                touches: Array.from(this.touch.touches.entries()),
                timestamp: performance.now()
            });
        }
    }

    /**
     * Handle touch move event
     * @param {TouchEvent} event - The touch event
     */
    handleTouchMove(event) {
        event.preventDefault();
        
        // Update touch state
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            
            // Get canvas position
            const rect = this.canvas.getBoundingClientRect();
            
            // Calculate touch position relative to canvas
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Update touch in touches map
            this.touch.touches.set(touch.identifier, { x, y });
        }
        
        // Record input if recording
        if (this.isRecording) {
            this.recordedInputs.push({
                type: 'touchmove',
                touches: Array.from(this.touch.touches.entries()),
                timestamp: performance.now()
            });
        }
    }

    /**
     * Handle touch cancel event
     * @param {TouchEvent} event - The touch event
     */
    handleTouchCancel(event) {
        // Update touch state
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            
            // Remove touch from touches map
            this.touch.touches.delete(touch.identifier);
        }
        
        // Set touch active flag
        this.touch.active = this.touch.touches.size > 0;
        
        // Record input if recording
        if (this.isRecording) {
            this.recordedInputs.push({
                type: 'touchcancel',
                touches: Array.from(this.touch.touches.entries()),
                timestamp: performance.now()
            });
        }
    }

    /**
     * Handle pointer lock change event
     */
    handlePointerLockChange() {
        this.mouse.isLocked = document.pointerLockElement === this.canvas;
    }

    /**
     * Handle window blur event
     */
    handleBlur() {
        // Reset all input states
        this.keys.clear();
        this.mouse.buttons.clear();
        this.mouse.wheel = 0;
        this.touch.touches.clear();
        this.touch.active = false;
    }

    /**
     * Request pointer lock for the canvas
     */
    requestPointerLock() {
        if (!this.mouse.isLocked) {
            this.canvas.requestPointerLock();
        }
    }

    /**
     * Exit pointer lock
     */
    exitPointerLock() {
        if (this.mouse.isLocked) {
            document.exitPointerLock();
        }
    }

    /**
     * Toggle pointer lock
     */
    togglePointerLock() {
        if (this.mouse.isLocked) {
            this.exitPointerLock();
        } else {
            this.requestPointerLock();
        }
    }

    /**
     * Start recording input
     */
    startRecording() {
        this.isRecording = true;
        this.recordedInputs = [];
    }

    /**
     * Stop recording input
     * @returns {Array} The recorded inputs
     */
    stopRecording() {
        this.isRecording = false;
        return this.recordedInputs;
    }

    /**
     * Start playing back recorded input
     * @param {Array} inputs - The recorded inputs to play back
     */
    startPlayback(inputs) {
        this.isPlayingBack = true;
        this.recordedInputs = inputs;
        this.playbackIndex = 0;
    }

    /**
     * Stop playing back recorded input
     */
    stopPlayback() {
        this.isPlayingBack = false;
        this.playbackIndex = 0;
    }

    /**
     * Update playback
     * @param {number} deltaTime - The time in seconds since the last update
     */
    updatePlayback(deltaTime) {
        if (!this.isPlayingBack || this.playbackIndex >= this.recordedInputs.length) {
            return;
        }
        
        const currentTime = performance.now();
        const input = this.recordedInputs[this.playbackIndex];
        
        if (currentTime >= input.timestamp) {
            // Process input
            switch (input.type) {
                case 'keydown':
                    this.keys.set(input.code, true);
                    break;
                case 'keyup':
                    this.keys.set(input.code, false);
                    break;
                case 'mousedown':
                    this.mouse.buttons.set(input.button, true);
                    break;
                case 'mouseup':
                    this.mouse.buttons.set(input.button, false);
                    break;
                case 'mousemove':
                    this.mouse.x = input.x;
                    this.mouse.y = input.y;
                    this.mouse.deltaX = input.deltaX;
                    this.mouse.deltaY = input.deltaY;
                    break;
                case 'wheel':
                    this.mouse.wheel = input.deltaY;
                    break;
                case 'touchstart':
                case 'touchend':
                case 'touchmove':
                case 'touchcancel':
                    this.touch.touches = new Map(input.touches);
                    this.touch.active = this.touch.touches.size > 0;
                    break;
            }
            
            // Move to next input
            this.playbackIndex++;
        }
    }

    /**
     * Map an action to input(s)
     * @param {string} actionName - The name of the action
     * @param {Object} actionConfig - The action configuration
     */
    mapAction(actionName, actionConfig) {
        this.actionMap.set(actionName, actionConfig);
    }

    /**
     * Unmap an action
     * @param {string} actionName - The name of the action
     */
    unmapAction(actionName) {
        this.actionMap.delete(actionName);
    }

    /**
     * Map an axis to input(s)
     * @param {string} axisName - The name of the axis
     * @param {Object} axisConfig - The axis configuration
     */
    mapAxis(axisName, axisConfig) {
        this.axisMap.set(axisName, axisConfig);
    }

    /**
     * Unmap an axis
     * @param {string} axisName - The name of the axis
     */
    unmapAxis(axisName) {
        this.axisMap.delete(axisName);
    }

    /**
     * Check if a key is down
     * @param {string} key - The key to check
     * @returns {boolean} Whether the key is down
     */
    isKeyDown(key) {
        return this.keys.get(key) === true;
    }

    /**
     * Check if a key was just pressed
     * @param {string} key - The key to check
     * @returns {boolean} Whether the key was just pressed
     */
    isKeyPressed(key) {
        return this.keys.get(key) === true && this.previousKeys.get(key) !== true;
    }

    /**
     * Check if a key was just released
     * @param {string} key - The key to check
     * @returns {boolean} Whether the key was just released
     */
    isKeyReleased(key) {
        return this.keys.get(key) !== true && this.previousKeys.get(key) === true;
    }

    /**
     * Check if a mouse button is down
     * @param {number} button - The button to check
     * @returns {boolean} Whether the button is down
     */
    isMouseButtonDown(button) {
        return this.mouse.buttons.get(button) === true;
    }

    /**
     * Check if a mouse button was just pressed
     * @param {number} button - The button to check
     * @returns {boolean} Whether the button was just pressed
     */
    isMouseButtonPressed(button) {
        return this.mouse.buttons.get(button) === true && this.mouse.previousButtons.get(button) !== true;
    }

    /**
     * Check if a mouse button was just released
     * @param {number} button - The button to check
     * @returns {boolean} Whether the button was just released
     */
    isMouseButtonReleased(button) {
        return this.mouse.buttons.get(button) !== true && this.mouse.previousButtons.get(button) === true;
    }

    /**
     * Check if touch is active
     * @returns {boolean} Whether touch is active
     */
    isTouchActive() {
        return this.touch.active;
    }

    /**
     * Get the position of the first touch
     * @returns {Object|null} The position of the first touch, or null if no touches are active
     */
    getFirstTouchPosition() {
        if (this.touch.touches.size === 0) {
            return null;
        }
        
        const firstTouchId = Array.from(this.touch.touches.keys())[0];
        return this.touch.touches.get(firstTouchId);
    }

    /**
     * Check if a gamepad button is down
     * @param {number} gamepadIndex - The gamepad index
     * @param {number} button - The button to check
     * @returns {boolean} Whether the button is down
     */
    isGamepadButtonDown(gamepadIndex, button) {
        const gamepad = this.gamepads.get(gamepadIndex);
        return gamepad && gamepad.buttons[button] === true;
    }

    /**
     * Check if a gamepad button was just pressed
     * @param {number} gamepadIndex - The gamepad index
     * @param {number} button - The button to check
     * @returns {boolean} Whether the button was just pressed
     */
    isGamepadButtonPressed(gamepadIndex, button) {
        const gamepad = this.gamepads.get(gamepadIndex);
        const prevGamepad = this.previousGamepads.get(gamepadIndex);
        
        return gamepad && prevGamepad && 
            gamepad.buttons[button] === true && 
            prevGamepad.buttons[button] !== true;
    }

    /**
     * Check if a gamepad button was just released
     * @param {number} gamepadIndex - The gamepad index
     * @param {number} button - The button to check
     * @returns {boolean} Whether the button was just released
     */
    isGamepadButtonReleased(gamepadIndex, button) {
        const gamepad = this.gamepads.get(gamepadIndex);
        const prevGamepad = this.previousGamepads.get(gamepadIndex);
        
        return gamepad && prevGamepad && 
            gamepad.buttons[button] !== true && 
            prevGamepad.buttons[button] === true;
    }

    /**
     * Get a gamepad axis value
     * @param {number} gamepadIndex - The gamepad index
     * @param {number} axis - The axis to get
     * @returns {number} The axis value (-1 to 1)
     */
    getGamepadAxis(gamepadIndex, axis) {
        const gamepad = this.gamepads.get(gamepadIndex);
        
        if (!gamepad || !gamepad.axes[axis]) {
            return 0;
        }
        
        const value = gamepad.axes[axis];
        
        // Apply deadzone
        const deadzone = 0.1;
        if (Math.abs(value) < deadzone) {
            return 0;
        }
        
        // Normalize value to remove deadzone
        const sign = value > 0 ? 1 : -1;
        return sign * (Math.abs(value) - deadzone) / (1 - deadzone);
    }

    /**
     * Check if an action is active
     * @param {string} actionName - The name of the action
     * @returns {boolean} Whether the action is active
     */
    isActionActive(actionName) {
        const actionConfig = this.actionMap.get(actionName);
        
        if (!actionConfig) {
            return false;
        }
        
        // Check keys
        if (actionConfig.keys) {
            for (const key of actionConfig.keys) {
                if (this.isKeyDown(key)) {
                    return true;
                }
            }
        }
        
        // Check mouse buttons
        if (actionConfig.mouseButtons) {
            for (const button of actionConfig.mouseButtons) {
                if (this.isMouseButtonDown(button)) {
                    return true;
                }
            }
        }
        
        // Check gamepad buttons
        if (actionConfig.gamepadButtons) {
            for (const [gamepadIndex, button] of actionConfig.gamepadButtons) {
                if (this.isGamepadButtonDown(gamepadIndex, button)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Check if an action was just triggered
     * @param {string} actionName - The name of the action
     * @returns {boolean} Whether the action was just triggered
     */
    isActionTriggered(actionName) {
        const actionConfig = this.actionMap.get(actionName);
        
        if (!actionConfig) {
            return false;
        }
        
        // Check keys
        if (actionConfig.keys) {
            for (const key of actionConfig.keys) {
                if (this.isKeyPressed(key)) {
                    return true;
                }
            }
        }
        
        // Check mouse buttons
        if (actionConfig.mouseButtons) {
            for (const button of actionConfig.mouseButtons) {
                if (this.isMouseButtonPressed(button)) {
                    return true;
                }
            }
        }
        
        // Check gamepad buttons
        if (actionConfig.gamepadButtons) {
            for (const [gamepadIndex, button] of actionConfig.gamepadButtons) {
                if (this.isGamepadButtonPressed(gamepadIndex, button)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Check if an action was just released
     * @param {string} actionName - The name of the action
     * @returns {boolean} Whether the action was just released
     */
    isActionReleased(actionName) {
        const actionConfig = this.actionMap.get(actionName);
        
        if (!actionConfig) {
            return false;
        }
        
        // Check keys
        if (actionConfig.keys) {
            for (const key of actionConfig.keys) {
                if (this.isKeyReleased(key)) {
                    return true;
                }
            }
        }
        
        // Check mouse buttons
        if (actionConfig.mouseButtons) {
            for (const button of actionConfig.mouseButtons) {
                if (this.isMouseButtonReleased(button)) {
                    return true;
                }
            }
        }
        
        // Check gamepad buttons
        if (actionConfig.gamepadButtons) {
            for (const [gamepadIndex, button] of actionConfig.gamepadButtons) {
                if (this.isGamepadButtonReleased(gamepadIndex, button)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Get axis value
     * @param {string} axisName - The name of the axis
     * @returns {number} The axis value (-1 to 1)
     */
    getAxisValue(axisName) {
        const axisConfig = this.axisMap.get(axisName);
        
        if (!axisConfig) {
            return 0;
        }
        
        let value = 0;
        
        // Check keys
        if (axisConfig.keys) {
            if (this.isKeyDown(axisConfig.keys.positive)) {
                value += 1;
            }
            
            if (this.isKeyDown(axisConfig.keys.negative)) {
                value -= 1;
            }
        }
        
        // Check mouse movement
        if (axisConfig.mouseMovement) {
            if (axisConfig.mouseMovement === 'x') {
                value = this.mouse.deltaX / 10; // Scale factor can be adjusted
                value = Math.max(-1, Math.min(1, value)); // Clamp to -1 to 1
            } else if (axisConfig.mouseMovement === 'y') {
                value = this.mouse.deltaY / 10; // Scale factor can be adjusted
                value = Math.max(-1, Math.min(1, value)); // Clamp to -1 to 1
            }
        }
        
        // Check gamepad axis
        if (axisConfig.gamepadAxis) {
            const [gamepadIndex, axis] = axisConfig.gamepadAxis;
            const axisValue = this.getGamepadAxis(gamepadIndex, axis);
            
            // Use the greater of the two values (keyboard/mouse or gamepad)
            if (Math.abs(axisValue) > Math.abs(value)) {
                value = axisValue;
            }
        }
        
        return value;
    }

    /**
     * Setup default control mappings
     */
    setupDefaultControls() {
        // Common actions
        this.mapAction('jump', { 
            keys: ['Space', 'KeyW', 'ArrowUp'],
            mouseButtons: [0],
            gamepadButtons: [[0, 0]] // A button on gamepad 0
        });
        
        this.mapAction('interact', { 
            keys: ['KeyE', 'Enter'],
            mouseButtons: [2],
            gamepadButtons: [[0, 2]] // X button on gamepad 0
        });
        
        this.mapAction('pause', { 
            keys: ['Escape', 'KeyP'],
            gamepadButtons: [[0, 9]] // Start button on gamepad 0
        });
        
        // Movement axes
        this.mapAxis('horizontal', {
            keys: {
                positive: 'KeyD',
                negative: 'KeyA'
            },
            gamepadAxis: [0, 0] // Left stick X on gamepad 0
        });
        
        this.mapAxis('vertical', {
            keys: {
                positive: 'KeyS',
                negative: 'KeyW'
            },
            gamepadAxis: [0, 1] // Left stick Y on gamepad 0
        });
        
        // Camera axes
        this.mapAxis('lookHorizontal', {
            keys: {
                positive: 'ArrowRight',
                negative: 'ArrowLeft'
            },
            mouseMovement: 'x',
            gamepadAxis: [0, 2] // Right stick X on gamepad 0
        });
        
        this.mapAxis('lookVertical', {
            keys: {
                positive: 'ArrowDown',
                negative: 'ArrowUp'
            },
            mouseMovement: 'y',
            gamepadAxis: [0, 3] // Right stick Y on gamepad 0
        });
    }

    /**
     * Update the input system
     * @param {number} deltaTime - The time in seconds since the last update
     */
    update(deltaTime) {
        // Save current state as previous state
        this.previousKeys = new Map(this.keys);
        this.mouse.previousButtons = new Map(this.mouse.buttons);
        this.touch.previousTouches = new Map(this.touch.touches);
        
        // Reset mouse delta
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        this.mouse.wheel = 0;
        
        // Update playback if playing back
        if (this.isPlayingBack) {
            this.updatePlayback(deltaTime);
        }
    }

    /**
     * Dispose of the input system
     */
    dispose() {
        // Remove event listeners
        this.removeEventListeners();
        
        // Stop gamepad polling
        this.stopGamepadPolling();
        
        // Exit pointer lock
        this.exitPointerLock();
        
        super.dispose();
    }
} 