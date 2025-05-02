import * as THREE from 'three';
import { Component } from '../Component.js';

/**
 * Physics component for handling entity physics
 */
export class Physics extends Component {
    constructor() {
        super();
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.angularVelocity = new THREE.Vector3();
        this.forces = new THREE.Vector3();
        this.mass = 1;
        this.useGravity = true;
        this.gravity = new THREE.Vector3(0, -9.8, 0);
        this.friction = 0.9;
        this.restitution = 0.3; // Bounciness
        this.isKinematic = false; // If true, not affected by forces
        this.isGrounded = false;
        this.collisionShape = 'box'; // 'box', 'sphere', 'capsule'
        this.boundingBox = new THREE.Box3();
        this.boundingSphere = new THREE.Sphere();
        this.collisionRadius = 1.0;
        this.collisionHeight = 2.0;
        this.collisionWidth = 1.0;
        this.collisionLayer = 1;
        this.collisionMask = 0xffffffff; // Collide with everything by default
        this.previousPosition = new THREE.Vector3();
        this.transform = null;
    }

    /**
     * Initialize the physics component
     */
    init() {
        this.transform = this.entity.getComponent('Transform');
        if (!this.transform) {
            console.warn('Physics component requires a Transform component');
        } else {
            this.updateCollisionBounds();
        }
    }

    /**
     * Update collision bounds based on transform
     */
    updateCollisionBounds() {
        if (!this.transform) return;

        const position = this.transform.position;
        
        // Update bounding sphere
        this.boundingSphere.center.copy(position);
        this.boundingSphere.radius = this.collisionRadius;
        
        // Update bounding box
        this.boundingBox.min.set(
            position.x - this.collisionWidth / 2,
            position.y - this.collisionHeight / 2,
            position.z - this.collisionWidth / 2
        );
        this.boundingBox.max.set(
            position.x + this.collisionWidth / 2,
            position.y + this.collisionHeight / 2,
            position.z + this.collisionWidth / 2
        );
    }

    /**
     * Apply a force to this physics body
     * @param {THREE.Vector3} force - The force to apply
     * @param {boolean} isImpulse - If true, applies as impulse (immediate)
     */
    applyForce(force, isImpulse = false) {
        if (this.isKinematic) return;
        
        if (isImpulse) {
            this.velocity.addScaledVector(force, 1 / this.mass);
        } else {
            this.forces.add(force);
        }
    }

    /**
     * Apply gravity force
     * @param {number} deltaTime - Time since last frame in seconds
     */
    applyGravity(deltaTime) {
        if (this.isKinematic || !this.useGravity || this.isGrounded) return;
        
        this.applyForce(this.gravity.clone().multiplyScalar(this.mass * deltaTime));
    }

    /**
     * Apply friction to velocity
     * @param {number} deltaTime - Time since last frame in seconds
     */
    applyFriction(deltaTime) {
        if (this.isKinematic) return;
        
        if (this.isGrounded) {
            // Apply stronger friction when grounded
            this.velocity.x *= Math.pow(this.friction, deltaTime * 60);
            this.velocity.z *= Math.pow(this.friction, deltaTime * 60);
        } else {
            // Apply air resistance
            this.velocity.x *= Math.pow(0.98, deltaTime * 60);
            this.velocity.z *= Math.pow(0.98, deltaTime * 60);
        }
        
        // Apply angular friction
        this.angularVelocity.multiplyScalar(Math.pow(0.95, deltaTime * 60));
        
        // Stop very small velocities
        if (this.velocity.lengthSq() < 0.0001) {
            this.velocity.set(0, 0, 0);
        }
        if (this.angularVelocity.lengthSq() < 0.0001) {
            this.angularVelocity.set(0, 0, 0);
        }
    }

    /**
     * Handle a collision with another physics component
     * @param {Physics} other - The other physics component
     * @param {THREE.Vector3} normal - The collision normal
     * @param {number} penetration - The penetration depth
     */
    handleCollision(other, normal, penetration) {
        if (this.isKinematic) return;
        
        // Move out of penetration
        if (this.transform && penetration > 0 && !other.isKinematic) {
            const pushFactor = penetration * 0.5;
            const moveVec = normal.clone().multiplyScalar(pushFactor);
            this.transform.position.add(moveVec);
            
            if (other.transform) {
                other.transform.position.sub(moveVec);
            }
        }
        
        // Reflect velocity
        if (!this.isGrounded) {
            const relativeVelocity = this.velocity.clone();
            if (other.velocity) {
                relativeVelocity.sub(other.velocity);
            }
            
            const normalVelocity = relativeVelocity.dot(normal);
            if (normalVelocity < 0) {
                const restitution = Math.min(this.restitution, other.restitution || this.restitution);
                const j = -(1 + restitution) * normalVelocity;
                const impulse = normal.clone().multiplyScalar(j);
                
                this.velocity.addScaledVector(impulse, 1 / this.mass);
                if (!other.isKinematic && other.velocity) {
                    other.velocity.addScaledVector(impulse, -1 / other.mass);
                }
            }
        }
    }

    /**
     * Test for a collision with another physics component
     * @param {Physics} other - The other physics component
     * @returns {Object|null} Collision data if there is a collision, null otherwise
     */
    testCollision(other) {
        // Check collision layers
        if ((this.collisionLayer & other.collisionMask) === 0 ||
            (other.collisionLayer & this.collisionMask) === 0) {
            return null;
        }
        
        // Use different collision tests based on shapes
        if (this.collisionShape === 'sphere' && other.collisionShape === 'sphere') {
            return this.testSphereSphereCollision(other);
        } else if (this.collisionShape === 'box' && other.collisionShape === 'box') {
            return this.testBoxBoxCollision(other);
        } else {
            // Fallback to sphere-sphere with average radius for mixed shapes
            const thisRadius = this.collisionRadius;
            const otherRadius = other.collisionRadius;
            const distance = this.transform.position.distanceTo(other.transform.position);
            const minDistance = thisRadius + otherRadius;
            
            if (distance < minDistance) {
                const normal = new THREE.Vector3()
                    .subVectors(this.transform.position, other.transform.position)
                    .normalize();
                    
                return {
                    normal: normal,
                    penetration: minDistance - distance
                };
            }
        }
        
        return null;
    }

    /**
     * Test for a sphere-sphere collision
     * @param {Physics} other - The other physics component
     * @returns {Object|null} Collision data if there is a collision, null otherwise
     */
    testSphereSphereCollision(other) {
        const distance = this.transform.position.distanceTo(other.transform.position);
        const minDistance = this.boundingSphere.radius + other.boundingSphere.radius;
        
        if (distance < minDistance) {
            const normal = new THREE.Vector3()
                .subVectors(this.transform.position, other.transform.position)
                .normalize();
                
            return {
                normal: normal,
                penetration: minDistance - distance
            };
        }
        
        return null;
    }

    /**
     * Test for a box-box collision
     * @param {Physics} other - The other physics component
     * @returns {Object|null} Collision data if there is a collision, null otherwise
     */
    testBoxBoxCollision(other) {
        if (this.boundingBox.intersectsBox(other.boundingBox)) {
            // Calculate penetration vector
            const thisCenter = new THREE.Vector3();
            const otherCenter = new THREE.Vector3();
            this.boundingBox.getCenter(thisCenter);
            other.boundingBox.getCenter(otherCenter);
            
            const thisSize = new THREE.Vector3();
            const otherSize = new THREE.Vector3();
            this.boundingBox.getSize(thisSize);
            other.boundingBox.getSize(otherSize);
            
            const toOther = new THREE.Vector3().subVectors(otherCenter, thisCenter);
            
            // Calculate penetration along each axis
            const xOverlap = (thisSize.x + otherSize.x) / 2 - Math.abs(toOther.x);
            const yOverlap = (thisSize.y + otherSize.y) / 2 - Math.abs(toOther.y);
            const zOverlap = (thisSize.z + otherSize.z) / 2 - Math.abs(toOther.z);
            
            // Find minimum penetration axis
            let normal, penetration;
            
            if (xOverlap < yOverlap && xOverlap < zOverlap) {
                normal = new THREE.Vector3(toOther.x < 0 ? -1 : 1, 0, 0);
                penetration = xOverlap;
            } else if (yOverlap < zOverlap) {
                normal = new THREE.Vector3(0, toOther.y < 0 ? -1 : 1, 0);
                penetration = yOverlap;
                
                // Check if grounded
                if (normal.y > 0.5) {
                    this.isGrounded = true;
                }
            } else {
                normal = new THREE.Vector3(0, 0, toOther.z < 0 ? -1 : 1);
                penetration = zOverlap;
            }
            
            return { normal, penetration };
        }
        
        return null;
    }

    /**
     * Update the physics component
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.transform) return;
        
        // Store previous position for collision resolution
        this.previousPosition.copy(this.transform.position);
        
        // Reset grounded state
        this.isGrounded = false;
        
        if (!this.isKinematic) {
            // Apply gravity
            this.applyGravity(deltaTime);
            
            // Calculate acceleration from forces
            this.acceleration.copy(this.forces).divideScalar(this.mass);
            
            // Update velocity
            this.velocity.addScaledVector(this.acceleration, deltaTime);
            
            // Apply friction
            this.applyFriction(deltaTime);
            
            // Update position based on velocity
            this.transform.position.addScaledVector(this.velocity, deltaTime);
            
            // Update rotation based on angular velocity
            if (this.angularVelocity.lengthSq() > 0) {
                const angle = this.angularVelocity.length() * deltaTime;
                const axis = this.angularVelocity.clone().normalize();
                
                const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
                this.transform.quaternion.premultiply(quaternion);
                this.transform.rotation.setFromQuaternion(this.transform.quaternion);
            }
            
            // Reset forces for next frame
            this.forces.set(0, 0, 0);
        }
        
        // Update collision bounds
        this.updateCollisionBounds();
    }
} 