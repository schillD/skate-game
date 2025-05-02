import * as THREE from 'three';

export class SkyBox {
    constructor(scene) {
        this.scene = scene;
        this.birds = [];
        console.log("SkyBox constructor called");
        this.createSkybox();
        
        // Ensure birds are created AFTER skybox
        console.log("About to create birds");
        setTimeout(() => {
            this.addRegularBirds(15); // Add regular birds to the skybox with a small delay
            console.log("Birds created:", this.birds.length);
        }, 1000);
        
    }
    

    createSkybox() {
        // Create a skybox using a cube with sky textures
        const skyboxSize = 900;
        
        // Use a single color gradient sky instead of textures for simplicity
        const skyboxGeometry = new THREE.BoxGeometry(skyboxSize, skyboxSize, skyboxSize);
        
        // Create materials for each side of the skybox
        const skyColors = [
            new THREE.Color(0x87CEEB), // Light blue
            new THREE.Color(0x6CA6CD), // Slightly darker blue at the bottom
            new THREE.Color(0xE0F7FF), // Very light blue for horizon
            new THREE.Color(0xFFD700)  // Golden color for sun
        ];
        
        // Create gradient materials
        const materials = [];
        
        for (let i = 0; i < 6; i++) {
            // Create a canvas for dynamic texture generation
            const canvas = document.createElement('canvas');
            canvas.width = 1024; // Higher resolution for better quality
            canvas.height = 1024;
            const context = canvas.getContext('2d');
            
            // Create a gradient based on which face we're creating
            let gradient;
            if (i === 2) { // Top face - blue with transition to lighter horizon
                gradient = context.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#4A90E2'); // Deeper sky blue at zenith
                gradient.addColorStop(0.7, '#87CEEB'); // Light blue
                gradient.addColorStop(1, '#C4E4FF'); // Very light blue/white at horizon
            } else if (i === 3) { // Bottom face - darker
                gradient = context.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#6CA6CD'); // Darker blue
                gradient.addColorStop(1, '#5C96BD'); // Even darker at very bottom
            } else { // Side faces - gradient from bottom to top
                gradient = context.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#E0F7FF'); // Very light blue/white at horizon
                gradient.addColorStop(0.4, '#87CEEB'); // Light blue
                gradient.addColorStop(1, '#4A90E2'); // Deeper blue at top
            }
            
            // Fill with gradient
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add dynamic sun to one of the side faces (east)
            if (i === 1) { // East face - add sun
                const sunX = canvas.width * 0.5;
                const sunY = canvas.height * 0.3; // Position sun above horizon
                const sunRadius = canvas.width * 0.1;
                
                // Create sun glow effect with radial gradient
                const sunGlow = context.createRadialGradient(
                    sunX, sunY, 0,
                    sunX, sunY, sunRadius * 2
                );
                sunGlow.addColorStop(0, 'rgba(255, 255, 190, 1)');
                sunGlow.addColorStop(0.2, 'rgba(255, 215, 0, 0.8)');
                sunGlow.addColorStop(0.5, 'rgba(255, 165, 0, 0.4)');
                sunGlow.addColorStop(1, 'rgba(255, 69, 0, 0)');
                
                context.fillStyle = sunGlow;
                context.beginPath();
                context.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
                context.fill();
                
                // Sun core
                context.fillStyle = '#FFFFA0';
                context.beginPath();
                context.arc(sunX, sunY, sunRadius * 0.7, 0, Math.PI * 2);
                context.fill();
            }
            
            // Add various cloud types to the sides and top (except bottom)
            if (i !== 3) {
                // Large cumulus clouds
                this.drawClouds(context, canvas, i);
            }
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            materials.push(new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }));
        }
        
        const skybox = new THREE.Mesh(skyboxGeometry, materials);
        this.scene.add(skybox);
    }
    
    drawClouds(context, canvas, faceIndex) {
        // Different cloud types based on the face
        if (faceIndex === 2) { // Top face - sparse cirrus clouds
            // Cirrus clouds
            context.fillStyle = 'rgba(255, 255, 255, 0.15)';
            for (let c = 0; c < 20; c++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const width = 100 + Math.random() * 150;
                const height = 2 + Math.random() * 4;
                const angle = Math.random() * Math.PI;
                
                context.save();
                context.translate(x, y);
                context.rotate(angle);
                context.beginPath();
                context.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
                context.fill();
                context.restore();
            }
        } else { // Side faces - mix of cloud types
            // Fluffy cumulus clouds
            const cloudCount = 5 + Math.floor(Math.random() * 5);
            
            for (let c = 0; c < cloudCount; c++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height * 0.5; // Keep clouds in upper half
                const cloudSize = 30 + Math.random() * 60;
                
                // Create each puffy cloud with multiple overlapping circles
                const segments = 5 + Math.floor(Math.random() * 7);
                const baseOpacity = 0.6 + Math.random() * 0.3;
                
                for (let s = 0; s < segments; s++) {
                    const segmentX = x + (Math.random() * cloudSize - cloudSize/2);
                    const segmentY = y + (Math.random() * cloudSize/2 - cloudSize/4);
                    const segmentSize = cloudSize * (0.4 + Math.random() * 0.6);
                    
                    // Vary opacity to give clouds some depth
                    context.fillStyle = `rgba(255, 255, 255, ${baseOpacity})`;
                    context.beginPath();
                    context.arc(segmentX, segmentY, segmentSize, 0, Math.PI * 2);
                    context.fill();
                }
            }
            
            // Add some thin wispy clouds
            context.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let c = 0; c < 10; c++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height * 0.4; // Higher up
                const width = 70 + Math.random() * 120;
                const height = 3 + Math.random() * 8;
                
                context.beginPath();
                context.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
                context.fill();
            }
        }
    }
    
    addRegularBirds(count) {
        console.log(`Adding ${count} regular birds to the skybox`);
        
        // Add birds in random positions, away from player
        for (let i = 0; i < count; i++) {
            // Position birds high up and far away
            const x = Math.random() * 200 - 100;   // -100 to 100
            const y = Math.random() * 20 + 15;     // 15 to 35 (higher altitude)
            const z = Math.random() * 200 - 100;   // -100 to 100
            
            // More subtle natural colors
            const naturalColors = [
                0x7d7d7d, // Gray
                0x8b4513, // Brown
                0x556b2f, // Dark olive green
                0x4682b4, // Steel blue
                0xcd853f  // Peru (brownish)
            ];
            const color = naturalColors[Math.floor(Math.random() * naturalColors.length)];
            
            this.createBird(x, y, z, color);
        }
        
        console.log(`Created ${this.birds.length} regular birds`);
    }
    
    createBird(x, y, z, color) {
        // Create a simple, brightly colored bird
        const birdGroup = new THREE.Group();
        
        // Bird body (simple cone shape)
        const bodyGeometry = new THREE.ConeGeometry(0.4, 1.2, 4);
        bodyGeometry.rotateX(Math.PI / 2); // Rotate to point forward
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        birdGroup.add(body);
        
        // Bird wings (simple planes)
        const wingGeometry = new THREE.PlaneGeometry(1.2, 0.4);
        const wingMaterial = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide
        });
        
        // Left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.6, 0, -0.2);
        leftWing.rotation.z = -Math.PI / 4;
        birdGroup.add(leftWing);
        
        // Right wing
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.6, 0, -0.2);
        rightWing.rotation.z = Math.PI / 4;
        birdGroup.add(rightWing);
        
        // Store wings for animation
        birdGroup.userData.wings = [leftWing, rightWing];
        
        // Position the bird
        birdGroup.position.set(x, y, z);
        
        // Randomize initial rotation
        birdGroup.rotation.y = Math.random() * Math.PI * 2;
        
        // Flight animation parameters
        birdGroup.userData.speed = 0.03 + Math.random() * 0.02;
        birdGroup.userData.direction = new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 0.2 - 0.1,
            Math.random() * 2 - 1
        ).normalize();
        birdGroup.userData.wingSpeed = 0.15 + Math.random() * 0.1;
        birdGroup.userData.wingTime = Math.random() * Math.PI;
        
        // Add to scene and store reference
        this.scene.add(birdGroup);
        this.birds.push(birdGroup);
        
        return birdGroup;
    }
    
    update(deltaTime) {
        // Check if birds array exists
        if (!this.birds || !Array.isArray(this.birds)) {
            console.warn("Birds array not properly initialized in update method");
            return;
        }

        // Log periodically (approximately once every 300 frames)
        if (Math.random() < 0.003) {
            console.log(`Updating ${this.birds.length} birds in skybox`);
        }
        
        // Animate birds with error handling
        this.birds.forEach((bird, index) => {
            // Skip if bird is invalid
            if (!bird || !bird.position || !bird.userData) {
                return;
            }
            
            try {
                // Move the bird
                const movement = bird.userData.direction.clone()
                    .multiplyScalar(bird.userData.speed);
                bird.position.add(movement);
                
                // Rotate to face direction of movement
                bird.lookAt(bird.position.clone().add(bird.userData.direction));
                
                // Animate wings
                bird.userData.wingTime += bird.userData.wingSpeed;
                const wingFlapAmount = Math.sin(bird.userData.wingTime) * 0.5 + 0.2;
                
                // Apply wing animation
                if (bird.userData.wings) {
                    bird.userData.wings[0].rotation.z = -Math.PI / 4 - wingFlapAmount;
                    bird.userData.wings[1].rotation.z = Math.PI / 4 + wingFlapAmount;
                }
                
                // Wrap around when bird flies too far
                this.wrapBirdPosition(bird);
            } catch (error) {
                console.error(`Error animating bird at index ${index}:`, error);
            }
        });
    }
    
    wrapBirdPosition(bird) {
        // Skip if bird is invalid
        if (!bird || !bird.position) {
            console.warn("Invalid bird passed to wrapBirdPosition");
            return;
        }
        
        try {
            const limit = 200;
            const pos = bird.position;
            
            // If bird flies too far in any direction, wrap around to the opposite side
            if (pos.x < -limit) pos.x = limit;
            if (pos.x > limit) pos.x = -limit;
            
            // Keep birds at a reasonable height
            if (pos.y < 2) pos.y = 2;
            if (pos.y > 20) pos.y = 20;
            
            if (pos.z < -limit) pos.z = limit;
            if (pos.z > limit) pos.z = -limit;
        } catch (error) {
            console.error("Error in wrapBirdPosition:", error);
        }
    }
} 