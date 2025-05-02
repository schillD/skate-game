import * as THREE from 'three';
import { System } from '../System.js';

/**
 * Render system for handling rendering operations
 */
export class RenderSystem extends System {
    constructor() {
        super('RenderSystem');
        this.renderer = null;
        this.cameras = [];
        this.mainCamera = null;
        this.activeCameras = [];
        this.viewports = [];
        this.renderTargets = [];
        this.postProcessingEnabled = false;
        this.shadowsEnabled = true;
        this.fogEnabled = true;
        this.effectComposer = null; // Will be initialized if post-processing is enabled
        this.renderStats = {
            fps: 0,
            triangles: 0,
            drawCalls: 0,
            lastTime: 0,
            frameCount: 0
        };
    }

    /**
     * Initialize the render system
     * @param {Scene} scene - The scene this system belongs to
     */
    init(scene) {
        super.init(scene);
        
        // Create renderer if it doesn't exist
        if (!this.renderer) {
            this.createRenderer();
        }
        
        // Set up default camera if none exists
        if (this.cameras.length === 0) {
            this.createDefaultCamera();
        }
        
        // Set up rendering
        this.setupRendering();
    }

    /**
     * Create the WebGL renderer
     */
    createRenderer() {
        // Get the canvas element
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false,
            stencil: true
        });
        
        // Configure renderer
        this.renderer.setClearColor(0x000000);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Enable shadows
        if (this.shadowsEnabled) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * Create a default camera if none exists
     */
    createDefaultCamera() {
        const camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);
        
        this.addCamera(camera);
        this.setMainCamera(camera);
    }

    /**
     * Add a camera to the render system
     * @param {THREE.Camera} camera - The camera to add
     * @param {Object} viewport - The viewport for this camera (optional)
     */
    addCamera(camera, viewport = null) {
        this.cameras.push(camera);
        
        // Add to active cameras if no viewport is specified (full screen)
        if (!viewport) {
            this.activeCameras.push(camera);
            this.viewports.push({
                camera: camera,
                left: 0,
                bottom: 0,
                width: 1,
                height: 1
            });
        } else {
            this.activeCameras.push(camera);
            this.viewports.push({
                camera: camera,
                left: viewport.left || 0,
                bottom: viewport.bottom || 0,
                width: viewport.width || 1,
                height: viewport.height || 1
            });
        }
        
        // Set as main camera if none is set
        if (!this.mainCamera) {
            this.mainCamera = camera;
        }
    }

    /**
     * Set the main camera
     * @param {THREE.Camera} camera - The camera to set as main
     */
    setMainCamera(camera) {
        if (this.cameras.includes(camera)) {
            this.mainCamera = camera;
        } else {
            console.warn('Camera not found in render system');
        }
    }

    /**
     * Remove a camera from the render system
     * @param {THREE.Camera} camera - The camera to remove
     */
    removeCamera(camera) {
        const index = this.cameras.indexOf(camera);
        if (index !== -1) {
            this.cameras.splice(index, 1);
            
            // Remove from active cameras and viewports
            const activeIndex = this.activeCameras.indexOf(camera);
            if (activeIndex !== -1) {
                this.activeCameras.splice(activeIndex, 1);
                this.viewports.splice(activeIndex, 1);
            }
            
            // Reset main camera if removed
            if (this.mainCamera === camera) {
                this.mainCamera = this.cameras.length > 0 ? this.cameras[0] : null;
            }
        }
    }

    /**
     * Set up rendering configurations
     */
    setupRendering() {
        if (!this.renderer || !this.scene || !this.scene.threeScene) return;
        
        // Configure fog
        if (this.fogEnabled) {
            this.scene.threeScene.fog = new THREE.FogExp2(0x000000, 0.005);
        } else {
            this.scene.threeScene.fog = null;
        }
        
        // Set up post-processing if enabled
        if (this.postProcessingEnabled) {
            this.setupPostProcessing();
        }
    }

    /**
     * Set up post-processing effects
     */
    setupPostProcessing() {
        // This is a placeholder for post-processing setup
        // For a real implementation, you would use something like EffectComposer from three.js
        console.log('Post-processing would be set up here');
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.renderer) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Update renderer
        this.renderer.setSize(width, height);
        
        // Update camera aspect ratios
        for (const camera of this.cameras) {
            if (camera instanceof THREE.PerspectiveCamera) {
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            }
        }
    }

    /**
     * Update the render stats
     */
    updateStats() {
        if (!this.renderer) return;
        
        const now = performance.now();
        const delta = now - this.renderStats.lastTime;
        
        this.renderStats.frameCount++;
        
        // Update stats every second
        if (delta > 1000) {
            this.renderStats.fps = Math.round((this.renderStats.frameCount * 1000) / delta);
            this.renderStats.triangles = this.renderer.info.render.triangles;
            this.renderStats.drawCalls = this.renderer.info.render.calls;
            
            this.renderStats.lastTime = now;
            this.renderStats.frameCount = 0;
        }
    }

    /**
     * Render the scene
     */
    render() {
        if (!this.renderer || !this.scene || !this.scene.threeScene) return;
        
        if (this.postProcessingEnabled && this.effectComposer) {
            // Render with post-processing
            this.effectComposer.render();
        } else if (this.viewports.length > 1) {
            // Render multiple viewports
            this.renderMultipleViewports();
        } else {
            // Single camera render
            this.renderer.render(this.scene.threeScene, this.mainCamera);
        }
        
        // Update render stats
        this.updateStats();
    }

    /**
     * Render multiple viewports
     */
    renderMultipleViewports() {
        if (!this.renderer || !this.scene || !this.scene.threeScene) return;
        
        const width = this.renderer.domElement.width;
        const height = this.renderer.domElement.height;
        
        // Save original viewport
        const originalViewport = this.renderer.getViewport(new THREE.Vector4());
        
        // Clear the renderer
        this.renderer.setScissorTest(true);
        
        // Render each viewport
        for (const viewport of this.viewports) {
            const left = Math.floor(viewport.left * width);
            const bottom = Math.floor(viewport.bottom * height);
            const vpWidth = Math.floor(viewport.width * width);
            const vpHeight = Math.floor(viewport.height * height);
            
            this.renderer.setViewport(left, bottom, vpWidth, vpHeight);
            this.renderer.setScissor(left, bottom, vpWidth, vpHeight);
            
            this.renderer.render(this.scene.threeScene, viewport.camera);
        }
        
        // Restore original viewport
        this.renderer.setViewport(originalViewport);
        this.renderer.setScissorTest(false);
    }

    /**
     * Update the render system
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Render the scene
        this.render();
    }

    /**
     * Enable shadows
     * @param {boolean} enabled - Whether shadows should be enabled
     */
    enableShadows(enabled) {
        this.shadowsEnabled = enabled;
        
        if (this.renderer) {
            this.renderer.shadowMap.enabled = enabled;
        }
    }

    /**
     * Enable fog
     * @param {boolean} enabled - Whether fog should be enabled
     * @param {number} color - The fog color
     * @param {number} density - The fog density
     */
    enableFog(enabled, color = 0x000000, density = 0.005) {
        this.fogEnabled = enabled;
        
        if (this.scene && this.scene.threeScene) {
            if (enabled) {
                this.scene.threeScene.fog = new THREE.FogExp2(color, density);
            } else {
                this.scene.threeScene.fog = null;
            }
        }
    }

    /**
     * Enable post-processing
     * @param {boolean} enabled - Whether post-processing should be enabled
     */
    enablePostProcessing(enabled) {
        this.postProcessingEnabled = enabled;
        
        if (enabled) {
            this.setupPostProcessing();
        } else {
            // Disable post-processing
            this.effectComposer = null;
        }
    }

    /**
     * Get the renderer
     * @returns {THREE.WebGLRenderer} The renderer
     */
    getRenderer() {
        return this.renderer;
    }

    /**
     * Get the main camera
     * @returns {THREE.Camera} The main camera
     */
    getMainCamera() {
        return this.mainCamera;
    }

    /**
     * Get render stats
     * @returns {Object} The render stats
     */
    getStats() {
        return { ...this.renderStats };
    }

    /**
     * Clean up resources when system is destroyed
     */
    dispose() {
        // Clean up event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Dispose of renderer
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        // Clean up render targets
        for (const target of this.renderTargets) {
            target.dispose();
        }
        this.renderTargets = [];
        
        // Clean up effect composer
        if (this.effectComposer) {
            // Dispose of effect composer passes
            this.effectComposer = null;
        }
        
        // Reset cameras
        this.cameras = [];
        this.activeCameras = [];
        this.viewports = [];
        this.mainCamera = null;
        
        super.dispose();
    }
} 