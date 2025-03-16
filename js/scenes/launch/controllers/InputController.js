export class InputController {
    constructor(gameState) {
        this.gameState = gameState;
        this.keys = {};
        this.throttleChangeRate = 5; // Porcentagem de mudança por segundo
        this.rotationSpeed = 0.5; // Velocidade de rotação
        this.manualControl = false;
        
        // Inicializar controles
        this.initControls();
    }
    
    initControls() {
        // Registrar eventos de teclado
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Definir estado inicial de voo
        if (this.gameState.flight) {
            this.gameState.flight.throttle = 50; // Throttle inicial em 50%
            this.gameState.flight.pitch = 0;
            this.gameState.flight.yaw = 0;
            this.gameState.flight.roll = 0;
        }
    }
    
    handleKeyDown(event) {
        // Armazenar estado da tecla
        this.keys[event.key.toLowerCase()] = true;
        
        // Iniciar lançamento com barra de espaço
        if (event.code === 'Space' && this.gameState.flight.status === 'pre-launch') {
            this.manualControl = true;
            this.gameState.flight.status = 'launching';
            console.log('Preparando para lançamento - Controle manual ativado!');
            
            // Iniciar contagem regressiva de 5 segundos
            this.gameState.flight.missionTime = -5;
            
            // Quando a contagem terminar, mudar para status flying
            setTimeout(() => {
                if (this.gameState.flight.status === 'launching') {
                    this.gameState.flight.status = 'flying';
                    this.gameState.flight.missionTime = 0;
                    console.log('Lançamento iniciado! Use SHIFT/CTRL para controlar throttle, WASD para direção, Q/E para rotação');
                }
            }, 5000);
        }
        
        // Evitar o comportamento padrão para as teclas de controle
        if (['w', 'a', 's', 'd', 'q', 'e', 'shift', 'control'].includes(event.key.toLowerCase())) {
            event.preventDefault();
        }
    }
    
    handleKeyUp(event) {
        // Limpar estado da tecla
        this.keys[event.key.toLowerCase()] = false;
    }
    
    update(deltaTime) {
        // Somente processar controles se estiver no modo manual e em voo
        if (this.manualControl && 
            (this.gameState.flight.status === 'flying' || 
             this.gameState.flight.status === 'launching')) {
            
            // Controle de throttle (SHIFT aumenta, CTRL diminui)
            if (this.keys['shift']) {
                this.gameState.flight.throttle = Math.min(100, this.gameState.flight.throttle + this.throttleChangeRate * deltaTime);
            }
            
            if (this.keys['control']) {
                this.gameState.flight.throttle = Math.max(0, this.gameState.flight.throttle - this.throttleChangeRate * deltaTime);
            }
            
            // Controle direcional
            // Pitch (W/S)
            if (this.keys['w']) {
                this.gameState.flight.pitch = Math.min(1, this.gameState.flight.pitch + this.rotationSpeed * deltaTime);
            } else if (this.keys['s']) {
                this.gameState.flight.pitch = Math.max(-1, this.gameState.flight.pitch - this.rotationSpeed * deltaTime);
            } else {
                // Retorno gradual para neutro
                this.gameState.flight.pitch *= 0.95;
            }
            
            // Yaw (A/D)
            if (this.keys['a']) {
                this.gameState.flight.yaw = Math.min(1, this.gameState.flight.yaw + this.rotationSpeed * deltaTime);
            } else if (this.keys['d']) {
                this.gameState.flight.yaw = Math.max(-1, this.gameState.flight.yaw - this.rotationSpeed * deltaTime);
            } else {
                // Retorno gradual para neutro
                this.gameState.flight.yaw *= 0.95;
            }
            
            // Roll (Q/E)
            if (this.keys['q']) {
                this.gameState.flight.roll = Math.min(1, this.gameState.flight.roll + this.rotationSpeed * deltaTime);
            } else if (this.keys['e']) {
                this.gameState.flight.roll = Math.max(-1, this.gameState.flight.roll - this.rotationSpeed * deltaTime);
            } else {
                // Retorno gradual para neutro
                this.gameState.flight.roll *= 0.95;
            }
        }
    }
    
    dispose() {
        // Remover listeners de eventos
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
} 