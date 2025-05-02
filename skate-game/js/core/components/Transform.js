import * as THREE from 'three';
import { Component } from '../Component.js';

/**
 * Transform component for handling entity position, rotation, and scale
 */
export class Transform extends Component {
    constructor() {
        super();
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.scale = new THREE.Vector3(1, 1, 1);
        this.quaternion = new THREE.Quaternion();
        this.matrix = new THREE.Matrix4();
        this.matrixNeedsUpdate = true;
        this.worldMatrix = new THREE.Matrix4();
        this.meshes = []; // Associated THREE.Mesh or THREE.Object3D instances
        this.group = new THREE.Group(); // Contains all meshes
    }

    /**
     * Initialize the transform component
     */
    init() {
        if (this.entity.scene && this.entity.scene.threeScene) {
            this.entity.scene.threeScene.add(this.group);
        }
    }

    /**
     * Add a mesh to this transform
     * @param {THREE.Object3D} mesh - The mesh to add
     */
    addMesh(mesh) {
        if (mesh instanceof THREE.Object3D) {
            this.meshes.push(mesh);
            this.group.add(mesh);
        }
    }

    /**
     * Remove a mesh from this transform
     * @param {THREE.Object3D} mesh - The mesh to remove
     */
    removeMesh(mesh) {
        const index = this.meshes.indexOf(mesh);
        if (index !== -1) {
            this.meshes.splice(index, 1);
            this.group.remove(mesh);
        }
    }

    /**
     * Set the position of this transform
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @param {number} z - The z coordinate
     */
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this.matrixNeedsUpdate = true;
    }

    /**
     * Set the rotation of this transform (in radians)
     * @param {number} x - The x rotation
     * @param {number} y - The y rotation
     * @param {number} z - The z rotation
     */
    setRotation(x, y, z) {
        this.rotation.set(x, y, z);
        this.quaternion.setFromEuler(this.rotation);
        this.matrixNeedsUpdate = true;
    }

    /**
     * Set the rotation using a quaternion
     * @param {THREE.Quaternion} quaternion - The quaternion
     */
    setQuaternion(quaternion) {
        this.quaternion.copy(quaternion);
        this.rotation.setFromQuaternion(this.quaternion);
        this.matrixNeedsUpdate = true;
    }

    /**
     * Set the scale of this transform
     * @param {number} x - The x scale
     * @param {number} y - The y scale
     * @param {number} z - The z scale
     */
    setScale(x, y, z) {
        this.scale.set(x, y, z);
        this.matrixNeedsUpdate = true;
    }

    /**
     * Get the position of this transform
     * @returns {THREE.Vector3} The position
     */
    getPosition() {
        return this.position.clone();
    }

    /**
     * Get the rotation of this transform
     * @returns {THREE.Euler} The rotation
     */
    getRotation() {
        return this.rotation.clone();
    }

    /**
     * Get the quaternion of this transform
     * @returns {THREE.Quaternion} The quaternion
     */
    getQuaternion() {
        return this.quaternion.clone();
    }

    /**
     * Get the scale of this transform
     * @returns {THREE.Vector3} The scale
     */
    getScale() {
        return this.scale.clone();
    }

    /**
     * Get the forward direction of this transform
     * @returns {THREE.Vector3} The forward direction
     */
    getForward() {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.quaternion);
        return forward;
    }

    /**
     * Get the right direction of this transform
     * @returns {THREE.Vector3} The right direction
     */
    getRight() {
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.quaternion);
        return right;
    }

    /**
     * Get the up direction of this transform
     * @returns {THREE.Vector3} The up direction
     */
    getUp() {
        const up = new THREE.Vector3(0, 1, 0);
        up.applyQuaternion(this.quaternion);
        return up;
    }

    /**
     * Update the transform matrix if needed
     */
    updateMatrix() {
        if (this.matrixNeedsUpdate) {
            this.matrix.compose(this.position, this.quaternion, this.scale);
            this.matrixNeedsUpdate = false;
        }
    }

    /**
     * Update the world matrix
     */
    updateWorldMatrix() {
        this.updateMatrix();
        
        if (this.entity.parent) {
            const parentTransform = this.entity.parent.getComponent('Transform');
            if (parentTransform) {
                parentTransform.updateWorldMatrix();
                this.worldMatrix.multiplyMatrices(parentTransform.worldMatrix, this.matrix);
            } else {
                this.worldMatrix.copy(this.matrix);
            }
        } else {
            this.worldMatrix.copy(this.matrix);
        }
    }

    /**
     * Apply the transform to all associated meshes
     */
    applyToMeshes() {
        this.group.position.copy(this.position);
        this.group.quaternion.copy(this.quaternion);
        this.group.scale.copy(this.scale);
    }

    /**
     * Update the transform component
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        this.updateMatrix();
        this.applyToMeshes();
    }

    /**
     * Clean up resources when component is destroyed
     */
    dispose() {
        if (this.entity.scene && this.entity.scene.threeScene) {
            this.entity.scene.threeScene.remove(this.group);
        }
        
        // Remove all meshes
        while (this.meshes.length > 0) {
            const mesh = this.meshes.pop();
            this.group.remove(mesh);
            
            // Dispose of geometry and materials
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }
            
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(material => material.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        }
    }
} 