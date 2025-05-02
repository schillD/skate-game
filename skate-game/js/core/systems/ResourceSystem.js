import * as THREE from 'three';
import { System } from '../System.js';

/**
 * Resource system for managing game assets
 */
export class ResourceSystem extends System {
    constructor() {
        super('ResourceSystem');
        
        // Resource caches
        this.textures = new Map();
        this.materials = new Map();
        this.geometries = new Map();
        this.models = new Map();
        this.sounds = new Map();
        this.fonts = new Map();
        this.shaders = new Map();
        
        // Loaders
        this.textureLoader = new THREE.TextureLoader();
        this.audioLoader = new THREE.AudioLoader();
        this.fontLoader = null; // Will be initialized if needed
        this.gltfLoader = null; // Will be initialized if needed
        
        // Loading state
        this.loadingQueue = [];
        this.loadingPromises = [];
        this.loadingProgress = 0;
        this.loadingTotal = 0;
        this.isLoading = false;
        
        // Configure texture loader
        this.textureLoader.crossOrigin = 'anonymous';
    }

    /**
     * Initialize the resource system
     * @param {Scene} scene - The scene this system belongs to
     */
    init(scene) {
        super.init(scene);
        
        // Initialize listeners for loading events
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    /**
     * Handle before unload event
     * @param {Event} event - The before unload event
     */
    handleBeforeUnload(event) {
        // Check if loading is in progress
        if (this.isLoading) {
            const message = 'Loading is in progress. Are you sure you want to leave?';
            event.returnValue = message;
            return message;
        }
    }

    /**
     * Load a texture
     * @param {string} url - The URL of the texture
     * @param {Object} options - Texture options
     * @returns {Promise<THREE.Texture>} A promise that resolves with the loaded texture
     */
    loadTexture(url, options = {}) {
        // Check if texture is already loaded
        if (this.textures.has(url)) {
            return Promise.resolve(this.textures.get(url));
        }
        
        // Add to loading queue
        this.loadingTotal++;
        this.isLoading = true;
        
        // Load texture
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    // Configure texture
                    if (options.wrapS) texture.wrapS = options.wrapS;
                    if (options.wrapT) texture.wrapT = options.wrapT;
                    if (options.minFilter) texture.minFilter = options.minFilter;
                    if (options.magFilter) texture.magFilter = options.magFilter;
                    if (options.repeat) texture.repeat.set(options.repeat[0], options.repeat[1]);
                    if (options.offset) texture.offset.set(options.offset[0], options.offset[1]);
                    if (options.anisotropy) texture.anisotropy = options.anisotropy;
                    if (options.flipY !== undefined) texture.flipY = options.flipY;
                    
                    // Cache texture
                    this.textures.set(url, texture);
                    
                    // Update loading progress
                    this.loadingProgress++;
                    if (this.loadingProgress === this.loadingTotal) {
                        this.isLoading = false;
                    }
                    
                    // Resolve promise
                    resolve(texture);
                },
                (progress) => {
                    // Progress callback
                },
                (error) => {
                    console.error(`Failed to load texture: ${url}`, error);
                    
                    // Update loading progress
                    this.loadingProgress++;
                    if (this.loadingProgress === this.loadingTotal) {
                        this.isLoading = false;
                    }
                    
                    // Reject promise
                    reject(error);
                }
            );
        });
    }

    /**
     * Create a material and cache it
     * @param {string} name - The name of the material
     * @param {string} type - The type of material ('standard', 'basic', 'phong', etc.)
     * @param {Object} params - Material parameters
     * @returns {THREE.Material} The created material
     */
    createMaterial(name, type = 'standard', params = {}) {
        // Check if material already exists
        if (this.materials.has(name)) {
            return this.materials.get(name);
        }
        
        // Create material based on type
        let material;
        
        switch (type.toLowerCase()) {
            case 'basic':
                material = new THREE.MeshBasicMaterial(params);
                break;
            case 'phong':
                material = new THREE.MeshPhongMaterial(params);
                break;
            case 'lambert':
                material = new THREE.MeshLambertMaterial(params);
                break;
            case 'toon':
                material = new THREE.MeshToonMaterial(params);
                break;
            case 'physical':
                material = new THREE.MeshPhysicalMaterial(params);
                break;
            case 'normal':
                material = new THREE.MeshNormalMaterial(params);
                break;
            case 'depth':
                material = new THREE.MeshDepthMaterial(params);
                break;
            case 'shader':
                material = new THREE.ShaderMaterial(params);
                break;
            case 'standard':
            default:
                material = new THREE.MeshStandardMaterial(params);
                break;
        }
        
        // Cache material
        this.materials.set(name, material);
        
        return material;
    }

    /**
     * Create a geometry and cache it
     * @param {string} name - The name of the geometry
     * @param {string} type - The type of geometry ('box', 'sphere', 'plane', etc.)
     * @param {Object} params - Geometry parameters
     * @returns {THREE.BufferGeometry} The created geometry
     */
    createGeometry(name, type = 'box', params = {}) {
        // Check if geometry already exists
        if (this.geometries.has(name)) {
            return this.geometries.get(name);
        }
        
        // Create geometry based on type
        let geometry;
        
        switch (type.toLowerCase()) {
            case 'box':
                geometry = new THREE.BoxGeometry(
                    params.width || 1,
                    params.height || 1,
                    params.depth || 1,
                    params.widthSegments || 1,
                    params.heightSegments || 1,
                    params.depthSegments || 1
                );
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(
                    params.radius || 1,
                    params.widthSegments || 32,
                    params.heightSegments || 16,
                    params.phiStart || 0,
                    params.phiLength || Math.PI * 2,
                    params.thetaStart || 0,
                    params.thetaLength || Math.PI
                );
                break;
            case 'plane':
                geometry = new THREE.PlaneGeometry(
                    params.width || 1,
                    params.height || 1,
                    params.widthSegments || 1,
                    params.heightSegments || 1
                );
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(
                    params.radiusTop || 1,
                    params.radiusBottom || 1,
                    params.height || 1,
                    params.radialSegments || 32,
                    params.heightSegments || 1,
                    params.openEnded || false,
                    params.thetaStart || 0,
                    params.thetaLength || Math.PI * 2
                );
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(
                    params.radius || 1,
                    params.height || 1,
                    params.radialSegments || 32,
                    params.heightSegments || 1,
                    params.openEnded || false,
                    params.thetaStart || 0,
                    params.thetaLength || Math.PI * 2
                );
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(
                    params.radius || 1,
                    params.tube || 0.4,
                    params.radialSegments || 16,
                    params.tubularSegments || 100,
                    params.arc || Math.PI * 2
                );
                break;
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
        }
        
        // Cache geometry
        this.geometries.set(name, geometry);
        
        return geometry;
    }

    /**
     * Load an audio file
     * @param {string} url - The URL of the audio file
     * @returns {Promise<AudioBuffer>} A promise that resolves with the loaded audio buffer
     */
    loadAudio(url) {
        // Check if audio is already loaded
        if (this.sounds.has(url)) {
            return Promise.resolve(this.sounds.get(url));
        }
        
        // Add to loading queue
        this.loadingTotal++;
        this.isLoading = true;
        
        // Load audio
        return new Promise((resolve, reject) => {
            this.audioLoader.load(
                url,
                (audioBuffer) => {
                    // Cache audio
                    this.sounds.set(url, audioBuffer);
                    
                    // Update loading progress
                    this.loadingProgress++;
                    if (this.loadingProgress === this.loadingTotal) {
                        this.isLoading = false;
                    }
                    
                    // Resolve promise
                    resolve(audioBuffer);
                },
                (progress) => {
                    // Progress callback
                },
                (error) => {
                    console.error(`Failed to load audio: ${url}`, error);
                    
                    // Update loading progress
                    this.loadingProgress++;
                    if (this.loadingProgress === this.loadingTotal) {
                        this.isLoading = false;
                    }
                    
                    // Reject promise
                    reject(error);
                }
            );
        });
    }

    /**
     * Load a GLTF model
     * @param {string} url - The URL of the model
     * @returns {Promise<Object>} A promise that resolves with the loaded model
     */
    loadModel(url) {
        // Check if model is already loaded
        if (this.models.has(url)) {
            return Promise.resolve(this.models.get(url).clone());
        }
        
        // Initialize GLTF loader if needed
        if (!this.gltfLoader) {
            // Dynamically import GLTFLoader
            import('three/addons/loaders/GLTFLoader.js').then(GLTFLoader => {
                this.gltfLoader = new GLTFLoader.GLTFLoader();
            });
        }
        
        // Add to loading queue
        this.loadingTotal++;
        this.isLoading = true;
        
        // Load model
        return new Promise((resolve, reject) => {
            // Wait for loader to be initialized
            const checkLoader = () => {
                if (!this.gltfLoader) {
                    setTimeout(checkLoader, 100);
                    return;
                }
                
                this.gltfLoader.load(
                    url,
                    (gltf) => {
                        // Cache model
                        this.models.set(url, gltf.scene);
                        
                        // Update loading progress
                        this.loadingProgress++;
                        if (this.loadingProgress === this.loadingTotal) {
                            this.isLoading = false;
                        }
                        
                        // Resolve promise
                        resolve(gltf.scene.clone());
                    },
                    (progress) => {
                        // Progress callback
                    },
                    (error) => {
                        console.error(`Failed to load model: ${url}`, error);
                        
                        // Update loading progress
                        this.loadingProgress++;
                        if (this.loadingProgress === this.loadingTotal) {
                            this.isLoading = false;
                        }
                        
                        // Reject promise
                        reject(error);
                    }
                );
            };
            
            checkLoader();
        });
    }

    /**
     * Load a font
     * @param {string} url - The URL of the font
     * @returns {Promise<Font>} A promise that resolves with the loaded font
     */
    loadFont(url) {
        // Check if font is already loaded
        if (this.fonts.has(url)) {
            return Promise.resolve(this.fonts.get(url));
        }
        
        // Initialize font loader if needed
        if (!this.fontLoader) {
            // Dynamically import FontLoader
            import('three/addons/loaders/FontLoader.js').then(FontLoader => {
                this.fontLoader = new FontLoader.FontLoader();
            });
        }
        
        // Add to loading queue
        this.loadingTotal++;
        this.isLoading = true;
        
        // Load font
        return new Promise((resolve, reject) => {
            // Wait for loader to be initialized
            const checkLoader = () => {
                if (!this.fontLoader) {
                    setTimeout(checkLoader, 100);
                    return;
                }
                
                this.fontLoader.load(
                    url,
                    (font) => {
                        // Cache font
                        this.fonts.set(url, font);
                        
                        // Update loading progress
                        this.loadingProgress++;
                        if (this.loadingProgress === this.loadingTotal) {
                            this.isLoading = false;
                        }
                        
                        // Resolve promise
                        resolve(font);
                    },
                    (progress) => {
                        // Progress callback
                    },
                    (error) => {
                        console.error(`Failed to load font: ${url}`, error);
                        
                        // Update loading progress
                        this.loadingProgress++;
                        if (this.loadingProgress === this.loadingTotal) {
                            this.isLoading = false;
                        }
                        
                        // Reject promise
                        reject(error);
                    }
                );
            };
            
            checkLoader();
        });
    }

    /**
     * Load a shader
     * @param {string} name - The name of the shader
     * @param {string} vertexUrl - The URL of the vertex shader
     * @param {string} fragmentUrl - The URL of the fragment shader
     * @returns {Promise<Object>} A promise that resolves with the loaded shader
     */
    loadShader(name, vertexUrl, fragmentUrl) {
        // Check if shader is already loaded
        if (this.shaders.has(name)) {
            return Promise.resolve(this.shaders.get(name));
        }
        
        // Add to loading queue
        this.loadingTotal += 2; // Two files to load
        this.isLoading = true;
        
        // Load vertex and fragment shaders
        const vertexPromise = fetch(vertexUrl).then(response => response.text());
        const fragmentPromise = fetch(fragmentUrl).then(response => response.text());
        
        // Wait for both shaders to load
        return Promise.all([vertexPromise, fragmentPromise]).then(([vertexShader, fragmentShader]) => {
            // Create shader object
            const shader = {
                name,
                vertexShader,
                fragmentShader
            };
            
            // Cache shader
            this.shaders.set(name, shader);
            
            // Update loading progress
            this.loadingProgress += 2; // Two files loaded
            if (this.loadingProgress === this.loadingTotal) {
                this.isLoading = false;
            }
            
            // Return shader
            return shader;
        }).catch(error => {
            console.error(`Failed to load shader: ${name}`, error);
            
            // Update loading progress
            this.loadingProgress += 2; // Count as loaded even if failed
            if (this.loadingProgress === this.loadingTotal) {
                this.isLoading = false;
            }
            
            throw error;
        });
    }

    /**
     * Get a texture by URL
     * @param {string} url - The URL of the texture
     * @returns {THREE.Texture|null} The texture, or null if not loaded
     */
    getTexture(url) {
        return this.textures.get(url) || null;
    }

    /**
     * Get a material by name
     * @param {string} name - The name of the material
     * @returns {THREE.Material|null} The material, or null if not loaded
     */
    getMaterial(name) {
        return this.materials.get(name) || null;
    }

    /**
     * Get a geometry by name
     * @param {string} name - The name of the geometry
     * @returns {THREE.BufferGeometry|null} The geometry, or null if not loaded
     */
    getGeometry(name) {
        return this.geometries.get(name) || null;
    }

    /**
     * Get a sound by URL
     * @param {string} url - The URL of the sound
     * @returns {AudioBuffer|null} The sound, or null if not loaded
     */
    getSound(url) {
        return this.sounds.get(url) || null;
    }

    /**
     * Get a model by URL
     * @param {string} url - The URL of the model
     * @returns {Object|null} The model, or null if not loaded
     */
    getModel(url) {
        const model = this.models.get(url);
        return model ? model.clone() : null;
    }

    /**
     * Get a font by URL
     * @param {string} url - The URL of the font
     * @returns {Font|null} The font, or null if not loaded
     */
    getFont(url) {
        return this.fonts.get(url) || null;
    }

    /**
     * Get a shader by name
     * @param {string} name - The name of the shader
     * @returns {Object|null} The shader, or null if not loaded
     */
    getShader(name) {
        return this.shaders.get(name) || null;
    }

    /**
     * Load multiple resources at once
     * @param {Object} resources - Resources to load
     * @returns {Promise<Object>} A promise that resolves with the loaded resources
     */
    loadResources(resources) {
        const promises = [];
        const result = {};
        
        // Load textures
        if (resources.textures) {
            for (const texture of resources.textures) {
                const promise = this.loadTexture(texture.url, texture.options).then(tex => {
                    result[texture.name || texture.url] = tex;
                });
                promises.push(promise);
            }
        }
        
        // Load models
        if (resources.models) {
            for (const model of resources.models) {
                const promise = this.loadModel(model.url).then(mod => {
                    result[model.name || model.url] = mod;
                });
                promises.push(promise);
            }
        }
        
        // Load sounds
        if (resources.sounds) {
            for (const sound of resources.sounds) {
                const promise = this.loadAudio(sound.url).then(audio => {
                    result[sound.name || sound.url] = audio;
                });
                promises.push(promise);
            }
        }
        
        // Load fonts
        if (resources.fonts) {
            for (const font of resources.fonts) {
                const promise = this.loadFont(font.url).then(fnt => {
                    result[font.name || font.url] = fnt;
                });
                promises.push(promise);
            }
        }
        
        // Load shaders
        if (resources.shaders) {
            for (const shader of resources.shaders) {
                const promise = this.loadShader(shader.name, shader.vertexUrl, shader.fragmentUrl).then(shd => {
                    result[shader.name] = shd;
                });
                promises.push(promise);
            }
        }
        
        // Wait for all resources to load
        return Promise.all(promises).then(() => {
            return result;
        });
    }

    /**
     * Get loading progress
     * @returns {number} The loading progress (0-1)
     */
    getProgress() {
        return this.loadingTotal > 0 ? this.loadingProgress / this.loadingTotal : 1;
    }

    /**
     * Check if resources are still loading
     * @returns {boolean} True if resources are loading, false otherwise
     */
    isResourcesLoading() {
        return this.isLoading;
    }

    /**
     * Clean up resources
     */
    dispose() {
        // Dispose of textures
        this.textures.forEach(texture => {
            texture.dispose();
        });
        this.textures.clear();
        
        // Dispose of materials
        this.materials.forEach(material => {
            material.dispose();
        });
        this.materials.clear();
        
        // Dispose of geometries
        this.geometries.forEach(geometry => {
            geometry.dispose();
        });
        this.geometries.clear();
        
        // Clear models (THREE.js will handle disposing of their geometries and materials)
        this.models.clear();
        
        // Clear sounds
        this.sounds.clear();
        
        // Clear fonts
        this.fonts.clear();
        
        // Clear shaders
        this.shaders.clear();
        
        // Remove event listeners
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        
        super.dispose();
    }
} 