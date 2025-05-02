/**
 * Base System class for handling game logic that operates on multiple entities
 */
export class System {
    /**
     * @param {string} name - The name of the system
     */
    constructor(name = this.constructor.name) {
        this.name = name;
        this.scene = null;
        this.enabled = true;
    }

    /**
     * Initialize the system with a scene
     * @param {Scene} scene - The scene this system belongs to
     */
    init(scene) {
        this.scene = scene;
    }

    /**
     * Update method called every frame
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Override in derived classes
    }

    /**
     * Enable the system
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable the system
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Clean up resources when system is destroyed
     */
    dispose() {
        this.scene = null;
    }
} 