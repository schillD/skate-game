import { Entity } from './Entity.js';

/**
 * Scene class to manage a collection of entities and systems
 */
export class Scene {
    /**
     * @param {string} name - The name of the scene
     */
    constructor(name = 'Scene') {
        this.name = name;
        this.entities = new Map(); // Map of entity ID to entity
        this.systems = new Map(); // Map of system name to system
        this.threeScene = null; // Reference to THREE.Scene
    }

    /**
     * Initialize the scene with a THREE.Scene
     * @param {THREE.Scene} threeScene - The THREE.Scene to use
     */
    init(threeScene) {
        this.threeScene = threeScene;
    }

    /**
     * Add an entity to the scene
     * @param {Entity} entity - The entity to add
     * @returns {Entity} The added entity
     */
    addEntity(entity) {
        if (!(entity instanceof Entity)) {
            throw new Error('Entity must be an instance of Entity');
        }

        this.entities.set(entity.id, entity);
        entity.setScene(this);
        return entity;
    }

    /**
     * Create a new entity and add it to the scene
     * @param {string} name - The name of the entity
     * @returns {Entity} The created entity
     */
    createEntity(name = 'Entity') {
        const entity = new Entity(name);
        return this.addEntity(entity);
    }

    /**
     * Get an entity by ID
     * @param {number} id - The entity ID
     * @returns {Entity|undefined} The entity, or undefined if not found
     */
    getEntity(id) {
        return this.entities.get(id);
    }

    /**
     * Find entities by tag
     * @param {string} tag - The tag to search for
     * @returns {Entity[]} Array of entities with the given tag
     */
    findEntitiesByTag(tag) {
        const result = [];
        
        for (const entity of this.entities.values()) {
            if (entity.hasTag(tag)) {
                result.push(entity);
            }
        }
        
        return result;
    }

    /**
     * Find entities by name
     * @param {string} name - The name to search for
     * @returns {Entity[]} Array of entities with the given name
     */
    findEntitiesByName(name) {
        const result = [];
        
        for (const entity of this.entities.values()) {
            if (entity.name === name) {
                result.push(entity);
            }
        }
        
        return result;
    }

    /**
     * Remove an entity from the scene
     * @param {Entity} entity - The entity to remove
     * @returns {boolean} True if the entity was removed, false otherwise
     */
    removeEntity(entity) {
        return this.entities.delete(entity.id);
    }

    /**
     * Add a system to the scene
     * @param {System} system - The system to add
     * @param {string} name - The name to use for the system
     * @returns {System} The added system
     */
    addSystem(system, name = system.constructor.name) {
        if (this.systems.has(name)) {
            console.warn(`A system with name ${name} already exists in scene ${this.name}`);
        }

        this.systems.set(name, system);
        
        // Initialize the system if it has an init method
        if (typeof system.init === 'function') {
            system.init(this);
        }
        
        return system;
    }

    /**
     * Get a system by name
     * @param {string} name - The system name
     * @returns {System|undefined} The system, or undefined if not found
     */
    getSystem(name) {
        return this.systems.get(name);
    }

    /**
     * Remove a system from the scene
     * @param {string} name - The system name
     * @returns {boolean} True if the system was removed, false otherwise
     */
    removeSystem(name) {
        const system = this.systems.get(name);
        
        if (system && typeof system.dispose === 'function') {
            system.dispose();
        }
        
        return this.systems.delete(name);
    }

    /**
     * Update all entities and systems in the scene
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Update all systems first
        for (const system of this.systems.values()) {
            if (typeof system.update === 'function') {
                system.update(deltaTime);
            }
        }

        // Update all entities
        for (const entity of this.entities.values()) {
            entity.update(deltaTime);
        }
    }

    /**
     * Clear all entities and systems from the scene
     */
    clear() {
        // Destroy all entities
        for (const entity of this.entities.values()) {
            entity.destroy();
        }
        this.entities.clear();

        // Dispose of all systems
        for (const [name, system] of this.systems.entries()) {
            if (typeof system.dispose === 'function') {
                system.dispose();
            }
        }
        this.systems.clear();
    }

    /**
     * Dispose of all resources when the scene is destroyed
     */
    dispose() {
        this.clear();
        this.threeScene = null;
    }
} 