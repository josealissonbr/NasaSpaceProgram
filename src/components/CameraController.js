// Removendo a importação do three.js pois ele já é carregado globalmente
// import * as THREE from 'three';

export class CameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // Estado da câmera
        this.target = new THREE.Vector3(0, 0, 0);
        this.distance = 10;
        this.minDistance = 2;
        this.maxDistance = 50;
        
        // Ângulos de rotação
        this.phi = 0; // ângulo vertical
        this.theta = 0; // ângulo horizontal
        
        // Velocidades
        this.rotateSpeed = 1.0;
        this.zoomSpeed = 1.2;
        this.panSpeed = 0.8;
        
        // Estado do mouse
        this.isMouseDown = false;
        this.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };
        this.mouse = new THREE.Vector2();
        this.prevMouse = new THREE.Vector2();
        
        // Estado de teclas
        this.keys = {
            UP: false,
            DOWN: false,
            LEFT: false,
            RIGHT: false,
            SHIFT: false,
            CTRL: false
        };
        
        // Vincular métodos
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseWheel = this.onMouseWheel.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        
        // Adicionar event listeners
        this.domElement.addEventListener('mousedown', this.onMouseDown, false);
        this.domElement.addEventListener('mousemove', this.onMouseMove, false);
        this.domElement.addEventListener('mouseup', this.onMouseUp, false);
        this.domElement.addEventListener('wheel', this.onMouseWheel, false);
        window.addEventListener('keydown', this.onKeyDown, false);
        window.addEventListener('keyup', this.onKeyUp, false);
        
        // Configurar a posição inicial da câmera
        this.updateCameraPosition();
    }
    
    onMouseDown(event) {
        event.preventDefault();
        
        this.isMouseDown = true;
        this.prevMouse.set(event.clientX, event.clientY);
        
        // Determinar o tipo de ação com base no botão do mouse
        if (event.button === 0) { // Botão esquerdo
            this.state = this.mouseButtons.LEFT;
        } else if (event.button === 1) { // Botão do meio
            this.state = this.mouseButtons.MIDDLE;
        } else if (event.button === 2) { // Botão direito
            this.state = this.mouseButtons.RIGHT;
            // Prevenir o menu de contexto ao usar o botão direito
            this.domElement.addEventListener('contextmenu', this.preventDefault, false);
        }
    }
    
    onMouseMove(event) {
        event.preventDefault();
        
        this.mouse.set(event.clientX, event.clientY);
        
        if (this.isMouseDown) {
            const movementX = this.mouse.x - this.prevMouse.x;
            const movementY = this.mouse.y - this.prevMouse.y;
            
            if (this.state === THREE.MOUSE.ROTATE) {
                // Rotação
                this.rotate(movementX, movementY);
            } else if (this.state === THREE.MOUSE.DOLLY) {
                // Zoom
                this.zoom(movementY);
            } else if (this.state === THREE.MOUSE.PAN) {
                // Pan
                this.pan(movementX, movementY);
            }
        }
        
        this.prevMouse.copy(this.mouse);
    }
    
    onMouseUp(event) {
        this.isMouseDown = false;
        
        // Remover o listener de contexto se foi adicionado
        this.domElement.removeEventListener('contextmenu', this.preventDefault, false);
    }
    
    onMouseWheel(event) {
        event.preventDefault();
        
        // Delta positivo = zoom out, negativo = zoom in
        const delta = Math.sign(event.deltaY);
        this.zoom(delta * 5);
    }
    
    onKeyDown(event) {
        switch (event.key) {
            case 'ArrowUp':
                this.keys.UP = true;
                break;
            case 'ArrowDown':
                this.keys.DOWN = true;
                break;
            case 'ArrowLeft':
                this.keys.LEFT = true;
                break;
            case 'ArrowRight':
                this.keys.RIGHT = true;
                break;
            case 'Shift':
                this.keys.SHIFT = true;
                break;
            case 'Control':
                this.keys.CTRL = true;
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.key) {
            case 'ArrowUp':
                this.keys.UP = false;
                break;
            case 'ArrowDown':
                this.keys.DOWN = false;
                break;
            case 'ArrowLeft':
                this.keys.LEFT = false;
                break;
            case 'ArrowRight':
                this.keys.RIGHT = false;
                break;
            case 'Shift':
                this.keys.SHIFT = false;
                break;
            case 'Control':
                this.keys.CTRL = false;
                break;
        }
    }
    
    rotate(deltaX, deltaY) {
        // Converter pixels para radianos
        const factor = 0.002;
        
        // Atualizar ângulos
        this.theta -= deltaX * factor * this.rotateSpeed;
        this.phi -= deltaY * factor * this.rotateSpeed;
        
        // Limitar a rotação vertical para evitar inversão
        this.phi = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.phi));
        
        this.updateCameraPosition();
    }
    
    zoom(delta) {
        // Ajustar a distância
        const factor = 0.1 * this.zoomSpeed;
        this.distance += delta * factor * this.distance;
        
        // Limitar a distância
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
        
        this.updateCameraPosition();
    }
    
    pan(deltaX, deltaY) {
        // Mover o alvo da câmera no plano perpendicular à linha de visão
        const factor = 0.01 * this.panSpeed;
        
        // Vetores de direção da câmera
        const forward = new THREE.Vector3();
        forward.subVectors(this.camera.position, this.target).normalize();
        
        const right = new THREE.Vector3();
        right.crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
        
        const up = new THREE.Vector3();
        up.crossVectors(forward, right).normalize();
        
        // Aplicar movimento
        const pan = new THREE.Vector3();
        pan.copy(right).multiplyScalar(-deltaX * factor * this.distance);
        this.target.add(pan);
        
        pan.copy(up).multiplyScalar(-deltaY * factor * this.distance);
        this.target.add(pan);
        
        this.updateCameraPosition();
    }
    
    updateCameraPosition() {
        // Calcular posição esférica
        const x = this.distance * Math.sin(this.phi) * Math.sin(this.theta);
        const y = this.distance * Math.cos(this.phi);
        const z = this.distance * Math.sin(this.phi) * Math.cos(this.theta);
        
        // Atualizar posição da câmera
        this.camera.position.set(
            this.target.x + x,
            this.target.y + y,
            this.target.z + z
        );
        
        // Apontar a câmera para o alvo
        this.camera.lookAt(this.target);
    }
    
    resetToDefault() {
        this.target.set(0, 0, 0);
        this.distance = 10;
        this.phi = Math.PI / 4; // 45 graus
        this.theta = Math.PI / 4; // 45 graus
        this.updateCameraPosition();
    }
    
    focusOnObject(object) {
        // Focar a câmera em um objeto específico
        if (!object) return;
        
        // Obter o centro do objeto
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        
        // Definir o alvo da câmera
        this.target.copy(center);
        
        // Ajustar a distância da câmera para enquadrar o objeto
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        this.distance = maxDim * 2;
        
        // Garantir que esteja dentro dos limites
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
        
        this.updateCameraPosition();
    }
    
    update() {
        // Aplicar movimentos contínuos com base no estado das teclas
        let needsUpdate = false;
        
        if (this.keys.UP) {
            this.phi += 0.01 * this.rotateSpeed;
            needsUpdate = true;
        }
        if (this.keys.DOWN) {
            this.phi -= 0.01 * this.rotateSpeed;
            needsUpdate = true;
        }
        if (this.keys.LEFT) {
            this.theta += 0.01 * this.rotateSpeed;
            needsUpdate = true;
        }
        if (this.keys.RIGHT) {
            this.theta -= 0.01 * this.rotateSpeed;
            needsUpdate = true;
        }
        
        // Limitar phi
        this.phi = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.phi));
        
        if (needsUpdate) {
            this.updateCameraPosition();
        }
    }
    
    preventDefault(event) {
        event.preventDefault();
    }
    
    dispose() {
        this.domElement.removeEventListener('mousedown', this.onMouseDown);
        this.domElement.removeEventListener('mousemove', this.onMouseMove);
        this.domElement.removeEventListener('mouseup', this.onMouseUp);
        this.domElement.removeEventListener('wheel', this.onMouseWheel);
        this.domElement.removeEventListener('contextmenu', this.preventDefault);
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }
} 