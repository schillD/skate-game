import { Component } from './Component.js';

/**
 * Entity class for the Entity-Component System
 * Represents a game object that can have multiple components attached
 */
export class Entity {
    /**
     * @param {string} name - The name of the entity
     */
    constructor(name = 'Entity') {
        this.name = name;
        this.components = new Map();
        this.children = [];
        this.parent = null;
        this.active = true;
        this.scene = null;
        this.id = Entity.nextId++;
        this.tags = new Set();
    }

    /**
     * Add a component to this entity
     * @param {Component} component - The component to add
     * @returns {Component} The added component
     */
    addComponent(component) {
        if (!(component instanceof Component)) {
            throw new Error('Component must extend the Component class');
        }

        const componentType = component.constructor;
        
        // Don't allow duplicate component types
        if (this.components.has(componentType.name)) {
            console.warn(`Entity ${this.name} already has a component of type ${componentType.name}`);
            return this.components.get(componentType.name);
        }

        this.components.set(componentType.name, component);
        component.onAttach(this);

        // Initialize the component if the entity is already in a scene
        if (this.scene) {
            component.init();
        }

        return component;
    }

    /**
     * Get a component by type
     * @param {string} componentType - The component type to get
     * @returns {Component|null} The component, or null if not found
     */
    getComponent(componentType) {
        return this.components.get(componentType);
    }

    /**
     * Remove a component by type
     * @param {string} componentType - The component type to remove
     * @returns {boolean} True if the component was removed, false otherwise
     */
    removeComponent(componentType) {
        const component = this.components.get(componentType);
        
        if (component) {
            component.onDetach();
            this.components.delete(componentType);
            return true;
        }
        
        return false;
    }

    /**
     * Check if this entity has a component of the given type
     * @param {string} componentType - The component type to check for
     * @returns {boolean} True if the entity has the component, false otherwise
     */
    hasComponent(componentType) {
        return this.components.has(componentType);
    }

    /**
     * Add a child entity to this entity
     * @param {Entity} child - The child entity to add
     */
    addChild(child) {
        if (child.parent) {
            child.parent.removeChild(child);
        }

        this.children.push(child);
        child.parent = this;
        
        // Set the child's scene to match the parent's
        if (this.scene) {
            child.setScene(this.scene);
        }
    }

    /**
     * Remove a child entity from this entity
     * @param {Entity} child - The child entity to remove
     * @returns {boolean} True if the child was removed, false otherwise
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            return true;
        }
        
        return false;
    }

    /**
     * Set the scene this entity belongs to
     * @param {Scene} scene - The scene
     */
    setScene(scene) {
        this.scene = scene;
        
        // Initialize all components
        for (const component of this.components.values()) {
            component.init();
        }
        
        // Set the scene for all children
        for (const child of this.children) {
            child.setScene(scene);
        }
    }

    /**
     * Add a tag to this entity
     * @param {string} tag - The tag to add
     */
    addTag(tag) {
        this.tags.add(tag);
    }

    /**
     * Check if this entity has the given tag
     * @param {string} tag - The tag to check for
     * @returns {boolean} True if the entity has the tag, false otherwise
     */
    hasTag(tag) {
        return this.tags.has(tag);
    }

    /**
     * Remove a tag from this entity
     * @param {string} tag - The tag to remove
     */
    removeTag(tag) {
        this.tags.delete(tag);
    }

    /**
     * Update this entity and all its components
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.active) return;

        // Update all components
        for (const component of this.components.values()) {
            if (component.enabled) {
                component.update(deltaTime);
            }
        }

        // Update all children
        for (const child of this.children) {
            child.update(deltaTime);
        }
    }

    /**
     * Enable this entity
     */
    enable() {
        this.active = true;
    }

    /**
     * Disable this entity
     */
    disable() {
        this.active = false;
    }

    /**
     * Destroy this entity, removing it from its parent and cleaning up all components
     */
    destroy() {
        // Remove from parent
        if (this.parent) {
            this.parent.removeChild(this);
        }

        // Destroy all components
        for (const component of this.components.values()) {
            component.dispose();
        }
        this.components.clear();

        // Destroy all children
        for (const child of [...this.children]) {
            child.destroy();
        }
        this.children = [];

        // Remove from scene
        if (this.scene) {
            this.scene.removeEntity(this);
        }
    }
}

// Static counter for unique entity IDs
Entity.nextId = 0; 