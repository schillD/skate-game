import * as THREE from 'three';

export class BoosterSystem {
    constructor(scene, skateboard) {
        this.scene = scene;
        this.skateboard = skateboard;
        this.boosters = [];
        this.boosterMaterial = new THREE.MeshStandardMaterial({
            color: 0x00aaff,
            emissive: 0x0066cc,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // Track which boosters have been activated
        this.activatedBoosters = new Set();
        
        // Speed boost settings
        this.boostMultiplier = 1.8;  // How much to multiply the speed by
        this.boostDuration = 2000;   // Duration of boost in milliseconds
        this.boostCooldown = 5000;   // Time before booster can be used again
        
        // Create boost notification element
        this.createBoostNotification();
        
        // Initialize boosters
        this.createBoosters();
    }
    
    createBoostNotification() {
        // Create a notification element that appears when a boost is activated
        this.boostNotification = document.createElement('div');
        this.boostNotification.id = 'boostNotification';
        this.boostNotification.textContent = 'SPEED BOOST!';
        this.boostNotification.style.position = 'fixed';
        this.boostNotification.style.top = '35%'; // Position higher than jump notification
        this.boostNotification.style.left = '50%';
        this.boostNotification.style.transform = 'translate(-50%, -50%)';
        this.boostNotification.style.color = '#00ffff';
        this.boostNotification.style.fontFamily = 'Arial, sans-serif';
        this.boostNotification.style.fontSize = '36px';
        this.boostNotification.style.fontWeight = 'bold';
        this.boostNotification.style.textShadow = '0 0 10px #0088ff, 0 0 20px #0088ff';
        this.boostNotification.style.zIndex = '1000';
        this.boostNotification.style.opacity = '0';
        this.boostNotification.style.transition = 'opacity 0.3s ease-in-out';
        this.boostNotification.style.pointerEvents = 'none'; // Don't block clicks/interactions
        
        document.body.appendChild(this.boostNotification);
    }
    
    createBoosters() {
        // Define positions for boosters around the skatepark
        const boosterPositions = [
            { x: 15, z: 15 },
            { x: -15, z: 15 },
            { x: 15, z: -15 },
            { x: -15, z: -15 },
            { x: 30, z: 0 },
            { x: -30, z: 0 },
            { x: 0, z: 30 },
            { x: 0, z: -30 }
        ];
        
        // Create each booster
        boosterPositions.forEach(pos => {
            this.createBooster(pos.x, pos.z);
        });
    }
    
    createBooster(x, z) {
        // Create booster pad geometry
        const geometry = new THREE.CylinderGeometry(2, 2, 0.2, 32);
        const booster = new THREE.Mesh(geometry, this.boosterMaterial);
        
        // Position the booster
        booster.position.set(x, 0.1, z); // Slightly above ground
        
        // Add glow effect with particles
        const particleSystem = this.createParticleSystem(x, z);
        
        // Add to scene and boosters array
        this.scene.add(booster);
        this.scene.add(particleSystem);
        
        this.boosters.push({
            mesh: booster,
            particles: particleSystem,
            position: new THREE.Vector3(x, 0.1, z),
            active: true,
            lastActivatedTime: 0
        });
    }
    
    createParticleSystem(x, z) {
        // Create particle geometry
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        
        // Create particle positions array
        const positions = new Float32Array(particleCount * 3);
        
        // Group to contain the particles
        const particleGroup = new THREE.Group();
        particleGroup.position.set(x, 0, z);
        
        for (let i = 0; i < particleCount; i++) {
            // Position particles in a circle around the booster
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 1.8 + Math.random() * 0.4;
            
            positions[i * 3] = Math.cos(angle) * radius; // Relative to group center
            positions[i * 3 + 1] = 0.1 + Math.random() * 0.4; // Vary height slightly
            positions[i * 3 + 2] = Math.sin(angle) * radius; // Relative to group center
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.3,
            transparent: true,
            opacity: 0.7
        });
        
        // Create the particle system
        const points = new THREE.Points(particles, particleMaterial);
        particleGroup.add(points);
        return particleGroup;
    }
    
    update(deltaTime) {
        // Check if player is over any booster
        this.checkBoosterCollisions();
        
        // Animate boosters
        this.animateBoosters(deltaTime);
        
        // Check if any boosters should reactivate
        this.checkBoosterRespawn();
    }
    
    checkBoosterCollisions() {
        const skateboardPosition = this.skateboard.getPosition();
        
        this.boosters.forEach((booster, index) => {
            if (!booster.active) return; // Skip inactive boosters
            
            // Calculate distance from skateboard to booster
            const distance = skateboardPosition.distanceTo(booster.position);
            
            // If close enough, activate the booster
            if (distance < 2.5) { // Collision radius
                this.activateBooster(index);
            }
        });
    }
    
    activateBooster(index) {
        const booster = this.boosters[index];
        
        // Don't activate if already activated recently
        if (this.activatedBoosters.has(index)) return;
        
        // Apply speed boost to skateboard
        this.applySpeedBoost();
        
        // Mark this booster as activated
        this.activatedBoosters.add(index);
        booster.active = false;
        booster.lastActivatedTime = Date.now();
        
        // Change appearance of booster to indicate it's used
        booster.mesh.material = booster.mesh.material.clone();
        booster.mesh.material.emissiveIntensity = 0.1;
        booster.mesh.material.color.set(0x555555);
        
        // Remove particles temporarily
        booster.particles.visible = false;
        
        // Create burst effect
        this.createBoostBurstEffect(booster.position);
        
        // Show boost notification
        this.showBoostNotification();
        
        // Schedule cleanup of boost effect
        setTimeout(() => {
            this.activatedBoosters.delete(index);
        }, this.boostDuration);
    }
    
    showBoostNotification() {
        // Show the boost notification
        this.boostNotification.style.opacity = '1';
        
        // Add a dynamic scaling effect
        this.boostNotification.style.transform = 'translate(-50%, -50%) scale(1.2)';
        
        // After a small delay, return to normal scale
        setTimeout(() => {
            this.boostNotification.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 150);
        
        // Hide the notification after a delay
        setTimeout(() => {
            this.boostNotification.style.opacity = '0';
        }, 1500);
    }
    
    applySpeedBoost() {
        // Store the original speed
        const originalBaseSpeed = this.skateboard.baseSpeed;
        const originalMaxSpeed = this.skateboard.maxSprintSpeed;
        
        // Apply a speed multiplier
        this.skateboard.baseSpeed *= this.boostMultiplier;
        this.skateboard.maxSprintSpeed *= this.boostMultiplier;
        
        // Also apply an immediate velocity boost in the direction of travel
        const currentDirection = new THREE.Vector3(
            this.skateboard.velocity.x,
            0,
            this.skateboard.velocity.z
        ).normalize();
        
        const boostFactor = 1.5;
        this.skateboard.velocity.x += currentDirection.x * boostFactor;
        this.skateboard.velocity.z += currentDirection.z * boostFactor;
        
        // Save the original reset function
        const originalResetSprintSpeed = this.skateboard.resetSprintSpeed;
        
        // Override the resetSprintSpeed method temporarily to ensure values reset to original base speed
        this.skateboard.resetSprintSpeed = function() {
            // Reset to the original values, not the boosted ones
            this.currentSpeed = originalBaseSpeed;
            this.isSprinting = false;
            console.log("Sprint speed reset to original base speed after boost");
        };
        
        // Reset the speed and restore the original resetSprintSpeed function after the boost duration
        setTimeout(() => {
            // Restore original speeds
            this.skateboard.baseSpeed = originalBaseSpeed;
            this.skateboard.maxSprintSpeed = originalMaxSpeed;
            
            // If current speed is higher than the restored base speed, reduce it
            if (this.skateboard.currentSpeed > originalBaseSpeed) {
                this.skateboard.currentSpeed = originalBaseSpeed;
            }
            
            // Restore the original resetSprintSpeed method
            this.skateboard.resetSprintSpeed = originalResetSprintSpeed;
            
            console.log("Boost effect ended, speeds restored to normal");
        }, this.boostDuration);
    }
    
    createBoostBurstEffect(position) {
        // Create a burst of particles when booster is activated
        const particleCount = 30;
        const burstGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the center
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            // Random velocity outward
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.05 + Math.random() * 0.1;
            velocities[i * 3] = Math.cos(angle) * speed;
            velocities[i * 3 + 1] = 0.05 + Math.random() * 0.1; // Upward
            velocities[i * 3 + 2] = Math.sin(angle) * speed;
        }
        
        burstGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const burstMaterial = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.4,
            transparent: true,
            opacity: 0.9
        });
        
        const burstSystem = new THREE.Points(burstGeometry, burstMaterial);
        this.scene.add(burstSystem);
        
        // Animate the burst
        let frameCount = 0;
        const maxFrames = 60;
        
        const animateBurst = () => {
            if (frameCount >= maxFrames) {
                this.scene.remove(burstSystem);
                return;
            }
            
            // Update positions based on velocities
            const positions = burstSystem.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i * 3];
                positions[i * 3 + 1] += velocities[i * 3 + 1];
                positions[i * 3 + 2] += velocities[i * 3 + 2];
                
                // Add gravity
                velocities[i * 3 + 1] -= 0.001;
            }
            
            burstSystem.geometry.attributes.position.needsUpdate = true;
            
            // Fade out
            burstMaterial.opacity = 0.9 * (1 - frameCount / maxFrames);
            
            frameCount++;
            requestAnimationFrame(animateBurst);
        };
        
        animateBurst();
    }
    
    checkBoosterRespawn() {
        const currentTime = Date.now();
        
        this.boosters.forEach((booster, index) => {
            if (!booster.active && (currentTime - booster.lastActivatedTime) > this.boostCooldown) {
                // Reactivate the booster
                booster.active = true;
                
                // Restore appearance
                booster.mesh.material = this.boosterMaterial;
                booster.particles.visible = true;
            }
        });
    }
    
    animateBoosters(deltaTime) {
        // Make active boosters pulse and rotate
        this.boosters.forEach(booster => {
            if (booster.active) {
                // Rotate particle system
                booster.particles.rotation.y += deltaTime * 1.0;
                
                // Pulse the emissive intensity
                if (booster.mesh.material.emissiveIntensity) {
                    const time = Date.now() * 0.001;
                    booster.mesh.material.emissiveIntensity = 0.3 + Math.sin(time * 4) * 0.2;
                }
            }
        });
    }
} 