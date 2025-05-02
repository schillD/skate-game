import { System } from '../System.js';

/**
 * UI System for managing game user interface elements
 */
export class UISystem extends System {
    constructor() {
        super('UISystem');
        
        // UI containers
        this.containers = {
            root: null,
            hud: null,
            menu: null,
            notification: null,
            debug: null
        };
        
        // UI elements
        this.elements = new Map();
        
        // Notification queue
        this.notifications = [];
        this.activeNotifications = [];
        this.maxActiveNotifications = 3;
        
        // UI state
        this.activeMenu = null;
        this.menuStack = [];
        this.isMenuActive = false;
        this.isHUDVisible = true;
        this.isDebugVisible = false;
        
        // Input handlers
        this.inputHandlers = new Map();
        
        // Animation frames
        this.animationFrames = new Map();
    }

    /**
     * Initialize the UI system
     * @param {Scene} scene - The scene this system belongs to
     */
    init(scene) {
        super.init(scene);
        
        // Create UI containers
        this.createContainers();
        
        // Add event listeners
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Create default UI elements
        this.createDefaultElements();
    }

    /**
     * Create UI containers
     */
    createContainers() {
        // Create root container
        this.containers.root = document.createElement('div');
        this.containers.root.id = 'game-ui';
        this.containers.root.style.position = 'absolute';
        this.containers.root.style.top = '0';
        this.containers.root.style.left = '0';
        this.containers.root.style.width = '100%';
        this.containers.root.style.height = '100%';
        this.containers.root.style.pointerEvents = 'none';
        this.containers.root.style.overflow = 'hidden';
        this.containers.root.style.zIndex = '1000';
        document.body.appendChild(this.containers.root);
        
        // Create HUD container
        this.containers.hud = document.createElement('div');
        this.containers.hud.id = 'game-hud';
        this.containers.hud.style.position = 'absolute';
        this.containers.hud.style.top = '0';
        this.containers.hud.style.left = '0';
        this.containers.hud.style.width = '100%';
        this.containers.hud.style.height = '100%';
        this.containers.hud.style.pointerEvents = 'none';
        this.containers.hud.style.zIndex = '1001';
        this.containers.root.appendChild(this.containers.hud);
        
        // Create menu container
        this.containers.menu = document.createElement('div');
        this.containers.menu.id = 'game-menu';
        this.containers.menu.style.position = 'absolute';
        this.containers.menu.style.top = '0';
        this.containers.menu.style.left = '0';
        this.containers.menu.style.width = '100%';
        this.containers.menu.style.height = '100%';
        this.containers.menu.style.display = 'none';
        this.containers.menu.style.pointerEvents = 'auto';
        this.containers.menu.style.zIndex = '1002';
        this.containers.menu.style.background = 'rgba(0, 0, 0, 0.5)';
        this.containers.root.appendChild(this.containers.menu);
        
        // Create notification container
        this.containers.notification = document.createElement('div');
        this.containers.notification.id = 'game-notifications';
        this.containers.notification.style.position = 'absolute';
        this.containers.notification.style.top = '20px';
        this.containers.notification.style.right = '20px';
        this.containers.notification.style.width = '300px';
        this.containers.notification.style.pointerEvents = 'none';
        this.containers.notification.style.zIndex = '1003';
        this.containers.root.appendChild(this.containers.notification);
        
        // Create debug container
        this.containers.debug = document.createElement('div');
        this.containers.debug.id = 'game-debug';
        this.containers.debug.style.position = 'absolute';
        this.containers.debug.style.bottom = '10px';
        this.containers.debug.style.left = '10px';
        this.containers.debug.style.pointerEvents = 'none';
        this.containers.debug.style.zIndex = '1004';
        this.containers.debug.style.display = 'none';
        this.containers.debug.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.containers.debug.style.color = '#fff';
        this.containers.debug.style.padding = '10px';
        this.containers.debug.style.borderRadius = '5px';
        this.containers.debug.style.fontFamily = 'monospace';
        this.containers.debug.style.fontSize = '12px';
        this.containers.root.appendChild(this.containers.debug);
    }

    /**
     * Create default UI elements
     */
    createDefaultElements() {
        // Create score element
        this.createHUDElement('score', {
            type: 'text',
            content: 'Score: 0',
            position: 'top-left',
            style: {
                color: '#fff',
                fontFamily: 'Arial, sans-serif',
                fontSize: '24px',
                margin: '20px',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }
        });
        
        // Create time element
        this.createHUDElement('time', {
            type: 'text',
            content: 'Time: 0',
            position: 'top-right',
            style: {
                color: '#fff',
                fontFamily: 'Arial, sans-serif',
                fontSize: '24px',
                margin: '20px',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }
        });
        
        // Create debug info
        this.createDebugElement('fps', {
            type: 'text',
            content: 'FPS: 0',
            style: {
                marginBottom: '5px'
            }
        });
        
        this.createDebugElement('memory', {
            type: 'text',
            content: 'Memory: 0 MB',
            style: {
                marginBottom: '5px'
            }
        });
        
        this.createDebugElement('drawCalls', {
            type: 'text',
            content: 'Draw Calls: 0',
            style: {
                marginBottom: '5px'
            }
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update UI elements that need repositioning
        this.elements.forEach(element => {
            if (element.onResize) {
                element.onResize();
            }
        });
    }

    /**
     * Update the UI system
     * @param {number} deltaTime - The time in seconds since the last update
     */
    update(deltaTime) {
        // Process notification queue
        this.processNotifications();
        
        // Update active notifications
        this.updateNotifications(deltaTime);
        
        // Update debug info if visible
        if (this.isDebugVisible) {
            this.updateDebugInfo();
        }
        
        // Update UI elements
        this.elements.forEach(element => {
            if (element.update) {
                element.update(deltaTime);
            }
        });
    }

    /**
     * Process notifications in the queue
     */
    processNotifications() {
        if (this.notifications.length === 0 || this.activeNotifications.length >= this.maxActiveNotifications) {
            return;
        }
        
        const notification = this.notifications.shift();
        this.showNotification(notification);
    }

    /**
     * Update active notifications
     * @param {number} deltaTime - The time in seconds since the last update
     */
    updateNotifications(deltaTime) {
        for (let i = this.activeNotifications.length - 1; i >= 0; i--) {
            const notification = this.activeNotifications[i];
            
            // Update notification lifetime
            notification.lifetime -= deltaTime;
            
            // Remove expired notifications
            if (notification.lifetime <= 0) {
                this.removeNotification(notification);
            }
        }
    }

    /**
     * Update debug information
     */
    updateDebugInfo() {
        // Get render statistics from render system if available
        const renderSystem = this.scene.getSystem('RenderSystem');
        if (renderSystem) {
            const stats = renderSystem.getStats();
            
            // Update FPS
            const fpsElement = this.elements.get('fps');
            if (fpsElement) {
                fpsElement.element.textContent = `FPS: ${stats.fps.toFixed(1)}`;
            }
            
            // Update draw calls
            const drawCallsElement = this.elements.get('drawCalls');
            if (drawCallsElement) {
                drawCallsElement.element.textContent = `Draw Calls: ${stats.drawCalls}`;
            }
        }
        
        // Update memory usage
        const memoryElement = this.elements.get('memory');
        if (memoryElement && window.performance && window.performance.memory) {
            const memory = window.performance.memory.usedJSHeapSize / (1024 * 1024);
            memoryElement.element.textContent = `Memory: ${memory.toFixed(2)} MB`;
        }
    }

    /**
     * Create a HUD element
     * @param {string} id - The element ID
     * @param {Object} options - The element options
     * @returns {Object} The created element
     */
    createHUDElement(id, options) {
        // Check if element already exists
        if (this.elements.has(id)) {
            console.warn(`UI element with ID '${id}' already exists.`);
            return this.elements.get(id);
        }
        
        // Create element
        const element = document.createElement('div');
        element.id = `hud-${id}`;
        element.style.position = 'absolute';
        element.style.pointerEvents = options.interactive ? 'auto' : 'none';
        
        // Set element content
        if (options.type === 'text') {
            element.textContent = options.content || '';
        } else if (options.type === 'image') {
            const img = document.createElement('img');
            img.src = options.src;
            if (options.width) img.style.width = typeof options.width === 'number' ? `${options.width}px` : options.width;
            if (options.height) img.style.height = typeof options.height === 'number' ? `${options.height}px` : options.height;
            element.appendChild(img);
        } else if (options.type === 'html') {
            element.innerHTML = options.content || '';
        }
        
        // Apply styles
        if (options.style) {
            Object.assign(element.style, options.style);
        }
        
        // Position element
        this.positionElement(element, options.position || 'center');
        
        // Add to HUD container
        this.containers.hud.appendChild(element);
        
        // Create element object
        const elementObj = {
            id,
            element,
            options,
            onResize: () => {
                this.positionElement(element, options.position || 'center');
            },
            update: options.update
        };
        
        // Store element
        this.elements.set(id, elementObj);
        
        return elementObj;
    }

    /**
     * Create a debug element
     * @param {string} id - The element ID
     * @param {Object} options - The element options
     * @returns {Object} The created element
     */
    createDebugElement(id, options) {
        // Check if element already exists
        if (this.elements.has(id)) {
            console.warn(`UI element with ID '${id}' already exists.`);
            return this.elements.get(id);
        }
        
        // Create element
        const element = document.createElement('div');
        element.id = `debug-${id}`;
        
        // Set element content
        if (options.type === 'text') {
            element.textContent = options.content || '';
        } else if (options.type === 'html') {
            element.innerHTML = options.content || '';
        }
        
        // Apply styles
        if (options.style) {
            Object.assign(element.style, options.style);
        }
        
        // Add to debug container
        this.containers.debug.appendChild(element);
        
        // Create element object
        const elementObj = {
            id,
            element,
            options,
            update: options.update
        };
        
        // Store element
        this.elements.set(id, elementObj);
        
        return elementObj;
    }

    /**
     * Create a menu
     * @param {string} id - The menu ID
     * @param {Object} options - The menu options
     * @returns {Object} The created menu
     */
    createMenu(id, options = {}) {
        // Check if menu already exists
        if (this.elements.has(`menu-${id}`)) {
            console.warn(`Menu with ID '${id}' already exists.`);
            return this.elements.get(`menu-${id}`);
        }
        
        // Create menu container
        const menuContainer = document.createElement('div');
        menuContainer.id = `menu-${id}`;
        menuContainer.className = 'game-menu-container';
        menuContainer.style.position = 'absolute';
        menuContainer.style.top = '50%';
        menuContainer.style.left = '50%';
        menuContainer.style.transform = 'translate(-50%, -50%)';
        menuContainer.style.backgroundColor = options.backgroundColor || 'rgba(0, 0, 0, 0.8)';
        menuContainer.style.color = options.color || '#fff';
        menuContainer.style.padding = options.padding || '20px';
        menuContainer.style.borderRadius = options.borderRadius || '10px';
        menuContainer.style.minWidth = options.minWidth || '300px';
        menuContainer.style.maxWidth = options.maxWidth || '80%';
        menuContainer.style.maxHeight = options.maxHeight || '80%';
        menuContainer.style.overflow = 'auto';
        menuContainer.style.boxShadow = options.boxShadow || '0 0 20px rgba(0, 0, 0, 0.5)';
        menuContainer.style.display = 'none';
        
        // Create menu title
        if (options.title) {
            const title = document.createElement('h2');
            title.textContent = options.title;
            title.style.margin = '0 0 20px 0';
            title.style.textAlign = 'center';
            title.style.fontFamily = options.fontFamily || 'Arial, sans-serif';
            menuContainer.appendChild(title);
        }
        
        // Create menu content
        const content = document.createElement('div');
        content.className = 'menu-content';
        
        if (options.content) {
            if (typeof options.content === 'string') {
                content.innerHTML = options.content;
            } else if (options.content instanceof HTMLElement) {
                content.appendChild(options.content);
            }
        }
        
        menuContainer.appendChild(content);
        
        // Create menu buttons
        if (options.buttons && options.buttons.length > 0) {
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'menu-buttons';
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.flexDirection = options.buttonDirection || 'column';
            buttonsContainer.style.gap = options.buttonGap || '10px';
            buttonsContainer.style.marginTop = '20px';
            buttonsContainer.style.justifyContent = 'center';
            
            options.buttons.forEach(buttonOptions => {
                const button = document.createElement('button');
                button.textContent = buttonOptions.text || '';
                button.style.padding = '10px 20px';
                button.style.border = 'none';
                button.style.borderRadius = '5px';
                button.style.backgroundColor = buttonOptions.backgroundColor || '#4CAF50';
                button.style.color = buttonOptions.color || '#fff';
                button.style.fontFamily = options.fontFamily || 'Arial, sans-serif';
                button.style.fontSize = '16px';
                button.style.cursor = 'pointer';
                button.style.transition = 'background-color 0.2s';
                
                // Hover effect
                button.onmouseover = () => {
                    button.style.backgroundColor = buttonOptions.hoverColor || '#45a049';
                };
                
                button.onmouseout = () => {
                    button.style.backgroundColor = buttonOptions.backgroundColor || '#4CAF50';
                };
                
                // Click event
                button.onclick = (event) => {
                    if (buttonOptions.onClick) {
                        buttonOptions.onClick(event);
                    }
                };
                
                buttonsContainer.appendChild(button);
            });
            
            menuContainer.appendChild(buttonsContainer);
        }
        
        // Add to menu container
        this.containers.menu.appendChild(menuContainer);
        
        // Create menu object
        const menu = {
            id,
            element: menuContainer,
            options,
            show: () => this.showMenu(id),
            hide: () => this.hideMenu(id),
            toggle: () => this.toggleMenu(id),
            update: options.update,
            content
        };
        
        // Store menu
        this.elements.set(`menu-${id}`, menu);
        
        return menu;
    }

    /**
     * Position an element
     * @param {HTMLElement} element - The element to position
     * @param {string} position - The position ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'top', 'bottom', 'left', 'right')
     */
    positionElement(element, position) {
        // Reset position
        element.style.top = '';
        element.style.right = '';
        element.style.bottom = '';
        element.style.left = '';
        element.style.transform = '';
        
        // Set position
        switch (position) {
            case 'top-left':
                element.style.top = '0';
                element.style.left = '0';
                break;
            case 'top-right':
                element.style.top = '0';
                element.style.right = '0';
                break;
            case 'bottom-left':
                element.style.bottom = '0';
                element.style.left = '0';
                break;
            case 'bottom-right':
                element.style.bottom = '0';
                element.style.right = '0';
                break;
            case 'center':
                element.style.top = '50%';
                element.style.left = '50%';
                element.style.transform = 'translate(-50%, -50%)';
                break;
            case 'top':
                element.style.top = '0';
                element.style.left = '50%';
                element.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                element.style.bottom = '0';
                element.style.left = '50%';
                element.style.transform = 'translateX(-50%)';
                break;
            case 'left':
                element.style.top = '50%';
                element.style.left = '0';
                element.style.transform = 'translateY(-50%)';
                break;
            case 'right':
                element.style.top = '50%';
                element.style.right = '0';
                element.style.transform = 'translateY(-50%)';
                break;
            default:
                if (typeof position === 'object') {
                    if (position.top !== undefined) element.style.top = typeof position.top === 'number' ? `${position.top}px` : position.top;
                    if (position.right !== undefined) element.style.right = typeof position.right === 'number' ? `${position.right}px` : position.right;
                    if (position.bottom !== undefined) element.style.bottom = typeof position.bottom === 'number' ? `${position.bottom}px` : position.bottom;
                    if (position.left !== undefined) element.style.left = typeof position.left === 'number' ? `${position.left}px` : position.left;
                }
                break;
        }
    }

    /**
     * Show a menu
     * @param {string} id - The menu ID
     */
    showMenu(id) {
        const menu = this.elements.get(`menu-${id}`);
        
        if (!menu) {
            console.warn(`Menu with ID '${id}' not found.`);
            return;
        }
        
        // Hide current active menu
        if (this.activeMenu && this.activeMenu !== menu) {
            this.activeMenu.element.style.display = 'none';
        }
        
        // Show menu container
        this.containers.menu.style.display = 'block';
        
        // Show menu
        menu.element.style.display = 'block';
        
        // Set active menu
        this.activeMenu = menu;
        this.menuStack.push(menu);
        this.isMenuActive = true;
        
        // Pause game if specified
        if (menu.options.pauseGame !== false) {
            this.scene.pause();
        }
        
        // Call onShow callback
        if (menu.options.onShow) {
            menu.options.onShow(menu);
        }
        
        // Dispatch event
        const event = new CustomEvent('menushow', { detail: { id } });
        window.dispatchEvent(event);
    }

    /**
     * Hide a menu
     * @param {string} id - The menu ID or null to hide current menu
     */
    hideMenu(id) {
        // If no ID provided, hide the active menu
        const menu = id ? this.elements.get(`menu-${id}`) : this.activeMenu;
        
        if (!menu) {
            if (id) {
                console.warn(`Menu with ID '${id}' not found.`);
            }
            return;
        }
        
        // Hide menu
        menu.element.style.display = 'none';
        
        // Remove from stack
        this.menuStack = this.menuStack.filter(m => m !== menu);
        
        // Set new active menu or hide menu container
        if (this.menuStack.length > 0) {
            this.activeMenu = this.menuStack[this.menuStack.length - 1];
            this.activeMenu.element.style.display = 'block';
        } else {
            this.activeMenu = null;
            this.isMenuActive = false;
            this.containers.menu.style.display = 'none';
            
            // Resume game if no more menus
            this.scene.resume();
        }
        
        // Call onHide callback
        if (menu.options.onHide) {
            menu.options.onHide(menu);
        }
        
        // Dispatch event
        const event = new CustomEvent('menuhide', { detail: { id: menu.id } });
        window.dispatchEvent(event);
    }

    /**
     * Toggle a menu
     * @param {string} id - The menu ID
     */
    toggleMenu(id) {
        const menu = this.elements.get(`menu-${id}`);
        
        if (!menu) {
            console.warn(`Menu with ID '${id}' not found.`);
            return;
        }
        
        if (menu.element.style.display === 'block') {
            this.hideMenu(id);
        } else {
            this.showMenu(id);
        }
    }

    /**
     * Show a notification
     * @param {Object} notification - The notification object
     */
    showNotification(notification) {
        // Create notification element
        const element = document.createElement('div');
        element.className = 'game-notification';
        element.style.backgroundColor = notification.backgroundColor || 'rgba(0, 0, 0, 0.7)';
        element.style.color = notification.color || '#fff';
        element.style.padding = '10px';
        element.style.borderRadius = '5px';
        element.style.marginBottom = '10px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.transition = 'opacity 0.3s, transform 0.3s';
        element.style.opacity = '0';
        element.style.transform = 'translateX(50px)';
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        
        // Add icon if specified
        if (notification.icon) {
            const icon = document.createElement('img');
            icon.src = notification.icon;
            icon.style.width = '20px';
            icon.style.height = '20px';
            icon.style.marginRight = '10px';
            icon.style.verticalAlign = 'middle';
            element.appendChild(icon);
        }
        
        // Add title if specified
        if (notification.title) {
            const title = document.createElement('h3');
            title.textContent = notification.title;
            title.style.margin = '0 0 5px 0';
            title.style.fontSize = '16px';
            element.appendChild(title);
        }
        
        // Add message
        const message = document.createElement('div');
        message.textContent = notification.message;
        message.style.fontSize = notification.fontSize || '14px';
        element.appendChild(message);
        
        // Add progress bar if specified
        if (notification.showProgress) {
            const progressBar = document.createElement('div');
            progressBar.style.position = 'absolute';
            progressBar.style.bottom = '0';
            progressBar.style.left = '0';
            progressBar.style.height = '3px';
            progressBar.style.backgroundColor = notification.progressColor || '#4CAF50';
            progressBar.style.width = '100%';
            element.appendChild(progressBar);
            
            // Update progress bar animation
            notification.progressBar = progressBar;
        }
        
        // Add close button if specified
        if (notification.closable) {
            const closeButton = document.createElement('button');
            closeButton.textContent = '×';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '5px';
            closeButton.style.right = '5px';
            closeButton.style.backgroundColor = 'transparent';
            closeButton.style.border = 'none';
            closeButton.style.color = '#fff';
            closeButton.style.fontWeight = 'bold';
            closeButton.style.fontSize = '16px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.padding = '0 5px';
            closeButton.addEventListener('click', () => {
                this.removeNotification(notification);
            });
            element.appendChild(closeButton);
        }
        
        // Add to notification container
        this.containers.notification.appendChild(element);
        
        // Store element in notification
        notification.element = element;
        
        // Add to active notifications
        this.activeNotifications.push(notification);
        
        // Show notification with animation
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
        }, 10);
        
        // Set up removal after lifetime
        if (notification.lifetime > 0 && notification.progressBar) {
            // Animate progress bar
            notification.progressBar.style.transition = `width ${notification.lifetime}s linear`;
            setTimeout(() => {
                notification.progressBar.style.width = '0%';
            }, 10);
        }
    }

    /**
     * Remove a notification
     * @param {Object} notification - The notification to remove
     */
    removeNotification(notification) {
        if (!notification || !notification.element) return;
        
        // Hide notification with animation
        notification.element.style.opacity = '0';
        notification.element.style.transform = 'translateX(50px)';
        
        // Remove element after animation
        setTimeout(() => {
            if (notification.element && notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            
            // Remove from active notifications
            const index = this.activeNotifications.indexOf(notification);
            if (index !== -1) {
                this.activeNotifications.splice(index, 1);
            }
            
            // Process next notification in queue
            this.processNotifications();
        }, 300);
    }

    /**
     * Add a notification to the queue
     * @param {Object|string} options - Notification options or message string
     * @returns {Object} The notification object
     */
    addNotification(options) {
        let notification;
        
        if (typeof options === 'string') {
            notification = {
                message: options,
                lifetime: 3
            };
        } else {
            notification = {
                message: options.message || '',
                title: options.title,
                icon: options.icon,
                backgroundColor: options.backgroundColor,
                color: options.color,
                fontSize: options.fontSize,
                showProgress: options.showProgress !== false,
                progressColor: options.progressColor,
                lifetime: options.lifetime || 3,
                closable: options.closable !== false,
                onShow: options.onShow,
                onHide: options.onHide
            };
        }
        
        // Add to notification queue
        this.notifications.push(notification);
        
        // Process notifications
        this.processNotifications();
        
        return notification;
    }

    /**
     * Update a HUD element
     * @param {string} id - The element ID
     * @param {Object|string} content - The new content or options
     */
    updateHUDElement(id, content) {
        const elementObj = this.elements.get(id);
        
        if (!elementObj) {
            console.warn(`UI element with ID '${id}' not found.`);
            return;
        }
        
        if (typeof content === 'string') {
            // Update text content
            elementObj.element.textContent = content;
        } else if (typeof content === 'object') {
            // Update element options
            if (content.content !== undefined) {
                if (elementObj.options.type === 'html') {
                    elementObj.element.innerHTML = content.content;
                } else {
                    elementObj.element.textContent = content.content;
                }
            }
            
            // Update style
            if (content.style) {
                Object.assign(elementObj.element.style, content.style);
            }
            
            // Update position
            if (content.position) {
                this.positionElement(elementObj.element, content.position);
                elementObj.options.position = content.position;
            }
            
            // Update other options
            if (content.update) {
                elementObj.update = content.update;
                elementObj.options.update = content.update;
            }
        }
    }

    /**
     * Toggle HUD visibility
     * @param {boolean} visible - Whether the HUD should be visible
     */
    toggleHUD(visible) {
        if (visible === undefined) {
            visible = !this.isHUDVisible;
        }
        
        this.isHUDVisible = visible;
        this.containers.hud.style.display = visible ? 'block' : 'none';
    }

    /**
     * Toggle debug info visibility
     * @param {boolean} visible - Whether the debug info should be visible
     */
    toggleDebug(visible) {
        if (visible === undefined) {
            visible = !this.isDebugVisible;
        }
        
        this.isDebugVisible = visible;
        this.containers.debug.style.display = visible ? 'block' : 'none';
    }

    /**
     * Add an animation to an element
     * @param {string} id - The element ID
     * @param {string} animationId - The animation ID
     * @param {Object} options - Animation options
     * @returns {number} The animation ID
     */
    addAnimation(id, animationId, options) {
        const elementObj = this.elements.get(id);
        
        if (!elementObj) {
            console.warn(`UI element with ID '${id}' not found.`);
            return -1;
        }
        
        // Cancel existing animation with the same ID
        this.removeAnimation(id, animationId);
        
        // Create animation function
        const animate = (timestamp) => {
            if (!this.animationFrames.has(`${id}-${animationId}`)) {
                return;
            }
            
            const animation = this.animationFrames.get(`${id}-${animationId}`);
            
            if (!animation.startTime) {
                animation.startTime = timestamp;
            }
            
            const elapsed = timestamp - animation.startTime;
            const progress = Math.min(elapsed / (options.duration || 1000), 1);
            
            // Call animation function
            options.onUpdate(elementObj.element, progress, elapsed);
            
            // Continue animation if not complete
            if (progress < 1) {
                animation.frameId = requestAnimationFrame(animate);
            } else {
                // Call completion callback
                if (options.onComplete) {
                    options.onComplete(elementObj.element);
                }
                
                // Handle repeat
                if (options.repeat) {
                    animation.startTime = null;
                    animation.frameId = requestAnimationFrame(animate);
                } else {
                    this.removeAnimation(id, animationId);
                }
            }
        };
        
        // Start animation
        const frameId = requestAnimationFrame(animate);
        
        // Store animation data
        this.animationFrames.set(`${id}-${animationId}`, {
            frameId,
            startTime: null,
            options
        });
        
        return frameId;
    }

    /**
     * Remove an animation
     * @param {string} id - The element ID
     * @param {string} animationId - The animation ID
     */
    removeAnimation(id, animationId) {
        const key = `${id}-${animationId}`;
        
        if (this.animationFrames.has(key)) {
            const animation = this.animationFrames.get(key);
            cancelAnimationFrame(animation.frameId);
            this.animationFrames.delete(key);
        }
    }

    /**
     * Play a bounce animation on an element
     * @param {string} id - The element ID
     * @param {Object} options - Animation options
     */
    bounceElement(id, options = {}) {
        return this.addAnimation(id, 'bounce', {
            duration: options.duration || 500,
            repeat: options.repeat || false,
            onUpdate: (element, progress) => {
                const scale = 1 + Math.sin(progress * Math.PI) * (options.scale || 0.2);
                element.style.transform = `${element.style.transform.replace(/scale\([^)]*\)/, '')} scale(${scale})`;
            },
            onComplete: (element) => {
                element.style.transform = element.style.transform.replace(/scale\([^)]*\)/, '');
                if (options.onComplete) {
                    options.onComplete(element);
                }
            }
        });
    }

    /**
     * Play a fade animation on an element
     * @param {string} id - The element ID
     * @param {Object} options - Animation options
     */
    fadeElement(id, options = {}) {
        const elementObj = this.elements.get(id);
        
        if (!elementObj) {
            console.warn(`UI element with ID '${id}' not found.`);
            return -1;
        }
        
        const startOpacity = options.fadeIn ? 0 : 1;
        const endOpacity = options.fadeIn ? 1 : 0;
        
        elementObj.element.style.opacity = startOpacity;
        
        if (options.fadeIn) {
            elementObj.element.style.display = '';
        }
        
        return this.addAnimation(id, 'fade', {
            duration: options.duration || 500,
            repeat: options.repeat || false,
            onUpdate: (element, progress) => {
                const opacity = startOpacity + (endOpacity - startOpacity) * progress;
                element.style.opacity = opacity;
            },
            onComplete: (element) => {
                element.style.opacity = endOpacity;
                
                if (!options.fadeIn) {
                    element.style.display = 'none';
                }
                
                if (options.onComplete) {
                    options.onComplete(element);
                }
            }
        });
    }

    /**
     * Dispose of the UI system
     */
    dispose() {
        // Remove all animation frames
        this.animationFrames.forEach((animation) => {
            cancelAnimationFrame(animation.frameId);
        });
        this.animationFrames.clear();
        
        // Remove all elements
        this.elements.clear();
        
        // Remove all containers
        for (const key in this.containers) {
            if (this.containers[key] && this.containers[key].parentNode) {
                this.containers[key].parentNode.removeChild(this.containers[key]);
            }
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        super.dispose();
    }
} 