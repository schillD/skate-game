import * as THREE from 'three';

/**
 * Utility class with static methods to help debug a THREE.js scene
 */
export class SceneDebug {
    /**
     * Add a debug coordinate system to the scene to help with orientation
     * @param {THREE.Scene} scene - The scene to add the axes helper to
     * @param {number} size - The size of the axes helper
     */
    static addAxesHelper(scene, size = 10) {
        const axesHelper = new THREE.AxesHelper(size);
        scene.add(axesHelper);
        console.log("Added axes helper to scene");
    }

    /**
     * Add a grid to the scene to help with orientation
     * @param {THREE.Scene} scene - The scene to add the grid to
     * @param {number} size - The size of the grid
     * @param {number} divisions - The number of divisions in the grid
     */
    static addGridHelper(scene, size = 100, divisions = 100) {
        const gridHelper = new THREE.GridHelper(size, divisions);
        scene.add(gridHelper);
        console.log("Added grid helper to scene");
    }

    /**
     * Add a debug shape directly to the scene at the given position
     * @param {THREE.Scene} scene - The scene to add the shape to
     * @param {string} type - The type of shape to add ('box', 'sphere', 'cylinder', 'cone')
     * @param {THREE.Vector3} position - The position to add the shape at
     * @param {number} size - The size of the shape
     * @param {number} color - The color of the shape
     */
    static addDebugShape(scene, type, position, size = 1, color = 0xff0000) {
        let geometry;
        switch(type.toLowerCase()) {
            case 'box':
                geometry = new THREE.BoxGeometry(size, size, size);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(size/2, 16, 16);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(size/2, size/2, size, 16);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(size/2, size, 16);
                break;
            default:
                geometry = new THREE.BoxGeometry(size, size, size);
        }
        
        const material = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        scene.add(mesh);
        
        console.log(`Added debug ${type} at position ${position.x}, ${position.y}, ${position.z}`);
        return mesh;
    }

    /**
     * Add a debug line from the origin to the given position
     * @param {THREE.Scene} scene - The scene to add the line to
     * @param {THREE.Vector3} position - The end position of the line
     * @param {number} color - The color of the line
     */
    static addDebugLine(scene, position, color = 0xffff00) {
        const material = new THREE.LineBasicMaterial({ color });
        const points = [
            new THREE.Vector3(0, 0, 0),
            position
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        
        console.log(`Added debug line from origin to ${position.x}, ${position.y}, ${position.z}`);
        return line;
    }

    /**
     * Print information about the scene to the console
     * @param {THREE.Scene} scene - The scene to print information about
     */
    static printSceneInfo(scene) {
        console.log("==== SCENE INFO ====");
        console.log(`Total objects: ${scene.children.length}`);
        
        // Count by object type
        const counts = {};
        scene.traverse(obj => {
            const type = obj.type;
            counts[type] = (counts[type] || 0) + 1;
        });
        
        console.log("Object counts by type:");
        Object.entries(counts).forEach(([type, count]) => {
            console.log(`- ${type}: ${count}`);
        });
        
        // Print all mesh names
        const meshes = [];
        scene.traverse(obj => {
            if (obj.isMesh) {
                meshes.push(obj.name || "(unnamed)");
            }
        });
        
        console.log(`Meshes (${meshes.length}): ${meshes.join(', ')}`);
        console.log("====================");
    }

    /**
     * Add a debug UI element to show FPS and object count
     */
    static addDebugUI() {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '10px';
        div.style.right = '10px';
        div.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        div.style.color = 'white';
        div.style.padding = '10px';
        div.style.fontFamily = 'monospace';
        div.style.fontSize = '14px';
        div.style.zIndex = '1000';
        div.id = 'debugInfo';
        
        document.body.appendChild(div);
        
        let lastTime = performance.now();
        let frames = 0;
        let fps = 0;
        
        setInterval(() => {
            const scene = window.game?.scene;
            if (!scene) return;
            
            // Count objects by type
            const counts = {
                Total: 0,
                Mesh: 0,
                Group: 0,
                Object3D: 0,
                Light: 0
            };
            
            scene.traverse(obj => {
                counts.Total++;
                if (obj.isMesh) counts.Mesh++;
                if (obj.isGroup) counts.Group++;
                if (obj.isObject3D && !obj.isMesh && !obj.isGroup) counts.Object3D++;
                if (obj.isLight) counts.Light++;
            });
            
            // Update the debug UI
            div.innerHTML = `
                FPS: ${fps}<br>
                Objects: ${counts.Total}<br>
                - Meshes: ${counts.Mesh}<br>
                - Groups: ${counts.Group}<br>
                - Lights: ${counts.Light}<br>
                Camera: (${Math.round(window.game?.camera.position.x)}, 
                         ${Math.round(window.game?.camera.position.y)}, 
                         ${Math.round(window.game?.camera.position.z)})
            `;
        }, 500);
        
        // Calculate FPS
        function updateFPS() {
            const now = performance.now();
            frames++;
            
            if (now >= lastTime + 1000) {
                fps = Math.round((frames * 1000) / (now - lastTime));
                frames = 0;
                lastTime = now;
            }
            
            requestAnimationFrame(updateFPS);
        }
        
        updateFPS();
    }

    /**
     * Track an object and visualize its position in real-time
     * @param {THREE.Scene} scene - The scene to add the tracker to
     * @param {THREE.Object3D} object - The object to track
     * @param {number} color - The color of the tracker
     * @param {string} label - Optional label for the tracker
     */
    static trackObject(scene, object, color = 0xff00ff, label = '') {
        // Create a sphere to represent the object's position
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color, 
            wireframe: true,
            transparent: true,
            opacity: 0.7
        });
        const tracker = new THREE.Mesh(geometry, material);
        scene.add(tracker);
        
        // Add a debug line from the ground to the object
        const lineMaterial = new THREE.LineBasicMaterial({ color });
        const lineGeometry = new THREE.BufferGeometry();
        const linePoints = new Float32Array(6); // Two points, each with x,y,z
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePoints, 3));
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
        
        // Add text label if provided
        let textSprite = null;
        if (label) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            context.fillStyle = 'rgba(0,0,0,0.5)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = '24px Arial';
            context.fillStyle = '#ffffff';
            context.textAlign = 'center';
            context.fillText(label, canvas.width / 2, canvas.height / 2 + 8);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            textSprite = new THREE.Sprite(spriteMaterial);
            textSprite.scale.set(5, 1.2, 1);
            scene.add(textSprite);
        }
        
        // Update the tracker position in the animation loop
        function updateTracker() {
            if (!object) return;
            
            // Update tracker position
            tracker.position.copy(object.position);
            
            // Update line points
            linePoints[0] = object.position.x; // Start x
            linePoints[1] = 0; // Start y (ground level)
            linePoints[2] = object.position.z; // Start z
            linePoints[3] = object.position.x; // End x
            linePoints[4] = object.position.y; // End y
            linePoints[5] = object.position.z; // End z
            line.geometry.attributes.position.needsUpdate = true;
            
            // Update text label position if it exists
            if (textSprite) {
                textSprite.position.set(
                    object.position.x,
                    object.position.y + 2, // Position above the object
                    object.position.z
                );
            }
            
            requestAnimationFrame(updateTracker);
        }
        
        updateTracker();
        
        return {
            tracker,
            line,
            textSprite,
            update: updateTracker
        };
    }

    /**
     * Add a trail effect behind a moving object
     * @param {THREE.Scene} scene - The scene to add the trail to
     * @param {THREE.Object3D} object - The object to trail
     * @param {number} length - The number of positions to store in the trail
     * @param {number} color - The color of the trail
     */
    static addTrail(scene, object, length = 100, color = 0x00ffff) {
        // Create a line to represent the trail
        const material = new THREE.LineBasicMaterial({ 
            color,
            transparent: true,
            opacity: 0.5
        });
        
        // Create an array to store trail positions
        const positions = new Float32Array(length * 3);
        for (let i = 0; i < length * 3; i++) {
            positions[i] = object.position.x; // Initialize with object's current position
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const trail = new THREE.Line(geometry, material);
        scene.add(trail);
        
        // Store previous positions for the trail
        const positionHistory = [];
        for (let i = 0; i < length; i++) {
            positionHistory.push(object.position.clone());
        }
        
        // Update the trail in the animation loop
        function updateTrail() {
            if (!object) return;
            
            // Add current position to the history
            positionHistory.push(object.position.clone());
            
            // Remove oldest position if we exceed the length
            if (positionHistory.length > length) {
                positionHistory.shift();
            }
            
            // Update the line geometry with position history
            for (let i = 0; i < positionHistory.length; i++) {
                const pos = positionHistory[i];
                positions[i * 3] = pos.x;
                positions[i * 3 + 1] = pos.y;
                positions[i * 3 + 2] = pos.z;
            }
            
            // Fill the rest of the array with the last position if needed
            for (let i = positionHistory.length; i < length; i++) {
                positions[i * 3] = positionHistory[positionHistory.length - 1].x;
                positions[i * 3 + 1] = positionHistory[positionHistory.length - 1].y;
                positions[i * 3 + 2] = positionHistory[positionHistory.length - 1].z;
            }
            
            trail.geometry.attributes.position.needsUpdate = true;
            
            requestAnimationFrame(updateTrail);
        }
        
        updateTrail();
        
        return {
            trail,
            update: updateTrail
        };
    }
} 