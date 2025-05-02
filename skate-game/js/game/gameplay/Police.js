import * as THREE from 'three';

export class PoliceSystem {
    constructor(scene, skateboard, camera, gameState, skater) {
        this.scene = scene;
        this.skateboard = skateboard;
        this.camera = camera; // Need access to the camera for text positioning
        this.gameState = gameState; // Reference to game state
        this.skater = skater; // Reference to the skater for visibility effects
        this.officers = [];
        this.detectionRadius = 40; // How far police can see the player
        this.chaseSpeed = 0.08; // Police movement speed
        this.spawnDistance = 80; // Distance from center to spawn police
        this.lastSpawnTime = 0;
        this.spawnInterval = 15000; // Time between spawning new officers (ms)
        this.officerCount = 3; // Starting number of officers
        this.chasingText = null;
        this.bustedText = null;
        this.explodingOfficers = []; // Track officers that are exploding
        this.explosionSound = null;
        
        // Initialize officers
        this.init();
        
        // Initialize explosion sound
        this.initSound();
    }
    
    initSound() {
        try {
            this.explosionSound = new Audio('/audio/explosion.mp3');
            this.explosionSound.volume = 0.5;
        } catch (error) {
            console.warn("Could not initialize explosion sound:", error);
        }
    }
    
    init() {
        // Create initial police officers
        for (let i = 0; i < this.officerCount; i++) {
            this.spawnOfficer();
        }
        
        // Create "BUSTED" text using a simplified approach
        this.createSimplifiedBustedEffect();
        
        // Create "CHASING!" text
        this.createChasingText();
    }
    
    createChasingText() {
        // Create a canvas for the text
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // Clear the canvas
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw text
        context.font = 'bold 32px Arial';
        context.fillStyle = 'red';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('CHASING!', canvas.width / 2, canvas.height / 2);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create sprite material
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true 
        });
        
        // Create sprite
        this.chasingText = new THREE.Sprite(material);
        this.chasingText.scale.set(10, 2.5, 1);
        this.chasingText.visible = false;
        this.scene.add(this.chasingText);
    }
    
    createSimplifiedBustedEffect() {
        // Create a canvas for "BUSTED" text
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // Fill with transparent background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add red text
        context.font = 'bold 80px Arial';
        context.fillStyle = 'red';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('BUSTED!', canvas.width / 2, canvas.height / 2);
        
        // Create a texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create a sprite for the HUD
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true 
        });
        
        this.bustedText = new THREE.Sprite(material);
        this.bustedText.scale.set(30, 10, 1);
        this.bustedText.visible = false;
        this.scene.add(this.bustedText);
    }
    
    spawnOfficer() {
        // Create a police officer character
        const officerGroup = new THREE.Group();
        
        // Officer body (blue)
        const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x000080 }); // Navy blue
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        officerGroup.add(body);
        
        // Officer head
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 }); // Gold for badge
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.85;
        officerGroup.add(head);
        
        // Officer hat (police cap)
        const hatGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16);
        const hatMaterial = new THREE.MeshStandardMaterial({ color: 0x000080 }); // Navy blue
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 2.15;
        officerGroup.add(hat);
        
        // Police badge
        const badgeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
        const badgeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 }); // Gold
        const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
        badge.rotation.x = Math.PI / 2;
        badge.position.set(0, 1.2, 0.45);
        officerGroup.add(badge);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
        const armMaterial = new THREE.MeshStandardMaterial({ color: 0x000080 }); // Navy blue
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.65, 0.75, 0);
        officerGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.65, 0.75, 0);
        officerGroup.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x000033 }); // Darker blue
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.3, -0.25, 0);
        officerGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.3, -0.25, 0);
        officerGroup.add(rightLeg);
        
        // Set officer position at random location away from player
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * this.spawnDistance;
        const z = Math.sin(angle) * this.spawnDistance;
        officerGroup.position.set(x, 0, z);
        
        // Store officer state
        officerGroup.userData = {
            isChasing: false,
            speed: this.chaseSpeed,
            chasingTime: 0,
            pauseTime: 0,
            originalPos: new THREE.Vector3(x, 0, z),
            id: Math.random() // Unique ID for animation offsets
        };
        
        this.scene.add(officerGroup);
        this.officers.push(officerGroup);
        
        return officerGroup;
    }
    
    update(deltaTime) {
        // Skip updates if game is over
        if (this.gameState.gameOver || this.gameState.gameWon) {
            return;
        }
        
        const playerPosition = this.skateboard.mesh.position.clone();
        const now = performance.now();
        
        // IMPORTANT: If player is caught, only update text positions - don't process police chasing or collisions
        if (this.gameState.isPlayerCaught) {
            this.updateBustedTextPosition();
            this.bustedText.visible = true;
            this.chasingText.visible = false;
            
            // Make officers keep distance when player is caught
            this.officers.forEach(officer => {
                const officerPos = officer.position.clone();
                const distanceToPlayer = officerPos.distanceTo(playerPosition);
                
                // If too close to player, move away slightly
                if (distanceToPlayer < 3) {
                    const awayDirection = officerPos.clone().sub(playerPosition).normalize();
                    officer.position.add(awayDirection.multiplyScalar(0.1));
                }
            });
            
            return; // Skip ALL other updates while player is caught
        } else {
            this.bustedText.visible = false;
        }
        
        // Handle player immunity visibility - if player is immune, flash the skater
        if (this.gameState.isPlayerImmuneFromCapture()) {
            // Toggle skateboard visibility based on immunity flash state
            if (this.skateboard && this.skateboard.mesh) {
                // Don't toggle skateboard visibility as it might affect gameplay
                // Instead, only toggle the skater model
                if (this.skater) {
                    if (this.skater.mesh) {
                        this.skater.mesh.visible = this.gameState.getImmunityVisibility();
                    }
                }
            }
        } else {
            // Always ensure skater is visible when not immune
            if (this.skater) {
                if (this.skater.mesh) {
                    this.skater.mesh.visible = true;
                }
            }
        }
        
        // Spawn new officers periodically
        if (now - this.lastSpawnTime > this.spawnInterval) {
            this.spawnOfficer();
            this.lastSpawnTime = now;
        }
        
        // Update any exploding officers
        this.updateExplodingOfficers(deltaTime);
        
        let anyOfficerChasing = false;
        let playerCaughtThisFrame = false; // Track if player was caught this frame
        
        // Update each police officer
        this.officers.forEach(officer => {
            // Skip officers that are marked for deletion
            if (officer.userData.exploding || officer.userData.toDelete) return;
            
            const officerPosition = officer.position.clone();
            officerPosition.y = 0; // Ignore height difference
            
            // Calculate distance to player
            const distanceToPlayer = officerPosition.distanceTo(playerPosition);
            
            // Check detection - officers can still detect player when immune, but can't catch them
            if (distanceToPlayer < this.detectionRadius) {
                // Player detected - start chasing!
                officer.userData.isChasing = true;
                officer.userData.chasingTime = 0;
                anyOfficerChasing = true;
            }
            
            // Handle chasing behavior
            if (officer.userData.isChasing) {
                // Update chasing timer
                officer.userData.chasingTime += deltaTime;
                
                // Check if we're in a pause (stumbled)
                if (officer.userData.pauseTime > 0) {
                    officer.userData.pauseTime -= deltaTime;
                    // Make officer "jump" to show stumbling
                    const bounce = Math.sin(officer.userData.pauseTime * 10) * 0.2;
                    officer.position.y = Math.max(0, bounce);
                } else {
                    // Get direction to player
                    const direction = new THREE.Vector3()
                        .subVectors(playerPosition, officerPosition)
                        .normalize();
                    
                    // Make officer face the player
                    officer.lookAt(playerPosition);
                    
                    // If player is immune, officers should still chase but maintain some distance
                    if (this.gameState.isPlayerImmuneFromCapture() && distanceToPlayer < 3) {
                        // Slow down when close to immune player
                        const slowFactor = 0.3;
                        officer.position.x += direction.x * officer.userData.speed * slowFactor;
                        officer.position.z += direction.z * officer.userData.speed * slowFactor;
                    } else {
                        // Normal movement
                        officer.position.x += direction.x * officer.userData.speed;
                        officer.position.z += direction.z * officer.userData.speed;
                    }
                    
                    // Animate legs while chasing
                    if (officer.children[6] && officer.children[7]) { // legs
                        const legAngle = Math.sin(now * 0.01) * 0.2;
                        officer.children[6].rotation.x = legAngle;
                        officer.children[7].rotation.x = -legAngle;
                    }
                    
                    // Special handling for candy invincibility - explode police on collision
                    if (this.gameState.isPlayerInvincibleFromCandy() && distanceToPlayer < 2.0) {
                        this.explodeOfficer(officer);
                        return; // Skip further processing for this officer
                    }
                    
                    // Check if officer caught player - with multiple safety checks
                    if (distanceToPlayer < 1.5 &&  // Close enough to catch
                        !this.gameState.isPlayerCaught && // Not already caught
                        !this.gameState.isPlayerImmuneFromCapture() && // Not immune
                        !playerCaughtThisFrame) { // Not caught by another officer this frame
                        
                        this.playerCaught();
                        playerCaughtThisFrame = true; // Prevent other officers from catching in same frame
                    }
                    
                    // Occasionally make the officer stumble
                    if (Math.random() < 0.001) {
                        officer.userData.pauseTime = 1.0;
                    }
                }
            } else {
                // When not chasing, patrol around original position
                const patrolRadius = 10;
                const patrolSpeed = 0.03;
                
                // Use sine waves to create circular patrol patterns
                const time = now * 0.001;
                const uniqueOffset = officer.userData.id * 10;
                const newX = officer.userData.originalPos.x + Math.sin(time + uniqueOffset) * patrolRadius;
                const newZ = officer.userData.originalPos.z + Math.cos(time + uniqueOffset) * patrolRadius;
                
                // Calculate patrol direction
                const patrolDirection = new THREE.Vector3(newX, 0, newZ).sub(officerPosition).normalize();
                
                // Move along patrol path
                officer.position.x += patrolDirection.x * patrolSpeed;
                officer.position.z += patrolDirection.z * patrolSpeed;
                
                // Make officer face patrol direction
                officer.lookAt(new THREE.Vector3(newX, 0, newZ));
            }
        });
        
        // Clean up officers marked for deletion
        this.cleanupDeletedOfficers();
        
        // Update chasing text visibility - show when chasing, whether player is immune or not
        this.chasingText.visible = anyOfficerChasing;
        if (anyOfficerChasing) {
            this.updateChasingTextPosition();
        }
    }
    
    playerCaught() {
        // Call gameState's playerCaught method to handle life reduction
        const gameOver = this.gameState.playerCaught();
        
        // Show BUSTED text
        this.bustedText.visible = true;
        this.updateBustedTextPosition();
        
        // Make police celebrate
        this.officers.forEach(officer => {
            // Make police stop and jump to celebrate
            officer.userData.isChasing = false;
            
            // Jump animation
            const jumpAnimation = () => {
                let jumpHeight = 0;
                let jumpVelocity = 0.1;
                const jumpInterval = setInterval(() => {
                    if (this.gameState.gameOver) {
                        clearInterval(jumpInterval);
                        return;
                    }
                    
                    jumpHeight += jumpVelocity;
                    jumpVelocity -= 0.01;
                    
                    if (jumpHeight <= 0) {
                        jumpHeight = 0;
                        jumpVelocity = 0.1;
                    }
                    
                    officer.position.y = jumpHeight;
                }, 50);
                
                // Stop jumping after a few seconds
                setTimeout(() => {
                    clearInterval(jumpInterval);
                    officer.position.y = 0;
                }, 3000);
            };
            
            jumpAnimation();
        });

        if (gameOver) {
            console.log("GAME OVER!");
            setTimeout(() => {
                // This should trigger the main game's reset, not just the police system
                if (this.gameState && typeof this.gameState.reset === 'function') {
                    // We don't call reset directly here, as it will be handled by SkateGame
                    console.log("Game over - ready for reset");
                }
            }, 3000);
        }
    }
    
    updateBustedTextPosition() {
        if (!this.bustedText) return;
        
        // Position in center of screen
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        const widthHalf = width / 2;
        const heightHalf = height / 2;
        
        const vector = new THREE.Vector3(0, 0, 0);
        vector.project(this.camera);
        
        this.bustedText.position.set(
            this.camera.position.x,
            this.camera.position.y,
            this.camera.position.z - 5
        );
        this.bustedText.lookAt(this.camera.position);
    }
    
    updateChasingTextPosition() {
        if (!this.chasingText) return;
        
        // Position above player
        this.chasingText.position.copy(this.skateboard.mesh.position);
        this.chasingText.position.y += 5;
        this.chasingText.lookAt(this.camera.position);
    }
    
    resetGame() {
        // Reset officers
        this.officers.forEach(officer => {
            // Return officers to their original positions
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * this.spawnDistance;
            const z = Math.sin(angle) * this.spawnDistance;
            officer.position.set(x, 0, z);
            officer.userData.originalPos = new THREE.Vector3(x, 0, z);
            officer.userData.isChasing = false;
            officer.userData.pauseTime = 0;
            officer.userData.exploding = false;
            officer.visible = true;
        });
        
        // Clear exploding officers list
        this.explodingOfficers = [];
        
        // Hide UI elements
        this.bustedText.visible = false;
        this.chasingText.visible = false;
    }
    
    // New method to handle officer explosions
    explodeOfficer(officer) {
        if (!officer || officer.userData.exploding) return;
        
        // Mark officer as exploding
        officer.userData.exploding = true;
        
        // Store original position for particles
        const explosionPosition = officer.position.clone();
        
        // Play explosion sound
        if (this.explosionSound) {
            try {
                this.explosionSound.currentTime = 0;
                this.explosionSound.play().catch(e => console.warn("Error playing explosion sound:", e));
            } catch (error) {
                console.warn("Error playing explosion sound:", error);
            }
        }
        
        // Create explosion effect
        this.createExplosionEffect(explosionPosition);
        
        // Hide the officer during explosion
        officer.visible = false;
        
        // Add to exploding officers list to track
        this.explodingOfficers.push({
            officer: officer,
            position: explosionPosition,
            timer: 3.0, // How long until respawn
        });
        
        console.log("Officer exploded due to collision with invincible player!");
    }
    
    // Create explosion particle effect
    createExplosionEffect(position) {
        const particles = [];
        const particleCount = 30;
        
        // Create explosion particles
        for (let i = 0; i < particleCount; i++) {
            // Create different shaped debris
            let particleGeometry;
            const particleType = Math.floor(Math.random() * 3);
            
            if (particleType === 0) {
                particleGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            } else if (particleType === 1) {
                particleGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            } else {
                particleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
            }
            
            // Generate random color for particles (blue/navy uniform color)
            const particleColor = Math.random() > 0.5 ? 0x000080 : 0x000033;
            
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: particleColor,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // Randomize position slightly
            particle.position.x += (Math.random() - 0.5) * 0.5;
            particle.position.y += Math.random() * 0.5 + 0.5; // Start above ground
            particle.position.z += (Math.random() - 0.5) * 0.5;
            
            // Add random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.2 + 0.1,
                (Math.random() - 0.5) * 0.3
            );
            
            // Add random rotation
            const rotation = new THREE.Vector3(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            particle.userData = { 
                velocity, 
                rotation,
                lifetime: 2.0 + Math.random() * 1.0 // Random lifetime between 2-3 seconds
            };
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // Add fire particles (orange/red)
        for (let i = 0; i < 15; i++) {
            const fireGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 8);
            const fireColor = Math.random() > 0.5 ? 0xFF4500 : 0xFF0000; // OrangeRed or Red
            
            const fireMaterial = new THREE.MeshBasicMaterial({
                color: fireColor,
                transparent: true,
                opacity: 0.8
            });
            
            const fire = new THREE.Mesh(fireGeometry, fireMaterial);
            fire.position.copy(position);
            
            // Random position within explosion radius
            fire.position.x += (Math.random() - 0.5) * 1.0;
            fire.position.y += Math.random() * 0.5;
            fire.position.z += (Math.random() - 0.5) * 1.0;
            
            // Upward velocity for fire
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                Math.random() * 0.1 + 0.05,
                (Math.random() - 0.5) * 0.1
            );
            
            fire.userData = { 
                velocity,
                lifetime: 0.5 + Math.random() * 0.5, // Shorter lifetime for fire
                isFlame: true
            };
            
            this.scene.add(fire);
            particles.push(fire);
        }
        
        // Animate particles
        const animateExplosion = () => {
            let hasActiveParticles = false;
            
            particles.forEach(particle => {
                if (particle.userData.lifetime > 0) {
                    // Update position
                    particle.position.add(particle.userData.velocity);
                    
                    // Apply gravity to debris, not to flames
                    if (!particle.userData.isFlame) {
                        particle.userData.velocity.y -= 0.01; // Gravity
                        
                        // Apply rotation for debris
                        particle.rotation.x += particle.userData.rotation.x * 0.05;
                        particle.rotation.y += particle.userData.rotation.y * 0.05;
                        particle.rotation.z += particle.userData.rotation.z * 0.05;
                    } else {
                        // Make flames shrink over time
                        const scale = particle.userData.lifetime * 0.8;
                        particle.scale.set(scale, scale, scale);
                    }
                    
                    // Bounce off ground
                    if (particle.position.y < 0.1 && particle.userData.velocity.y < 0) {
                        particle.userData.velocity.y = -particle.userData.velocity.y * 0.4; // Bounce with damping
                        particle.userData.velocity.x *= 0.8; // Friction
                        particle.userData.velocity.z *= 0.8; // Friction
                    }
                    
                    // Reduce lifetime
                    particle.userData.lifetime -= 0.02;
                    
                    // Update opacity near end of life
                    if (particle.userData.lifetime < 0.5) {
                        particle.material.opacity = particle.userData.lifetime / 0.5;
                    }
                    
                    hasActiveParticles = true;
                } else if (particle.parent) {
                    // Remove dead particles
                    this.scene.remove(particle);
                }
            });
            
            if (hasActiveParticles) {
                requestAnimationFrame(animateExplosion);
            }
        };
        
        animateExplosion();
    }
    
    // Update exploding officers (respawn after timer)
    updateExplodingOfficers(deltaTime) {
        for (let i = this.explodingOfficers.length - 1; i >= 0; i--) {
            const explodingOfficer = this.explodingOfficers[i];
            
            // Update timer
            explodingOfficer.timer -= deltaTime;
            
            // Check if it's time to respawn
            if (explodingOfficer.timer <= 0) {
                const officer = explodingOfficer.officer;
                
                // Reposition at a random location
                const angle = Math.random() * Math.PI * 2;
                const x = Math.cos(angle) * this.spawnDistance;
                const z = Math.sin(angle) * this.spawnDistance;
                
                // Reset officer properties
                officer.position.set(x, 0, z);
                officer.userData.originalPos = new THREE.Vector3(x, 0, z);
                officer.userData.exploding = false;
                officer.userData.isChasing = false;
                officer.userData.pauseTime = 0;
                officer.visible = true;
                
                // Remove from exploding list
                this.explodingOfficers.splice(i, 1);
                
                console.log("Officer respawned at new location");
            }
        }
    }
    
    // Clean up officers marked for deletion
    cleanupDeletedOfficers() {
        for (let i = this.officers.length - 1; i >= 0; i--) {
            if (this.officers[i].userData.toDelete) {
                this.scene.remove(this.officers[i]);
                this.officers.splice(i, 1);
            }
        }
    }
} 