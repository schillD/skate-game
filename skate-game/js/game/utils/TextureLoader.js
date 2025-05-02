import * as THREE from 'three';

export class TextureLoader {
    constructor() {
        this.loader = new THREE.TextureLoader();
        this.textureCache = new Map(); // Cache to avoid reloading the same textures
    }
    
    load(url) {
        // Check if the texture is already in the cache
        if (this.textureCache.has(url)) {
            return Promise.resolve(this.textureCache.get(url));
        }
        
        // Otherwise, load it and cache it
        return new Promise((resolve, reject) => {
            this.loader.load(
                url,
                texture => {
                    this.textureCache.set(url, texture);
                    resolve(texture);
                },
                undefined,
                error => reject(error)
            );
        });
    }
    
    // Create a canvas with a pattern and return it as a texture
    createPatternTexture(createPattern, width = 128, height = 128) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        // Call the provided function to create the pattern
        createPattern(context, canvas);
        
        // Create a texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    // Helper to create a striped pattern
    createStripeTexture(color1 = '#FFCC00', color2 = '#000000', stripeWidth = 16) {
        return this.createPatternTexture((ctx, canvas) => {
            for (let i = 0; i < canvas.height; i += stripeWidth * 2) {
                ctx.fillStyle = color1;
                ctx.fillRect(0, i, canvas.width, stripeWidth);
                ctx.fillStyle = color2;
                ctx.fillRect(0, i + stripeWidth, canvas.width, stripeWidth);
            }
        });
    }
    
    // Helper to create a checkered pattern
    createCheckerTexture(color1 = '#FFFFFF', color2 = '#000000', size = 16) {
        return this.createPatternTexture((ctx, canvas) => {
            const rows = Math.ceil(canvas.height / size);
            const cols = Math.ceil(canvas.width / size);
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    ctx.fillStyle = (row + col) % 2 === 0 ? color1 : color2;
                    ctx.fillRect(col * size, row * size, size, size);
                }
            }
        });
    }
    
    // Helper to create a gradient texture
    createGradientTexture(color1 = '#87CEEB', color2 = '#FFFFFF', isVertical = true) {
        return this.createPatternTexture((ctx, canvas) => {
            const gradient = isVertical
                ? ctx.createLinearGradient(0, 0, 0, canvas.height)
                : ctx.createLinearGradient(0, 0, canvas.width, 0);
                
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
    }
} 