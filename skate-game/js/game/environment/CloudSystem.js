import * as THREE from 'three';

export class CloudSystem {
    constructor(scene) {
        this.scene = scene;
        this.clouds = [];
        
        // Cloud system configuration
        this.cloudCount = 12;        // Number of clouds to create
        this.minHeight = 20;         // Minimum cloud height
        this.maxHeight = 60;         // Maximum cloud height
        this.minScale = 4;           // Minimum cloud scale
        this.maxScale = 12;          // Maximum cloud scale
        this.areaSize = 300;         // Area in which clouds can spawn
        this.minSpeed = 0.05;        // Minimum cloud movement speed
        this.maxSpeed = 0.2;         // Maximum cloud movement speed
        this.windDirection = new THREE.Vector3(-1, 0, 0.2).normalize(); // Wind direction
        
        // Create initial clouds
        this.createClouds();
    }
    
    createClouds() {
        // Create several clouds with random positions and sizes
        for (let i = 0; i < this.cloudCount; i++) {
            this.createCloud(
                (Math.random() * this.areaSize) - (this.areaSize / 2),  // x
                this.minHeight + Math.random() * (this.maxHeight - this.minHeight), // y
                (Math.random() * this.areaSize) - (this.areaSize / 2),  // z
                this.minScale + Math.random() * (this.maxScale - this.minScale) // scale
            );
        }
    }
    
    createCloud(x, y, z, scale) {
        // Create a cloud group to hold all particles
        const cloud = new THREE.Group();
        
        // Cloud material with soft edges
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            roughness: 1,
            metalness: 0
        });
        
        // Create multiple overlapping sphere meshes to form a cloud
        const particleCount = 5 + Math.floor(Math.random() * 8); // Random number of particles per cloud
        
        for (let i = 0; i < particleCount; i++) {
            // Create a sphere with random size
            const size = (0.5 + Math.random() * 0.5) * scale;
            const geometry = new THREE.SphereGeometry(size, 7, 7);
            
            // Create mesh
            const mesh = new THREE.Mesh(geometry, cloudMaterial);
            
            // Position each sphere within the cloud with some overlap
            mesh.position.set(
                (Math.random() - 0.5) * scale * 0.6,
                (Math.random() - 0.5) * scale * 0.3,
                (Math.random() - 0.5) * scale * 0.6
            );
            
            // Add soft shadows
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // Add to cloud group
            cloud.add(mesh);
        }
        
        // Position the cloud
        cloud.position.set(x, y, z);
        
        // Slightly random rotation for variety
        cloud.rotation.y = Math.random() * Math.PI * 2;
        
        // Store movement speed
        cloud.userData.speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);
        
        // Add to scene and store reference
        this.scene.add(cloud);
        this.clouds.push(cloud);
        
        return cloud;
    }
    
    update(deltaTime) {
        // Move each cloud according to wind direction and speed
        this.clouds.forEach(cloud => {
            if (!cloud || !cloud.position || !cloud.userData) return;
            
            try {
                // Move the cloud
                const movement = this.windDirection.clone()
                    .multiplyScalar(cloud.userData.speed * deltaTime * 10);
                cloud.position.add(movement);
                
                // Slow vertical oscillation for floating effect
                const time = performance.now() * 0.0001;
                const cloudIndex = this.clouds.indexOf(cloud);
                const verticalMovement = Math.sin(time + cloudIndex) * 0.05;
                cloud.position.y += verticalMovement * deltaTime;
                
                // Wrap around when cloud moves too far
                this.wrapCloudPosition(cloud);
            } catch (error) {
                console.error("Error updating cloud:", error);
            }
        });
    }
    
    wrapCloudPosition(cloud) {
        // Skip if cloud is invalid
        if (!cloud || !cloud.position) return;
        
        try {
            const limit = this.areaSize / 2;
            const pos = cloud.position;
            
            // If cloud moves too far in the x or z direction, wrap around
            if (pos.x < -limit) pos.x = limit;
            if (pos.x > limit) pos.x = -limit;
            
            if (pos.z < -limit) pos.z = limit;
            if (pos.z > limit) pos.z = -limit;
            
            // Keep clouds at their intended height range
            if (pos.y < this.minHeight) pos.y = this.minHeight;
            if (pos.y > this.maxHeight) pos.y = this.maxHeight;
        } catch (error) {
            console.error("Error in wrapCloudPosition:", error);
        }
    }
    
    // Change wind direction and speed
    setWind(direction, speedFactor = 1) {
        this.windDirection.copy(direction).normalize();
        
        // Update all cloud speeds
        this.clouds.forEach(cloud => {
            if (cloud && cloud.userData) {
                cloud.userData.speed = (this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed)) * speedFactor;
            }
        });
    }
} 