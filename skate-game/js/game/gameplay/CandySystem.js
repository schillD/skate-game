import * as THREE from 'three';

export class CandySystem {
    constructor(scene, skateboard, camera, gameState) {
        this.scene = scene;
        this.skateboard = skateboard;
        this.camera = camera;
        this.gameState = gameState;
        this.candies = [];
        this.candyCount = 5; // Number of candies to spawn
        this.collectSound = null;
        this.spawnDistance = 50; // Max distance from center to spawn candies
        this.respawnInterval = 40000; // Respawn candies every 40 seconds
        this.lastRespawnTime = 0;
        
        // Create candies and add them to the scene
        this.initCandies();
        
        // Try to initialize sound
        this.initSound();
    }
    
    initSound() {
        try {
            this.collectSound = new Audio('/audio/candy_collect.mp3');
            this.collectSound.volume = 0.4;
        } catch (error) {
            console.warn("Could not initialize candy collection sound:", error);
        }
    }
    
    initCandies() {
        // Remove any existing candies
        this.candies.forEach(candy => {
            if (candy && this.scene.children.includes(candy)) {
                this.scene.remove(candy);
            }
        });
        
        this.candies = [];
        
        // Create new candies
        for (let i = 0; i < this.candyCount; i++) {
            const candy = this.createCandy();
            this.candies.push(candy);
            this.scene.add(candy);
        }
        
        console.log(`Created ${this.candyCount} candies`);
    }
    
    createCandy() {
        // Create a group for the candy
        const candyGroup = new THREE.Group();
        
        // Create candy base (colorful spherical candy)
        const candyGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const candyMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF1493, // Deep pink
            emissive: 0xFF69B4, // Pink glow
            emissiveIntensity: 0.3,
            roughness: 0.3,
            metalness: 0.8
        });
        
        const candyMesh = new THREE.Mesh(candyGeometry, candyMaterial);
        candyGroup.add(candyMesh);
        
        // Add some decorative elements to make it look like a wrapped candy
        const wrapperGeometry = new THREE.TorusGeometry(0.8, 0.1, 8, 16);
        const wrapperMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF, // White
            roughness: 0.5
        });
        
        const wrapper = new THREE.Mesh(wrapperGeometry, wrapperMaterial);
        wrapper.rotation.x = Math.PI / 2;
        candyGroup.add(wrapper);
        
        const wrapper2 = new THREE.Mesh(wrapperGeometry, wrapperMaterial);
        wrapper2.rotation.z = Math.PI / 2;
        candyGroup.add(wrapper2);
        
        // Add a glow effect
        const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF69B4,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        candyGroup.add(glowMesh);
        
        // Position the candy at a random location
        this.positionCandyRandomly(candyGroup);
        
        // Store the original position for animation
        candyGroup.userData = {
            originalY: candyGroup.position.y,
            collected: false,
            id: Math.random() // Unique ID for animation offsets
        };
        
        return candyGroup;
    }
    
    positionCandyRandomly(candy) {
        // Position at random location in skatepark
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.spawnDistance;
        
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const y = 1.5; // Hover above ground
        
        candy.position.set(x, y, z);
    }
    
    update(deltaTime) {
        const now = performance.now();
        
        // Skip updates if game is over
        if (this.gameState.gameOver || this.gameState.gameWon) return;
        
        // Check if we should respawn candies
        if (now - this.lastRespawnTime > this.respawnInterval) {
            this.respawnCandies();
            this.lastRespawnTime = now;
        }
        
        // Check each candy for collection and animate
        this.candies.forEach((candy, index) => {
            if (!candy) return;
            
            // Skip if already collected
            if (candy.userData.collected) return;
            
            // Animate candy - hover up and down and rotate
            this.animateCandy(candy, now);
            
            // Check if player collected
            this.checkCandyCollection(candy);
        });
    }
    
    animateCandy(candy, now) {
        if (!candy) return;
        
        // Hover up and down
        const hoverHeight = 0.2;
        const hoverSpeed = 1.5;
        const timeOffset = candy.userData.id * 1000; // Offset based on ID for varied animation
        
        candy.position.y = candy.userData.originalY + 
                          Math.sin((now + timeOffset) * 0.001 * hoverSpeed) * hoverHeight;
        
        // Rotate
        candy.rotation.y += 0.01;
    }
    
    checkCandyCollection(candy) {
        if (!candy || !this.skateboard || !this.skateboard.mesh) return;
        
        const skateboardPos = this.skateboard.mesh.position.clone();
        const candyPos = candy.position.clone();
        
        // Check distance (ignore y-axis for easier collection)
        candyPos.y = skateboardPos.y;
        const distance = candyPos.distanceTo(skateboardPos);
        
        // If close enough, collect the candy
        if (distance < 2.5) {
            this.collectCandy(candy);
        }
    }
    
    collectCandy(candy) {
        if (!candy || candy.userData.collected) return;
        
        // Mark as collected
        candy.userData.collected = true;
        
        // Hide the candy
        candy.visible = false;
        
        // Play collection sound
        if (this.collectSound) {
            try {
                this.collectSound.currentTime = 0;
                this.collectSound.play().catch(e => console.warn("Error playing candy collect sound:", e));
            } catch (error) {
                console.warn("Error playing candy collect sound:", error);
            }
        }
        
        // Grant invincibility to player
        this.gameState.activateInvincibility();
        
        // Show collection message
        console.log("Candy collected! Player is now INVINCIBLE!");
        
        // Create visual effect for collection
        this.createCollectionEffect(candy.position.clone());
    }
    
    createCollectionEffect(position) {
        // Create a burst effect at the collection position
        const particleCount = 20;
        const particles = [];
        
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xFF1493,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // Add random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            
            particle.userData = { velocity, lifetime: 1.0 };
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // Animate particles
        const animateParticles = () => {
            let allDead = true;
            
            particles.forEach(particle => {
                if (particle.userData.lifetime > 0) {
                    // Update position
                    particle.position.add(particle.userData.velocity);
                    
                    // Apply gravity
                    particle.userData.velocity.y -= 0.01;
                    
                    // Reduce lifetime
                    particle.userData.lifetime -= 0.02;
                    
                    // Update opacity
                    particle.material.opacity = particle.userData.lifetime;
                    
                    allDead = false;
                } else if (particle.parent) {
                    // Remove dead particles
                    this.scene.remove(particle);
                }
            });
            
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }
    
    respawnCandies() {
        this.candies.forEach(candy => {
            if (candy && candy.userData.collected) {
                // Reset candy
                candy.userData.collected = false;
                candy.visible = true;
                
                // Reposition
                this.positionCandyRandomly(candy);
                candy.userData.originalY = candy.position.y;
            }
        });
        
        console.log("Respawned collected candies");
    }
} 