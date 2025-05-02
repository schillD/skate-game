import * as THREE from 'three';

export class BirdSystem {
    constructor(scene, count = 10) {
        this.scene = scene;
        this.birds = [];
        this.count = count;
        
        // Create birds in very visible locations
        this.createDebugBirds();
        
        this.bounds = {
            minX: -50,
            maxX: 50,
            minY: 3,
            maxY: 10,
            minZ: -50,
            maxZ: 50
        };
        
        console.log("Bird system initialized with", count, "birds");
    }

    createDebugBirds() {
        console.log("Creating debug birds");
        
        // Create a few birds in very specific locations
        this.createFixedBird(0, 5, -20);  // Directly in front of starting position
        this.createFixedBird(10, 8, -30);
        this.createFixedBird(-10, 6, -25);
        
        // Add remaining birds
        for (let i = 0; i < this.count - 3; i++) {
            this.createBird();
        }
    }
    
    createFixedBird(x, y, z) {
        const bird = this.createBirdMesh();
        bird.position.set(x, y, z);
        bird.scale.set(5, 5, 5); // Make fixed birds enormous
        
        // Add a glowing sphere around the bird to make it super visible
        const glowGeometry = new THREE.SphereGeometry(2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff, 
            transparent: true,
            opacity: 0.5
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        bird.add(glow);
        
        // Add to scene
        this.scene.add(bird);
        this.birds.push(bird);
        console.log("Created fixed bird at", x, y, z);
        
        return bird;
    }

    createBird() {
        const birdGroup = this.createBirdMesh();
        
        // Random position - keep birds in a smaller area and lower
        birdGroup.position.set(
            this.randomRange(-30, 30),
            this.randomRange(3, 10),
            this.randomRange(-30, 30)
        );
        
        // Random flight direction
        birdGroup.userData.velocity = new THREE.Vector3(
            this.randomRange(-0.1, 0.1),
            this.randomRange(-0.02, 0.02),
            this.randomRange(-0.1, 0.1)
        );
        
        // Wing flap animation parameters
        birdGroup.userData.wingFlapSpeed = this.randomRange(0.1, 0.2);
        birdGroup.userData.wingFlapTime = Math.random() * Math.PI * 2;
        
        // Make birds huge and visible
        birdGroup.scale.set(4, 4, 4);
        
        // Add to scene
        this.scene.add(birdGroup);
        this.birds.push(birdGroup);
        
        return birdGroup;
    }
    
    createBirdMesh() {
        // Create a simple bird shape
        const birdGroup = new THREE.Group();
        
        // Bird body - use a bright color
        const bodyGeometry = new THREE.ConeGeometry(0.5, 1.5, 4);
        bodyGeometry.rotateX(Math.PI / 2);
        const bodyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,  // Bright red
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        birdGroup.add(body);
        
        // Bird head
        const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const headMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00, // Bright yellow
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0, -0.7);
        birdGroup.add(head);
        
        // Bird wings - bigger and brighter
        const createWing = (side) => {
            const wingGeometry = new THREE.PlaneGeometry(1.5, 0.5);
            const wingMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff, // Bright cyan
                side: THREE.DoubleSide,
            });
            const wing = new THREE.Mesh(wingGeometry, wingMaterial);
            wing.position.set(side * 0.6, 0, -0.1);
            wing.rotation.z = side * Math.PI / 4;
            
            birdGroup.userData.wing = wing;
            birdGroup.add(wing);
            
            return wing;
        };
        
        const leftWing = createWing(-1);
        const rightWing = createWing(1);
        
        // Store wings for animation
        birdGroup.userData.wings = [leftWing, rightWing];
        
        return birdGroup;
    }

    getRandomBirdColor() {
        // Super bright neon colors
        const colors = [
            0xff0000, // Bright red
            0x00ff00, // Bright green
            0x0000ff, // Bright blue
            0xffff00, // Bright yellow
            0xff00ff, // Bright magenta
            0x00ffff, // Bright cyan
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    update(deltaTime) {
        // Animate each bird
        this.birds.forEach(bird => {
            // Update position based on velocity
            if (bird.userData.velocity) {
                bird.position.add(bird.userData.velocity);
            
                // Change direction slightly for natural movement
                bird.userData.velocity.x += this.randomRange(-0.005, 0.005);
                bird.userData.velocity.y += this.randomRange(-0.002, 0.002);
                bird.userData.velocity.z += this.randomRange(-0.005, 0.005);
                
                // Limit velocity
                bird.userData.velocity.x = Math.max(-0.2, Math.min(0.2, bird.userData.velocity.x));
                bird.userData.velocity.y = Math.max(-0.05, Math.min(0.05, bird.userData.velocity.y));
                bird.userData.velocity.z = Math.max(-0.2, Math.min(0.2, bird.userData.velocity.z));
                
                // Set bird rotation to match velocity direction
                if (bird.userData.velocity.length() > 0.01) {
                    const direction = bird.userData.velocity.clone().normalize();
                    bird.lookAt(bird.position.clone().add(direction));
                }
                
                // Check bounds
                this.checkBounds(bird);
            }
            
            // Animate wings flapping if this bird has wings
            if (bird.userData.wings && bird.userData.wingFlapSpeed) {
                bird.userData.wingFlapTime += bird.userData.wingFlapSpeed;
                const wingFlapAmount = Math.sin(bird.userData.wingFlapTime) * 0.5 + 0.2;
                
                bird.userData.wings.forEach((wing, index) => {
                    const side = index === 0 ? -1 : 1;
                    wing.rotation.z = side * (Math.PI / 4 + wingFlapAmount);
                });
            }
        });
    }

    checkBounds(bird) {
        const pos = bird.position;
        
        if (pos.x < this.bounds.minX) pos.x = this.bounds.maxX;
        if (pos.x > this.bounds.maxX) pos.x = this.bounds.minX;
        
        if (pos.y < this.bounds.minY) pos.y = this.bounds.minY;
        if (pos.y > this.bounds.maxY) pos.y = this.bounds.maxY;
        
        if (pos.z < this.bounds.minZ) pos.z = this.bounds.maxZ;
        if (pos.z > this.bounds.maxZ) pos.z = this.bounds.minZ;
    }
} 