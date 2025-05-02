import * as THREE from 'three';
import { System } from '../System.js';
import { Physics } from '../components/Physics.js';

/**
 * Physics system for handling physics updates and collision detection
 */
export class PhysicsSystem extends System {
    constructor() {
        super('PhysicsSystem');
        this.physicsBodies = [];
        this.staticBodies = [];
        this.dynamicBodies = [];
        this.collisionPairs = [];
        this.spatialGrid = null;
        this.gridCellSize = 10;
        this.useSpatialPartitioning = true;
        this.gravity = new THREE.Vector3(0, -9.8, 0);
        this.iterations = 3; // Solver iterations for better accuracy
    }

    /**
     * Initialize the physics system
     * @param {Scene} scene - The scene this system belongs to
     */
    init(scene) {
        super.init(scene);
        this.initSpatialGrid();
    }

    /**
     * Initialize spatial partitioning grid
     */
    initSpatialGrid() {
        if (!this.useSpatialPartitioning) return;
        
        this.spatialGrid = [];
        const gridSize = 20; // 20x20x20 grid
        
        for (let x = 0; x < gridSize; x++) {
            this.spatialGrid[x] = [];
            for (let y = 0; y < gridSize; y++) {
                this.spatialGrid[x][y] = [];
                for (let z = 0; z < gridSize; z++) {
                    this.spatialGrid[x][y][z] = [];
                }
            }
        }
    }

    /**
     * Update the physics system
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.scene) return;
        
        // Limit delta time to avoid instability with large gaps
        const dt = Math.min(deltaTime, 0.1);
        
        // Update physics components list if needed
        this.updatePhysicsBodyLists();
        
        // Update spatial grid
        if (this.useSpatialPartitioning) {
            this.updateSpatialGrid();
        }
        
        // First update all physics bodies
        for (const physics of this.physicsBodies) {
            if (physics.enabled) {
                physics.update(dt);
            }
        }
        
        // Then detect and resolve collisions
        for (let iteration = 0; iteration < this.iterations; iteration++) {
            this.detectCollisions();
            this.resolveCollisions();
        }
    }

    /**
     * Update physics body lists by finding all entities with Physics components
     */
    updatePhysicsBodyLists() {
        this.physicsBodies = [];
        this.staticBodies = [];
        this.dynamicBodies = [];
        
        // Find all entities with Physics components
        for (const entity of this.scene.entities.values()) {
            const physics = entity.getComponent('Physics');
            if (physics && physics.enabled) {
                this.physicsBodies.push(physics);
                
                if (physics.isKinematic) {
                    this.staticBodies.push(physics);
                } else {
                    this.dynamicBodies.push(physics);
                }
            }
        }
    }

    /**
     * Update spatial partitioning grid
     */
    updateSpatialGrid() {
        if (!this.useSpatialPartitioning || !this.spatialGrid) return;
        
        // Clear grid
        for (let x = 0; x < this.spatialGrid.length; x++) {
            for (let y = 0; y < this.spatialGrid[x].length; y++) {
                for (let z = 0; z < this.spatialGrid[x][y].length; z++) {
                    this.spatialGrid[x][y][z] = [];
                }
            }
        }
        
        // Insert bodies into grid
        for (const physics of this.physicsBodies) {
            if (!physics.transform) continue;
            
            const pos = physics.transform.position;
            const radius = physics.collisionRadius;
            
            // Calculate grid cells that contain this body
            const minX = Math.max(0, Math.floor((pos.x - radius + 100) / this.gridCellSize));
            const maxX = Math.min(this.spatialGrid.length - 1, Math.floor((pos.x + radius + 100) / this.gridCellSize));
            const minY = Math.max(0, Math.floor((pos.y - radius + 100) / this.gridCellSize));
            const maxY = Math.min(this.spatialGrid[0].length - 1, Math.floor((pos.y + radius + 100) / this.gridCellSize));
            const minZ = Math.max(0, Math.floor((pos.z - radius + 100) / this.gridCellSize));
            const maxZ = Math.min(this.spatialGrid[0][0].length - 1, Math.floor((pos.z + radius + 100) / this.gridCellSize));
            
            // Add body to all relevant grid cells
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        this.spatialGrid[x][y][z].push(physics);
                    }
                }
            }
        }
    }

    /**
     * Detect collisions between physics bodies
     */
    detectCollisions() {
        this.collisionPairs = [];
        
        if (this.useSpatialPartitioning && this.spatialGrid) {
            // Use spatial grid for broad phase
            this.detectCollisionsWithSpatialGrid();
        } else {
            // Fallback to simple O(n²) collision detection
            this.detectCollisionsSimple();
        }
    }

    /**
     * Detect collisions using spatial grid
     */
    detectCollisionsWithSpatialGrid() {
        // Create a set to avoid duplicate collision pairs
        const checkedPairs = new Set();
        
        // Check each grid cell
        for (let x = 0; x < this.spatialGrid.length; x++) {
            for (let y = 0; y < this.spatialGrid[x].length; y++) {
                for (let z = 0; z < this.spatialGrid[x][y].length; z++) {
                    const cell = this.spatialGrid[x][y][z];
                    
                    // Check collisions between bodies in this cell
                    for (let i = 0; i < cell.length; i++) {
                        for (let j = i + 1; j < cell.length; j++) {
                            const bodyA = cell[i];
                            const bodyB = cell[j];
                            
                            // Generate a unique ID for this pair
                            const pairId = Math.min(bodyA.entity.id, bodyB.entity.id) + '_' + 
                                           Math.max(bodyA.entity.id, bodyB.entity.id);
                            
                            // Skip if we've already checked this pair
                            if (checkedPairs.has(pairId)) continue;
                            checkedPairs.add(pairId);
                            
                            // Test for collision
                            const collision = bodyA.testCollision(bodyB);
                            if (collision) {
                                this.collisionPairs.push({
                                    bodyA: bodyA,
                                    bodyB: bodyB,
                                    normal: collision.normal,
                                    penetration: collision.penetration
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Detect collisions using simple O(n²) algorithm
     */
    detectCollisionsSimple() {
        // Dynamic vs Dynamic bodies
        for (let i = 0; i < this.dynamicBodies.length; i++) {
            for (let j = i + 1; j < this.dynamicBodies.length; j++) {
                const bodyA = this.dynamicBodies[i];
                const bodyB = this.dynamicBodies[j];
                
                const collision = bodyA.testCollision(bodyB);
                if (collision) {
                    this.collisionPairs.push({
                        bodyA: bodyA,
                        bodyB: bodyB,
                        normal: collision.normal,
                        penetration: collision.penetration
                    });
                }
            }
        }
        
        // Dynamic vs Static bodies
        for (let i = 0; i < this.dynamicBodies.length; i++) {
            for (let j = 0; j < this.staticBodies.length; j++) {
                const bodyA = this.dynamicBodies[i];
                const bodyB = this.staticBodies[j];
                
                const collision = bodyA.testCollision(bodyB);
                if (collision) {
                    this.collisionPairs.push({
                        bodyA: bodyA,
                        bodyB: bodyB,
                        normal: collision.normal,
                        penetration: collision.penetration
                    });
                }
            }
        }
    }

    /**
     * Resolve all detected collisions
     */
    resolveCollisions() {
        for (const pair of this.collisionPairs) {
            pair.bodyA.handleCollision(pair.bodyB, pair.normal, pair.penetration);
            
            // Invert normal for bodyB
            const invertedNormal = pair.normal.clone().negate();
            pair.bodyB.handleCollision(pair.bodyA, invertedNormal, pair.penetration);
        }
    }

    /**
     * Clean up resources when system is destroyed
     */
    dispose() {
        this.physicsBodies = [];
        this.staticBodies = [];
        this.dynamicBodies = [];
        this.collisionPairs = [];
        this.spatialGrid = null;
        super.dispose();
    }
} 