import * as THREE from 'three';

export class Decorations {
    constructor(scene, textureLoader) {
        this.scene = scene;
        this.textureLoader = textureLoader;
        
        // Track created decorations
        this.bushes = [];
        this.rocks = [];
        this.flowers = [];
        this.streetLights = [];
        
        // Performance settings
        this.settings = {
            drawDistance: 100,         // Maximum distance to render decorations
            lodDistances: [30, 60, 90], // Distances for LOD levels
            instancedRendering: true,   // Use instanced rendering where supported
            maxVisibleFlowers: 20,      // Limit number of visible flowers
            maxVisibleStreetLights: 4,  // Limit number of visible lights
            cullingEnabled: true         // Enable frustum culling
        };
        
        // Create temporary object to track camera position
        this.lastCameraPosition = new THREE.Vector3();
        this.cameraUpdateFrequency = 5; // Update visibility every N frames
        this.frameCount = 0;
        
        // Initialize 
        this.createDecorations();
    }
    
    createDecorations() {
        console.log("Creating environment decorations");
        
        // Reduce total decoration counts for better performance
        this.addBushes(true);  // true = use optimized version
        this.addRocks(true);   // true = use optimized version
        this.addFlowers(true); // true = use optimized version
        this.addStreetLights();
        
        // Add decorations to the grassfield area where sheep roam
        this.addGrassfieldDecorations();
        
        // River is now added directly in the grassfield decorations
    }
    
    addGrassfieldDecorations() {
        console.log("Adding decorations to grassfield");
        
        // Create multiple rivers flowing through the grassfield
        this.createGrassfieldRivers();
        
        // Create grassfield bushes
        this.createGrassfieldBushes();
        
        // Create grassfield rocks
        this.createGrassfieldRocks();
        
        // Create grassfield flowers
        this.createGrassfieldFlowers();
        
        // Add trees (moved from skatepark to grassfield)
        this.addGrassfieldTrees();
    }
    
    createGrassfieldRivers() {
        console.log("Creating multiple rivers in the grassfield");
        
        // Create several rivers in different parts of the grassfield
        const riverConfigs = [
            // River 1: Diagonal in northeast quadrant
            {
                start: new THREE.Vector3(110, 0, 110),
                end: new THREE.Vector3(180, 0, 180),
                width: 20
            },
            // River 2: Curved in northwest quadrant
            {
                start: new THREE.Vector3(-110, 0, 110),
                end: new THREE.Vector3(-160, 0, 140),
                width: 15
            },
            // River 3: Straight in southeast quadrant
            {
                start: new THREE.Vector3(130, 0, -110),
                end: new THREE.Vector3(130, 0, -170),
                width: 25
            }
        ];
        
        // Create each river
        riverConfigs.forEach(config => {
            this.createSingleRiver(config.start, config.end, config.width);
        });
    }
    
    createSingleRiver(riverStart, riverEnd, riverWidth) {
        // Create a simple rectangular river
        const riverLength = riverStart.distanceTo(riverEnd);
        
        // Create a simple plane for the river
        const riverGeometry = new THREE.PlaneGeometry(riverWidth, riverLength);
        
        // Create a water material with slight transparency
        const riverMaterial = new THREE.MeshStandardMaterial({
            color: 0x4477DD,       // More natural blue
            opacity: 0.9,
            transparent: true,
            metalness: 0.3,
            roughness: 0.4,
            side: THREE.DoubleSide
        });
        
        // Create the river mesh
        const river = new THREE.Mesh(riverGeometry, riverMaterial);
        
        // Position the river on the ground
        river.position.set(
            (riverStart.x + riverEnd.x) / 2,  // Center X
            0.05,                             // Slightly above ground to prevent z-fighting
            (riverStart.z + riverEnd.z) / 2   // Center Z
        );
        
        // Rotate to lay flat
        river.rotation.x = -Math.PI / 2;
        
        // Point the river in the right direction
        const direction = new THREE.Vector3().subVectors(riverEnd, riverStart);
        const angle = Math.atan2(direction.z, direction.x);
        river.rotation.z = angle;
        
        // Add to scene
        this.scene.add(river);
        
        // Add natural-looking river banks with rocks and vegetation
        this.addRiverBanks(river, riverWidth, riverLength, riverStart, riverEnd, direction);
    }
    
    addRiverBanks(river, riverWidth, riverLength, riverStart, riverEnd, direction) {
        // Create natural-looking river banks with vegetation
        const bankWidth = 5;
        const bankGeometry = new THREE.PlaneGeometry(bankWidth, riverLength);
        const bankMaterial = new THREE.MeshStandardMaterial({
            color: 0xD2B48C,  // Tan/sandy color for natural riverbank
            side: THREE.DoubleSide,
            roughness: 0.9
        });
        
        // Calculate perpendicular vector for bank placement
        const perpendicular = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
        
        // Left bank
        const leftBank = new THREE.Mesh(bankGeometry, bankMaterial);
        leftBank.position.copy(river.position);
        leftBank.position.x -= perpendicular.x * (riverWidth / 2 + bankWidth / 2);
        leftBank.position.z -= perpendicular.z * (riverWidth / 2 + bankWidth / 2);
        leftBank.rotation.copy(river.rotation);
        leftBank.position.y = 0.03; // Slightly raised above ground but below river level
        this.scene.add(leftBank);
        
        // Right bank
        const rightBank = new THREE.Mesh(bankGeometry, bankMaterial);
        rightBank.position.copy(river.position);
        rightBank.position.x += perpendicular.x * (riverWidth / 2 + bankWidth / 2);
        rightBank.position.z += perpendicular.z * (riverWidth / 2 + bankWidth / 2);
        rightBank.rotation.copy(river.rotation);
        rightBank.position.y = 0.03; // Slightly raised above ground but below river level
        this.scene.add(rightBank);
        
        // Add rocks and vegetation along the banks
        this.addRiverDecoration(riverStart, riverEnd, riverWidth, direction, perpendicular);
    }
    
    addRiverDecoration(riverStart, riverEnd, riverWidth, direction, perpendicular) {
        const riverVector = new THREE.Vector3().subVectors(riverEnd, riverStart);
        const riverLength = riverVector.length();
        const numDecorations = Math.floor(riverLength / 10); // One decoration every 10 units
        
        // Create rocks and plants along both banks
        for (let i = 0; i < numDecorations; i++) {
            // Calculate position along river
            const t = i / (numDecorations - 1); // 0 to 1
            const posAlong = new THREE.Vector3()
                .copy(riverStart)
                .lerp(riverEnd, t);
            
            // Add rocks on left and right banks
            this.addRiverRockCluster(
                posAlong.x - perpendicular.x * (riverWidth/2 + 2 + Math.random() * 3),
                posAlong.z - perpendicular.z * (riverWidth/2 + 2 + Math.random() * 3),
                2 + Math.floor(Math.random() * 3) // 2-4 rocks per cluster
            );
            
            this.addRiverRockCluster(
                posAlong.x + perpendicular.x * (riverWidth/2 + 2 + Math.random() * 3),
                posAlong.z + perpendicular.z * (riverWidth/2 + 2 + Math.random() * 3),
                2 + Math.floor(Math.random() * 3) // 2-4 rocks per cluster
            );
            
            // Add reeds/tall grass at some spots
            if (Math.random() > 0.5) {
                this.addRiverReeds(
                    posAlong.x - perpendicular.x * (riverWidth/2 - 1 + Math.random()),
                    posAlong.z - perpendicular.z * (riverWidth/2 - 1 + Math.random()),
                    3 + Math.floor(Math.random() * 5) // 3-7 reeds per cluster
                );
                
                this.addRiverReeds(
                    posAlong.x + perpendicular.x * (riverWidth/2 - 1 + Math.random()),
                    posAlong.z + perpendicular.z * (riverWidth/2 - 1 + Math.random()),
                    3 + Math.floor(Math.random() * 5) // 3-7 reeds per cluster
                );
            }
        }
    }
    
    addRiverRockCluster(x, z, count) {
        // Add a cluster of rocks at the specified position
        const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x777777,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Add several rocks in a tight cluster
        for (let i = 0; i < count; i++) {
            const offsetX = Math.random() * 2 - 1; // -1 to 1
            const offsetZ = Math.random() * 2 - 1; // -1 to 1
            
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                x + offsetX, 
                0.1 + Math.random() * 0.3, // Slightly vary height
                z + offsetZ
            );
            rock.rotation.set(
                Math.random() * Math.PI, 
                Math.random() * Math.PI, 
                Math.random() * Math.PI
            );
            const scale = 0.4 + Math.random() * 0.6;
            rock.scale.set(scale, scale * 0.7, scale);
            this.scene.add(rock);
        }
    }
    
    addRiverReeds(x, z, count) {
        // Add water reeds/cattails at the specified position
        const reedGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4);
        const reedMaterial = new THREE.MeshLambertMaterial({
            color: 0xCCAA55 // Yellowish-brown
        });
        
        const tipGeometry = new THREE.CylinderGeometry(0.15, 0.05, 0.5, 4);
        const tipMaterial = new THREE.MeshLambertMaterial({
            color: 0x774422 // Brown
        });
        
        // Create a cluster of reeds
        for (let i = 0; i < count; i++) {
            const offsetX = Math.random() * 1.0 - 0.5; // -0.5 to 0.5
            const offsetZ = Math.random() * 1.0 - 0.5; // -0.5 to 0.5
            
            // Create reed stem
            const reed = new THREE.Mesh(reedGeometry, reedMaterial);
            reed.position.set(
                x + offsetX,
                0.75, // Half the height for proper positioning
                z + offsetZ
            );
            
            // Add slight random tilt
            reed.rotation.set(
                (Math.random() * 0.2 - 0.1), // Slight random tilt
                Math.random() * Math.PI * 2,   // Random rotation around Y
                (Math.random() * 0.2 - 0.1)   // Slight random tilt
            );
            
            // Add tip to the reed
            const tip = new THREE.Mesh(tipGeometry, tipMaterial);
            tip.position.y = 1.0; // Place at top of reed
            reed.add(tip);
            
            this.scene.add(reed);
        }
    }
    
    addGrassfieldTrees() {
        console.log("Adding trees to grassfield");
        
        // Add clusters of trees in the grassfield area (away from skatepark)
        // Skatepark is roughly in the -100 to +100 area, so place trees beyond that
        
        // Define several tree cluster locations
        const treeLocations = [
            // Northeast area
            { x: 130, z: 130, count: 5, radius: 10 },
            { x: 160, z: 160, count: 8, radius: 15 },
            // Northwest area
            { x: -130, z: 130, count: 6, radius: 12 },
            { x: -160, z: 160, count: 7, radius: 14 },
            // Southeast area
            { x: 150, z: -150, count: 9, radius: 18 },
            // Southwest area
            { x: -150, z: -150, count: 4, radius: 9 },
            { x: -180, z: -120, count: 6, radius: 12 }
        ];
        
        // Create tree clusters
        treeLocations.forEach(location => {
            this.createTreeCluster(
                location.x, 
                location.z, 
                location.count, 
                location.radius
            );
        });
    }
    
    createTreeCluster(centerX, centerZ, count, radius) {
        for (let i = 0; i < count; i++) {
            // Calculate random position within the cluster radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            const x = centerX + Math.cos(angle) * distance;
            const z = centerZ + Math.sin(angle) * distance;
            
            this.createTree(x, z);
        }
    }
    
    createTree(x, z) {
        const treeHeight = 8 + Math.random() * 4; // 8-12 units tall
        
        // Create trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, treeHeight * 0.7, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown
            roughness: 0.9
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, treeHeight * 0.35, z); // Half trunk height for proper positioning
        trunk.castShadow = true;
        
        // Create foliage (multiple layers for fuller look)
        const foliageRadius = 2 + Math.random() * 1.5;
        const foliageLayers = 3;
        const foliageHeight = treeHeight * 0.5;
        
        for (let i = 0; i < foliageLayers; i++) {
            const layerHeight = treeHeight * 0.7 + (i * foliageHeight / foliageLayers);
            const layerSize = foliageRadius * (1 - i * 0.2);
            
            // Use cone for upper layers, sphere for lower layer
            let foliageGeometry;
            if (i === 0) {
                foliageGeometry = new THREE.SphereGeometry(layerSize, 8, 6);
            } else {
                foliageGeometry = new THREE.ConeGeometry(layerSize, foliageHeight / foliageLayers, 8);
            }
            
            // Vary the green color slightly for each tree
            const colorShift = Math.random() * 0.15;
            const foliageMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0.2 + colorShift, 0.5 + colorShift, 0.1),
                roughness: 0.8
            });
            
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.set(0, layerHeight - treeHeight * 0.7, 0);
            foliage.castShadow = true;
            trunk.add(foliage);
        }
        
        this.scene.add(trunk);
    }
    
    addBasketballCourt() {
        console.log("Creating basketball court in grassfield");
        
        // Position the court in the south-west area of the grassfield
        const courtPosition = new THREE.Vector3(-120, 0.1, -120);
        
        // Court dimensions (standard half-court is ~14m x 15m)
        const courtWidth = 15;  // Width (sideline to sideline)
        const courtLength = 14;  // Length (baseline to half-court line)
        
        // Create court surface
        this.createCourtSurface(courtPosition, courtWidth, courtLength);
        
        // Add court markings (lines)
        this.addCourtMarkings(courtPosition, courtWidth, courtLength);
        
        // Add basketball hoop
        this.addBasketballHoop(courtPosition, courtWidth, courtLength);
        
        // Add fence around the court
        this.addCourtFence(courtPosition, courtWidth, courtLength);
    }
    
    createCourtSurface(position, width, length) {
        // Create the court surface - concrete/asphalt with texture
        const courtGeometry = new THREE.PlaneGeometry(width, length);
        
        // Create asphalt texture procedurally
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Base color - dark gray asphalt
        context.fillStyle = '#333333';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add asphalt texture details
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            
            // Slightly lighter gray specs
            const gray = 60 + Math.floor(Math.random() * 20);
            context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            
            context.beginPath();
            context.rect(x, y, size, size);
            context.fill();
        }
        
        // Create texture from canvas
        const courtTexture = new THREE.CanvasTexture(canvas);
        courtTexture.wrapS = courtTexture.wrapT = THREE.RepeatWrapping;
        courtTexture.repeat.set(4, 4);
        
        // Create court material
        const courtMaterial = new THREE.MeshStandardMaterial({
            map: courtTexture,
            roughness: 0.9,
            side: THREE.DoubleSide
        });
        
        // Create court mesh
        const court = new THREE.Mesh(courtGeometry, courtMaterial);
        court.rotation.x = -Math.PI / 2; // Lay flat
        court.position.copy(position);
        court.receiveShadow = true;
        
        this.scene.add(court);
        return court;
    }
    
    addCourtMarkings(position, width, length) {
        // Add white line markings to the court
        const createLine = (x1, z1, x2, z2, lineWidth = 0.05) => {
            const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
            const lineGeometry = new THREE.PlaneGeometry(lineWidth, lineLength);
            const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            
            // Position at midpoint
            line.position.set(
                position.x + (x1 + x2) / 2,
                position.y + 0.01, // Slightly above court to prevent z-fighting
                position.z + (z1 + z2) / 2
            );
            
            // Rotate to align with line direction
            line.rotation.x = -Math.PI / 2; // Lay flat
            line.rotation.z = Math.atan2(z2 - z1, x2 - x1);
            
            this.scene.add(line);
        };
        
        // Calculate court boundaries
        const halfWidth = width / 2;
        const halfLength = length / 2;
        
        // Perimeter lines
        createLine(-halfWidth, -halfLength, halfWidth, -halfLength); // Baseline
        createLine(-halfWidth, halfLength, halfWidth, halfLength);   // Half-court line
        createLine(-halfWidth, -halfLength, -halfWidth, halfLength); // Left sideline
        createLine(halfWidth, -halfLength, halfWidth, halfLength);   // Right sideline
        
        // Free throw line (5.8m from baseline)
        const freeThrowDistance = (length * 0.84) - length;
        createLine(-halfWidth/2, freeThrowDistance, halfWidth/2, freeThrowDistance);
        
        // Key (lane) - 4.9m wide, 5.8m deep
        const keyWidth = width * 0.33;
        const keyHalfWidth = keyWidth / 2;
        createLine(-keyHalfWidth, -halfLength, -keyHalfWidth, freeThrowDistance); // Left lane
        createLine(keyHalfWidth, -halfLength, keyHalfWidth, freeThrowDistance);   // Right lane
        
        // Three-point arc
        const threePointRadius = width * 0.4;
        const arcSegments = 20;
        const arcGeometry = new THREE.BufferGeometry();
        const arcPoints = [];
        
        for (let i = 0; i <= arcSegments; i++) {
            const angle = (Math.PI / 2) - (Math.PI * i / arcSegments);
            const x = Math.cos(angle) * threePointRadius;
            const z = Math.sin(angle) * threePointRadius - halfLength / 2;
            arcPoints.push(new THREE.Vector3(position.x + x, position.y + 0.01, position.z + z));
        }
        
        arcGeometry.setFromPoints(arcPoints);
        const arcMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
        const arc = new THREE.Line(arcGeometry, arcMaterial);
        this.scene.add(arc);
        
        // Center circle - use a ring geometry instead of circle to avoid the vertices.shift issue
        const centerRadius = width * 0.1;
        const ringGeometry = new THREE.RingGeometry(centerRadius - 0.01, centerRadius, 32);
        const centerMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
        const centerCircle = new THREE.Mesh(ringGeometry, centerMaterial);
        centerCircle.rotation.x = -Math.PI / 2; // Lay flat
        centerCircle.position.set(position.x, position.y + 0.01, position.z);
        this.scene.add(centerCircle);
    }
    
    addBasketballHoop(position, width, length) {
        // Add basketball hoop at baseline center
        const halfLength = length / 2;
        const hoopPosition = new THREE.Vector3(
            position.x,
            position.y,
            position.z - halfLength - 1 // 1 unit behind baseline
        );
        
        // Create backboard
        const backboardWidth = width * 0.25;
        const backboardHeight = backboardWidth * 0.6;
        const backboardGeometry = new THREE.BoxGeometry(backboardWidth, backboardHeight, 0.1);
        const backboardMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            roughness: 0.5
        });
        
        const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
        backboard.position.set(hoopPosition.x, hoopPosition.y + 3.05, hoopPosition.z);
        this.scene.add(backboard);
        
        // Add target square on backboard
        const targetGeometry = new THREE.PlaneGeometry(backboardWidth * 0.4, backboardWidth * 0.3);
        const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
        const target = new THREE.Mesh(targetGeometry, targetMaterial);
        target.position.set(0, -backboardHeight * 0.15, 0.06);
        backboard.add(target);
        
        // Create rim
        const rimRadius = 0.225; // Standard basketball rim radius
        const rimTubeRadius = 0.02;
        const rimGeometry = new THREE.TorusGeometry(rimRadius, rimTubeRadius, 16, 32);
        const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4400 }); // Orange rim
        
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.position.set(hoopPosition.x, hoopPosition.y + 3.05 - backboardHeight * 0.2, hoopPosition.z + rimRadius + 0.1);
        rim.rotation.x = Math.PI / 2; // Orient horizontally
        this.scene.add(rim);
        
        // Create pole
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3.05, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(hoopPosition.x, hoopPosition.y + 3.05/2, hoopPosition.z);
        this.scene.add(pole);
        
        // Create support structure
        const supportWidth = backboardWidth * 0.8;
        const supportGeometry = new THREE.BoxGeometry(supportWidth, 0.1, 1.2);
        const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const support = new THREE.Mesh(supportGeometry, supportMaterial);
        support.position.set(hoopPosition.x, hoopPosition.y + 3.05, hoopPosition.z + 0.6);
        this.scene.add(support);
    }
    
    addCourtFence(position, width, length) {
        // Add a chain-link fence around the court
        const fenceHeight = 3;
        const postSpacing = 4;
        const fenceSetback = 2; // Distance from court edge to fence
        
        // Calculate fence dimensions
        const fenceWidth = width + fenceSetback * 2;
        const fenceLength = length + fenceSetback * 2;
        const halfFenceWidth = fenceWidth / 2;
        const halfFenceLength = fenceLength / 2;
        
        // Create fence posts
        const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, fenceHeight, 8);
        const postMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        // Place posts around perimeter
        const perimeter = [
            // Front side (with gate in the middle)
            ...Array.from({ length: Math.floor(fenceWidth / postSpacing) / 2 }, (_, i) => ({
                x: -halfFenceWidth + i * postSpacing,
                z: -halfFenceLength
            })),
            ...Array.from({ length: Math.floor(fenceWidth / postSpacing) / 2 }, (_, i) => ({
                x: halfFenceWidth - i * postSpacing,
                z: -halfFenceLength
            })),
            // Back side
            ...Array.from({ length: Math.floor(fenceWidth / postSpacing) + 1 }, (_, i) => ({
                x: -halfFenceWidth + i * postSpacing,
                z: halfFenceLength
            })),
            // Left side
            ...Array.from({ length: Math.floor(fenceLength / postSpacing) - 1 }, (_, i) => ({
                x: -halfFenceWidth,
                z: -halfFenceLength + (i+1) * postSpacing
            })),
            // Right side
            ...Array.from({ length: Math.floor(fenceLength / postSpacing) - 1 }, (_, i) => ({
                x: halfFenceWidth,
                z: -halfFenceLength + (i+1) * postSpacing
            }))
        ];
        
        perimeter.forEach(coord => {
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(
                position.x + coord.x,
                position.y + fenceHeight/2,
                position.z + coord.z
            );
            this.scene.add(post);
        });
        
        // Create fence mesh
        // We'll use a semi-transparent plane with a grid texture to simulate chain-link
        const createFenceSection = (x1, z1, x2, z2) => {
            const sectionLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
            const sectionGeometry = new THREE.PlaneGeometry(sectionLength, fenceHeight);
            
            // Create chain-link texture
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const context = canvas.getContext('2d');
            
            // Draw grid pattern
            context.strokeStyle = '#AAAAAA';
            context.lineWidth = 1;
            const gridSize = 8;
            
            for (let i = 0; i <= canvas.width; i += gridSize) {
                context.beginPath();
                context.moveTo(i, 0);
                context.lineTo(i, canvas.height);
                context.stroke();
                
                context.beginPath();
                context.moveTo(0, i);
                context.lineTo(canvas.width, i);
                context.stroke();
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(Math.ceil(sectionLength), Math.ceil(fenceHeight));
            
            const fenceMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            
            const fence = new THREE.Mesh(sectionGeometry, fenceMaterial);
            
            // Position at midpoint
            fence.position.set(
                position.x + (x1 + x2) / 2,
                position.y + fenceHeight/2,
                position.z + (z1 + z2) / 2
            );
            
            // Rotate to align with fence direction
            fence.rotation.y = Math.atan2(x2 - x1, z2 - z1);
            
            this.scene.add(fence);
        };
        
        // Create fence sections between posts
        // Back side
        createFenceSection(-halfFenceWidth, halfFenceLength, halfFenceWidth, halfFenceLength);
        
        // Left and right sides
        createFenceSection(-halfFenceWidth, -halfFenceLength, -halfFenceWidth, halfFenceLength);
        createFenceSection(halfFenceWidth, -halfFenceLength, halfFenceWidth, halfFenceLength);
        
        // Front sides (with gap for entrance)
        const gateSize = 3;
        const gateHalfSize = gateSize / 2;
        createFenceSection(-halfFenceWidth, -halfFenceLength, -gateHalfSize, -halfFenceLength);
        createFenceSection(gateHalfSize, -halfFenceLength, halfFenceWidth, -halfFenceLength);
        
        // Add a simple gate (just for show)
        const gateGeometry = new THREE.PlaneGeometry(gateSize, fenceHeight * 0.8);
        
        // Create gate texture (same as fence texture)
        const gateCanvas = document.createElement('canvas');
        gateCanvas.width = 64;
        gateCanvas.height = 64;
        const gateContext = gateCanvas.getContext('2d');
        
        // Draw grid pattern
        gateContext.strokeStyle = '#AAAAAA';
        gateContext.lineWidth = 1;
        const gateGridSize = 8;
        
        for (let i = 0; i <= gateCanvas.width; i += gateGridSize) {
            gateContext.beginPath();
            gateContext.moveTo(i, 0);
            gateContext.lineTo(i, gateCanvas.height);
            gateContext.stroke();
            
            gateContext.beginPath();
            gateContext.moveTo(0, i);
            gateContext.lineTo(gateCanvas.width, i);
            gateContext.stroke();
        }
        
        const gateTexture = new THREE.CanvasTexture(gateCanvas);
        gateTexture.wrapS = gateTexture.wrapT = THREE.RepeatWrapping;
        gateTexture.repeat.set(Math.ceil(gateSize), Math.ceil(fenceHeight * 0.8));
        
        const gateMaterial = new THREE.MeshBasicMaterial({
            map: gateTexture,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        
        const gate = new THREE.Mesh(gateGeometry, gateMaterial);
        gate.position.set(
            position.x,
            position.y + (fenceHeight * 0.8) / 2,
            position.z - halfFenceLength
        );
        gate.rotation.y = Math.PI / 6; // Slightly open
        this.scene.add(gate);
    }
    
    // Empty implementation - we no longer need this
    addOriginRiverPointer() {
        // This method is intentionally empty now that we removed the markers
    }
    
    addRiverMarkers(riverPoints, riverWidth) {
        // Add extremely tall marker posts at key points along the river so player can find it
        if (!riverPoints || riverPoints.length === 0) {
            console.error('No riverPoints provided to addRiverMarkers');
            return;
        }
        
        const markerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 }); // Bright red
        
        // Add markers at start, end, and middle of river
        const markerPositions = [
            0,                  // Start
            Math.floor(riverPoints.length / 2),  // Middle
            riverPoints.length - 1    // End
        ];
        
        for (const idx of markerPositions) {
            if (idx >= riverPoints.length) {
                console.error(`Invalid index ${idx} for riverPoints with length ${riverPoints.length}`);
                continue;
            }
            const point = riverPoints[idx];
            
            // Create marker post
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            
            // Position at river point but tall enough to be seen from far away
            marker.position.set(point.x, 7.5, point.z);  // Half the height (15/2) to position from bottom
            
            // Add a sphere on top for better visibility
            const topSphereGeometry = new THREE.SphereGeometry(1.5, 16, 12);
            const topSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
            const topSphere = new THREE.Mesh(topSphereGeometry, topSphereMaterial);
            topSphere.position.y = 8;  // Place at top of post
            marker.add(topSphere);
            
            this.scene.add(marker);
            
            // Add a floating text label for even better visibility
            const message = "RIVER HERE";
            
            // Create canvas for text
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 128;
            
            // White background with margin
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Text properties
            context.font = 'Bold 48px Arial';
            context.fillStyle = '#000000';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(message, canvas.width / 2, canvas.height / 2);
            
            // Create texture
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: true
            });
            
            // Create plane for the text
            const geometry = new THREE.PlaneGeometry(10, 5);
            const textMesh = new THREE.Mesh(geometry, material);
            textMesh.position.set(0, 10, 0);  // Above the marker
            textMesh.rotation.y = Math.PI / 4;  // Angle for better visibility
            
            marker.add(textMesh);
            
            // Add a duplicate text mesh rotated the other way so it's visible from both sides
            const textMesh2 = textMesh.clone();
            textMesh2.rotation.y = -Math.PI / 4;
            marker.add(textMesh2);
        }
    }
    
    addRiverVegetation(riverPoints, riverWidth) {
        // Add vegetation near the river banks for better visibility
        const bushGeometry = new THREE.SphereGeometry(1.5, 8, 6);
        const bushMaterial = new THREE.MeshLambertMaterial({
            color: 0x116633 // Deep green
        });
        
        // Add taller reeds/cattails along the river banks
        const reedGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 4);
        const reedMaterial = new THREE.MeshLambertMaterial({
            color: 0xCCBB55 // Tan/brown color
        });
        
        // Place vegetation along the river - fewer points for performance
        for (let i = 0; i < riverPoints.length; i += 3) {
            // Skip some points to reduce density
            if (Math.random() > 0.7) continue;
            
            // Create a plant cluster at this point
            const point = riverPoints[i];
            
            // Add a bush on one side
            if (Math.random() > 0.4) {
                const angleOffset = Math.random() * Math.PI * 0.3;
                const distance = (riverWidth / 2) + 2 + Math.random() * 3; // Just outside the river bank
                
                // Get position offset perpendicular to river
                const dx = Math.cos(angleOffset) * distance;
                const dz = Math.sin(angleOffset) * distance;
                
                const bush = new THREE.Mesh(bushGeometry, bushMaterial);
                bush.position.set(
                    point.x + dx,
                    1.9 + Math.random() * 0.5,
                    point.z + dz
                );
                
                const scale = 0.7 + Math.random() * 0.6;
                bush.scale.set(scale, scale * 0.8, scale);
                bush.rotation.y = Math.random() * Math.PI * 2;
                
                this.scene.add(bush);
            }
            
            // Add reeds/cattails near the water's edge
            if (Math.random() > 0.5) {
                const angleOffset = Math.random() * Math.PI * 2;
                const bankDistance = (riverWidth / 2) - 0.5 + Math.random() * 3;
                
                const dx = Math.cos(angleOffset) * bankDistance;
                const dz = Math.sin(angleOffset) * bankDistance;
                
                const reed = new THREE.Mesh(reedGeometry, reedMaterial);
                reed.position.set(
                    point.x + dx,
                    3.0,  // Taller and elevated to match river height
                    point.z + dz
                );
                
                reed.rotation.x = Math.random() * 0.2 - 0.1;
                reed.rotation.z = Math.random() * 0.2 - 0.1;
                reed.rotation.y = Math.random() * Math.PI * 2;
                
                this.scene.add(reed);
            }
        }
    }
    
    addRiverRocks(riverPoints, riverWidth) {
        // Add some decorative rocks along the river banks
        const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true
        });
        
        // Number of rocks to add along each bank
        const rocksPerBank = 20;
        
        // For both river banks
        ['left', 'right'].forEach((side, sideIndex) => {
            for (let i = 0; i < rocksPerBank; i++) {
                // Random point along the river
                const pointIndex = Math.floor(Math.random() * (riverPoints.length - 1));
                const p1 = riverPoints[pointIndex];
                const p2 = riverPoints[pointIndex + 1];
                
                // Random position between these two points
                const t = Math.random();
                const pos = new THREE.Vector3().lerpVectors(p1, p2, t);
                
                // Direction between the points
                const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
                
                // Perpendicular vector (for width)
                const perp = new THREE.Vector3(dir.z, 0, -dir.x);
                
                // Determine side multiplier (-1 for left, 1 for right)
                const sideMult = sideIndex === 0 ? -1 : 1;
                
                // Position away from river center
                const distance = (riverWidth / 2) + Math.random() * 2.5;
                pos.add(perp.multiplyScalar(sideMult * distance));
                
                // Create rock
                const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                
                // Position and scale
                // Position the rock at elevated position matching the river height
                rock.position.set(pos.x, 1.9 + Math.random() * 0.4, pos.z);
                const scale = 0.5 + Math.random() * 0.8;
                rock.scale.set(scale, scale * 0.7, scale);
                
                // Random rotation
                rock.rotation.y = Math.random() * Math.PI * 2;
                rock.rotation.x = Math.random() * 0.2;
                rock.rotation.z = Math.random() * 0.2;
                
                // Add shadows
                rock.castShadow = true;
                rock.receiveShadow = true;
                
                // Add to scene
                this.scene.add(rock);
            }
        });
    }
    
    createGrassfieldBushes() {
        // Create bushes scattered around the grassfield (outer areas where sheep roam)
        // Use instancing for better performance
        
        // Bush colors - softer colors for the grassfield
        const bushColors = [
            new THREE.Color(0x3a9d23), // Light green
            new THREE.Color(0x4db34a), // Medium green
            new THREE.Color(0x75b855)  // Yellowish green
        ];
        
        // Create a simplified geometry for grassfield bushes
        const bushGeometry = new THREE.SphereGeometry(1, 6, 4);
        const bushMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a9d23,
            roughness: 0.8,
            flatShading: true
        });
        
        // Number of bushes to create
        const numBushes = 40; // Fewer bushes for better performance
        
        // Create instanced mesh
        const instancedMesh = new THREE.InstancedMesh(
            bushGeometry,
            bushMaterial,
            numBushes
        );
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        
        // Set properties for each instance
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        
        // Place bushes in the grassfield (outside the skateable area which is 100 units from center)
        for (let i = 0; i < numBushes; i++) {
            // Calculate random position in the grassfield (green area outside skatepark)
            const angle = Math.random() * Math.PI * 2;
            const distance = 110 + Math.random() * 80; // Between 110 and 190 units from center
            
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Add some randomness
            position.set(
                x + (Math.random() * 10 - 5),
                0, // On the ground
                z + (Math.random() * 10 - 5)
            );
            
            // Random rotation
            quaternion.setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                Math.random() * Math.PI * 2
            );
            
            // Varying sizes
            const size = 0.8 + Math.random() * 0.7;
            scale.set(size, size, size);
            
            // Apply transformations
            matrix.compose(position, quaternion, scale);
            instancedMesh.setMatrixAt(i, matrix);
            
            // Set random color for variation
            const colorIndex = Math.floor(Math.random() * bushColors.length);
            instancedMesh.setColorAt(i, bushColors[colorIndex]);
        }
        
        // Update the instance buffer
        if (instancedMesh.instanceMatrix) instancedMesh.instanceMatrix.needsUpdate = true;
        if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
        
        // Add to scene and track for updates
        this.scene.add(instancedMesh);
        this.bushes.push(instancedMesh);
    }
    
    createGrassfieldRocks() {
        // Create rocks scattered around the grassfield
        // Use instancing for better performance
        
        // Create a simple rock geometry
        const rockGeometry = new THREE.DodecahedronGeometry(0.8, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });
        
        // Number of rocks to create
        const numRocks = 30;
        
        // Create instanced mesh
        const instancedMesh = new THREE.InstancedMesh(
            rockGeometry,
            rockMaterial,
            numRocks
        );
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        
        // Set properties for each instance
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        
        // Place rocks in the grassfield (outside the skateable area)
        for (let i = 0; i < numRocks; i++) {
            // Calculate random position in the grassfield (green area outside skatepark)
            const angle = Math.random() * Math.PI * 2;
            const distance = 120 + Math.random() * 70; // Between 120 and 190 units from center
            
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Random position with slight elevation
            position.set(
                x + (Math.random() * 8 - 4),
                -0.5 + Math.random() * 0.2, // Slightly buried in the ground
                z + (Math.random() * 8 - 4)
            );
            
            // Random rotation for natural look
            quaternion.setFromEuler(new THREE.Euler(
                Math.random() * 0.3,
                Math.random() * Math.PI * 2,
                Math.random() * 0.3
            ));
            
            // Varying sizes
            const sizeX = 0.3 + Math.random() * 0.6;
            const sizeY = 0.2 + Math.random() * 0.4;
            const sizeZ = 0.3 + Math.random() * 0.6;
            scale.set(sizeX, sizeY, sizeZ);
            
            // Apply transformations
            matrix.compose(position, quaternion, scale);
            instancedMesh.setMatrixAt(i, matrix);
            
            // Vary the color slightly
            const shade = 0.7 + Math.random() * 0.3;
            const rockColor = new THREE.Color(shade, shade, shade);
            instancedMesh.setColorAt(i, rockColor);
        }
        
        // Update the instance buffer
        if (instancedMesh.instanceMatrix) instancedMesh.instanceMatrix.needsUpdate = true;
        if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
        
        // Add to scene and track for updates
        this.scene.add(instancedMesh);
        this.rocks.push(instancedMesh);
    }
    
    createGrassfieldFlowers() {
        // Create colorful flowers in small clusters throughout the grassfield
        // Use simple geometries for better performance
        
        // Flower types and colors
        const flowerColors = [
            0xFFFF00, // Yellow
            0xFF1493, // Deep Pink
            0xFF4500, // Orange Red
            0x9932CC, // Dark Orchid
            0x00BFFF  // Deep Sky Blue
        ];
        
        // Create several flower clusters
        const numClusters = 15;
        const flowersPerCluster = 4; // Small clusters for performance
        
        // Track all flowers
        const allFlowers = [];
        
        // Create flower clusters
        for (let c = 0; c < numClusters; c++) {
            // Random cluster position in the grassfield (outside the skateable area)
            const angle = Math.random() * Math.PI * 2;
            const distance = 130 + Math.random() * 60; // Between 130 and 190 units from center
            
            const clusterX = Math.cos(angle) * distance;
            const clusterZ = Math.sin(angle) * distance;
            
            // Create flowers in this cluster
            for (let f = 0; f < flowersPerCluster; f++) {
                // Create a simple flower shape (stem + head)
                const flowerGroup = new THREE.Group();
                
                // Stem
                const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 4);
                const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x006400 });
                const stem = new THREE.Mesh(stemGeometry, stemMaterial);
                stem.position.y = 0.25; // Half height off ground
                flowerGroup.add(stem);
                
                // Flower head - use a simple cone for performance
                const headGeometry = new THREE.ConeGeometry(0.15, 0.2, 5);
                
                // Pick a random color from the array
                const colorIndex = Math.floor(Math.random() * flowerColors.length);
                const headMaterial = new THREE.MeshBasicMaterial({ color: flowerColors[colorIndex] });
                
                const head = new THREE.Mesh(headGeometry, headMaterial);
                head.position.y = 0.6; // Place at top of stem
                head.rotation.x = Math.PI; // Point the cone downward
                flowerGroup.add(head);
                
                // Position within the cluster with some randomness
                flowerGroup.position.set(
                    clusterX + (Math.random() * 3 - 1.5),
                    0,
                    clusterZ + (Math.random() * 3 - 1.5)
                );
                
                // Add to scene
                this.scene.add(flowerGroup);
                this.flowers.push(flowerGroup);
                allFlowers.push(flowerGroup);
            }
        }
        
        console.log(`Created ${allFlowers.length} flowers in ${numClusters} clusters in the grassfield`);
        return allFlowers;
    }
    
    addBushes(optimized = true) {
        console.log("Adding bushes to environment");
        
        if (optimized) {
            // Use instanced rendering for better performance
            this.createInstancedBushes();
        } else {
            // Original implementation (slower)
            this.createIndividualBushes();
        }
    }
    
    createInstancedBushes() {
        // Create geometries with different LOD levels
        const highDetailGeometry = new THREE.SphereGeometry(1, 8, 6);
        const mediumDetailGeometry = new THREE.SphereGeometry(1, 6, 4);
        const lowDetailGeometry = new THREE.SphereGeometry(1, 4, 3);
        
        // Bush colors
        const bushColors = [
            new THREE.Color(0x2E8B57), // Sea Green
            new THREE.Color(0x228B22), // Forest Green
            new THREE.Color(0x006400)  // Dark Green
        ];
        
        // Create instanced mesh for each bush type
        // Reduce the density by half compared to the original implementation
        const groundSize = 200;
        const margin = 5;
        const density = 15; // Half of the original density
        const totalBushes = density * 4;
        
        // Create instance attributes
        const bushMaterial = new THREE.MeshStandardMaterial({
            color: 0x2E8B57,
            roughness: 0.8,
            flatShading: true
        });
        
        // Create instanced mesh
        const instancedMesh = new THREE.InstancedMesh(
            highDetailGeometry,
            bushMaterial,
            totalBushes
        );
        
        // Set properties for each instance
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        
        for (let i = 0; i < totalBushes; i++) {
            let x, z;
            
            // Determine perimeter position
            const side = Math.floor(i / (density));
            const t = (i % density) / density;
            
            switch(side) {
                case 0: // North side
                    x = -groundSize/2 + groundSize * t;
                    z = -groundSize/2 + margin;
                    break;
                case 1: // East side
                    x = groundSize/2 - margin;
                    z = -groundSize/2 + groundSize * t;
                    break;
                case 2: // South side
                    x = groundSize/2 - groundSize * t;
                    z = groundSize/2 - margin;
                    break;
                case 3: // West side
                    x = -groundSize/2 + margin;
                    z = groundSize/2 - groundSize * t;
                    break;
            }
            
            // Add some randomness to positions
            x += (Math.random() - 0.5) * 10;
            z += (Math.random() - 0.5) * 10;
            
            // Random size
            const size = 0.5 + Math.random() * 0.8;
            const bushType = Math.floor(Math.random() * 3);
            const y = size/2; // Position on ground
            
            // Set position, rotation and scale
            position.set(x, y, z);
            quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
            scale.set(
                size * (0.8 + Math.random() * 0.4),
                size * (0.8 + Math.random() * 0.4),
                size * (0.8 + Math.random() * 0.4)
            );
            
            // Apply transformation
            matrix.compose(position, quaternion, scale);
            instancedMesh.setMatrixAt(i, matrix);
            
            // Set instance color
            instancedMesh.setColorAt(i, bushColors[bushType]);
        }
        
        // Mark attribute updates
        instancedMesh.instanceMatrix.needsUpdate = true;
        if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
        
        // Optimize rendering
        instancedMesh.frustumCulled = true;
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = false;
        
        // Add to scene
        this.scene.add(instancedMesh);
        this.bushes.push(instancedMesh);
        
        // Add fewer bush clusters (half the original amount)
        this.addBushClusters(7, true);
    }
    
    createIndividualBushes() {
        // Original unoptimized method (kept for compatibility)
        const groundSize = 200;
        const margin = 5;
        const density = 30;
        
        for (let i = 0; i < density * 4; i++) {
            let x, z;
            
            const side = Math.floor(i / density);
            const t = (i % density) / density;
            
            switch(side) {
                case 0: // North side
                    x = -groundSize/2 + groundSize * t;
                    z = -groundSize/2 + margin;
                    break;
                case 1: // East side
                    x = groundSize/2 - margin;
                    z = -groundSize/2 + groundSize * t;
                    break;
                case 2: // South side
                    x = groundSize/2 - groundSize * t;
                    z = groundSize/2 - margin;
                    break;
                case 3: // West side
                    x = -groundSize/2 + margin;
                    z = groundSize/2 - groundSize * t;
                    break;
            }
            
            x += (Math.random() - 0.5) * 10;
            z += (Math.random() - 0.5) * 10;
            
            const size = 0.5 + Math.random() * 1.0;
            const bushType = Math.floor(Math.random() * 3);
            this.createBush(x, 0, z, size, bushType);
        }
        
        this.addBushClusters(15, false);
    }
    
    addBushClusters(count, optimized = true) {
        if (optimized) {
            // Create a simplified instanced version with fewer bushes
            const totalInstances = count * 3; // Average of 3 bushes per cluster
            
            const geometry = new THREE.SphereGeometry(1, 6, 4);
            const bushColors = [
                new THREE.Color(0x2E8B57), // Sea Green
                new THREE.Color(0x228B22), // Forest Green
                new THREE.Color(0x006400)  // Dark Green
            ];
            
            const material = new THREE.MeshStandardMaterial({
                color: 0x2E8B57,
                roughness: 0.8,
                flatShading: true
            });
            
            const instancedMesh = new THREE.InstancedMesh(
                geometry,
                material,
                totalInstances
            );
            
            const matrix = new THREE.Matrix4();
            const position = new THREE.Vector3();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();
            
            let index = 0;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 20 + Math.random() * 70;
                const centerX = Math.cos(angle) * distance;
                const centerZ = Math.sin(angle) * distance;
                
                // Create bushes for this cluster
                const clusterSize = Math.min(3, 2 + Math.floor(Math.random() * 4));
                
                for (let j = 0; j < clusterSize && index < totalInstances; j++) {
                    const offsetX = (Math.random() - 0.5) * 5;
                    const offsetZ = (Math.random() - 0.5) * 5;
                    const size = 0.3 + Math.random() * 0.8;
                    const bushType = Math.floor(Math.random() * 3);
                    const x = centerX + offsetX;
                    const z = centerZ + offsetZ;
                    const y = size/2;
                    
                    // Set instance transformation
                    position.set(x, y, z);
                    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
                    scale.set(size, size, size);
                    
                    matrix.compose(position, quaternion, scale);
                    instancedMesh.setMatrixAt(index, matrix);
                    instancedMesh.setColorAt(index, bushColors[bushType]);
                    
                    index++;
                }
            }
            
            // Update instance attributes
            instancedMesh.instanceMatrix.needsUpdate = true;
            if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
            
            // Set rendering properties
            instancedMesh.frustumCulled = true;
            instancedMesh.castShadow = true;
            instancedMesh.receiveShadow = false;
            
            // Add to scene
            this.scene.add(instancedMesh);
            this.bushes.push(instancedMesh);
            
        } else {
            // Original implementation
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 20 + Math.random() * 70;
                const x = Math.cos(angle) * distance;
                const z = Math.sin(angle) * distance;
                
                const clusterSize = 2 + Math.floor(Math.random() * 4);
                
                for (let j = 0; j < clusterSize; j++) {
                    const offsetX = (Math.random() - 0.5) * 5;
                    const offsetZ = (Math.random() - 0.5) * 5;
                    const size = 0.3 + Math.random() * 0.8;
                    const bushType = Math.floor(Math.random() * 3);
                    
                    this.createBush(x + offsetX, 0, z + offsetZ, size, bushType);
                }
            }
        }
    }
    
    createBush(x, y, z, size = 1.0, type = 0) {
        // Legacy method for individual bushes - use simplified geometry
        const bushColors = [
            0x2E8B57, // Sea Green
            0x228B22, // Forest Green
            0x006400  // Dark Green
        ];
        
        const bushMaterial = new THREE.MeshStandardMaterial({
            color: bushColors[type],
            roughness: 0.8,
            flatShading: true // Use flat shading for better performance
        });
        
        // Use simpler geometry for better performance
        let bushGeometry;
        
        switch (type) {
            case 0: // Round bush - use low poly version
                bushGeometry = new THREE.SphereGeometry(size, 5, 4);
                break;
            case 1: // Oval bush - use low poly
                bushGeometry = new THREE.SphereGeometry(size, 5, 4);
                bushGeometry.scale(1, 0.8, 1);
                break;
            case 2: // Irregular bush - use low poly
                bushGeometry = new THREE.IcosahedronGeometry(size, 0); // Reduced detail
                // Simple deformation
                const posAttr = bushGeometry.getAttribute('position');
                const vertices = posAttr.array;
                
                for (let i = 0; i < vertices.length; i += 3) {
                    vertices[i] *= (0.8 + Math.random() * 0.4); // x
                    vertices[i + 1] *= (0.8 + Math.random() * 0.4); // y
                    vertices[i + 2] *= (0.8 + Math.random() * 0.4); // z
                }
                
                posAttr.needsUpdate = true;
                break;
        }
        
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.set(x, y + size/2, z);
        
        // Reduce shadow casting for better performance
        bush.castShadow = true;
        bush.receiveShadow = false;
        
        // Add userData for distance culling
        bush.userData.isBush = true;
        bush.userData.size = size;
        
        this.scene.add(bush);
        this.bushes.push(bush);
        
        return bush;
    }
    
    addRocks(optimized = true) {
        console.log("Adding rocks to environment");
        
        if (optimized) {
            // Use instanced rendering for better performance
            this.createInstancedRocks();
        } else {
            // Original implementation (slower)
            this.createIndividualRocks();
        }
    }
    
    createInstancedRocks() {
        // Create simplified rock geometry
        const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
        
        // Reduce rock count for better performance
        const count = 15; // Reduced from 25
        
        // Create rock material with flat shading for better performance
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.1,
            flatShading: true
        });
        
        // Use instanced mesh for better performance
        const instancedMesh = new THREE.InstancedMesh(
            rockGeometry,
            rockMaterial,
            count
        );
        
        // Set up matrices for instancing
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        
        // Create rocks around the edges
        for (let i = 0; i < count; i++) {
            // Choose random positions at the edges
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 70;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Random size
            const size = 0.3 + Math.random() * 0.8;
            const y = size/2;
            
            // Random rotation
            quaternion.setFromEuler(new THREE.Euler(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            ));
            
            // Random deformation through scaling
            scale.set(
                size * (0.7 + Math.random() * 0.6),
                size * (0.7 + Math.random() * 0.6),
                size * (0.7 + Math.random() * 0.6)
            );
            
            // Set position
            position.set(x, y, z);
            
            // Apply transformation
            matrix.compose(position, quaternion, scale);
            instancedMesh.setMatrixAt(i, matrix);
        }
        
        // Update instance matrix
        instancedMesh.instanceMatrix.needsUpdate = true;
        
        // Optimize rendering
        instancedMesh.frustumCulled = true;
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = false;
        
        // Add to scene
        this.scene.add(instancedMesh);
        this.rocks.push(instancedMesh);
    }
    
    createIndividualRocks() {
        // Original implementation
        const count = 25;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 70;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            const size = 0.3 + Math.random() * 1.0;
            this.createRock(x, 0, z, size);
        }
    }
    
    createRock(x, y, z, size = 1.0) {
        // Create a simplified polyhedron for the rock shape
        const rockGeometry = new THREE.DodecahedronGeometry(size, 0); // Lowest detail level
        
        // Apply simple deformation
        const posAttr = rockGeometry.getAttribute('position');
        const vertices = posAttr.array;
        
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] *= (0.7 + Math.random() * 0.6);
            vertices[i + 1] *= (0.7 + Math.random() * 0.6);
            vertices[i + 2] *= (0.7 + Math.random() * 0.6);
        }
        
        posAttr.needsUpdate = true;
        
        // Rock material with simplified settings
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.1,
            flatShading: true // Use flat shading for better performance
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(x, y + size/2, z);
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        
        // Optimize shadow settings
        rock.castShadow = true;
        rock.receiveShadow = false; // Don't receive shadows for better performance
        
        // Add userData for distance culling
        rock.userData.isRock = true;
        rock.userData.size = size;
        
        this.scene.add(rock);
        this.rocks.push(rock);
        
        return rock;
    }
    
    addFlowers(optimized = true) {
        console.log("Adding flowers to environment");
        
        if (optimized) {
            // Use simplified flower patches for better performance
            this.createSimplifiedFlowers();
        } else {
            // Original implementation (slower)
            this.createDetailedFlowers();
        }
    }
    
    createSimplifiedFlowers() {
        // Dramatically reduce flower count for better performance
        const patchCount = 6; // Reduced from 12
        
        // Predefine flower colors
        const flowerColors = [
            new THREE.Color(0xFF1493), // Deep Pink
            new THREE.Color(0xFFFF00), // Yellow
            new THREE.Color(0xFF4500), // Orange Red
            new THREE.Color(0xBA55D3), // Medium Orchid
            new THREE.Color(0xFFFFFF)  // White
        ];
        
        // Create a single shared geometry for all flowers
        const petalSize = 0.1;
        const stemRadius = 0.02;
        const stemHeight = 0.3;
        
        // Create a single petal geometry to be reused
        const petalGeometry = new THREE.CircleGeometry(petalSize, 6); // Reduced segments
        
        // Calculate total flowers based on the limit
        let totalFlowers = 0;
        for (let i = 0; i < patchCount; i++) {
            // Create fewer flowers per patch
            totalFlowers += 3 + Math.floor(Math.random() * 5); // 3-7 flowers per patch instead of 5-15
        }
        
        // Cap total flowers at the maximum visible limit
        totalFlowers = Math.min(totalFlowers, this.settings.maxVisibleFlowers);
        
        // Create a merged geometry approach instead of instancing for flowers
        // This works better for flowers since they have complex structure
        
        // Create simplified flowers - one mesh per patch but with merged geometry
        for (let i = 0; i < patchCount; i++) {
            // Create patch at random position
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 60; // Keep away from center
            const patchX = Math.cos(angle) * distance;
            const patchZ = Math.sin(angle) * distance;
            
            // Create a single merged geometry for this patch
            const flowerCount = 3 + Math.floor(Math.random() * 5); // Reduced flower count
            
            // Create a group for this patch
            const patchGroup = new THREE.Group();
            
            for (let j = 0; j < flowerCount; j++) {
                const offsetX = (Math.random() - 0.5) * 4;
                const offsetZ = (Math.random() - 0.5) * 4;
                const x = patchX + offsetX;
                const z = patchZ + offsetZ;
                
                // Choose random color
                const colorIndex = Math.floor(Math.random() * flowerColors.length);
                const flowerColor = flowerColors[colorIndex];
                
                // Create a simplified flower (just a colored circle on a stem)
                const simplifiedFlower = this.createSimplifiedFlower(x, 0, z, flowerColor);
                patchGroup.add(simplifiedFlower);
            }
            
            // Add the patch group to the scene
            this.scene.add(patchGroup);
            
            // Add to flowers array for updates
            this.flowers.push(patchGroup);
        }
    }
    
    createSimplifiedFlower(x, y, z, color) {
        // Create a much simpler flower representation
        const flowerGroup = new THREE.Group();
        
        // Simplified stem
        const stemHeight = 0.2 + Math.random() * 0.2;
        const stemRadius = 0.02;
        const stemGeometry = new THREE.CylinderGeometry(stemRadius, stemRadius, stemHeight, 4); // Reduced segments
        const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x008000 }); // BasicMaterial for better performance
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.set(0, stemHeight/2, 0);
        flowerGroup.add(stem);
        
        // Simplified flower head - just a single circle
        const flowerSize = 0.1 + Math.random() * 0.05;
        const flowerGeometry = new THREE.CircleGeometry(flowerSize, 6); // Reduced segments
        const flowerMaterial = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide
        });
        
        const flowerHead = new THREE.Mesh(flowerGeometry, flowerMaterial);
        flowerHead.position.set(0, stemHeight, 0);
        flowerHead.rotation.x = -Math.PI/2;
        flowerGroup.add(flowerHead);
        
        // Position the entire flower
        flowerGroup.position.set(x, y, z);
        
        // Add metadata for distance culling
        flowerGroup.userData.isFlower = true;
        flowerGroup.userData.size = flowerSize;
        
        return flowerGroup;
    }
    
    createDetailedFlowers() {
        // Original detailed implementation
        const patchCount = 12;
        
        for (let i = 0; i < patchCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 60;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            const flowerCount = 5 + Math.floor(Math.random() * 10);
            const flowerColors = [
                0xFF1493, // Deep Pink
                0xFFFF00, // Yellow
                0xFF4500, // Orange Red
                0xBA55D3, // Medium Orchid
                0xFFFFFF  // White
            ];
            
            for (let j = 0; j < flowerCount; j++) {
                const offsetX = (Math.random() - 0.5) * 4;
                const offsetZ = (Math.random() - 0.5) * 4;
                const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
                
                this.createFlower(x + offsetX, 0, z + offsetZ, flowerColor);
            }
        }
    }
    
    createFlower(x, y, z, color) {
        // Original detailed flower method
        // Stem
        const stemHeight = 0.2 + Math.random() * 0.3;
        const stemRadius = 0.02;
        
        const stemGeometry = new THREE.CylinderGeometry(stemRadius, stemRadius, stemHeight, 4); // Reduced segments
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x008000 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        
        // Position stem
        stem.position.set(x, y + stemHeight/2, z);
        stem.castShadow = false; // Don't cast shadows for better performance
        
        // Flower head
        const petalCount = 5 + Math.floor(Math.random() * 3);
        const petalSize = 0.05 + Math.random() * 0.05;
        const flowerGroup = new THREE.Group();
        
        // Create petals
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const petalGeometry = new THREE.CircleGeometry(petalSize, 5); // Reduced segments
            const petalMaterial = new THREE.MeshBasicMaterial({ // BasicMaterial for better performance
                color: color,
                side: THREE.DoubleSide
            });
            
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            petal.position.set(
                Math.cos(angle) * petalSize,
                stemHeight + 0.02,
                Math.sin(angle) * petalSize
            );
            
            // Make petals face slightly upward
            petal.rotation.x = -Math.PI/2;
            petal.rotation.z = -angle;
            petal.castShadow = false; // Disable shadow casting for better performance
            
            flowerGroup.add(petal);
        }
        
        // Center of the flower
        const centerGeometry = new THREE.CircleGeometry(petalSize/2, 5); // Reduced segments
        const centerMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00, // Yellow center
            side: THREE.DoubleSide
        });
        
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.set(0, stemHeight + 0.03, 0);
        center.rotation.x = -Math.PI/2;
        center.castShadow = false; // Disable shadow casting for better performance
        
        flowerGroup.add(center);
        flowerGroup.add(stem);
        
        this.scene.add(flowerGroup);
        this.flowers.push(flowerGroup);
        
        return flowerGroup;
    }
    
    addStreetLights() {
        console.log("Adding street lights to environment");
        
        // Reduce light count and size for better performance
        const count = Math.min(4, this.settings.maxVisibleStreetLights);
        
        // Create a shared pole geometry
        const poleHeight = 5;
        const poleRadius = 0.1;
        const poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 6); // Reduced segments
        
        // Create simplified light fixtures
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const distance = 90;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Create optimized street light
            this.createOptimizedStreetLight(x, 0, z, poleGeometry, poleHeight);
        }
    }
    
    createOptimizedStreetLight(x, y, z, poleGeometry, poleHeight) {
        // Use a shared material for better performance
        const poleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x707070,
            metalness: 0.3,
            roughness: 0.7,
            flatShading: true
        });
        
        // Create pole
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(0, poleHeight/2, 0);
        
        // Lamp fixture group
        const fixtureGroup = new THREE.Group();
        fixtureGroup.add(pole);
        
        // Simplified lamp housing - use lower poly count
        const housingGeometry = new THREE.SphereGeometry(0.3, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
        const housingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x909090,
            flatShading: true
        });
        
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.position.set(0, poleHeight, 0);
        housing.rotation.x = Math.PI;
        fixtureGroup.add(housing);
        
        // Add a point light with reduced settings
        const light = new THREE.PointLight(0xffffcc, 1, 40);
        light.position.set(0, poleHeight - 0.1, 0);
        
        // Use shadow settings optimized for performance
        light.castShadow = true;
        light.shadow.mapSize.width = 256; // Reduced shadow map resolution
        light.shadow.mapSize.height = 256;
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 25; // Reduced distance
        
        // Randomly toggle some lights on/off to simulate time of day
        light.intensity = Math.random() > 0.5 ? 1 : 0;
        
        fixtureGroup.add(light);
        
        // Position the entire group
        fixtureGroup.position.set(x, y, z);
        
        // Add metadata for distance-based culling
        fixtureGroup.userData.isStreetLight = true;
        fixtureGroup.userData.light = light;
        
        this.scene.add(fixtureGroup);
        this.streetLights.push(fixtureGroup);
        
        return fixtureGroup;
    }
    
    // Method to update animations and handle performance optimizations
    update(deltaTime, camera) {
        // Only update every N frames for performance
        this.frameCount++;
        if (this.frameCount % this.cameraUpdateFrequency !== 0) {
            // Just update animations but skip visibility checks
            this.updateAnimations(deltaTime);
            return;
        }
        
        // Update camera position for distance culling
        if (camera && camera.position) {
            this.lastCameraPosition.copy(camera.position);
        }
        
        // Handle distance-based culling and LOD
        if (this.settings.cullingEnabled) {
            this.updateVisibility();
        }
        
        // Update animations
        this.updateAnimations(deltaTime);
    }
    
    // Update animations without affecting visibility
    updateAnimations(deltaTime) {
        // Make flowers sway in the wind
        if (this.flowers && this.flowers.length > 0) {
            this.flowers.forEach(flower => {
                // Skip if flower is invalid
                if (!flower || !flower.children) return;
                
                // Simple wind sway animation
                const swayAmount = Math.sin(Date.now() * 0.002) * 0.02;
                flower.rotation.x = swayAmount;
                flower.rotation.z = swayAmount;
            });
        }
    }
    
    // Handle distance-based culling for better performance
    updateVisibility() {
        const camera = this.lastCameraPosition;
        if (!camera) return;
        
        // Distance thresholds
        const maxDistance = this.settings.drawDistance;
        const [closeDistance, mediumDistance, farDistance] = this.settings.lodDistances;
        
        // Process bushes
        this.bushes.forEach(bush => {
            // Skip instanced meshes - they're handled differently
            if (bush instanceof THREE.InstancedMesh) return;
            
            if (bush.userData.isBush) {
                const distance = camera.distanceTo(bush.position);
                
                // Enable/disable based on distance
                if (distance > maxDistance) {
                    bush.visible = false;
                } else {
                    bush.visible = true;
                    
                    // Disable shadows for distant objects
                    bush.castShadow = (distance < mediumDistance);
                }
            }
        });
        
        // Process rocks
        this.rocks.forEach(rock => {
            // Skip instanced meshes
            if (rock instanceof THREE.InstancedMesh) return;
            
            if (rock.userData.isRock) {
                const distance = camera.distanceTo(rock.position);
                
                if (distance > maxDistance) {
                    rock.visible = false;
                } else {
                    rock.visible = true;
                    rock.castShadow = (distance < mediumDistance);
                }
            }
        });
        
        // Process flowers - these can be more aggressively culled
        this.flowers.forEach(flower => {
            if (flower.userData.isFlower) {
                const distance = camera.distanceTo(flower.position);
                
                if (distance > farDistance) {
                    flower.visible = false;
                } else {
                    flower.visible = true;
                }
            }
        });
        
        // Process street lights - selectively enable/disable lights based on distance
        this.streetLights.forEach(light => {
            if (light.userData.isStreetLight) {
                const distance = camera.distanceTo(light.position);
                
                // Always keep the light fixture visible up to max distance
                if (distance > maxDistance) {
                    light.visible = false;
                } else {
                    light.visible = true;
                    
                    // Only enable actual light component when close
                    if (light.userData.light) {
                        // Only enable close lights to improve performance
                        light.userData.light.intensity = 
                            (distance < closeDistance && light.userData.light.intensity > 0) ? 1 : 0;
                    }
                }
            }
        });
    }
}
