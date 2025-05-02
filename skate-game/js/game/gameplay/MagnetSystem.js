import * as THREE from 'three';

export class MagnetSystem {
    constructor(scene, skateboard, camera, gameState) {
        this.scene = scene;
        this.skateboard = skateboard;
        this.camera = camera;
        this.gameState = gameState;
        this.magnets = [];
        this.magnetCount = 3; // Number of magnets to spawn
        this.collectSound = null;
        this.spawnDistance = 50; // Max distance from center to spawn magnets
        this.respawnInterval = 60000; // Respawn magnets every 60 seconds
        this.lastRespawnTime = 0;
        
        // Create magnets and add them to the scene
        this.initMagnets();
        
        // Try to initialize sound
        this.initSound();
    }
    
    initSound() {
        try {
            this.collectSound = new Audio('/audio/magnet_collect.mp3');
            this.collectSound.volume = 0.5;
        } catch (error) {
            console.warn("Could not initialize magnet collection sound:", error);
        }
    }
    
    initMagnets() {
        // Remove any existing magnets
        this.magnets.forEach(magnet => {
            if (magnet && this.scene.children.includes(magnet)) {
                this.scene.remove(magnet);
            }
        });
        
        this.magnets = [];
        
        // Create new magnets
        for (let i = 0; i < this.magnetCount; i++) {
            const magnet = this.createMagnet();
            this.magnets.push(magnet);
            this.scene.add(magnet);
        }
        
        console.log(`Created ${this.magnetCount} magnets`);
    }
    
    createMagnet() {
        // Create a group for the magnet
        const magnetGroup = new THREE.Group();
        
        // Create magnet base (horseshoe shape)
        const torusGeometry = new THREE.TorusGeometry(0.6, 0.2, 16, 32, Math.PI);
        const magnetMaterial = new THREE.MeshStandardMaterial({
            color: 0x3333FF, // Blue
            emissive: 0x0000FF, // Blue glow
            emissiveIntensity: 0.3,
            roughness: 0.3,
            metalness: 0.9
        });
        
        const magnetMesh = new THREE.Mesh(torusGeometry, magnetMaterial);
        magnetMesh.rotation.x = Math.PI / 2; // Rotate to stand upright
        magnetGroup.add(magnetMesh);
        
        // Add the magnet poles (red and blue ends)
        const poleGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 16);
        const redPoleMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF0000, // Red
            emissive: 0xFF0000,
            emissiveIntensity: 0.2,
            roughness: 0.3,
            metalness: 0.9
        });
        
        const bluePoleMaterial = new THREE.MeshStandardMaterial({
            color: 0x0000FF, // Blue
            emissive: 0x0000FF,
            emissiveIntensity: 0.2,
            roughness: 0.3,
            metalness: 0.9
        });
        
        // Create the poles and position them at the ends of the magnet
        const redPole = new THREE.Mesh(poleGeometry, redPoleMaterial);
        redPole.position.set(0.6, 0, 0);
        redPole.rotation.x = Math.PI / 2;
        magnetGroup.add(redPole);
        
        const bluePole = new THREE.Mesh(poleGeometry, bluePoleMaterial);
        bluePole.position.set(-0.6, 0, 0);
        bluePole.rotation.x = Math.PI / 2;
        magnetGroup.add(bluePole);
        
        // Add a glow effect
        const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x4444FF,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        magnetGroup.add(glowMesh);
        
        // Position the magnet at a random location
        this.positionMagnetRandomly(magnetGroup);
        
        // Store the original position for animation
        magnetGroup.userData = {
            originalY: magnetGroup.position.y,
            collected: false,
            id: Math.random() // Unique ID for animation offsets
        };
        
        return magnetGroup;
    }
    
    positionMagnetRandomly(magnet) {
        // Position at random location in skatepark
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.spawnDistance;
        
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const y = 1.5; // Hover above ground
        
        magnet.position.set(x, y, z);
    }
    
    update(deltaTime) {
        const now = performance.now();
        
        // Skip updates if game is over
        if (this.gameState.gameOver || this.gameState.gameWon) return;
        
        // Check if we should respawn magnets
        if (now - this.lastRespawnTime > this.respawnInterval) {
            this.respawnMagnets();
            this.lastRespawnTime = now;
        }
        
        // Check each magnet for collection and animate
        this.magnets.forEach((magnet, index) => {
            if (!magnet) return;
            
            // Skip if already collected
            if (magnet.userData.collected) return;
            
            // Animate magnet - hover up and down and rotate
            this.animateMagnet(magnet, now);
            
            // Check if player collected
            this.checkMagnetCollection(magnet);
        });
    }
    
    animateMagnet(magnet, now) {
        // Add a unique offset based on the magnet's ID to make each animation slightly different
        const timeOffset = magnet.userData.id * 1000;
        
        // Hover effect - move up and down slightly
        const hoverY = Math.sin((now + timeOffset) * 0.001) * 0.2;
        magnet.position.y = magnet.userData.originalY + hoverY;
        
        // Rotate the magnet
        magnet.rotation.y += 0.01;
    }
    
    checkMagnetCollection(magnet) {
        if (!magnet || magnet.userData.collected) return;
        
        const skaterPosition = this.skateboard.mesh.position.clone();
        const magnetPosition = magnet.position.clone();
        const distance = skaterPosition.distanceTo(magnetPosition);
        
        // Check if player is close enough to collect
        if (distance < 2) {
            this.collectMagnet(magnet);
        }
    }
    
    collectMagnet(magnet) {
        if (!magnet || magnet.userData.collected) return;
        
        // Mark as collected
        magnet.userData.collected = true;
        
        // Hide the magnet
        magnet.visible = false;
        
        // Play collection sound
        if (this.collectSound) {
            try {
                this.collectSound.currentTime = 0;
                this.collectSound.play().catch(e => console.warn("Error playing magnet collect sound:", e));
            } catch (error) {
                console.warn("Error playing magnet collect sound:", error);
            }
        }
        
        // Activate magnet effect in game state
        this.gameState.activateMagnet();
        
        // Show collection message
        console.log("Magnet collected! Coins will be attracted to player!");
        
        // Create visual effect for collection
        this.createCollectionEffect(magnet.position.clone());
    }
    
    createCollectionEffect(position) {
        // Create particle effect for collection
        const particleCount = 30;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x4444FF,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around the collection point
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.5;
            particle.position.set(
                position.x + Math.cos(angle) * radius,
                position.y + Math.random() * 0.5,
                position.z + Math.sin(angle) * radius
            );
            
            // Random velocity
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 5,
                    Math.random() * 5,
                    (Math.random() - 0.5) * 5
                ),
                lifetime: 1.0 // Seconds
            };
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // Animate particles
        const startTime = performance.now();
        
        const animateParticles = () => {
            const now = performance.now();
            const elapsedTime = (now - startTime) / 1000; // Convert to seconds
            
            if (elapsedTime > 1.0) {
                // Remove particles after lifetime
                this.scene.remove(particles);
                return;
            }
            
            // Update each particle
            particles.children.forEach(particle => {
                // Update position based on velocity
                particle.position.x += particle.userData.velocity.x * 0.01;
                particle.position.y += particle.userData.velocity.y * 0.01;
                particle.position.z += particle.userData.velocity.z * 0.01;
                
                // Fade out as they age
                const age = elapsedTime / particle.userData.lifetime;
                particle.material.opacity = 0.7 * (1 - age);
                
                // Slow down over time
                particle.userData.velocity.multiplyScalar(0.96);
            });
            
            requestAnimationFrame(animateParticles);
        };
        
        animateParticles();
    }
    
    respawnMagnets() {
        this.magnets.forEach(magnet => {
            if (magnet && magnet.userData.collected) {
                // Reset magnet
                magnet.userData.collected = false;
                magnet.visible = true;
                
                // Reposition
                this.positionMagnetRandomly(magnet);
                magnet.userData.originalY = magnet.position.y;
            }
        });
        
        console.log("Respawned collected magnets");
    }
} 