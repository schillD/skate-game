import * as THREE from 'three';

export class LightingSystem {
    constructor(scene) {
        this.scene = scene;
        this.setupLights();
    }
    
    setupLights() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 70, 30);
        directionalLight.castShadow = true;
        
        // Improve shadow quality and range for the larger map
        directionalLight.shadow.mapSize.width = 2048; // Keep quality high
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -150; // Increased range
        directionalLight.shadow.camera.right = 150; // Increased range
        directionalLight.shadow.camera.top = 150; // Increased range
        directionalLight.shadow.camera.bottom = -150; // Increased range
        directionalLight.shadow.camera.far = 300; // Increased far plane
        
        this.scene.add(directionalLight);
        
        // Add a subtle secondary light for some fill
        const secondaryLight = new THREE.DirectionalLight(0xffffcc, 0.3);
        secondaryLight.position.set(-30, 40, -50);
        this.scene.add(secondaryLight);
    }
} 