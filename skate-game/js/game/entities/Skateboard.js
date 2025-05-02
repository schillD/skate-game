import * as THREE from 'three';

export class Skateboard {
    constructor(scene) {
        // Create the skateboard group
        this.mesh = new THREE.Group();
        this.mesh.position.y = 0.5;
        
        // Physics properties
        this.velocity = new THREE.Vector3(); // Use this for X, Y, Z velocity
        this.isJumping = false;
        this.jumpForce = 0.25;
        this.gravity = 0.015;
        this.inAir = false;
        this.defaultHeight = 0.5;
        this.previousPosition = new THREE.Vector3();
        this.baseRotateSpeed = 0.03; // Base rotation speed
        this.friction = 0.92; // Friction factor
        
        // Speed and Sprint properties
        this.baseSpeed = 0.2;
        this.maxSprintSpeed = 0.35;
        this.currentSpeed = this.baseSpeed;
        this.sprintAcceleration = 0.005; // How quickly speed increases/decreases
        this.isSprinting = false;
        
        // Add a wasMoving flag to track when the skateboard stops
        this.wasMoving = false;
        
        // Animation properties
        this.wheelMeshes = []; // Store wheel meshes for rotation animation
        
        // Create skateboard parts
        this.createSkateboard();
        
        // Add to scene
        scene.add(this.mesh);
    }
    
    createSkateboard() {
        // Deck - oriented correctly so Z axis is along the length
        const deckGeometry = new THREE.BoxGeometry(0.8, 0.1, 2);
        
        // Create a more realistic skateboard deck with rounded edges and a grip tape texture
        const deckMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.7
        });
        
        const gripTapeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.9
        });
        
        // Create the main deck
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.castShadow = true;
        this.mesh.add(deck);
        
        // Add grip tape on top
        const gripTapeGeometry = new THREE.BoxGeometry(0.76, 0.01, 1.95);
        const gripTape = new THREE.Mesh(gripTapeGeometry, gripTapeMaterial);
        gripTape.position.y = 0.055; // Place slightly above deck
        gripTape.castShadow = true;
        deck.add(gripTape);

        // Trucks (the metal part that holds the wheels)
        const createTruck = (z) => {
            const truckGroup = new THREE.Group();
            truckGroup.position.set(0, -0.15, z);
            
            // Main truck part
            const truckGeometry = new THREE.BoxGeometry(0.7, 0.1, 0.2);
            const truckMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x888888, 
                metalness: 0.8,
                roughness: 0.2
            });
            const truck = new THREE.Mesh(truckGeometry, truckMaterial);
            truck.castShadow = true;
            truckGroup.add(truck);
            
            // Truck axle
            const axleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8);
            const axle = new THREE.Mesh(axleGeometry, truckMaterial);
            axle.rotation.z = Math.PI/2;
            axle.castShadow = true;
            truckGroup.add(axle);
            
            this.mesh.add(truckGroup);
            return truckGroup;
        };
        
        const frontTruck = createTruck(-0.7);
        const backTruck = createTruck(0.7);

        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.12, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.5
        });

        const wheelPositions = [
            [0.4, -0.2, -0.7],  // front right
            [-0.4, -0.2, -0.7], // front left
            [0.4, -0.2, 0.7],   // back right
            [-0.4, -0.2, 0.7]   // back left
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.rotation.x = Math.PI / 2;
            wheel.castShadow = true;
            this.mesh.add(wheel);
            this.wheelMeshes.push(wheel); // Store for animation
        });
    }
    
    handleInput(rotationInput, moveZ, jump, sprint, jumpPower = 1.0, deltaTime = 1/60) {
        // Calculate time scale factor based on ideal 60fps
        const timeScale = deltaTime * 60;
        
        // Store previous position for collision resolution
        this.previousPosition.copy(this.mesh.position);
        
        // --- Rotation --- 
        if (rotationInput !== 0) {
            // Scale rotation by deltaTime for consistent turning at any FPS
            this.mesh.rotation.y += rotationInput * timeScale;
        }
        
        // --- Sprinting and Speed --- 
        this.isSprinting = sprint;
        if (this.isSprinting && moveZ < 0) { // Sprinting forward
            // Frame-rate independent acceleration
            const frameAcceleration = this.sprintAcceleration * timeScale;
            // Only accelerate up to max sprint speed
            this.currentSpeed = Math.min(this.currentSpeed + frameAcceleration, this.maxSprintSpeed);
        } else {
            // If not sprinting but speed is above base, decelerate
            if (this.currentSpeed > this.baseSpeed) {
                const frameDeceleration = this.sprintAcceleration * 1.5 * timeScale;
                this.currentSpeed = Math.max(this.currentSpeed - frameDeceleration, this.baseSpeed);
            } else {
                this.currentSpeed = this.baseSpeed;
            }
        }
        
        // --- Forward/Backward Acceleration --- 
        if (moveZ !== 0) {
            const effectiveSpeed = (moveZ < 0) ? this.currentSpeed : this.baseSpeed * 0.8; // Slightly slower backwards
            const acceleration = new THREE.Vector3(0, 0, moveZ); // Use input direction
            acceleration.normalize();
            // Scale acceleration by deltaTime to ensure consistent movement speed regardless of FPS
            acceleration.multiplyScalar(effectiveSpeed * 0.1 * timeScale);
            acceleration.applyQuaternion(this.mesh.quaternion); // Rotate to skateboard orientation
            
            // Add acceleration to velocity (instead of directly setting moveX/moveZ)
            this.velocity.x += acceleration.x;
            this.velocity.z += acceleration.z;
        } else {
            // If player stopped input, gradually reset sprint speed
            if (this.currentSpeed > this.baseSpeed) {
                const frameDeceleration = this.sprintAcceleration * 2 * timeScale;
                this.currentSpeed = Math.max(this.currentSpeed - frameDeceleration, this.baseSpeed);
            }
        }
        
        // --- Jumping --- 
        if (jump && !this.isJumping && !this.inAir) {
            this.isJumping = true;
            // Apply jump force with the power multiplier (jump force is already tuned for 60fps)
            this.velocity.y = this.jumpForce * jumpPower;
            
            // Add a small forward boost when jumping while moving
            const currentXZSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
            if (currentXZSpeed > 0.01) {
                // Use time-based power for the boost
                const boostFactorBase = this.isSprinting ? 1.1 : 1.05;
                // For very low frame rates, don't over-boost
                const boostFactor = Math.pow(boostFactorBase, Math.min(timeScale, 1));
                this.velocity.x *= boostFactor;
                this.velocity.z *= boostFactor;
            }
        }
    }
    
    updatePhysics(deltaTime = 1/60) {
        // Calculate time scale factor based on ideal 60fps (16.67ms frame time)
        const timeScale = deltaTime * 60;
        
        // --- Apply Friction --- 
        // Use frame-rate independent friction
        const frameFriction = Math.pow(this.friction, timeScale);
        this.velocity.x *= frameFriction;
        this.velocity.z *= frameFriction;

        // Stop tiny movements
        if (Math.abs(this.velocity.x) < 0.001) this.velocity.x = 0;
        if (Math.abs(this.velocity.z) < 0.001) this.velocity.z = 0;
        
        // Calculate current speed
        const currentMovementSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        
        // Check if we've come to a stop after moving
        if (currentMovementSpeed < 0.01 && this.wasMoving) {
            // Reset sprint speed when stopped
            this.resetSprintSpeed();
        }
        
        // Update movement state
        this.wasMoving = currentMovementSpeed >= 0.01;
        
        // --- Apply Velocity to Position (scaled by deltaTime) --- 
        this.mesh.position.x += this.velocity.x * timeScale;
        this.mesh.position.z += this.velocity.z * timeScale;
        // Y position is handled by applyGravity
        
        // Boundary check
        const bounds = 98; // Increased bounds for the larger map (half of skateparkSize - 2)
        this.mesh.position.x = Math.max(Math.min(this.mesh.position.x, bounds), -bounds);
        this.mesh.position.z = Math.max(Math.min(this.mesh.position.z, bounds), -bounds);
        
        // Animate wheels based on movement
        this.animateWheels();
    }
    
    animateWheels() {
        // Calculate wheel rotation speed based on XZ velocity magnitude
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        const rotationAmount = speed * 0.5; // Adjust multiplier for wheel rotation speed
        
        // Rotate wheels based on movement direction
        if (speed > 0.01) {
            // Get movement direction relative to skateboard orientation
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this.mesh.quaternion);
            
            // Calculate dot product to determine if moving forward or backward
            const movementVector = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize();
            const dotProduct = forward.dot(movementVector);
            
            // Rotate wheels accordingly (positive for forward, negative for backward)
            const direction = dotProduct < 0 ? 1 : -1;
            
            // Apply rotation to each wheel
            this.wheelMeshes.forEach(wheel => {
                wheel.rotation.y += direction * rotationAmount;
            });
        }
    }
    
    applyGravity(groundHeight, deltaTime = 1/60) {
        // Calculate time scale factor based on ideal 60fps
        const timeScale = deltaTime * 60;
        
        // Apply gravity and jumping physics
        if (this.isJumping || this.inAir) {
            // Apply gravity to velocity.y (scaled by deltaTime)
            this.velocity.y -= this.gravity * timeScale;
            
            // Update position based on velocity.y (scaled by deltaTime)
            this.mesh.position.y += this.velocity.y * timeScale;
            
            // Check if we've landed
            if (this.mesh.position.y <= groundHeight) {
                // Landing
                this.mesh.position.y = groundHeight;
                this.isJumping = false;
                this.inAir = false;
                this.velocity.y = 0; // Stop vertical velocity
                
                // Add a small kickback on landing (apply to velocity)
                const currentXZSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
                if (currentXZSpeed > 0.01) {
                    // Frame-rate independent landing impact
                    const landingFriction = Math.pow(0.7, timeScale);
                    this.velocity.x *= landingFriction;
                    this.velocity.z *= landingFriction;
                    
                    // If landing with very low speed, reset sprint
                    if (currentXZSpeed < 0.05) {
                        this.resetSprintSpeed();
                    }
                } else {
                    // Reset sprint speed when landing with almost no horizontal movement
                    this.resetSprintSpeed();
                }
            }
        } else {
            // Check if we're above ground
            if (this.mesh.position.y > groundHeight + 0.1) {
                this.inAir = true;
                // Don't reset velocity.y here, let gravity take effect
            } else {
                // Stay on ground
                this.mesh.position.y = groundHeight;
                this.velocity.y = 0; // Ensure no vertical velocity when grounded
            }
        }
    }
    
    applyTilt(normal) {
        // Adjust skateboard rotation to match surface normal
        if (normal) {
            if (normal.y < 0.99) { // If on a slope
                // Calculate tilt based on surface normal
                const slopeX = Math.atan2(normal.x, normal.y);
                const slopeZ = Math.atan2(normal.z, normal.y);
                
                // Smoothly adjust rotation
                this.mesh.rotation.x = THREE.MathUtils.lerp(
                    this.mesh.rotation.x,
                    -slopeZ,
                    0.1
                );
                
                this.mesh.rotation.z = THREE.MathUtils.lerp(
                    this.mesh.rotation.z,
                    slopeX,
                    0.1
                );
                
                // Add momentum on slopes
                const slopeForce = 0.003 * (1 - normal.y);
                this.velocity.x += normal.x * slopeForce;
                this.velocity.z += normal.z * slopeForce;
            } else {
                // Smoothly return to level
                this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, 0.1);
                this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, 0.1);
            }
        }
    }
    
    addAirRotation() {
        // Add slight random rotation when in air
        if (this.isJumping || this.inAir) {
            const airRotation = 0.005;
            if (Math.abs(this.velocity.x) + Math.abs(this.velocity.z) > 0.1) {
                this.mesh.rotation.x += (Math.random() - 0.5) * airRotation;
                this.mesh.rotation.z += (Math.random() - 0.5) * airRotation;
            }
        }
    }
    
    resetPosition() {
        // Reset to the last known safe position before the collision
        this.mesh.position.copy(this.previousPosition);
        
        // Reset horizontal movement (Vertical velocity reset is handled in CollisionSystem for safety)
        this.velocity.x = 0;
        this.velocity.z = 0;
        
        // Reset sprint speed after collision
        this.resetSprintSpeed();
    }
    
    getPosition() {
        return this.mesh.position;
    }
    
    getRotation() {
        return this.mesh.rotation.y;
    }
    
    getJumpingState() {
        return this.isJumping;
    }
    
    getInAirState() {
        return this.inAir;
    }
    
    fullStop() {
        // Completely stop all skateboard movement and physics
        this.velocity.set(0, 0, 0);
        this.isJumping = false;
        this.inAir = false;
        
        // Reset sprint speed on full stop
        this.resetSprintSpeed();
        
        // Reset wheel animations
        this.wheelMeshes.forEach(wheel => {
            wheel.rotation.y = 0;
        });
    }
    
    // Add a new method to reset sprint speed
    resetSprintSpeed() {
        // Force reset to base speed
        this.currentSpeed = this.baseSpeed;
        this.isSprinting = false;
        
        // Log sprint reset for debugging
        //console.log("Sprint speed reset to base speed");
    }
} 