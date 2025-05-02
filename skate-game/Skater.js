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
        
        // Create the skater model
        this.createSkater();
        
        // Add to scene if provided
        if (scene) {
            scene.add(this.mesh);
        }
    }
    
    createSkater() {
        // Colors
        const skinColor = 0xf1c27d;
        const shirtColor = 0x4a90e2;
        const pantsColor = 0x232323;
        const shoeColor = 0x111111;
        const hairColor = 0x3d2314;
        
        // Create head
        const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 1.1, 0);
        head.castShadow = true;
        head.name = "head";
        this.bodyParts.head = head;
        this.mesh.add(head);
        
        // Create hair
        const hairGeometry = new THREE.SphereGeometry(0.21, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColor });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.set(0, 1.15, 0);
        hair.rotation.x = Math.PI * 0.1;
        hair.castShadow = true;
        this.mesh.add(hair);
        
        // Create body (torso)
        const torsoGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.5, 8);
        const torsoMaterial = new THREE.MeshStandardMaterial({ color: shirtColor });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.set(0, 0.8, 0);
        torso.castShadow = true;
        torso.name = "torso";
        this.bodyParts.torso = torso;
        this.mesh.add(torso);
        
        // Create legs
        const createLeg = (x, color) => {
            const legGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.5, 8);
            const legMaterial = new THREE.MeshStandardMaterial({ color });
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x, 0.45, 0);
            leg.castShadow = true;
            leg.name = "leg";
            this.bodyParts.legs.push(leg);
            this.mesh.add(leg);
            
            // Create shoe
            const shoeGeometry = new THREE.BoxGeometry(0.12, 0.06, 0.18);
            const shoeMaterial = new THREE.MeshStandardMaterial({ color: shoeColor });
            const shoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
            shoe.position.set(x, 0.17, 0.04);
            shoe.castShadow = true;
            this.mesh.add(shoe);
            
            return leg;
        };
        
        const leftLeg = createLeg(-0.1, pantsColor);
        const rightLeg = createLeg(0.1, pantsColor);
        
        // Slightly bend knees for skating stance
        leftLeg.rotation.x = 0.2;
        rightLeg.rotation.x = -0.2;
        
        // Create arms
        const createArm = (x, color) => {
            const armGeometry = new THREE.CylinderGeometry(0.05, 0.04, 0.4, 8);
            const armMaterial = new THREE.MeshStandardMaterial({ color });
            const arm = new THREE.Mesh(armGeometry, armMaterial);
            
            // Position the arm at the shoulder
            arm.position.set(x, 0.9, 0);
            
            // Rotate the arm slightly outward and forward
            const sideRotation = x > 0 ? -0.3 : 0.3;
            arm.rotation.z = sideRotation;
            arm.rotation.x = -0.3;
            
            arm.castShadow = true;
            arm.name = "arm";
            this.bodyParts.arms.push(arm);
            this.mesh.add(arm);
            
            // Create hand
            const handGeometry = new THREE.SphereGeometry(0.04, 8, 8);
            const handMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
            const hand = new THREE.Mesh(handGeometry, handMaterial);
            
            // Position hand at end of arm, accounting for arm rotation
            const armLength = 0.4;
            const handX = x + Math.sin(sideRotation) * armLength;
            const handY = 0.9 - Math.cos(sideRotation) * Math.cos(-0.3) * armLength;
            const handZ = Math.sin(-0.3) * armLength;
            hand.position.set(handX, handY, handZ);
            
            hand.castShadow = true;
            this.mesh.add(hand);
            
            return arm;
        };
        
        const leftArm = createArm(-0.2, shirtColor);
        const rightArm = createArm(0.2, shirtColor);
        
        // Set the skater in a skating stance
        this.mesh.rotation.x = 0.2; // Lean forward slightly
        
        // Position the skater so feet are at y=0
        this.mesh.position.y = 0;
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
} 