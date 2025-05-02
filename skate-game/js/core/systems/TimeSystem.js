import { System } from '../System.js';

/**
 * Time System for managing game time and timing-related functionality
 */
export class TimeSystem extends System {
    constructor() {
        super('TimeSystem');
        
        // Time tracking
        this.startTime = 0;
        this.previousTime = 0;
        this.currentTime = 0;
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.timeScale = 1.0;
        this.isPaused = false;
        
        // FPS tracking
        this.frameCount = 0;
        this.fpsUpdateInterval = 1.0; // Update FPS every second
        this.fpsUpdateAccumulator = 0;
        this.fps = 0;
        
        // Time step configuration
        this.fixedTimeStep = 1 / 60; // 60 updates per second
        this.maxTimeStep = 0.1; // Cap delta time to avoid spiral of death
        this.timeStepAccumulator = 0;
        
        // Timers
        this.timers = new Map();
        this.timerIdCounter = 0;
        
        // Animation frames
        this.animationFrames = new Map();
        this.animationFrameIdCounter = 0;
        
        // Performance monitoring
        this.performanceMetrics = {
            frameTime: [],
            updateTime: [],
            renderTime: [],
            maxSamples: 100
        };
    }

    /**
     * Initialize the time system
     * @param {Scene} scene - The scene this system belongs to
     */
    init(scene) {
        super.init(scene);
        
        // Initialize time
        this.startTime = performance.now() / 1000;
        this.previousTime = this.startTime;
        this.currentTime = this.startTime;
    }

    /**
     * Begin a new frame
     * @returns {number} The delta time for this frame
     */
    beginFrame() {
        // Get current time
        this.currentTime = performance.now() / 1000;
        
        // Calculate delta time
        this.deltaTime = this.currentTime - this.previousTime;
        
        // Apply time scale
        this.deltaTime *= this.timeScale;
        
        // Cap delta time to avoid spiral of death
        if (this.deltaTime > this.maxTimeStep) {
            this.deltaTime = this.maxTimeStep;
        }
        
        // Update elapsed time
        if (!this.isPaused) {
            this.elapsedTime += this.deltaTime;
        }
        
        // Update FPS
        this.updateFPS();
        
        // Update fixed time step accumulator
        this.timeStepAccumulator += this.deltaTime;
        
        // Store current time for next frame
        this.previousTime = this.currentTime;
        
        // Record frame time for performance metrics
        this.recordFrameTime();
        
        // Update timers
        this.updateTimers();
        
        // Return delta time for this frame
        return this.isPaused ? 0 : this.deltaTime;
    }

    /**
     * Record frame time for performance metrics
     */
    recordFrameTime() {
        const frameTime = this.deltaTime * 1000; // Convert to milliseconds
        
        // Add to performance metrics
        this.performanceMetrics.frameTime.push(frameTime);
        
        // Cap the number of samples
        if (this.performanceMetrics.frameTime.length > this.performanceMetrics.maxSamples) {
            this.performanceMetrics.frameTime.shift();
        }
    }

    /**
     * Record update time for performance metrics
     * @param {number} updateTime - The time taken for update in milliseconds
     */
    recordUpdateTime(updateTime) {
        // Add to performance metrics
        this.performanceMetrics.updateTime.push(updateTime);
        
        // Cap the number of samples
        if (this.performanceMetrics.updateTime.length > this.performanceMetrics.maxSamples) {
            this.performanceMetrics.updateTime.shift();
        }
    }

    /**
     * Record render time for performance metrics
     * @param {number} renderTime - The time taken for rendering in milliseconds
     */
    recordRenderTime(renderTime) {
        // Add to performance metrics
        this.performanceMetrics.renderTime.push(renderTime);
        
        // Cap the number of samples
        if (this.performanceMetrics.renderTime.length > this.performanceMetrics.maxSamples) {
            this.performanceMetrics.renderTime.shift();
        }
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        const calculateAverage = (array) => {
            if (array.length === 0) return 0;
            const sum = array.reduce((total, value) => total + value, 0);
            return sum / array.length;
        };
        
        const calculateMax = (array) => {
            if (array.length === 0) return 0;
            return Math.max(...array);
        };
        
        return {
            fps: this.fps,
            frameTimeAvg: calculateAverage(this.performanceMetrics.frameTime),
            frameTimeMax: calculateMax(this.performanceMetrics.frameTime),
            updateTimeAvg: calculateAverage(this.performanceMetrics.updateTime),
            updateTimeMax: calculateMax(this.performanceMetrics.updateTime),
            renderTimeAvg: calculateAverage(this.performanceMetrics.renderTime),
            renderTimeMax: calculateMax(this.performanceMetrics.renderTime)
        };
    }

    /**
     * Update FPS counter
     */
    updateFPS() {
        // Increment frame count
        this.frameCount++;
        
        // Update FPS accumulator
        this.fpsUpdateAccumulator += this.deltaTime;
        
        // Update FPS if interval has elapsed
        if (this.fpsUpdateAccumulator >= this.fpsUpdateInterval) {
            this.fps = this.frameCount / this.fpsUpdateAccumulator;
            this.frameCount = 0;
            this.fpsUpdateAccumulator = 0;
        }
    }

    /**
     * Check if fixed time step is ready for an update
     * @returns {boolean} Whether a fixed update should occur
     */
    shouldFixedUpdate() {
        return this.timeStepAccumulator >= this.fixedTimeStep;
    }

    /**
     * Consume fixed time step
     */
    consumeFixedTimeStep() {
        this.timeStepAccumulator -= this.fixedTimeStep;
    }

    /**
     * Get the fixed time step value
     * @returns {number} The fixed time step
     */
    getFixedTimeStep() {
        return this.fixedTimeStep;
    }

    /**
     * Set the time scale
     * @param {number} scale - The new time scale
     */
    setTimeScale(scale) {
        this.timeScale = Math.max(0, scale);
    }

    /**
     * Get the current time scale
     * @returns {number} The current time scale
     */
    getTimeScale() {
        return this.timeScale;
    }

    /**
     * Pause the game time
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Resume the game time
     */
    resume() {
        this.isPaused = false;
    }

    /**
     * Toggle the pause state
     * @returns {boolean} The new pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    /**
     * Check if the game time is paused
     * @returns {boolean} Whether the game time is paused
     */
    isPaused() {
        return this.isPaused;
    }

    /**
     * Get the current time
     * @returns {number} The current time in seconds
     */
    getTime() {
        return this.currentTime - this.startTime;
    }

    /**
     * Get the elapsed time (affected by pausing and time scale)
     * @returns {number} The elapsed time in seconds
     */
    getElapsedTime() {
        return this.elapsedTime;
    }

    /**
     * Get the delta time for this frame
     * @returns {number} The delta time in seconds
     */
    getDeltaTime() {
        return this.isPaused ? 0 : this.deltaTime;
    }

    /**
     * Get the FPS
     * @returns {number} The current FPS
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Create a timer
     * @param {Object} options - Timer options
     * @param {number} options.duration - The duration of the timer in seconds
     * @param {Function} options.onComplete - The callback to call when the timer completes
     * @param {Function} options.onUpdate - The callback to call when the timer updates
     * @param {boolean} options.loop - Whether the timer should loop
     * @param {boolean} options.autoStart - Whether the timer should start automatically
     * @returns {number} The timer ID
     */
    createTimer(options) {
        const id = this.timerIdCounter++;
        
        const timer = {
            id,
            duration: options.duration || 1,
            elapsed: 0,
            onComplete: options.onComplete || null,
            onUpdate: options.onUpdate || null,
            isPaused: options.autoStart === false,
            isComplete: false,
            loop: options.loop || false
        };
        
        this.timers.set(id, timer);
        
        return id;
    }

    /**
     * Start a timer
     * @param {number} id - The timer ID
     */
    startTimer(id) {
        const timer = this.timers.get(id);
        
        if (timer) {
            timer.isPaused = false;
            timer.isComplete = false;
        }
    }

    /**
     * Pause a timer
     * @param {number} id - The timer ID
     */
    pauseTimer(id) {
        const timer = this.timers.get(id);
        
        if (timer) {
            timer.isPaused = true;
        }
    }

    /**
     * Reset a timer
     * @param {number} id - The timer ID
     */
    resetTimer(id) {
        const timer = this.timers.get(id);
        
        if (timer) {
            timer.elapsed = 0;
            timer.isComplete = false;
        }
    }

    /**
     * Remove a timer
     * @param {number} id - The timer ID
     */
    removeTimer(id) {
        this.timers.delete(id);
    }

    /**
     * Check if a timer is active
     * @param {number} id - The timer ID
     * @returns {boolean} Whether the timer is active
     */
    isTimerActive(id) {
        const timer = this.timers.get(id);
        return timer && !timer.isPaused && !timer.isComplete;
    }

    /**
     * Get timer progress
     * @param {number} id - The timer ID
     * @returns {number} The timer progress (0-1)
     */
    getTimerProgress(id) {
        const timer = this.timers.get(id);
        
        if (!timer) {
            return 0;
        }
        
        return Math.min(timer.elapsed / timer.duration, 1);
    }

    /**
     * Update timers
     */
    updateTimers() {
        if (this.isPaused) {
            return;
        }
        
        this.timers.forEach(timer => {
            if (timer.isPaused || timer.isComplete) {
                return;
            }
            
            // Update elapsed time
            timer.elapsed += this.deltaTime;
            
            // Call update callback
            if (timer.onUpdate) {
                const progress = Math.min(timer.elapsed / timer.duration, 1);
                timer.onUpdate(progress, timer.elapsed, timer.id);
            }
            
            // Check if timer is complete
            if (timer.elapsed >= timer.duration) {
                if (timer.loop) {
                    // Reset elapsed time for looping timers
                    timer.elapsed %= timer.duration;
                    
                    // Call complete callback
                    if (timer.onComplete) {
                        timer.onComplete(timer.id);
                    }
                } else {
                    // Mark timer as complete
                    timer.isComplete = true;
                    
                    // Call complete callback
                    if (timer.onComplete) {
                        timer.onComplete(timer.id);
                    }
                }
            }
        });
    }

    /**
     * Add a delayed call
     * @param {Function} callback - The function to call
     * @param {number} delay - The delay in seconds
     * @param {boolean} repeat - Whether to repeat the call
     * @returns {number} The timer ID
     */
    delay(callback, delay, repeat = false) {
        return this.createTimer({
            duration: delay,
            onComplete: callback,
            loop: repeat,
            autoStart: true
        });
    }

    /**
     * Add a repeating call
     * @param {Function} callback - The function to call
     * @param {number} interval - The interval in seconds
     * @returns {number} The timer ID
     */
    repeat(callback, interval) {
        return this.delay(callback, interval, true);
    }

    /**
     * Add an animation frame update
     * @param {Function} callback - The callback function
     * @returns {number} The animation frame ID
     */
    addAnimationFrame(callback) {
        const id = this.animationFrameIdCounter++;
        
        this.animationFrames.set(id, {
            callback,
            isActive: true
        });
        
        return id;
    }

    /**
     * Remove an animation frame update
     * @param {number} id - The animation frame ID
     */
    removeAnimationFrame(id) {
        this.animationFrames.delete(id);
    }

    /**
     * Update animation frames
     */
    updateAnimationFrames() {
        if (this.isPaused) {
            return;
        }
        
        this.animationFrames.forEach((frame, id) => {
            if (frame.isActive) {
                frame.callback(this.deltaTime, this.elapsedTime, id);
            }
        });
    }

    /**
     * Update the time system
     * @param {number} deltaTime - The time in seconds since the last update
     */
    update(deltaTime) {
        // Update animation frames
        this.updateAnimationFrames();
    }

    /**
     * Format time as a string (MM:SS.MS)
     * @param {number} timeInSeconds - The time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const milliseconds = Math.floor((timeInSeconds % 1) * 100);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }

    /**
     * Dispose of the time system
     */
    dispose() {
        // Clear timers
        this.timers.clear();
        
        // Clear animation frames
        this.animationFrames.clear();
        
        super.dispose();
    }
} 