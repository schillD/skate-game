import * as THREE from 'three';

export class Skater {
    constructor(scene) {
        // Create skater group
        this.mesh = new THREE.Group();
        
        // Store references to body parts for animation
        this.bodyParts = {
            legs: [],
            arms: [],
            torso: null,
            head: null
        };
        
        // Animation properties
        this.animationTime = 0;
        this.lastSkateboardPosition = new THREE.Vector3();
        this.movementSpeed = 0;
        this.isTurning = false;
        this.turnDirection = 0;
        this.lastRotation = 0;
        this.leanAmount = 0;
        
        // Glow effect for invincibility
        this.glowEffect = null;
        this.isGlowing = false;
        
        // Create the skater model
        this.createSkater();
        
        // Add to scene if provided
        if (scene) {
            scene.add(this.mesh);
        }
    }

    createSkater() {
        // Create a more realistic color scheme
        const skinTone = 0xe0ac69; // More realistic skin tone
        const shirtColor = 0x3366cc; // Blue shirt
        const pantsColor = 0x222222; // Dark jeans
        const shoeColor = 0x111111; // Black shoes
        const hairColor = 0x3d2314; // Brown hair
        
        // Create a more detailed head with facial features
        const headGroup = new THREE.Group();
        
        // Base head
        const headGeometry = new THREE.SphereGeometry(0.2, 24, 24);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: skinTone,
            roughness: 0.7,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        headGroup.add(head);
        this.bodyParts.head = head;
        
        // More natural hair (using shape)
        const hairGroup = new THREE.Group();
        
        // Top hair
        const hairTopGeometry = new THREE.SphereGeometry(0.21, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2);
        const hairMaterial = new THREE.MeshStandardMaterial({ 
            color: hairColor,
            roughness: 0.9,
            metalness: 0.0
        });
        const hairTop = new THREE.Mesh(hairTopGeometry, hairMaterial);
        hairTop.position.y = 0.05;
        hairTop.rotation.x = Math.PI * 0.1;
        hairGroup.add(hairTop);
        
        // Side hair
        const hairSideGeometry = new THREE.CylinderGeometry(0.21, 0.18, 0.2, 16);
        const hairSide1 = new THREE.Mesh(hairSideGeometry, hairMaterial);
        hairSide1.position.set(0, -0.05, 0);
        hairSide1.scale.set(0.7, 1, 0.85);
        hairGroup.add(hairSide1);
        
        // Position hair group on head
        hairGroup.position.y = 0.05;
        headGroup.add(hairGroup);
        
        // Add eyes
        const eyeGeometry = new THREE.SphereGeometry(0.03, 12, 12);
        const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const eyeIrisMaterial = new THREE.MeshBasicMaterial({ color: 0x3366ff });
        
        // Create eye structure
        const createEye = (xPos) => {
            const eyeGroup = new THREE.Group();
            
            // White of eye
            const eyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
            eyeGroup.add(eyeWhite);
            
            // Iris (smaller)
            const irisGeometry = new THREE.SphereGeometry(0.018, 12, 12);
            const iris = new THREE.Mesh(irisGeometry, eyeIrisMaterial);
            iris.position.z = 0.02;
            eyeGroup.add(iris);
            
            // Pupil (black, even smaller)
            const pupilGeometry = new THREE.SphereGeometry(0.008, 8, 8);
            const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
            pupil.position.z = 0.025;
            eyeGroup.add(pupil);
            
            // Position the eye group
            eyeGroup.position.set(xPos, 0.03, 0.17);
            eyeGroup.rotation.y = Math.PI * 0.07; // Slight angle
            return eyeGroup;
        };
        
        // Add left and right eyes
        const leftEye = createEye(-0.07);
        const rightEye = createEye(0.07);
        headGroup.add(leftEye);
        headGroup.add(rightEye);
        
        // Add mouth
        const mouthGeometry = new THREE.TorusGeometry(0.05, 0.01, 8, 12, Math.PI * 0.6);
        const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x990000 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.06, 0.17);
        mouth.rotation.set(Math.PI * 0.1, 0, 0);
        headGroup.add(mouth);
        
        // Position the head
        headGroup.position.set(0, 1.1, 0);
        headGroup.rotation.y = Math.PI; // Face forward
        this.mesh.add(headGroup);
        
        // Create a more detailed torso with better proportions
        const torsoGroup = new THREE.Group();
        
        // Upper body (uses a slightly more complex shape)
        const upperBodyGeometry = new THREE.CylinderGeometry(0.2, 0.18, 0.3, 12);
        const shirtMaterial = new THREE.MeshStandardMaterial({ 
            color: shirtColor,
            roughness: 0.7,
            metalness: 0.1
        });
        const upperBody = new THREE.Mesh(upperBodyGeometry, shirtMaterial);
        upperBody.position.y = 0.15;
        torsoGroup.add(upperBody);
        this.bodyParts.torso = upperBody;
        
        // Lower body (narrower at waist)
        const lowerBodyGeometry = new THREE.CylinderGeometry(0.18, 0.15, 0.25, 12);
        const lowerBody = new THREE.Mesh(lowerBodyGeometry, shirtMaterial);
        lowerBody.position.y = -0.15;
        torsoGroup.add(lowerBody);
        
        // Add a simple collar/neck detail
        const collarGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12);
        const collar = new THREE.Mesh(collarGeometry, shirtMaterial);
        collar.position.y = 0.3;
        torsoGroup.add(collar);
        
        // Position torso
        torsoGroup.position.set(0, 0.8, 0);
        this.mesh.add(torsoGroup);
        
        // Create more detailed legs
        const createLeg = (x, isLeft) => {
            const legGroup = new THREE.Group();
            
            // Thigh (upper leg)
            const thighGeometry = new THREE.CylinderGeometry(0.07, 0.06, 0.25, 12);
            const pantsMaterial = new THREE.MeshStandardMaterial({ 
                color: pantsColor,
                roughness: 0.8,
                metalness: 0.0
            });
            const thigh = new THREE.Mesh(thighGeometry, pantsMaterial);
            thigh.position.y = -0.125;
            legGroup.add(thigh);
            
            // Lower leg
            const calfGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.25, 12);
            const calf = new THREE.Mesh(calfGeometry, pantsMaterial);
            calf.position.y = -0.375;
            legGroup.add(calf);
            
            // Shoe
            const shoeGeometry = new THREE.BoxGeometry(0.12, 0.06, 0.2);
            const shoeMaterial = new THREE.MeshStandardMaterial({ 
                color: shoeColor,
                roughness: 0.5,
                metalness: 0.2
            });
            const shoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
            shoe.position.set(0, -0.55, 0.04);
            legGroup.add(shoe);
            
            // Position the leg group
            legGroup.position.set(x, 0.55, 0);
            
            // Slightly bend knees for skating stance
            legGroup.rotation.x = isLeft ? 0.2 : -0.2;
            
            this.bodyParts.legs.push(legGroup);
            return legGroup;
        };
        
        // Add legs
        const leftLeg = createLeg(-0.1, true);
        const rightLeg = createLeg(0.1, false);
        this.mesh.add(leftLeg);
        this.mesh.add(rightLeg);
        
        // Create more detailed arms
        const createArm = (x, isLeft) => {
            const armGroup = new THREE.Group();
            
            // Upper arm
            const upperArmGeometry = new THREE.CylinderGeometry(0.05, 0.045, 0.22, 12);
            const upperArmMaterial = new THREE.MeshStandardMaterial({ 
                color: shirtColor,
                roughness: 0.7,
                metalness: 0.1
            });
            const upperArm = new THREE.Mesh(upperArmGeometry, upperArmMaterial);
            upperArm.position.y = -0.11;
            armGroup.add(upperArm);
            
            // Lower arm
            const lowerArmGeometry = new THREE.CylinderGeometry(0.045, 0.04, 0.22, 12);
            const skinMaterial = new THREE.MeshStandardMaterial({ 
                color: skinTone,
                roughness: 0.7,
                metalness: 0.0
            });
            const lowerArm = new THREE.Mesh(lowerArmGeometry, skinMaterial);
            lowerArm.position.y = -0.33;
            armGroup.add(lowerArm);
            
            // Hand
            const handGeometry = new THREE.SphereGeometry(0.04, 12, 12);
            const hand = new THREE.Mesh(handGeometry, skinMaterial);
            hand.position.y = -0.45;
            armGroup.add(hand);
            
            // Position the arm group at shoulder
            armGroup.position.set(x, 0.95, 0);
            
            // Rotate arms slightly out and forward
            const sideRotation = isLeft ? 0.3 : -0.3;
            armGroup.rotation.z = sideRotation;
            armGroup.rotation.x = -0.3;
            
            this.bodyParts.arms.push(armGroup);
            return armGroup;
        };
        
        // Add arms
        const leftArm = createArm(-0.2, true);
        const rightArm = createArm(0.2, false);
        this.mesh.add(leftArm);
        this.mesh.add(rightArm);
        
        // Set the skater in a skating stance
        this.mesh.rotation.x = 0.2; // Lean forward slightly
    }
    
    update(skateboardPosition, skateboardRotation, isJumping, inAir, moveX = 0, moveZ = 0) {
        try {
            // Safety checks to prevent errors
            if (!skateboardPosition) return;
            
            // Calculate rotation change
            const rotationDelta = skateboardRotation - this.lastRotation;
            this.lastRotation = skateboardRotation || 0;
            
            // Determine turning state
            this.isTurning = Math.abs(moveX) > 0.01;
            this.turnDirection = moveX;
            
            // Calculate speed
            const positionDelta = this.lastSkateboardPosition.distanceTo(skateboardPosition);
            if (positionDelta > 0) {
                this.movementSpeed = THREE.MathUtils.lerp(this.movementSpeed, positionDelta * 60, 0.1);
                this.movementSpeed = Math.min(this.movementSpeed, 5);
            } else {
                this.movementSpeed *= 0.9;
            }
            this.lastSkateboardPosition.copy(skateboardPosition);
            
            // Increment animation time
            this.animationTime += 0.1;
            
            // Position skater on the skateboard
            this.mesh.position.copy(skateboardPosition);
            this.mesh.position.y += 0.35; // Raise slightly above the board
            
            // Match skateboard's direction
            this.mesh.rotation.y = skateboardRotation || 0;
            
            // Apply animations based on movement state
            this.animateSkater(isJumping, inAir, moveX, moveZ);
        } catch (error) {
            console.error("Error in Skater.update:", error);
        }
    }
    
    animateSkater(isJumping, inAir, moveX, moveZ) {
        try {
            // Reset legs to default stance
            this.bodyParts.legs.forEach((leg, index) => {
                if (!leg) return;
                
                if (index === 0) { // Left leg
                    leg.rotation.x = 0.2;
                    leg.rotation.z = 0;
                } else { // Right leg
                    leg.rotation.x = -0.2;
                    leg.rotation.z = 0;
                }
            });
            
            // Handle forward/backward movement first
            let targetLean = 0;
            
            // Forward lean when moving
            const forwardLean = moveZ < 0 ? 0.25 : 0.15; // Lean more when moving forward
            this.mesh.rotation.x = forwardLean;
            
            // Then handle turning - with reduced effect when moving forward
            if (this.isTurning) {
                // Smaller lean when moving forward+turning (fix for the bug)
                if (Math.abs(moveZ) > 0.01 && moveZ < 0) {
                    // Reduced lean effect when moving forward and turning
                    targetLean = -this.turnDirection * Math.min(0.1, Math.abs(moveX));
                    
                    // Adjust legs for a more stable stance when moving forward+turning
                    if (moveX > 0 && this.bodyParts.legs[0] && this.bodyParts.legs[1]) { // Right turn
                        this.bodyParts.legs[0].rotation.x = 0.15; // Left leg less bent
                        this.bodyParts.legs[1].rotation.x = -0.25; // Right leg more bent
                    } else if (this.bodyParts.legs[0] && this.bodyParts.legs[1]) { // Left turn
                        this.bodyParts.legs[0].rotation.x = 0.25; // Left leg more bent
                        this.bodyParts.legs[1].rotation.x = -0.15; // Right leg less bent
                    }
                } else {
                    // Standard turning lean when not moving forward
                    targetLean = -this.turnDirection * Math.min(0.2, Math.abs(moveX) * 2);
                    
                    // More dramatic leg positions for turning in place
                    if (moveX > 0 && this.bodyParts.legs[0] && this.bodyParts.legs[1]) { // Right turn
                        this.bodyParts.legs[0].rotation.x = 0.1; // Left leg straightens
                        this.bodyParts.legs[1].rotation.x = -0.3; // Right leg bends more
                    } else if (this.bodyParts.legs[0] && this.bodyParts.legs[1]) { // Left turn
                        this.bodyParts.legs[0].rotation.x = 0.3; // Left leg bends more
                        this.bodyParts.legs[1].rotation.x = -0.1; // Right leg straightens
                    }
                }
            }
            
            // Smooth lean transition - prevents sudden body movements
            this.leanAmount = THREE.MathUtils.lerp(this.leanAmount, targetLean, 0.15);
            this.mesh.rotation.z = this.leanAmount;
            
            // Apply movement animations when on ground
            if (!isJumping && !inAir && this.movementSpeed > 0.1) {
                // Calculate animation intensity based on speed
                const intensity = Math.min(1, this.movementSpeed / 2);
                
                // Add subtle pumping animation for forward movement
                if (moveZ < 0) {
                    // Reduced animation during combined forward+turning (fixes bug)
                    const pumpIntensity = this.isTurning ? intensity * 0.5 : intensity;
                    
                    // Leg pumping animation
                    this.bodyParts.legs.forEach((leg, index) => {
                        if (!leg) return;
                        
                        const phase = index === 0 ? 0 : Math.PI; // Legs move opposite each other
                        const pumpAmount = Math.sin(this.animationTime * 2.5 + phase) * 0.1 * pumpIntensity;
                        leg.rotation.x += pumpAmount;
                    });
                    
                    // Subtle arm swinging
                    this.bodyParts.arms.forEach((arm, index) => {
                        if (!arm) return;
                        
                        const phase = index === 0 ? Math.PI : 0; // Arms opposite to legs
                        const swingAmount = Math.sin(this.animationTime * 2.5 + phase) * 0.08 * pumpIntensity;
                        arm.rotation.x += swingAmount;
                    });
                }
            }
            
            // Special animations for jumps
            if (isJumping || inAir) {
                // Tuck legs for jump
                this.bodyParts.legs.forEach(leg => {
                    if (!leg) return;
                    leg.rotation.x = (leg.rotation.x * 0.3) + (0.4 * 0.7); // Blend to tucked position
                });
                
                // Arms adjust for balance
                this.bodyParts.arms.forEach(arm => {
                    if (!arm) return;
                    arm.rotation.x = Math.min(arm.rotation.x, -0.4); // Arms forward for balance
                });
                
                // Skater leans forward in air
                this.mesh.rotation.x = 0.3;
                
                // Reduced side lean in air for stability
                this.mesh.rotation.z = this.leanAmount * 0.5;
            }
        } catch (error) {
            console.error("Error in Skater.animateSkater:", error);
        }
    }
    
    // Add a method to toggle invincibility glow effect
    setInvincibility(isInvincible) {
        if (isInvincible && !this.isGlowing) {
            this.addGlowEffect();
        } else if (!isInvincible && this.isGlowing) {
            this.removeGlowEffect();
        }
        
        // Update the glow effect if it exists
        if (this.isGlowing && this.glowEffect) {
            // Pulse the glow effect
            const time = performance.now() * 0.001;
            const scale = 1.0 + Math.sin(time * 5) * 0.1;
            this.glowEffect.scale.set(scale, scale, scale);
            
            // Rainbow color effect
            const hue = (time * 50) % 360;
            const color = new THREE.Color(`hsl(${hue}, 100%, 70%)`);
            if (this.glowEffect.material) {
                this.glowEffect.material.color = color;
            }
        }
    }
    
    addGlowEffect() {
        if (this.glowEffect) return; // Already has glow effect
        
        // Create a glow effect around the skater
        const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF1493, // Deep pink
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide,
        });
        
        this.glowEffect = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowEffect.position.y = 0.5; // Center on skater
        this.mesh.add(this.glowEffect);
        this.isGlowing = true;
        
        // Add particle effect for extra flair
        this.createParticleEffect();
    }
    
    createParticleEffect() {
        // Create a group for particles
        this.particles = [];
        
        // Create particles
        for (let i = 0; i < 15; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around skater
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.8 + Math.random() * 0.7;
            particle.position.x = Math.cos(angle) * radius;
            particle.position.z = Math.sin(angle) * radius;
            particle.position.y = Math.random() * 1.5;
            
            // Store animation data in userData
            particle.userData = {
                angle: angle,
                radius: radius,
                speed: 0.5 + Math.random() * 1.5,
                ySpeed: -0.01 + Math.random() * 0.02,
                originalY: particle.position.y
            };
            
            this.mesh.add(particle);
            this.particles.push(particle);
        }
    }
    
    updateParticles() {
        if (!this.particles || !this.isGlowing) return;
        
        const time = performance.now() * 0.001;
        
        this.particles.forEach(particle => {
            // Update angle for orbit
            particle.userData.angle += particle.userData.speed * 0.01;
            
            // Update position in orbit
            particle.position.x = Math.cos(particle.userData.angle) * particle.userData.radius;
            particle.position.z = Math.sin(particle.userData.angle) * particle.userData.radius;
            
            // Oscillate y position
            particle.position.y = particle.userData.originalY + Math.sin(time * particle.userData.speed) * 0.3;
            
            // Update color based on time
            const hue = (time * 50 + particle.userData.angle * 30) % 360;
            particle.material.color.setHSL(hue/360, 1, 0.7);
        });
    }
    
    removeGlowEffect() {
        if (this.glowEffect) {
            this.mesh.remove(this.glowEffect);
            this.glowEffect.geometry.dispose();
            this.glowEffect.material.dispose();
            this.glowEffect = null;
        }
        
        // Remove particles
        if (this.particles) {
            this.particles.forEach(particle => {
                this.mesh.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
            });
            this.particles = [];
        }
        
        this.isGlowing = false;
    }
}
