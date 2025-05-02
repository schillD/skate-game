import * as THREE from 'three';

export class SheepSystem {
    constructor(scene, count = 5) {
        this.scene = scene;
        this.sheep = [];
        this.count = count;
        this.skateparkRadius = 50; // Bring sheep even closer
        
        // Create sheep directly in player's view
        this.createDebugSheep();
        
        // Movement parameters
        this.movementTimer = 0;
        this.movementUpdateFrequency = 5;
        
        console.log("Sheep system initialized with", count, "sheep");
    }

    createDebugSheep() {
        console.log("Creating debug sheep");
        
        // Create sheep in locations around the environment, not in the center
        this.createFixedSheep(40, 0, -40);   // Far front
        this.createFixedSheep(35, 0, 30);   // To the right
        this.createFixedSheep(-35, 0, 40);  // To the left
        
        // Few more sheep in distant positions
        this.createFixedSheep(45, 0, -15);
        this.createFixedSheep(-45, 0, -25);
    }
    
    createFixedSheep(x, y, z) {
        const sheep = this.createSheepMesh();
        sheep.position.set(x, y + 1.0, z);
        sheep.scale.set(2, 2, 2); // Make them visible but not too large
        
        // Store base height for animation
        sheep.userData.baseHeight = y + 1.0;
        
        // Add a glowing marker above the sheep
        const markerGeometry = new THREE.SphereGeometry(1, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.7
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(0, 5, 0); // Position above the sheep
        sheep.add(marker);
        
        // Add to scene
        this.scene.add(sheep);
        this.sheep.push(sheep);
        console.log("Created fixed sheep at", x, y, z);
        
        return sheep;
    }

    createSheepMesh() {
        // Create a sheep model using simple shapes
        const sheepGroup = new THREE.Group();
        
        // Sheep body - super bright
        const bodyGeometry = new THREE.CapsuleGeometry(1.0, 1.5, 8, 8);
        bodyGeometry.rotateZ(Math.PI / 2);
        
        const bodyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF, // White for sheep body
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        sheepGroup.add(body);
        
        // Sheep head
        const headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const headMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, // Bright red
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(1.2, 0, 0);
        sheepGroup.add(head);
        
        // Legs
        const legPositions = [
            [0.5, 0.5, 0.6],
            [0.5, 0.5, -0.6],
            [-0.5, 0.5, 0.6],
            [-0.5, 0.5, -0.6]
        ];
        
        legPositions.forEach(pos => {
            const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.0);
            const legMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue legs
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos[0], pos[1] - 1.0, pos[2]);
            sheepGroup.add(leg);
        });
        
        // Store leg references for animation
        sheepGroup.userData.legs = sheepGroup.children.slice(2);
        
        return sheepGroup;
    }
    
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    update(deltaTime) {
        // Make sheep bounce up and down to be more visible
        // Use deltaTime to ensure consistent animation speed at any frame rate
        this.sheep.forEach((sheep, index) => {
            // Store animation time in each sheep's userData
            if (!sheep.userData.animTime) {
                sheep.userData.animTime = index * 0.5; // Initial offset based on index
            }
            
            // Update animation time based on deltaTime (consistent across any frame rate)
            sheep.userData.animTime += deltaTime;
            
            const bounceHeight = 0.5;
            const bounceSpeed = 2;
            
            // Get the base height (or use current position if not set)
            const baseHeight = sheep.userData.baseHeight || sheep.position.y;
            
            // Use the accumulated time for smooth consistent animation
            const newY = Math.sin(sheep.userData.animTime * bounceSpeed) * bounceHeight + baseHeight;
            sheep.position.y = newY;
            
            // Rotate to face the player (scaled by deltaTime for consistent speed)
            const rotationSpeed = 0.6; // degrees per second
            sheep.rotation.y += rotationSpeed * deltaTime;
            
            // Animate legs
            if (sheep.userData.legs) {
                sheep.userData.legs.forEach((leg, legIndex) => {
                    // Make legs move dramatically (scaled by deltaTime)
                    const legAnimSpeed = 0.3; // Movement speed
                    const legAngle = Math.sin((sheep.userData.animTime * legAnimSpeed) + (legIndex * Math.PI/2)) * 0.3;
                    leg.rotation.x = legAngle;
                });
            }
        });
    }
} 