export class InputManager {
    constructor() {
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = { left: false, middle: false, right: false };
        this.callbacks = {
            keydown: [],
            keyup: [],
            mousedown: [],
            mouseup: [],
            mousemove: [],
            wheel: []
        };
    }
    
    initialize() {
        // Eventos do teclado
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Eventos do mouse
        window.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Prevenir menu de contexto padrão
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    // Métodos para gerenciar eventos de teclado
    handleKeyDown(event) {
        this.keys[event.code] = true;
        this.callbacks.keydown.forEach(callback => callback(event));
    }
    
    handleKeyUp(event) {
        this.keys[event.code] = false;
        this.callbacks.keyup.forEach(callback => callback(event));
    }
    
    // Métodos para gerenciar eventos de mouse
    handleMouseDown(event) {
        switch (event.button) {
            case 0: this.mouseButtons.left = true; break;
            case 1: this.mouseButtons.middle = true; break;
            case 2: this.mouseButtons.right = true; break;
        }
        this.callbacks.mousedown.forEach(callback => callback(event));
    }
    
    handleMouseUp(event) {
        switch (event.button) {
            case 0: this.mouseButtons.left = false; break;
            case 1: this.mouseButtons.middle = false; break;
            case 2: this.mouseButtons.right = false; break;
        }
        this.callbacks.mouseup.forEach(callback => callback(event));
    }
    
    handleMouseMove(event) {
        this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.callbacks.mousemove.forEach(callback => callback(event));
    }
    
    handleWheel(event) {
        this.callbacks.wheel.forEach(callback => callback(event));
    }
    
    // Métodos para registrar callbacks
    on(eventType, callback) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].push(callback);
            return true;
        }
        return false;
    }
    
    off(eventType, callback) {
        if (this.callbacks[eventType]) {
            const index = this.callbacks[eventType].indexOf(callback);
            if (index !== -1) {
                this.callbacks[eventType].splice(index, 1);
                return true;
            }
        }
        return false;
    }
    
    // Utilitários
    isKeyPressed(code) {
        return this.keys[code] === true;
    }
    
    isMouseButtonPressed(button) {
        return this.mouseButtons[button] === true;
    }
} 