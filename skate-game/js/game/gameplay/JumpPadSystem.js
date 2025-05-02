import * as THREE from 'three';

export class JumpPadSystem {
    constructor(scene, skateboard) {
        this.scene = scene;
        this.skateboard = skateboard;
        this.jumpPads = [];
        this.jumpPadMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            emissive: 0xcc3300,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // Track which jump pads have been activated
        this.activatedJumpPads = new Set();
        
        // Jump settings
        this.jumpMultiplier = 3.0;  // How much to multiply the jump force by
        this.jumpCooldown = 3000;   // Time before jump pad can be used again
        
        // Create jump notification element
        this.createJumpNotification();
        
        // Initialize jump pads
        this.createJumpPads();
    }
    
    createJumpNotification() {
        // Create a notification element that appears when a jump pad is activated
        this.jumpNotification = document.createElement('div');
        this.jumpNotification.id = 'jumpNotification';
        this.jumpNotification.textContent = 'SUPER JUMP!';
        this.jumpNotification.style.position = 'fixed';
        this.jumpNotification.style.top = '45%'; // Position lower than booster notification
        this.jumpNotification.style.left = '50%';
        this.jumpNotification.style.transform = 'translate(-50%, -50%)';
        this.jumpNotification.style.color = '#ffaa00';
        this.jumpNotification.style.fontFamily = 'Arial, sans-serif';
        this.jumpNotification.style.fontSize = '36px';
        this.jumpNotification.style.fontWeight = 'bold';
        this.jumpNotification.style.textShadow = '0 0 10px #ff5500, 0 0 20px #ff5500';
        this.jumpNotification.style.zIndex = '1000';
        this.jumpNotification.style.opacity = '0';
        this.jumpNotification.style.transition = 'opacity 0.3s ease-in-out';
        this.jumpNotification.style.pointerEvents = 'none'; // Don't block clicks/interactions
        
        document.body.appendChild(this.jumpNotification);
    }
    
    createJumpPads() {
        // Define positions for jump pads around the skatepark
        // Position them in a more evenly distributed pattern across the map
        const jumpPadPositions = [
            { x: 30, z: 30 },    // Far northeast
            { x: -30, z: 30 },   // Far northwest
            { x: 30, z: -30 },   // Far southeast
            { x: -30, z: -30 },  // Far southwest
            { x: 0, z: 45 },     // North center
            { x: 0, z: -45 },    // South center
            { x: 45, z: 0 },     // East center
            { x: -45, z: 0 },    // West center
            { x: 15, z: 15 },    // Inner northeast
            { x: -15, z: 15 },   // Inner northwest
            { x: 15, z: -15 },   // Inner southeast
            { x: -15, z: -15 }   // Inner southwest
        ];
        
        // Create each jump pad
        jumpPadPositions.forEach(pos => {
            this.createJumpPad(pos.x, pos.z);
        });
    }
    
    createJumpPad(x, z) {
        // Create a triangular prism for the jump pad to distinguish from booster pads
        const jumpPad = new THREE.Group();
        
        // Create base
        const baseGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 32);
        const base = new THREE.Mesh(baseGeometry, this.jumpPadMaterial);
        base.position.y = 0.1;
        jumpPad.add(base);
        
        // Create arrows pointing up to indicate jumping
        for (let i = 0; i < 4; i++) {
            const arrowGroup = new THREE.Group();
            
            // Arrow body
            const arrowBodyGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
            const arrowBody = new THREE.Mesh(arrowBodyGeometry, this.jumpPadMaterial);
            arrowBody.position.y = 0.5;
            arrowGroup.add(arrowBody);
            
            // Arrow head
            const arrowHeadGeometry = new THREE.ConeGeometry(0.3, 0.4, 8);
            const arrowHead = new THREE.Mesh(arrowHeadGeometry, this.jumpPadMaterial);
            arrowHead.position.y = 1.0;
            arrowGroup.add(arrowHead);
            
            // Position around the base
            arrowGroup.position.x = Math.sin(i * Math.PI / 2) * 1.2;
            arrowGroup.position.z = Math.cos(i * Math.PI / 2) * 1.2;
            
            jumpPad.add(arrowGroup);
        }
        
        // Position the jump pad
        jumpPad.position.set(x, 0, z);
        
        // Add particle effect
        const particleSystem = this.createParticleSystem(x, z);
        
        // Add to scene and jump pads array
        this.scene.add(jumpPad);
        this.scene.add(particleSystem);
        
        this.jumpPads.push({
            mesh: jumpPad,
            particles: particleSystem,
            position: new THREE.Vector3(x, 0, z),
            active: true,
            lastActivatedTime: 0
        });
    }
    
    createParticleSystem(x, z) {
        // Create particle geometry (similar to booster pads but with different colors)
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        
        // Create particle positions array
        const positions = new Float32Array(particleCount * 3);
        
        // Group to contain the particles
        const particleGroup = new THREE.Group();
        particleGroup.position.set(x, 0, z);
        
        for (let i = 0; i < particleCount; i++) {
            // Position particles in a circle around the jump pad
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 1.8 + Math.random() * 0.4;
            
            positions[i * 3] = Math.cos(angle) * radius; // Relative to group center
            positions[i * 3 + 1] = 0.1 + Math.random() * 0.4; // Vary height slightly
            positions[i * 3 + 2] = Math.sin(angle) * radius; // Relative to group center
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create particle material - orange/yellow for jump pads
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffaa00,
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
        // Check if player is over any jump pad
        this.checkJumpPadCollisions();
        
        // Animate jump pads
        this.animateJumpPads(deltaTime);
        
        // Check if any jump pads should reactivate
        this.checkJumpPadRespawn();
    }
    
    checkJumpPadCollisions() {
        // Only check if the skateboard is on the ground (not already jumping)
        if (this.skateboard.isJumping || this.skateboard.inAir) return;
        
        const skateboardPosition = this.skateboard.getPosition();
        
        this.jumpPads.forEach((jumpPad, index) => {
            if (!jumpPad.active) return; // Skip inactive jump pads
            
            // Calculate distance from skateboard to jump pad
            const distance = new THREE.Vector2(
                skateboardPosition.x - jumpPad.position.x,
                skateboardPosition.z - jumpPad.position.z
            ).length();
            
            // If close enough, activate the jump pad
            if (distance < 2.5) { // Collision radius
                this.activateJumpPad(index);
            }
        });
    }
    
    activateJumpPad(index) {
        const jumpPad = this.jumpPads[index];
        
        // Don't activate if already activated recently
        if (this.activatedJumpPads.has(index)) return;
        
        // Apply super jump to skateboard
        this.applySuperJump();
        
        // Mark this jump pad as activated
        this.activatedJumpPads.add(index);
        jumpPad.active = false;
        jumpPad.lastActivatedTime = Date.now();
        
        // Change appearance of jump pad to indicate it's used
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            emissive: 0x331100,
            emissiveIntensity: 0.1,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // Update materials on all meshes in the jump pad
        jumpPad.mesh.traverse((child) => {
            if (child.isMesh) {
                child.material = baseMaterial;
            }
        });
        
        // Remove particles temporarily
        jumpPad.particles.visible = false;
        
        // Create burst effect
        this.createJumpBurstEffect(jumpPad.position);
        
        // Show jump notification
        this.showJumpNotification();
        
        // Schedule cleanup of jump effect
        setTimeout(() => {
            this.activatedJumpPads.delete(index);
        }, this.jumpCooldown);
    }
    
    showJumpNotification() {
        // Show the jump notification
        this.jumpNotification.style.opacity = '1';
        
        // Add a dynamic scaling effect
        this.jumpNotification.style.transform = 'translate(-50%, -50%) scale(1.2)';
        
        // After a small delay, return to normal scale
        setTimeout(() => {
            this.jumpNotification.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 150);
        
        // Hide the notification after a delay
        setTimeout(() => {
            this.jumpNotification.style.opacity = '0';
        }, 1500);
    }
    
    applySuperJump() {
        // Set jumping state
        this.skateboard.isJumping = true;
        
        // Apply a much stronger jump force than normal
        this.skateboard.velocity.y = this.skateboard.jumpForce * this.jumpMultiplier;
        
        // Add some forward momentum too if moving
        const currentXZSpeed = Math.sqrt(
            this.skateboard.velocity.x * this.skateboard.velocity.x + 
            this.skateboard.velocity.z * this.skateboard.velocity.z
        );
        
        if (currentXZSpeed > 0.01) {
            const boostFactor = 1.2;
            this.skateboard.velocity.x *= boostFactor;
            this.skateboard.velocity.z *= boostFactor;
        }
    }
    
    createJumpBurstEffect(position) {
        // Create a burst of particles when jump pad is activated
        const particleCount = 40;
        const burstGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the center
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y + 0.2;
            positions[i * 3 + 2] = position.z;
            
            // Random velocity - mostly upward for jump effect
            const angle = Math.random() * Math.PI * 2;
            const horizontalSpeed = 0.03 + Math.random() * 0.05;
            const verticalSpeed = 0.08 + Math.random() * 0.12;
            
            velocities[i * 3] = Math.cos(angle) * horizontalSpeed;
            velocities[i * 3 + 1] = verticalSpeed;
            velocities[i * 3 + 2] = Math.sin(angle) * horizontalSpeed;
        }
        
        burstGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const burstMaterial = new THREE.PointsMaterial({
            color: 0xffaa00,
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
                velocities[i * 3 + 1] -= 0.002;
            }
            
            burstSystem.geometry.attributes.position.needsUpdate = true;
            
            // Fade out
            burstMaterial.opacity = 0.9 * (1 - frameCount / maxFrames);
            
            frameCount++;
            requestAnimationFrame(animateBurst);
        };
        
        animateBurst();
    }
    
    checkJumpPadRespawn() {
        const currentTime = Date.now();
        
        this.jumpPads.forEach((jumpPad, index) => {
            if (!jumpPad.active && (currentTime - jumpPad.lastActivatedTime) > this.jumpCooldown) {
                // Reactivate the jump pad
                jumpPad.active = true;
                
                // Restore appearance
                // Update materials on all meshes in the jump pad
                jumpPad.mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.material = this.jumpPadMaterial;
                    }
                });
                
                jumpPad.particles.visible = true;
            }
        });
    }
    
    animateJumpPads(deltaTime) {
        // Make active jump pads pulse and rotate
        this.jumpPads.forEach(jumpPad => {
            if (jumpPad.active) {
                // Rotate particle system
                jumpPad.particles.rotation.y += deltaTime * 1.5;
                
                // Bounce the arrows up and down
                const time = Date.now() * 0.001;
                const bounceHeight = Math.sin(time * 5) * 0.1;
                
                jumpPad.mesh.children.forEach((child, i) => {
                    if (i > 0) { // Skip the base, only bounce the arrows
                        child.position.y = 0.1 + bounceHeight;
                    }
                });
                
                // Pulse the emissive intensity on all meshes
                jumpPad.mesh.traverse((child) => {
                    if (child.isMesh && child.material && child.material.emissiveIntensity) {
                        child.material.emissiveIntensity = 0.3 + Math.sin(time * 4) * 0.2;
                    }
                });
            }
        });
    }
} 