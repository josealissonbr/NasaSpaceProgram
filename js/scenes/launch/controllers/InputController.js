export class InputController {
    constructor(gameState) {
        this.gameState = gameState;
        this.keys = {};
        this.throttleChangeRate = 50; // Aumentado para resposta mais rápida
        this.rotationSpeed = 1.5; // Aumentado para controle mais responsivo
        this.manualControl = false;
        this.lastThrottleUpdate = 0;
        
        // Inicializar controles
        this.initControls();
        
        // Criar barra de progresso vertical
        this.createThrottleBar();
    }
    
    createThrottleBar() {
        // Remover barra existente se houver
        const existingBar = document.getElementById('throttle-bar-container');
        if (existingBar) {
            existingBar.remove();
        }
        
        // Criar container da barra
        const container = document.createElement('div');
        container.id = 'throttle-bar-container';
        container.style.cssText = `
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 30px;
            height: 200px;
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid #444;
            border-radius: 15px;
            padding: 5px;
        `;
        
        // Criar a barra de progresso
        const bar = document.createElement('div');
        bar.id = 'throttle-bar';
        bar.style.cssText = `
            position: absolute;
            bottom: 5px;
            left: 5px;
            width: 20px;
            background: linear-gradient(to top, #ff3300, #ffcc00);
            border-radius: 10px;
            transition: height 0.1s ease-out;
        `;
        
        // Adicionar label
        const label = document.createElement('div');
        label.id = 'throttle-label';
        label.style.cssText = `
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-family: Arial, sans-serif;
            font-size: 12px;
            text-shadow: 1px 1px 2px black;
        `;
        
        container.appendChild(bar);
        container.appendChild(label);
        document.body.appendChild(container);
    }
    
    updateThrottleBar() {
        const bar = document.getElementById('throttle-bar');
        const label = document.getElementById('throttle-label');
        if (bar && label) {
            const height = (this.gameState.flight.throttle / 100) * 190; // 190px é a altura máxima da barra
            bar.style.height = `${height}px`;
            label.textContent = `Throttle: ${Math.round(this.gameState.flight.throttle)}%`;
        }
    }
    
    initControls() {
        // Registrar eventos de teclado
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Definir estado inicial de voo
        if (this.gameState.flight) {
            this.gameState.flight.throttle = 0; // Throttle inicial em 0%
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
            this.startLaunch();
        }
        
        // Evitar o comportamento padrão para as teclas de controle
        if (['w', 'a', 's', 'd', 'q', 'e', 'shift', 'control'].includes(event.key.toLowerCase())) {
            event.preventDefault();
        }
    }
    
    startLaunch() {
        this.manualControl = true;
        this.gameState.flight.status = 'launching';
        console.log('Preparando para lançamento - Controle manual ativado!');
        
        // Efeito sonoro de contagem regressiva (se disponível)
        if (window.soundManager && window.soundManager.playSound) {
            window.soundManager.playSound('countdown');
        }
        
        // Iniciar contagem regressiva de 5 segundos
        this.gameState.flight.missionTime = -5;
        
        // Mostrar contagem regressiva na tela
        this.showCountdown(5);
        
        // Quando a contagem terminar, mudar para status flying
        setTimeout(() => {
            if (this.gameState.flight.status === 'launching') {
                this.gameState.flight.status = 'flying';
                this.gameState.flight.missionTime = 0;
                console.log('Lançamento iniciado! Use SHIFT/CTRL para controlar throttle, WASD para direção, Q/E para rotação');
                
                // Efeito sonoro de lançamento (se disponível)
                if (window.soundManager && window.soundManager.playSound) {
                    window.soundManager.playSound('launch');
                }
            }
        }, 5000);
    }
    
    showCountdown(seconds) {
        // Remover contador existente se houver
        const existingCounter = document.getElementById('launch-countdown');
        if (existingCounter) {
            existingCounter.remove();
        }
        
        // Criar elemento de contagem regressiva
        const counter = document.createElement('div');
        counter.id = 'launch-countdown';
        counter.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            font-family: Arial, sans-serif;
            z-index: 1000;
        `;
        document.body.appendChild(counter);
        
        // Atualizar contagem
        const updateCount = (remaining) => {
            if (remaining >= 0) {
                counter.textContent = remaining;
                if (remaining > 0) {
                    setTimeout(() => updateCount(remaining - 1), 1000);
                } else {
                    counter.textContent = 'LANÇAR!';
                    setTimeout(() => counter.remove(), 1000);
                }
            }
        };
        
        updateCount(seconds);
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
                this.updateThrottleBar();
            }
            
            if (this.keys['control']) {
                this.gameState.flight.throttle = Math.max(0, this.gameState.flight.throttle - this.throttleChangeRate * deltaTime);
                this.updateThrottleBar();
            }
            
            // Controle direcional com amortecimento
            const dampingFactor = 0.98; // Fator de amortecimento para movimento mais suave
            
            // Pitch (W/S)
            if (this.keys['w']) {
                this.gameState.flight.pitch = Math.min(1, this.gameState.flight.pitch + this.rotationSpeed * deltaTime);
            } else if (this.keys['s']) {
                this.gameState.flight.pitch = Math.max(-1, this.gameState.flight.pitch - this.rotationSpeed * deltaTime);
            } else {
                this.gameState.flight.pitch *= dampingFactor;
            }
            
            // Yaw (A/D)
            if (this.keys['a']) {
                this.gameState.flight.yaw = Math.min(1, this.gameState.flight.yaw + this.rotationSpeed * deltaTime);
            } else if (this.keys['d']) {
                this.gameState.flight.yaw = Math.max(-1, this.gameState.flight.yaw - this.rotationSpeed * deltaTime);
            } else {
                this.gameState.flight.yaw *= dampingFactor;
            }
            
            // Roll (Q/E)
            if (this.keys['q']) {
                this.gameState.flight.roll = Math.min(1, this.gameState.flight.roll + this.rotationSpeed * deltaTime);
            } else if (this.keys['e']) {
                this.gameState.flight.roll = Math.max(-1, this.gameState.flight.roll - this.rotationSpeed * deltaTime);
            } else {
                this.gameState.flight.roll *= dampingFactor;
            }
        }
    }
    
    dispose() {
        // Remover listeners de eventos
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        // Remover elementos visuais
        const throttleBar = document.getElementById('throttle-bar-container');
        if (throttleBar) {
            throttleBar.remove();
        }
        
        const countdown = document.getElementById('launch-countdown');
        if (countdown) {
            countdown.remove();
        }
    }
} 