/**
 * Base Component class for the Entity-Component System
 * All game components should extend this class
 */
export class Component {
    constructor() {
        this.entity = null;
        this.enabled = true;
    }

    /**
     * Called when the component is attached to an entity
     * @param {Entity} entity - The entity this component is attached to
     */
    onAttach(entity) {
        this.entity = entity;
    }

    /**
     * Called when the component is detached from an entity
     */
    onDetach() {
        this.entity = null;
    }

    /**
     * Update method called every frame
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Override in derived classes
    }

    /**
     * Initialize the component
     */
    init() {
        // Override in derived classes
    }

    /**
     * Enable the component
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable the component
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Clean up resources when component is destroyed
     */
    dispose() {
        // Override in derived classes to clean up resources
    }
} 