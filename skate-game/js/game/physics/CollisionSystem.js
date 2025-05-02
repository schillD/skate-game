import * as THREE from 'three';

export class CollisionSystem {
    constructor(skateboard) {
        this.skateboard = skateboard;
        this.wallCollisionDetected = false; // Flag to track wall collisions between frames
    }
    
    checkCollisions(sceneObjects, deltaTime = 1/60) {
        // Reset wall collision flag at the start of each collision check
        this.wallCollisionDetected = false;
        
        // Set up raycasters for collision detection in cardinal directions
        const directions = [
            new THREE.Vector3(1, 0, 0),    // right
            new THREE.Vector3(-1, 0, 0),   // left
            new THREE.Vector3(0, 0, 1),    // front
            new THREE.Vector3(0, 0, -1),   // back
        ];
        
        const collisionDistance = 0.4; // Reduced collision distance to avoid false positives
        let collision = false;
        
        // Direction of movement
        const movingDirection = new THREE.Vector3(
            this.skateboard.moveX, 
            0, 
            this.skateboard.moveZ
        ).normalize();
        
        // Only check collisions in the direction we're moving
        // Filter directions with a significant component in our movement direction
        const relevantDirections = directions.filter(dir => {
            const dot = movingDirection.dot(dir);
            return dot > 0.3; // Only care about directions we're moving towards
        });
        
        // Get the skateboard's current forward direction to check walls in front
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.skateboard.mesh.quaternion);
        
        // First, check if there's a wall directly in front of us (enhanced wall detection)
        if (!this.checkForWallsInFront(sceneObjects, forward, collisionDistance * 2)) {
            // Regular collision checks in relevant directions
            for (let direction of relevantDirections) {
                const raycaster = new THREE.Raycaster(
                    this.skateboard.mesh.position.clone().add(new THREE.Vector3(0, 0.35, 0)),
                    direction,
                    0,
                    collisionDistance
                );
                
                // Better filtering for collision objects
                const objects = sceneObjects.filter(obj => 
                    obj !== this.skateboard.mesh && 
                    obj.isMesh && 
                    !obj.name?.includes("ground") && // Don't collide with ground
                    !obj.name?.includes("floor") && // Don't collide with floors
                    !obj.name?.includes("coin") && // Don't collide with coins
                    obj.visible // Only visible objects
                );
                
                const intersects = raycaster.intersectObjects(objects, true);
                
                if (intersects.length > 0) {
                    const hit = intersects[0];

                    // Skip rails we can pass under
                    if (this.isRailObject(hit.object) && this.canPassUnder(hit.object)) {
                        continue;
                    }

                    // Get surface normal
                    let worldNormal = direction.clone().negate();
                    if (hit.face) {
                        worldNormal = hit.face.normal.clone();
                        const nMat = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
                        worldNormal.applyMatrix3(nMat).normalize();
                    }

                    // Check if collision is wall-like and handle small obstacles differently
                    const isWallLike = Math.abs(worldNormal.y) < 0.7; 
                    const maxTraversableHeight = 0.3; // Max obstacle height to ignore horizontal collision

                    if (isWallLike) {
                        const skateboardBaseY = this.skateboard.mesh.position.y - this.skateboard.defaultHeight;
                        const heightDiff = hit.point.y - skateboardBaseY;

                        // If it's a low obstacle, ignore the horizontal collision for this ray
                        if (heightDiff < maxTraversableHeight && heightDiff > -0.1) { 
                            continue; // Skip sliding logic, let vertical physics handle it
                        }
                        // Otherwise (high wall), proceed with wall collision logic below
                        
                        // Flag this as wall collision
                        this.wallCollisionDetected = true;
                    }

                    // Collision with non-traversable obstacle: Reset position and stop
                    this.skateboard.resetPosition(); // Revert to previous safe position
                    this.skateboard.velocity.x = 0;    // Stop horizontal movement
                    this.skateboard.velocity.z = 0;
                    this.skateboard.velocity.y = 0;    // Stop vertical movement as well
                    
                    // If it's a wall, make sure we can't jump
                    if (isWallLike) {
                        this.skateboard.isJumping = false;
                        this.skateboard.inAir = false;
                    }

                    collision = true;
                    break;
                }
            }
        }
        
        // Check ground height and get the normal of the surface below
        const groundData = this.checkGround(sceneObjects);
        
        // Apply gravity with ground height and deltaTime for frame-rate independence
        if (groundData.found) {
            this.skateboard.applyGravity(groundData.height, deltaTime);
            
            // Apply tilt based on surface normal when on ground
            if (!this.skateboard.isJumping && !this.skateboard.inAir) {
                this.skateboard.applyTilt(groundData.normal);
            }
        } else {
            // Default ground height of 0 if no ground found
            this.skateboard.applyGravity(0, deltaTime);
        }
        
        // Add air rotation effects
        this.skateboard.addAirRotation();
        
        return collision;
    }
    
    // New method: Enhanced detection for wall-like objects in front of the skateboard
    checkForWallsInFront(sceneObjects, forward, distance) {
        // Wall checking at multiple heights to prevent climbing or jumping over walls
        const startPositions = [
            this.skateboard.mesh.position.clone().add(new THREE.Vector3(0, 0.2, 0)),  // Low check
            this.skateboard.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)),  // Middle check
            this.skateboard.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0))   // High check
        ];
        
        // Filter objects - ignore ground, floor, and coins
        const objects = sceneObjects.filter(obj => 
            obj !== this.skateboard.mesh && 
            obj.isMesh && 
            !obj.name?.includes("ground") && 
            !obj.name?.includes("floor") && 
            !obj.name?.includes("coin") && 
            obj.visible
        );
        
        // Check for walls at each height
        for (let startPos of startPositions) {
            const raycaster = new THREE.Raycaster(startPos, forward, 0, distance);
            const intersects = raycaster.intersectObjects(objects, true);
            
            if (intersects.length > 0) {
                const hit = intersects[0];
                
                // Skip rails we can pass under
                if (this.isRailObject(hit.object) && this.canPassUnder(hit.object)) {
                    continue;
                }
                
                // Check if object name indicates a wall
                const isWall = hit.object.name?.includes('wall') || 
                              hit.object.name?.includes('house') || 
                              hit.object.name === 'house_walls' ||
                              hit.object.name === 'house_structure';
                              
                // If object is explicitly a wall, stop immediately
                if (isWall) {
                    // Wall collision detected, reset position and zero velocity
                    this.skateboard.resetPosition();
                    this.skateboard.velocity.set(0, 0, 0);
                    this.skateboard.isJumping = false;
                    this.skateboard.inAir = false;
                    this.wallCollisionDetected = true;
                    return true;
                }
                
                // Check if the surface normal indicates a wall (near-vertical)
                if (hit.face) {
                    const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
                    const normal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
                    
                    // If normal is horizontal (indicates a vertical surface like a wall)
                    if (Math.abs(normal.y) < 0.4) {
                        // Wall-like surface detected
                        this.skateboard.resetPosition();
                        this.skateboard.velocity.set(0, 0, 0);
                        this.skateboard.isJumping = false;
                        this.skateboard.inAir = false;
                        this.wallCollisionDetected = true;
                        return true;
                    }
                }
            }
        }
        
        return false; // No walls detected
    }
    
    canPassUnder(object) {
        if (!this.isRailObject(object)) {
            return false; // Early exit if not a rail object
        }
        
        // Ensure matrices are up-to-date
        object.updateMatrixWorld();
        
        // Calculate the world-space bounding box
        if (!object.geometry.boundingBox) {
            object.geometry.computeBoundingBox();
        }
        const worldBoundingBox = object.geometry.boundingBox.clone();
        worldBoundingBox.applyMatrix4(object.matrixWorld);
        
        // Get the bottom Y coordinate of the rail in world space
        const objectBottomY = worldBoundingBox.min.y;
        
        // Get skateboard height (using a point slightly above the deck for clearance)
        const skateboardClearanceY = this.skateboard.mesh.position.y + this.skateboard.defaultHeight + 0.1;
        
        // Check vertical clearance - is the bottom of the rail clearly above the skateboard's clearance point?
        return objectBottomY > skateboardClearanceY;
    }
    
    checkGround(sceneObjects) {
        // Raycast down to find ground
        const raycaster = new THREE.Raycaster(
            new THREE.Vector3(
                this.skateboard.mesh.position.x,
                this.skateboard.mesh.position.y + 5,
                this.skateboard.mesh.position.z
            ),
            new THREE.Vector3(0, -1, 0),
            0,
            10
        );
        
        // Filter objects to exclude skateboard and rails/bars
        const objects = sceneObjects.filter(obj => 
            obj !== this.skateboard.mesh &&
            obj.isMesh &&
            !obj.name?.includes("coin") && // Don't count coins as ground
            !this.isRailObject(obj) // Exclude rails/bars from ground detection
        );
        
        const intersects = raycaster.intersectObjects(objects, true);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            
            // Found ground, return height and surface normal
            return {
                found: true,
                height: hit.point.y + this.skateboard.defaultHeight,
                normal: hit.face ? this.transformNormal(hit.face.normal, hit.object) : null
            };
        }
        
        // No ground found
        return {
            found: false,
            height: 0,
            normal: null
        };
    }
    
    transformNormal(normal, object) {
        // Transform the normal from local object space to world space
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
        const worldNormal = normal.clone().applyMatrix3(normalMatrix).normalize();
        return worldNormal;
    }
    
    /**
     * Check if an object is a rail or similar structure
     */
    isRailObject(object) {
        // Check by name first - most reliable
        const isRailByName = object.name && (
            object.name.includes('rail') || 
            object.name.includes('coping') || 
            object.name.includes('bar')
        );
        
        if (isRailByName) return true;

        // Check by geometry, but be specific
        if (object.geometry instanceof THREE.CylinderGeometry) {
            // Check if the cylinder is oriented horizontally (like a typical rail)
            // Rails are usually rotated PI/2 around X or Z axis.
            const isHorizontal = Math.abs(Math.abs(object.rotation.x) - Math.PI / 2) < 0.1 ||
                                 Math.abs(Math.abs(object.rotation.z) - Math.PI / 2) < 0.1;
            // Also check if it's relatively thin (like a rail, not a wide pillar)
            const radius = object.geometry.parameters.radiusTop || 1.0; // Default to larger radius if undefined
            const isThin = radius < 0.3; 
            
            return isHorizontal && isThin;
        } else if (object.geometry instanceof THREE.TorusGeometry) {
            // Torus geometry is typically used for coping, consider it a rail
            return true;
        }
        
        return false;
    }
} 