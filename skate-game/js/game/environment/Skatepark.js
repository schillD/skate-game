import * as THREE from 'three';

export class Skatepark {
    constructor(scene, textureLoader) {
        this.scene = scene;
        this.textureLoader = textureLoader;
        this.sheep = [];
        this.createSkatepark();
    }
    
    createSkatepark() {
        // Create a larger ground plane with better texture
        const groundSize = 400;
        const skateparkSize = 200;
        
        // Main ground - extends far beyond the playable area (grass)
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        
        // Create a simple ground material immediately without waiting for texture
        const basicGroundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x7CFC00, // Lawn green
            side: THREE.DoubleSide,
            roughness: 0.8
        });
        const baseGround = new THREE.Mesh(groundGeometry, basicGroundMaterial);
        baseGround.rotation.x = -Math.PI / 2;
        baseGround.position.y = -0.51;
        baseGround.receiveShadow = true;
        baseGround.name = "base_ground";
        this.scene.add(baseGround);
        
        // Add normal sheep (not debug sheep with markers)
        console.log("Creating sheep for gameplay");
        this.addRegularSheep();
        
        // Create a procedural grass texture
        const grassTexture = this.createProceduralGrassTexture();
        
        // Apply grass texture to the ground
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            map: grassTexture,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5; // Slightly higher to avoid z-fighting
        ground.receiveShadow = true;
        ground.name = "textured_ground";
        this.scene.add(ground);
        
        // Skatepark concrete base
        const skateparkGeometry = new THREE.BoxGeometry(skateparkSize, 1, skateparkSize);
        
        // Create a concrete texture
        const concreteTexture = this.createProceduralConcreteTexture();
        concreteTexture.wrapS = THREE.RepeatWrapping;
        concreteTexture.wrapT = THREE.RepeatWrapping;
        concreteTexture.repeat.set(15, 15);
        
        const skateparkMaterial = new THREE.MeshStandardMaterial({ 
            map: concreteTexture,
            color: 0xbababa,
            roughness: 0.5
        });
        
        const skatepark = new THREE.Mesh(skateparkGeometry, skateparkMaterial);
        skatepark.position.y = -0.5;
        skatepark.receiveShadow = true;
        skatepark.name = "skatepark_base";
        this.scene.add(skatepark);
        
        // SKATEPARK LAYOUT - Completely reorganized with more skateable features
        // Main central elements
        this.createHalfPipe(0, 0, -45, 20, 5);     // Large central half pipe
        this.createRail(0, 0, 15, 25);             // Long central rail
        
        // North section
        this.createFunBox(0, 0, 45, 12, 2, 8);     // Large fun box
        this.createRail(-15, 2, 45, 12, true);     // Rail on fun box
        this.createRail(15, 2, 45, 12, false);     // Rail on fun box
        this.createQuarterPipe(0, 0, 70, 30, 4);   // North edge quarter pipe
        
        // East section (right)
        this.createRampSeries(50, 0, 0, 4);         // Series of ramps
        this.createBowl(60, 0, -60, 12, 3);        // Deep bowl in corner
        
        // West section (left)
        this.addSkatePool(-60, 0, 0, 20, 4);        // Skate pool
        this.createStairs(-50, 0, 30, 6, 0.2, 5);  // Wider stairs with rails
        
        // South section
        this.createManualPad(-30, 0, -30, 15, 4, 0.5); // Manual pad
        this.createKicker(30, 0, -30, 6, 2, 4);    // Larger kicker
        
        // Perimeter elements
        this.createQuarterPipe(85, 0, 0, 30, 4, false);  // East perimeter quarter pipe
        this.createQuarterPipe(-85, 0, 0, 30, 4, true);  // West perimeter quarter pipe
        
        // Add more skateable obstacles
        this.addGrindBox(40, 0, 0);               // Grind box/ledge
        this.addFlatRail(-40, 0, -15);            // Flat rail setup
        this.addHalfPyramid(20, 0, 20);           // Half pyramid
        this.addLedges();                         // Add concrete ledges
        this.addSpineTransfer();                  // Add spine transfer
        
        // Add skatepark decorations (benches, trash cans, etc)
        this.addSkateparkDecorations();
        this.createManualPad(0, 0, -60, 15, 4);   // Long manual pad
        this.createBank(70, 0, 50, 15, 3);        // Angled bank
        this.createBank(-70, 0, -50, 15, 3, true);// Mirrored angled bank
        
        // Add a house
        this.createHouse(85, 0, 85);
        
        // Add some decorative elements
        this.addDecorations();

        // Add obstacle elements for more fun gameplay
        this.addTrafficCones();
        this.addBarrels();

        // Add new obstacle elements
        this.addRamps();
        this.addMerryGoRound();
        this.addSeeSaw();
        this.addGrindBox();
        this.addHalfPyramid();
        this.addObstacleCourse();
        this.addSkatePool();
        
        // Add basketball court in a visible central location
        this.addBasketballCourt();
        console.log("Added basketball court to skatepark");
        
        // Add a spatial check to identify overlapping objects
        this.checkForOverlappingObjects();
    }
    
    createRamp(x, y, z, size = 1.0, mirrored = false) {
        const rampWidth = 8 * size;
        const rampHeight = 3 * size;
        const rampLength = 10 * size;
        
        const rampGeometry = new THREE.BoxGeometry(rampWidth, rampHeight, rampLength);
        const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
        const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
        
        ramp.position.set(x, y + rampHeight/2, z);
        const rotation = mirrored ? -Math.PI/8 : Math.PI/8;
        ramp.rotation.z = rotation;
        
        ramp.castShadow = true;
        ramp.receiveShadow = true;
        this.scene.add(ramp);
        
        // Add grind edges to the ramp
        const edgeGeometry = new THREE.CylinderGeometry(0.1, 0.1, rampWidth + 0.5);
        const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 });
        
        const topEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        topEdge.rotation.z = Math.PI/2;
        topEdge.position.set(x, y + rampHeight - 0.1, z - rampLength/2);
        topEdge.castShadow = true;
        topEdge.name = "rail_edge";
        this.scene.add(topEdge);
    }
    
    createRail(x, y, z, length = 10, mirrored = false) {
        const railGeometry = new THREE.CylinderGeometry(0.1, 0.1, length);
        const railMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x404040, 
            metalness: 0.8,
            roughness: 0.2
        });
        const rail = new THREE.Mesh(railGeometry, railMaterial);
        rail.position.set(x, y + 1, z);
        rail.rotation.x = Math.PI / 2;
        if (mirrored) {
            rail.rotation.z = Math.PI / 16; // Slight angle if mirrored
        }
        rail.castShadow = true;
        rail.name = "rail";
        this.scene.add(rail);
        
        // Add supports
        const supportGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1);
        const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 });
        
        const supports = [-length/2 + 0.5, 0, length/2 - 0.5];
        supports.forEach((offset, index) => {
            const support = new THREE.Mesh(supportGeometry, supportMaterial);
            // Adjust support position slightly if rail is angled
            const supportX = mirrored ? x + Math.sin(rail.rotation.z) * offset : x;
            const supportZ = mirrored ? z + Math.cos(rail.rotation.z) * offset : z + offset;
            support.position.set(supportX, y + 0.5, supportZ);
            support.castShadow = true;
            support.name = `rail_support_${index}`;
            this.scene.add(support);
        });
    }
    
    createHalfPipe(x, y, z) {
        const width = 12;
        const height = 4;
        const length = 20;
        const segments = 12;
        
        // Create half-pipe shape with curved sides
        const shape = new THREE.Shape();
        shape.moveTo(-width/2, 0);
        shape.lineTo(-width/2, 0.2);
        
        // Left curved wall
        for (let i = 0; i <= segments; i++) {
            const angle = (Math.PI/2) * (i/segments);
            const px = -width/2 + height * (1 - Math.cos(angle));
            const py = height * Math.sin(angle);
            shape.lineTo(px, py);
        }
        
        // Flat middle
        shape.lineTo(width/2, height);
        
        // Right curved wall
        for (let i = segments; i >= 0; i--) {
            const angle = (Math.PI/2) * (i/segments);
            const px = width/2 - height * (1 - Math.cos(angle));
            const py = height * Math.sin(angle);
            shape.lineTo(px, py);
        }
        
        shape.lineTo(width/2, 0);
        shape.lineTo(width/2, 0);
        
        const extrudeSettings = {
            steps: 1,
            depth: length,
            bevelEnabled: false
        };
        
        const halfPipeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        halfPipeGeometry.center();
        
        // Load a texture for the half pipe
        this.textureLoader.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg')
            .then(halfPipeTexture => {
                halfPipeTexture.wrapS = THREE.RepeatWrapping;
                halfPipeTexture.wrapT = THREE.RepeatWrapping;
                halfPipeTexture.repeat.set(5, 2);
                
                const halfPipeMaterial = new THREE.MeshStandardMaterial({ 
                    map: halfPipeTexture,
                    side: THREE.DoubleSide
                });
                
                const halfPipe = new THREE.Mesh(halfPipeGeometry, halfPipeMaterial);
                halfPipe.position.set(x, y, z);
                halfPipe.rotation.x = Math.PI/2;
                halfPipe.castShadow = true;
                halfPipe.receiveShadow = true;
                
                this.scene.add(halfPipe);
            })
            .catch(() => {
                const halfPipeMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x888888,
                    side: THREE.DoubleSide
                });
                
                const halfPipe = new THREE.Mesh(halfPipeGeometry, halfPipeMaterial);
                halfPipe.position.set(x, y, z);
                halfPipe.rotation.x = Math.PI/2;
                halfPipe.castShadow = true;
                halfPipe.receiveShadow = true;
                
                this.scene.add(halfPipe);
            });
        
        // Add coping at the top edges
        const copingGeometry = new THREE.CylinderGeometry(0.15, 0.15, length + 0.3);
        const copingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xa0a0a0, 
            metalness: 0.7,
            roughness: 0.3
        });
        
        const leftCoping = new THREE.Mesh(copingGeometry, copingMaterial);
        leftCoping.position.set(x - width/2, y + height, z);
        leftCoping.rotation.x = Math.PI/2;
        leftCoping.castShadow = true;
        leftCoping.name = "rail_coping_left";
        this.scene.add(leftCoping);
        
        const rightCoping = new THREE.Mesh(copingGeometry, copingMaterial);
        rightCoping.position.set(x + width/2, y + height, z);
        rightCoping.rotation.x = Math.PI/2;
        rightCoping.castShadow = true;
        rightCoping.name = "rail_coping_right";
        this.scene.add(rightCoping);
    }
    
    createFunBox(x, y, z) {
        // Main box
        const boxWidth = 6;
        const boxHeight = 1.5;
        const boxLength = 8;
        
        const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxLength);
        const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(x, y + boxHeight/2, z);
        box.castShadow = true;
        box.receiveShadow = true;
        this.scene.add(box);
        
        // Angled ramps on each side
        const rampGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxHeight * 2);
        const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        
        const frontRamp = new THREE.Mesh(rampGeometry, rampMaterial);
        frontRamp.position.set(x, y + boxHeight/2, z - boxLength/2 - boxHeight);
        frontRamp.rotation.x = -Math.PI/6;
        frontRamp.castShadow = true;
        frontRamp.receiveShadow = true;
        this.scene.add(frontRamp);
        
        const backRamp = new THREE.Mesh(rampGeometry, rampMaterial);
        backRamp.position.set(x, y + boxHeight/2, z + boxLength/2 + boxHeight);
        backRamp.rotation.x = Math.PI/6;
        backRamp.castShadow = true;
        backRamp.receiveShadow = true;
        this.scene.add(backRamp);
        
        // Rails on top
        this.createRail(x - 1.5, y + boxHeight - 0.5, z, boxLength - 1);
        this.createRail(x + 1.5, y + boxHeight - 0.5, z, boxLength - 1);
    }
    
    createStairs(x, y, z, stairCount = 5, stairHeight = 0.3, stairWidth = 8) {
        // Create a set of stairs with rails
        const stairDepth = 1.5;
        const totalHeight = stairCount * stairHeight;
        const totalDepth = stairCount * stairDepth;
        
        // Create each step
        for (let i = 0; i < stairCount; i++) {
            const stepGeometry = new THREE.BoxGeometry(stairWidth, stairHeight, stairDepth);
            const stepMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            
            step.position.set(
                x, 
                y + stairHeight/2 + i * stairHeight, 
                z + i * stairDepth
            );
            
            step.castShadow = true;
            step.receiveShadow = true;
            this.scene.add(step);
        }
        
        // Handrails on the sides
        const railHeight = 1;
        const railLength = stairCount * stairDepth;
        const railAngle = Math.atan2(stairCount * stairHeight, railLength);
        
        const leftRailGeometry = new THREE.CylinderGeometry(0.05, 0.05, railLength);
        const rightRailGeometry = new THREE.CylinderGeometry(0.05, 0.05, railLength);
        const railMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x505050,
            metalness: 0.7
        });
        
        const leftRail = new THREE.Mesh(leftRailGeometry, railMaterial);
        leftRail.position.set(
            x - stairWidth/2 + 0.2, 
            y + railHeight/2 + (stairCount * stairHeight)/2, 
            z + railLength/2
        );
        leftRail.rotation.x = Math.PI/2 - railAngle;
        leftRail.castShadow = true;
        leftRail.name = "rail_stair_left";
        this.scene.add(leftRail);
        
        const rightRail = new THREE.Mesh(rightRailGeometry, railMaterial);
        rightRail.position.set(
            x + stairWidth/2 - 0.2, 
            y + railHeight/2 + (stairCount * stairHeight)/2, 
            z + railLength/2
        );
        rightRail.rotation.x = Math.PI/2 - railAngle;
        rightRail.castShadow = true;
        rightRail.name = "rail_stair_right";
        this.scene.add(rightRail);
    }
    
    createQuarterPipe(x, y, z, width = 10, height = 3) {
        const depth = height * 2; // Make depth proportional to height
        const segments = 8;
        
        // Create quarter-pipe shape
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        
        // Curved section
        for (let i = 0; i <= segments; i++) {
            const angle = (Math.PI/2) * (i/segments);
            const px = height * (1 - Math.cos(angle));
            const py = height * Math.sin(angle);
            shape.lineTo(px, py);
        }
        
        shape.lineTo(height, 0);
        shape.lineTo(0, 0);
        
        const extrudeSettings = {
            steps: 1,
            depth: width,
            bevelEnabled: false
        };
        
        const pipeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        
        // Load texture for the quarter pipe
        this.textureLoader.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg')
            .then(pipeTexture => {
                pipeTexture.wrapS = THREE.RepeatWrapping;
                pipeTexture.wrapT = THREE.RepeatWrapping;
                pipeTexture.repeat.set(Math.max(1, width / 3), 1); // Adjust texture repeat based on width
                
                const pipeMaterial = new THREE.MeshStandardMaterial({ 
                    map: pipeTexture,
                    side: THREE.DoubleSide
                });
                
                const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
                pipe.position.set(x - width/2, y, z);
                pipe.rotation.y = Math.PI/2;
                pipe.castShadow = true;
                pipe.receiveShadow = true;
                pipe.name = "quarter_pipe";
                this.scene.add(pipe);
            })
            .catch(() => {
                const pipeMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x888888,
                    side: THREE.DoubleSide
                });
                
                const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
                pipe.position.set(x - width/2, y, z);
                pipe.rotation.y = Math.PI/2;
                pipe.castShadow = true;
                pipe.receiveShadow = true;
                pipe.name = "quarter_pipe";
                this.scene.add(pipe);
            });
        
        // Add coping at the top edge
        const copingGeometry = new THREE.CylinderGeometry(0.15, 0.15, width);
        const copingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xa0a0a0, 
            metalness: 0.7 
        });
        
        const coping = new THREE.Mesh(copingGeometry, copingMaterial);
        // Adjust coping position based on potentially changed height
        coping.position.set(x, y + height, z - height);
        coping.rotation.x = Math.PI/2;
        coping.castShadow = true;
        coping.name = "rail_coping_quarter";
        this.scene.add(coping);
    }
    
    createBowl(x, y, z, radius = 6, depth = 2) {
        const segments = 32;
        const innerRadius = radius - 0.2;
        
        // Create bowl shape
        const shape = new THREE.Shape();
        shape.moveTo(radius, 0);
        
        // Outer circle
        for (let i = 0; i <= segments; i++) {
            const angle = 2 * Math.PI * i / segments;
            shape.lineTo(
                radius * Math.cos(angle),
                radius * Math.sin(angle)
            );
        }
        
        // Inner circle (hole)
        const hole = new THREE.Path();
        for (let i = segments; i >= 0; i--) {
            const angle = 2 * Math.PI * i / segments;
            hole.lineTo(
                innerRadius * Math.cos(angle),
                innerRadius * Math.sin(angle)
            );
        }
        shape.holes.push(hole);
        
        // Floor of the bowl
        const floorGeometry = new THREE.CircleGeometry(innerRadius, segments);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x999999,
            side: THREE.DoubleSide
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.set(x, y - depth, z);
        floor.rotation.x = -Math.PI/2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Walls of the bowl
        const extrudeSettings = {
            steps: 1,
            depth: depth,
            bevelEnabled: false
        };
        
        const wallGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            side: THREE.DoubleSide
        });
        
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(x, y, z);
        wall.rotation.x = Math.PI/2;
        wall.castShadow = true;
        wall.receiveShadow = true;
        
        this.scene.add(wall);
        
        // Add coping around the edge
        const copingGeometry = new THREE.TorusGeometry(radius, 0.15, 16, 48);
        const copingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xa0a0a0, 
            metalness: 0.7 
        });
        
        const coping = new THREE.Mesh(copingGeometry, copingMaterial);
        coping.position.set(x, y, z);
        coping.rotation.x = Math.PI/2;
        coping.castShadow = true;
        coping.name = "rail_coping_bowl";
        this.scene.add(coping);
    }
    
    addSkateparkDecorations() {
        // Add skatepark-specific decorations
        this.addBenches();
        this.addTrashCans();
        this.addSkateparkSignage();
        this.addGraffiti();
        this.addBarriers();
        this.addWaterFountain();
        this.addObstacleCones();
    }
    
    addDecorations() {
        // Legacy method - now calling the new implementation
        this.addSkateparkDecorations();
    }
    
    addTrees() {
        // Empty - trees are now handled by Decorations.js
    }

    addSpineTransfer() {
        // Add a spine transfer ramp (two quarter pipes back-to-back)
        const x = -20;
        const z = 20;
        
        // First quarter pipe
        const qp1 = this.createQuarterPipe(x - 5, 0, z, 15, 3, false, false);
        
        // Second quarter pipe facing the opposite direction
        const qp2 = this.createQuarterPipe(x + 5, 0, z, 15, 3, true, false);
    }
    
    addLedges() {
        // Add skateable concrete ledges
        this.createLedge(30, 0, 30, 12, 0.4, 1);
        this.createLedge(-30, 0, -40, 15, 0.4, 1);
        this.createLedge(70, 0, -20, 20, 0.4, 1);
    }
    
    createLedge(x, y, z, length = 10, height = 0.4, width = 1) {
        // Create a simple skateable ledge
        const ledgeGeometry = new THREE.BoxGeometry(width, height, length);
        const ledgeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xCCCCCC,
            roughness: 0.6
        });
        
        const ledge = new THREE.Mesh(ledgeGeometry, ledgeMaterial);
        ledge.position.set(x, y + height/2, z);
        ledge.castShadow = true;
        ledge.receiveShadow = true;
        ledge.name = `ledge_${x}_${z}`;
        
        this.scene.add(ledge);
        return ledge;
    }
    
    addFlatRail(x, y, z) {
        // Create a flat rail setup with approach ramps
        const railLength = 12;
        
        // Create small approach ramps on each end
        this.createSmallRamp(x - railLength/2 - 2, y, z, 4, 0.4, 3);
        this.createSmallRamp(x + railLength/2 + 2, y, z, 4, 0.4, 3, true);
        
        // Create the rail
        this.createRail(x, y + 0.3, z, railLength);
    }
    
    addSkateparkSignage() {
        // Add a skatepark sign
        const signWidth = 6;
        const signHeight = 4;
        
        // Create sign post
        const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
        const postMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(80, 2.5, 80);
        post.castShadow = true;
        this.scene.add(post);
        
        // Create sign panel
        const signGeometry = new THREE.BoxGeometry(signWidth, signHeight, 0.2);
        const signMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2288cc,
            roughness: 0.5
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, 1, 0);
        sign.rotation.y = Math.PI / 4; // Angle the sign
        post.add(sign);
    }
    
    addGraffiti() {
        // Add graffiti textures to some walls
        // This would normally use custom textures, but we'll just use colored materials
        
        // Create graffiti wall
        const wallGeometry = new THREE.BoxGeometry(20, 4, 0.5);
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xDDDDDD });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(-80, 2, -80);
        wall.rotation.y = Math.PI / 4;
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
        
        // Add some colored shapes for 'graffiti'
        const addGraffitiShape = (width, height, x, y, color) => {
            const shapeGeometry = new THREE.PlaneGeometry(width, height);
            const shapeMaterial = new THREE.MeshBasicMaterial({ color });
            const shape = new THREE.Mesh(shapeGeometry, shapeMaterial);
            shape.position.set(x, y, 0.26);
            wall.add(shape);
        };
        
        // Add various 'graffiti' shapes
        addGraffitiShape(5, 2, -4, 0, 0xff4400);
        addGraffitiShape(3, 3, 2, 0, 0x44aaff);
        addGraffitiShape(4, 1.5, 6, -0.5, 0xffcc00);
        addGraffitiShape(2, 2, -7, 0.5, 0x66cc66);
    }
    
    addBarriers() {
        // Add safety barriers around dangerous features
        const barrierPositions = [
            {x: 60, z: -80, rotation: 0, length: 20},
            {x: 40, z: -80, rotation: 0, length: 20}
        ];
        
        barrierPositions.forEach(pos => {
            this.createBarrier(pos.x, 0, pos.z, pos.rotation, pos.length);
        });
    }
    
    createBarrier(x, y, z, rotation = 0, length = 10) {
        // Create safety barrier
        const postCount = Math.floor(length / 2) + 1;
        const barrierGroup = new THREE.Group();
        barrierGroup.position.set(x, y, z);
        barrierGroup.rotation.y = rotation;
        
        // Create posts
        for (let i = 0; i < postCount; i++) {
            const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6);
            const postMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(-length/2 + i * (length/(postCount-1)), 0.6, 0);
            barrierGroup.add(post);
        }
        
        // Create horizontal rails
        const railGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 6);
        railGeometry.rotateZ(Math.PI/2);
        const railMaterial = new THREE.MeshStandardMaterial({ color: 0xDD3333 });
        
        const topRail = new THREE.Mesh(railGeometry, railMaterial);
        topRail.position.set(0, 1.0, 0);
        barrierGroup.add(topRail);
        
        const bottomRail = new THREE.Mesh(railGeometry, railMaterial);
        bottomRail.position.set(0, 0.5, 0);
        barrierGroup.add(bottomRail);
        
        this.scene.add(barrierGroup);
    }
    
    addWaterFountain() {
        // Add a water fountain
        const baseGeometry = new THREE.CylinderGeometry(0.6, 0.8, 0.8, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(90, 0.4, 90);
        this.scene.add(base);
        
        const topGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8);
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(0, 0.5, 0);
        base.add(top);
        
        const spoutGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
        const spoutMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const spout = new THREE.Mesh(spoutGeometry, spoutMaterial);
        spout.position.set(0, 0.1, 0.3);
        top.add(spout);
    }
    
    addObstacleCones() {
        // Add traffic cones as obstacles
        for (let i = 0; i < 5; i++) {
            const x = -70 + i * 5;
            this.createTrafficCone(x, 0, -70, 0.4, 1.2);
        }
    }
    
    addBasketballCourt() {
        console.log("Creating basketball court in skatepark");
        
        // Position the court in a very visible free area (central area slightly toward southeast)
        const courtPosition = new THREE.Vector3(30, 0.01, 15);
        
        // Court dimensions (standard half-court is ~14m x 15m)
        const courtWidth = 15;  // Width (sideline to sideline)
        const courtLength = 14;  // Length (baseline to half-court line)
        
        // Create a visible border around the court
        this.createCourtBorder(courtPosition, courtWidth, courtLength);
        
        // Create court surface
        this.createCourtSurface(courtPosition, courtWidth, courtLength);
        
        // Add court markings (lines)
        this.addCourtMarkings(courtPosition, courtWidth, courtLength);
        
        // Add basketball hoop
        this.addBasketballHoop(courtPosition, courtWidth, courtLength);
        
        console.log("Basketball court created at position:", courtPosition);
    }
    
    createCourtBorder(position, width, length) {
        // Create a colored border around the court for better visibility
        const borderWidth = width + 1;
        const borderLength = length + 1;
        const borderGeometry = new THREE.PlaneGeometry(borderWidth, borderLength);
        const borderMaterial = new THREE.MeshBasicMaterial({
            color: 0x0058BC, // Basketball blue color
            side: THREE.DoubleSide
        });
        
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.rotation.x = -Math.PI / 2; // Lay flat
        border.position.set(position.x, position.y - 0.001, position.z); // Slightly below court surface
        this.scene.add(border);
        return border;
    }
    
    createCourtSurface(position, width, length) {
        // Create the court surface - concrete/asphalt with texture
        const courtGeometry = new THREE.PlaneGeometry(width, length);
        
        // Create asphalt texture procedurally
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Base color - dark gray asphalt with a hint of blue (typical court color)
        context.fillStyle = '#2A353C';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add asphalt texture details
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            
            // Slightly lighter gray specs
            const gray = 60 + Math.floor(Math.random() * 20);
            context.fillStyle = `rgb(${gray}, ${gray + 5}, ${gray + 8})`;
            
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
        
        // Center circle - use a ring geometry instead of circle
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
        const targetMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
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
    
    addBenches() {
        const createBench = (x, y, z, rotation = 0) => {
            const seatGeometry = new THREE.BoxGeometry(3, 0.2, 1);
            const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
            const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            
            // Seat
            const seat = new THREE.Mesh(seatGeometry, woodMaterial);
            seat.position.set(x, y + 0.5, z);
            seat.rotation.y = rotation;
            seat.castShadow = true;
            this.scene.add(seat);
            
            // Legs
            const legOffsets = [
                [-1.2, 0.3], [-1.2, -0.3], [1.2, 0.3], [1.2, -0.3]
            ];
            
            legOffsets.forEach(offset => {
                const leg = new THREE.Mesh(legGeometry, woodMaterial);
                
                // Apply rotation to position
                const rotatedX = offset[0] * Math.cos(rotation) - offset[1] * Math.sin(rotation);
                const rotatedZ = offset[0] * Math.sin(rotation) + offset[1] * Math.cos(rotation);
                
                leg.position.set(x + rotatedX, y + 0.1, z + rotatedZ);
                leg.castShadow = true;
                this.scene.add(leg);
            });
        };
        
        // Add benches around the expanded park
        createBench(40, 0, 0, Math.PI/4);
        createBench(-40, 0, 0, -Math.PI/4);
        createBench(0, 0, 40, Math.PI/2);
        createBench(60, 0, 60, Math.PI/8);
        createBench(-60, 0, -60, -Math.PI/8);
        createBench(80, 0, -20, 0);
        createBench(-80, 0, 20, Math.PI);
        createBench(20, 0, 80, -Math.PI/2);
        createBench(-20, 0, -80, Math.PI/2);
    }
    
    addTrashCans() {
        const createTrashCan = (x, z) => {
            const canGeometry = new THREE.CylinderGeometry(0.4, 0.3, 1, 8);
            const canMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const can = new THREE.Mesh(canGeometry, canMaterial);
            can.position.set(x, 0.5, z);
            can.castShadow = true;
            this.scene.add(can);
        };
        
        // Place trash cans around the expanded park
        createTrashCan(35, 15);
        createTrashCan(-35, -15);
        createTrashCan(15, 35);
        createTrashCan(-15, -35);
        createTrashCan(70, 70);
        createTrashCan(-70, -70);
        createTrashCan(70, -70);
        createTrashCan(-70, 70);
        createTrashCan(90, 20);
        createTrashCan(-90, -20);
    }

    // --- New Element Creation Methods ---

    createKicker(x, y, z, width = 4, height = 1, length = 3) {
        const kickerGeometry = new THREE.BoxGeometry(width, height, length);
        const kickerMaterial = new THREE.MeshStandardMaterial({ color: 0x606070 });
        const kicker = new THREE.Mesh(kickerGeometry, kickerMaterial);
        
        kicker.position.set(x, y + height / 2, z);
        kicker.rotation.x = -Math.PI / 12; // Slight upward angle
        kicker.castShadow = true;
        kicker.receiveShadow = true;
        kicker.name = "kicker";
        this.scene.add(kicker);
    }

    createManualPad(x, y, z, length = 10, width = 3, height = 0.5) {
        const padGeometry = new THREE.BoxGeometry(width, height, length);
        const padMaterial = new THREE.MeshStandardMaterial({ color: 0x9a9a9a });
        const pad = new THREE.Mesh(padGeometry, padMaterial);
        
        pad.position.set(x, y + height / 2, z);
        pad.castShadow = true;
        pad.receiveShadow = true;
        pad.name = "manual_pad";
        this.scene.add(pad);
    }

    createBank(x, y, z, width = 10, height = 2, length = 8, mirrored = false) {
        const bankGeometry = new THREE.BoxGeometry(width, height, length);
        const bankMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a6a });
        const bank = new THREE.Mesh(bankGeometry, bankMaterial);

        bank.position.set(x, y + height / 2, z);
        const rotationY = mirrored ? Math.PI / 6 : -Math.PI / 6;
        bank.rotation.y = rotationY;
        bank.castShadow = true;
        bank.receiveShadow = true;
        bank.name = "bank";
        this.scene.add(bank);
    }

    createHouse(x, y, z) {
        const houseWidth = 8;
        const houseDepth = 6;
        const wallHeight = 4;
        const wallThickness = 0.5;
        
        // Create a group to hold all house components
        const houseGroup = new THREE.Group();
        houseGroup.position.set(x, y, z);
        houseGroup.name = "house";
        this.scene.add(houseGroup);
        
        // Create materials
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xd2b48c }); // Tan color
        const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // Brown color
        
        // Create explicit collision boxes for each wall
        this.createWallCollider(x, y + wallHeight/2, z + houseDepth/2, houseWidth, wallHeight, wallThickness, "house_wall_front");
        this.createWallCollider(x, y + wallHeight/2, z - houseDepth/2, houseWidth, wallHeight, wallThickness, "house_wall_back");
        this.createWallCollider(x + houseWidth/2, y + wallHeight/2, z, wallThickness, wallHeight, houseDepth, "house_wall_right");
        this.createWallCollider(x - houseWidth/2, y + wallHeight/2, z, wallThickness, wallHeight, houseDepth, "house_wall_left");
        
        // Visual walls (front and back)
        const frontWallGeometry = new THREE.BoxGeometry(houseWidth, wallHeight, wallThickness);
        const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
        frontWall.position.set(0, wallHeight/2, houseDepth/2);
        frontWall.name = "house_wall_visual";
        frontWall.castShadow = true;
        frontWall.receiveShadow = true;
        houseGroup.add(frontWall);
        
        const backWallGeometry = new THREE.BoxGeometry(houseWidth, wallHeight, wallThickness);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, wallHeight/2, -houseDepth/2);
        backWall.name = "house_wall_visual";
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        houseGroup.add(backWall);
        
        // Visual walls (left and right)
        const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, houseDepth);
        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        leftWall.position.set(-houseWidth/2, wallHeight/2, 0);
        leftWall.name = "house_wall_visual";
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        houseGroup.add(leftWall);
        
        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        rightWall.position.set(houseWidth/2, wallHeight/2, 0);
        rightWall.name = "house_wall_visual";
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        houseGroup.add(rightWall);
        
        // Roof (simple pyramid)
        const roofGeometry = new THREE.ConeGeometry(houseWidth * 0.75, wallHeight/2, 4);
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, wallHeight + wallHeight/4, 0);
        roof.rotation.y = Math.PI / 4; // Align pyramid edges with walls
        roof.castShadow = true;
        roof.receiveShadow = true;
        roof.name = "house_roof";
        houseGroup.add(roof);
        
        // Door (cut-out in the front wall)
        const doorWidth = 1.5;
        const doorHeight = 2.5;
        const doorGeometry = new THREE.PlaneGeometry(doorWidth, doorHeight);
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x654321, 
            side: THREE.DoubleSide 
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, doorHeight/2, houseDepth/2 + 0.01);
        door.name = "house_door";
        houseGroup.add(door);
    }
    
    createWallCollider(x, y, z, width, height, depth, name) {
        const wallGeometry = new THREE.BoxGeometry(width, height, depth);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.0 // Invisible collider
        });
        
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(x, y, z);
        wall.name = name;
        wall.userData.isCollider = true; // Explicit collision flag
        this.scene.add(wall);
        return wall; // Return the wall for potential further use
    }

    // Add obstacle creation methods
    addTrafficCones() {
        // Define positions for traffic cones around the park
        const positions = [
            [20, 20], [-20, 20], [20, -20], [-20, -20],
            [0, 30], [30, 0], [-30, 0], [0, -30]
        ];
        positions.forEach(([x, z]) => this.createTrafficCone(x, 0, z));
    }

    createTrafficCone(x, y, z, radius = 0.5, height = 1.5) {
        // Create a cone mesh for the traffic cone
        const geometry = new THREE.ConeGeometry(radius, height, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0xff4500 });
        const cone = new THREE.Mesh(geometry, material);
        cone.position.set(x, y + height / 2, z);
        cone.castShadow = true;
        cone.receiveShadow = true;
        cone.name = 'traffic_cone';
        this.scene.add(cone);
        // Add invisible collider around the traffic cone for collision detection
        this.createWallCollider(x, y + height / 2, z, radius * 2, height, radius * 2, 'traffic_cone_collider');
    }

    addBarrels() {
        // Define positions for barrels around the park
        const positions = [
            [40, -30], [-40, 30], [10, -40], [-10, 40],
            [50, 50], [-50, -50]
        ];
        positions.forEach(([x, z]) => this.createBarrel(x, 0, z));
    }

    createBarrel(x, y, z, radiusTop = 1, radiusBottom = 1, height = 2, segments = 16) {
        const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
        const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const barrel = new THREE.Mesh(geometry, material);
        barrel.position.set(x, y + height / 2, z);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        barrel.name = 'barrel';
        this.scene.add(barrel);
        // Add invisible collider around the barrel for collision detection
        this.createWallCollider(x, y + height / 2, z, radiusTop * 2, height, radiusTop * 2, 'barrel_collider');
    }

    // --- Additional Obstacle Creation Methods ---
    
    addRamps() {
        // Create a series of connected ramps for tricks
        this.createRampSeries(25, 0, -70, 3);
        this.createRampSeries(-25, 0, 70, 3, true);
    }
    
    createRampSeries(x, y, z, count = 3, mirrored = false) {
        const rampWidth = 8;
        const rampHeight = 2;
        const rampLength = 6;
        const spacing = 2;
        
        for (let i = 0; i < count; i++) {
            const rampGeometry = new THREE.BoxGeometry(rampWidth, rampHeight, rampLength);
            const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
            const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
            
            const posZ = z + i * (rampLength + spacing);
            ramp.position.set(x, y + rampHeight/2, posZ);
            const rotation = mirrored ? -Math.PI/8 : Math.PI/8;
            ramp.rotation.z = rotation;
            
            ramp.castShadow = true;
            ramp.receiveShadow = true;
            ramp.name = "ramp_series_" + i;
            this.scene.add(ramp);
            
            // Add grind edge to the top
            const edgeGeometry = new THREE.CylinderGeometry(0.1, 0.1, rampWidth + 0.5);
            const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 });
            
            const topEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            topEdge.rotation.z = Math.PI/2;
            topEdge.position.set(x, y + rampHeight - 0.1, posZ - rampLength/2);
            topEdge.castShadow = true;
            topEdge.name = "rail_edge_series_" + i;
            this.scene.add(topEdge);
        }
    }
    
    addMerryGoRound() {
        // Create a merry-go-round obstacle in the center of the park
        const radius = 6;
        const height = 0.2;
        // Moved position to avoid overlapping with other objects
        const centerX = -40;
        const centerZ = -15;
        
        // Create the base platform
        const baseGeometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x3366aa });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(centerX, height/2, centerZ);
        base.castShadow = true;
        base.receiveShadow = true;
        base.name = "merry_go_round_base";
        this.scene.add(base);
        
        // Create rails/barriers on the platform
        const barCount = 6;
        for (let i = 0; i < barCount; i++) {
            const angle = (i / barCount) * Math.PI * 2;
            const barX = centerX + Math.cos(angle) * (radius - 0.5);
            const barZ = centerZ + Math.sin(angle) * (radius - 0.5);
            
            // Create a rail for grinding
            const railGeometry = new THREE.CylinderGeometry(0.1, 0.1, radius * 1.5);
            const railMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x404040, 
                metalness: 0.8,
                roughness: 0.2
            });
            
            const rail = new THREE.Mesh(railGeometry, railMaterial);
            rail.position.set(barX, height + 0.6, barZ);
            rail.rotation.x = Math.PI/2;
            rail.rotation.z = angle + Math.PI/2;
            rail.castShadow = true;
            rail.name = "merry_go_round_rail_" + i;
            this.scene.add(rail);
        }
        
        // Add collision detection for the base
        this.createWallCollider(centerX, height/2, centerZ, radius * 2, height, radius * 2, "merry_go_round_collider");
    }
    
    addSeeSaw() {
        // Create a see-saw obstacle
        const length = 15;
        const width = 3;
        const height = 0.3;
        const pivotHeight = 1.2;
        
        // Position - moved to avoid overlapping with other objects
        const centerX = 40;
        const centerZ = 65;
        
        // Create the pivot base
        const pivotBaseGeometry = new THREE.BoxGeometry(width, pivotHeight, width);
        const pivotBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const pivotBase = new THREE.Mesh(pivotBaseGeometry, pivotBaseMaterial);
        pivotBase.position.set(centerX, pivotHeight/2, centerZ);
        pivotBase.castShadow = true;
        pivotBase.receiveShadow = true;
        pivotBase.name = "see_saw_pivot";
        this.scene.add(pivotBase);
        
        // Create the see-saw plank
        const plankGeometry = new THREE.BoxGeometry(width, height, length);
        const plankMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const plank = new THREE.Mesh(plankGeometry, plankMaterial);
        
        // Position slightly tilted
        plank.position.set(centerX, pivotHeight + height/2, centerZ);
        plank.rotation.x = Math.PI/16; // Slight tilt
        plank.castShadow = true;
        plank.receiveShadow = true;
        plank.name = "see_saw_plank";
        this.scene.add(plank);
        
        // Add collision detection for the plank
        this.createWallCollider(centerX, pivotHeight + height/2, centerZ, width, height, length, "see_saw_collider");
        
        // Add collision for the pivot
        this.createWallCollider(centerX, pivotHeight/2, centerZ, width, pivotHeight, width, "see_saw_pivot_collider");
    }
    
    addGrindBox() {
        // Create a specialized grind box with multiple rails
        const boxWidth = 8;
        const boxHeight = 1.5;
        const boxLength = 12;
        
        // Position - moved to avoid overlaps
        const x = -65;
        const y = 0;
        const z = -45;
        
        // Create the main box
        const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxLength);
        const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(x, y + boxHeight/2, z);
        box.castShadow = true;
        box.receiveShadow = true;
        box.name = "grind_box";
        this.scene.add(box);
        
        // Add rails on top in different configurations
        
        // Center rail
        const centerRailGeometry = new THREE.CylinderGeometry(0.1, 0.1, boxLength - 1);
        const railMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x707070, 
            metalness: 0.9,
            roughness: 0.1
        });
        
        const centerRail = new THREE.Mesh(centerRailGeometry, railMaterial);
        centerRail.position.set(x, y + boxHeight + 0.1, z);
        centerRail.rotation.x = Math.PI/2;
        centerRail.castShadow = true;
        centerRail.name = "grind_box_center_rail";
        this.scene.add(centerRail);
        
        // Angled rails on the sides
        const leftRailGeometry = new THREE.CylinderGeometry(0.1, 0.1, boxLength - 2);
        const leftRail = new THREE.Mesh(leftRailGeometry, railMaterial);
        leftRail.position.set(x - boxWidth/2 + 0.6, y + boxHeight + 0.1, z);
        leftRail.rotation.x = Math.PI/2;
        leftRail.rotation.z = Math.PI/12; // Slight angle
        leftRail.castShadow = true;
        leftRail.name = "grind_box_left_rail";
        this.scene.add(leftRail);
        
        const rightRailGeometry = new THREE.CylinderGeometry(0.1, 0.1, boxLength - 2);
        const rightRail = new THREE.Mesh(rightRailGeometry, railMaterial);
        rightRail.position.set(x + boxWidth/2 - 0.6, y + boxHeight + 0.1, z);
        rightRail.rotation.x = Math.PI/2;
        rightRail.rotation.z = -Math.PI/12; // Opposite angle
        rightRail.castShadow = true;
        rightRail.name = "grind_box_right_rail";
        this.scene.add(rightRail);
        
        // Add collision detection for the box
        this.createWallCollider(x, y + boxHeight/2, z, boxWidth, boxHeight, boxLength, "grind_box_collider");
    }
    
    addHalfPyramid() {
        // Create a half-pyramid with multiple levels for tricks
        const x = 50;  // Adjusted position to avoid overlaps
        const y = 0;
        const z = -65; // Adjusted position to avoid overlaps
        const levels = 4;
        const baseWidth = 18;
        const baseLength = 18;
        const stepHeight = 0.8;
        
        // Create each level of the pyramid
        for (let i = 0; i < levels; i++) {
            const levelWidth = baseWidth - (i * 3);
            const levelLength = baseLength - (i * 3);
            const levelY = y + i * stepHeight;
            
            const geometry = new THREE.BoxGeometry(levelWidth, stepHeight, levelLength);
            const material = new THREE.MeshStandardMaterial({ color: 0x8a8a8a });
            const level = new THREE.Mesh(geometry, material);
            level.position.set(x, levelY + stepHeight/2, z);
            level.castShadow = true;
            level.receiveShadow = true;
            level.name = "pyramid_level_" + i;
            this.scene.add(level);
            
            // Add collision for each level
            this.createWallCollider(x, levelY + stepHeight/2, z, levelWidth, stepHeight, levelLength, "pyramid_level_" + i + "_collider");
            
            // Add rails on the edges of each level (except the top)
            if (i < levels - 1) {
                // Create rails on each of the four sides
                const railGeometry = new THREE.CylinderGeometry(0.1, 0.1, levelWidth - 1);
                const railMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x707070, 
                    metalness: 0.9,
                    roughness: 0.1
                });
                
                // Front rail
                const frontRail = new THREE.Mesh(railGeometry, railMaterial);
                frontRail.rotation.z = Math.PI/2;
                frontRail.position.set(x, levelY + stepHeight, z + levelLength/2 - 0.1);
                frontRail.castShadow = true;
                frontRail.name = "pyramid_rail_front_" + i;
                this.scene.add(frontRail);
                
                // Back rail
                const backRail = new THREE.Mesh(railGeometry, railMaterial);
                backRail.rotation.z = Math.PI/2;
                backRail.position.set(x, levelY + stepHeight, z - levelLength/2 + 0.1);
                backRail.castShadow = true;
                backRail.name = "pyramid_rail_back_" + i;
                this.scene.add(backRail);
                
                // Side rails (rotated 90 degrees)
                const sideRailGeometry = new THREE.CylinderGeometry(0.1, 0.1, levelLength - 1);
                
                // Left rail
                const leftRail = new THREE.Mesh(sideRailGeometry, railMaterial);
                leftRail.rotation.x = Math.PI/2;
                leftRail.position.set(x - levelWidth/2 + 0.1, levelY + stepHeight, z);
                leftRail.castShadow = true;
                leftRail.name = "pyramid_rail_left_" + i;
                this.scene.add(leftRail);
                
                // Right rail
                const rightRail = new THREE.Mesh(sideRailGeometry, railMaterial);
                rightRail.rotation.x = Math.PI/2;
                rightRail.position.set(x + levelWidth/2 - 0.1, levelY + stepHeight, z);
                rightRail.castShadow = true;
                rightRail.name = "pyramid_rail_right_" + i;
                this.scene.add(rightRail);
            }
        }
    }
    
    addObstacleCourse() {
        // Create a mini obstacle course with various jumps and rails
        const startX = -70; // Adjusted position to avoid overlaps
        const startZ = 55;  // Adjusted position to avoid overlaps
        const courseLength = 40;
        
        // Create a series of low blocks as the base
        const blockCount = 5;
        const blockSpacing = courseLength / blockCount;
        const blockWidth = 8;
        const blockHeight = 0.5;
        const blockLength = 4;
        
        for (let i = 0; i < blockCount; i++) {
            const blockX = startX + i * blockSpacing;
            const blockZ = startZ;
            
            const geometry = new THREE.BoxGeometry(blockWidth, blockHeight, blockLength);
            const material = new THREE.MeshStandardMaterial({ color: 0x777777 });
            const block = new THREE.Mesh(geometry, material);
            block.position.set(blockX, blockHeight/2, blockZ);
            block.castShadow = true;
            block.receiveShadow = true;
            block.name = "obstacle_course_block_" + i;
            this.scene.add(block);
            
            // Add collision
            this.createWallCollider(blockX, blockHeight/2, blockZ, blockWidth, blockHeight, blockLength, "obstacle_course_block_" + i + "_collider");
            
            // Add different obstacles on each block
            switch (i % 5) {
                case 0:
                    // Small ramp with rail
                    this.createSmallRamp(blockX, blockHeight, blockZ, blockWidth, 1.2, blockLength/2);
                    break;
                case 1:
                    // Rail
                    this.createRail(blockX, blockHeight, blockZ, blockLength * 0.8);
                    break;
                case 2:
                    // Double-height block with rail
                    const doubleBlockGeometry = new THREE.BoxGeometry(blockWidth * 0.6, blockHeight, blockLength);
                    const doubleBlock = new THREE.Mesh(doubleBlockGeometry, material);
                    doubleBlock.position.set(blockX, blockHeight * 1.5, blockZ);
                    doubleBlock.castShadow = true;
                    doubleBlock.receiveShadow = true;
                    doubleBlock.name = "obstacle_course_double_" + i;
                    this.scene.add(doubleBlock);
                    
                    // Add collision
                    this.createWallCollider(blockX, blockHeight * 1.5, blockZ, blockWidth * 0.6, blockHeight, blockLength, "obstacle_course_double_" + i + "_collider");
                    
                    // Add rail on top
                    this.createRail(blockX, blockHeight * 2, blockZ, blockLength * 0.6);
                    break;
                case 3:
                    // Cross rails
                    this.createRail(blockX, blockHeight + 0.5, blockZ, blockLength * 0.8);
                    this.createRail(blockX, blockHeight + 0.5, blockZ, blockWidth * 0.8, true);
                    break;
                case 4:
                    // Small funbox
                    this.createFunBoxMini(blockX, blockHeight, blockZ, blockWidth * 0.8, blockHeight * 2, blockLength * 1.2);
                    break;
            }
        }
    }
    
    createSmallRamp(x, y, z, width, height, length) {
        const rampGeometry = new THREE.BoxGeometry(width, height, length);
        const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
        
        ramp.position.set(x, y + height/2, z);
        ramp.rotation.x = -Math.PI/8; // Angled upward
        ramp.castShadow = true;
        ramp.receiveShadow = true;
        ramp.name = "small_ramp";
        this.scene.add(ramp);
        
        // Add invisible collider that follows the ramp shape
        this.createWallCollider(x, y + height/2, z, width, height, length, "small_ramp_collider");
    }
    
    createFunBoxMini(x, y, z, width, height, length) {
        // Create a mini funbox - a raised box with angled sides
        const boxGeometry = new THREE.BoxGeometry(width, height, length);
        const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(x, y + height/2, z);
        box.castShadow = true;
        box.receiveShadow = true;
        box.name = "funbox_mini";
        this.scene.add(box);
        
        // Add collision
        this.createWallCollider(x, y + height/2, z, width, height, length, "funbox_mini_collider");
        
        // Add a rail on top
        const railGeometry = new THREE.CylinderGeometry(0.1, 0.1, length * 0.8);
        const railMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x707070, 
            metalness: 0.9,
            roughness: 0.1
        });
        
        const rail = new THREE.Mesh(railGeometry, railMaterial);
        rail.position.set(x, y + height + 0.1, z);
        rail.rotation.x = Math.PI/2;
        rail.castShadow = true;
        rail.name = "funbox_mini_rail";
        this.scene.add(rail);
    }
    
    addSkatePool() {
        // Create a swimming pool style skate bowl as a raised structure
        const x = 75;
        const y = 0; // Ground level
        const z = 20;
        const width = 25;
        const length = 30;
        const height = 1.2; // Wall height
        const depth = 2.5;  // Pool depth (internal)
        
        // Create a simple, solid concrete frame for the pool
        const frameGeometry = new THREE.BoxGeometry(width + 3, height, length + 3);
        const frameMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888
        });
        
        const poolFrame = new THREE.Mesh(frameGeometry, frameMaterial);
        poolFrame.position.set(x, y + height/2, z);
        poolFrame.receiveShadow = true;
        poolFrame.castShadow = true;
        poolFrame.name = "skate_pool_frame";
        this.scene.add(poolFrame);
        
        // Create a larger, more distinct blue water surface that sits higher
        // Make it MUCH more noticeable with a bright blue color
        const waterGeometry = new THREE.BoxGeometry(width, 0.5, length);
        const waterMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00AAFF,  // Bright, vibrant blue
            transparent: false,
            side: THREE.DoubleSide
        });
        
        const poolWater = new THREE.Mesh(waterGeometry, waterMaterial);
        // Position it very high in the pool so it's definitely visible
        poolWater.position.set(x, y + 0.3, z);
        poolWater.name = "skate_pool_water";
        poolWater.renderOrder = 10; // Ensure it renders above other items
        this.scene.add(poolWater);
        
        // Create a second water layer with a different blue for better visibility
        const waterTopGeometry = new THREE.BoxGeometry(width - 0.5, 0.1, length - 0.5);
        const waterTopMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x33CCFF,  // Slightly lighter blue
            transparent: false
        });
        
        const waterTop = new THREE.Mesh(waterTopGeometry, waterTopMaterial);
        waterTop.position.set(x, y + 0.6, z);
        waterTop.name = "skate_pool_water_top";
        waterTop.renderOrder = 11; // Even higher render order
        this.scene.add(waterTop);
        
        // Create pool coping (edge rail all around)
        this.createPoolCoping(x, y + height, z, width, length);
        
        // Add collision detection for the walls
        const wallThickness = 1.5;
        
        // Add colliders for the pool walls
        this.createWallCollider(x, y + height/2, z + length/2 + wallThickness/2, 
                               width, height, wallThickness, "pool_wall_front");
        
        this.createWallCollider(x, y + height/2, z - length/2 - wallThickness/2, 
                               width, height, wallThickness, "pool_wall_back");
        
        this.createWallCollider(x + width/2 + wallThickness/2, y + height/2, z, 
                               wallThickness, height, length, "pool_wall_right");
        
        this.createWallCollider(x - width/2 - wallThickness/2, y + height/2, z, 
                               wallThickness, height, length, "pool_wall_left");
        
        // Add pool floor collision
        this.createWallCollider(x, y + 0.1, z, width, 0.2, length, "pool_floor");
    }
    
    createPoolCoping(x, y, z, width, length) {
        const copingRadius = 0.15;
        const edgePositions = [
            { pos: [x, y + copingRadius, z + length/2], rot: [0, 0, 0], len: width },
            { pos: [x, y + copingRadius, z - length/2], rot: [0, 0, 0], len: width },
            { pos: [x + width/2, y + copingRadius, z], rot: [0, Math.PI/2, 0], len: length },
            { pos: [x - width/2, y + copingRadius, z], rot: [0, Math.PI/2, 0], len: length }
        ];
        
        const copingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc, 
            metalness: 0.7,
            roughness: 0.3
        });
        
        edgePositions.forEach((edge, i) => {
            const copingGeometry = new THREE.CylinderGeometry(copingRadius, copingRadius, edge.len);
            const coping = new THREE.Mesh(copingGeometry, copingMaterial);
            
            coping.position.set(edge.pos[0], edge.pos[1], edge.pos[2]);
            coping.rotation.set(edge.rot[0], edge.rot[1], edge.rot[2]);
            if (i < 2) {
                coping.rotation.z = Math.PI/2; // Rotate horizontal rails
            } else {
                coping.rotation.x = Math.PI/2; // Rotate vertical rails
            }
            
            coping.castShadow = true;
            coping.name = "pool_coping_" + i;
            this.scene.add(coping);
        });
    }

    // Add a method to check for and warn about overlapping objects
    checkForOverlappingObjects() {
        // Implementation of overlap checking for development purposes
        const objects = this.scene.children.filter(obj => obj.isMesh && obj.name.includes('obstacle'));
        
        for (let i = 0; i < objects.length; i++) {
            const obj1 = objects[i];
            const box1 = new THREE.Box3().setFromObject(obj1);
            
            for (let j = i + 1; j < objects.length; j++) {
                const obj2 = objects[j];
                const box2 = new THREE.Box3().setFromObject(obj2);
                
                if (box1.intersectsBox(box2)) {
                    console.warn(`Overlap detected between ${obj1.name} and ${obj2.name}`);
                }
            }
        }
    }
    
    addRegularSheep() {
        console.log("Adding regular sheep to the skatepark");
        
        // Create sheep in grassy area around skatepark only (far from player)
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 30; // Farther away from player
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            this.createSheep(x, 0, z);
        }
        
        console.log(`Created ${this.sheep.length} regular sheep`);
    }
    
    createSheep(x, y, z) {
        // Create a super simple sheep mesh
        const sheepGroup = new THREE.Group();
        
        // Sheep body
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 1);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        sheepGroup.add(body);
        
        // Sheep head
        const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const headMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.x = 1.0;
        sheepGroup.add(head);
        
        // Legs - simple blocks with references for animation
        const legs = [];
        const legPositions = [
            [-0.7, -0.5, 0.4],  // back right
            [-0.7, -0.5, -0.4], // back left
            [0.7, -0.5, 0.4],   // front right
            [0.7, -0.5, -0.4]   // front left
        ];
        
        legPositions.forEach(pos => {
            const legGeometry = new THREE.BoxGeometry(0.2, 1.0, 0.2);
            const legMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            legs.push(leg);
            sheepGroup.add(leg);
        });
        
        // Store legs for animation
        sheepGroup.userData.legs = legs;
        
        // Add animation properties
        sheepGroup.userData.animTime = Math.random() * 10; // Random starting phase
        sheepGroup.userData.baseY = y + 1.0; // Store base height for bounce animation
        sheepGroup.userData.moveDirection = new THREE.Vector2(
            Math.random() * 2 - 1, 
            Math.random() * 2 - 1
        ).normalize();
        sheepGroup.userData.moveSpeed = 0.5 + Math.random() * 0.5; // Random speed
        sheepGroup.userData.nextDirectionChange = 5 + Math.random() * 5; // Time until direction change
        
        // Position the sheep
        sheepGroup.position.set(x, y + 1.0, z);
        
        // Add to scene
        this.scene.add(sheepGroup);
        this.sheep.push(sheepGroup);
        
        return sheepGroup;
    }
    
    update(deltaTime) {
        // Remove any debug visualization code here
        
        // Core update functionality - ensure physics/animations are updated
        if (this.physics) {
            this.physics.update(deltaTime);
        }
        
        // Update sheep animations with frame-rate independent movement
        if (this.sheep && this.sheep.length) {
            this.sheep.forEach(sheep => {
                // Skip if no userData (should never happen)
                if (!sheep.userData) return;
                
                // Update animation time with deltaTime for frame-rate independence
                sheep.userData.animTime += deltaTime;
                
                // Bouncing movement (up and down)
                const bounceHeight = 0.2;
                const bounceFrequency = 2;
                const newY = sheep.userData.baseY + Math.sin(sheep.userData.animTime * bounceFrequency) * bounceHeight;
                sheep.position.y = newY;
                
                // Forward movement
                sheep.userData.nextDirectionChange -= deltaTime;
                if (sheep.userData.nextDirectionChange <= 0) {
                    // Change direction randomly
                    sheep.userData.moveDirection = new THREE.Vector2(
                        Math.random() * 2 - 1, 
                        Math.random() * 2 - 1
                    ).normalize();
                    sheep.userData.nextDirectionChange = 5 + Math.random() * 5;
                }
                
                // Apply movement (scaled by deltaTime for frame-rate independence)
                const moveSpeed = sheep.userData.moveSpeed * deltaTime;
                sheep.position.x += sheep.userData.moveDirection.x * moveSpeed;
                sheep.position.z += sheep.userData.moveDirection.y * moveSpeed;
                
                // Rotate sheep to face movement direction
                const targetRotation = Math.atan2(sheep.userData.moveDirection.y, sheep.userData.moveDirection.x);
                sheep.rotation.y = targetRotation;
                
                // Animate legs if they exist
                if (sheep.userData.legs) {
                    sheep.userData.legs.forEach((leg, index) => {
                        const legFreq = 8; // Higher frequency for faster leg movement
                        const legAmplitude = 0.2;
                        // Alternate legs (front-left with back-right, front-right with back-left)
                        const phaseOffset = (index % 2 === 0) ? 0 : Math.PI;
                        leg.rotation.x = Math.sin(sheep.userData.animTime * legFreq + phaseOffset) * legAmplitude;
                    });
                }
                
                // Keep sheep within the game area (100-unit radius)
                const distanceFromCenter = Math.sqrt(sheep.position.x * sheep.position.x + sheep.position.z * sheep.position.z);
                if (distanceFromCenter > 120) {
                    // Send sheep back toward center
                    const dirToCenter = new THREE.Vector2(-sheep.position.x, -sheep.position.z).normalize();
                    sheep.userData.moveDirection = dirToCenter;
                }
            });
        }
        
        // Add other simulation logic that needs to run every frame
    }

    // Create a procedural grass texture
    createProceduralGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Base green color
        context.fillStyle = '#7CFC00'; // Lawn green
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add grass texture details
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const width = 1 + Math.random() * 2;
            const height = 3 + Math.random() * 5;
            
            // Random green shade
            const r = 100 + Math.floor(Math.random() * 50);
            const g = 180 + Math.floor(Math.random() * 70);
            const b = Math.floor(Math.random() * 50);
            context.fillStyle = `rgb(${r}, ${g}, ${b})`;
            
            // Draw grass blade
            context.beginPath();
            context.rect(x, y, width, height);
            context.fill();
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 20);
        
        return texture;
    }

    // Create a procedural concrete texture
    createProceduralConcreteTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Base concrete color
        context.fillStyle = '#CCCCCC'; // Light gray
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add noise and variations
        for (let i = 0; i < 10000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = 1 + Math.random() * 3;
            
            // Random gray tone
            const tone = 170 + Math.floor(Math.random() * 60);
            context.fillStyle = `rgb(${tone}, ${tone}, ${tone})`;
            
            context.beginPath();
            context.rect(x, y, size, size);
            context.fill();
        }
        
        // Add a few larger spots and cracks
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = 5 + Math.random() * 20;
            
            // Darker tones for cracks
            const tone = 120 + Math.floor(Math.random() * 50);
            context.fillStyle = `rgba(${tone}, ${tone}, ${tone}, 0.5)`;
            
            context.beginPath();
            context.ellipse(x, y, size, size/4, Math.random() * Math.PI, 0, Math.PI * 2);
            context.fill();
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        return texture;
    }
} 