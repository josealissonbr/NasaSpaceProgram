import { THREE } from '../../utils/ThreeImports.js';
import { PhysicsEngine } from '../../physics/PhysicsEngine.js';
import { RocketFactory } from '../../components/RocketFactory.js';

// Importar componentes
import { LaunchStructure } from './components/LaunchStructure.js';
import { GroundEnvironment } from './components/GroundEnvironment.js';
import { ExplosionEffect } from './components/ExplosionEffect.js';
import { ThrottleDisplay } from './components/ThrottleDisplay.js';
import { ControlsDisplay } from './components/ControlsDisplay.js';

// Importar controladores
import { CameraController } from './controllers/CameraController.js';
import { EngineController } from './controllers/EngineController.js';
import { InputController } from './controllers/InputController.js';

// Importar animações
import { LaunchAnimations } from './animations/LaunchAnimations.js';

// Importar utilitários
import { LAUNCH_CONSTANTS, LaunchHelpers } from './utils/LaunchHelpers.js';

export class LaunchScene {
    constructor(gameState, assetLoader) {
        this.gameState = gameState;
        this.assetLoader = assetLoader;
        
        // Inicializar cena Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(LAUNCH_CONSTANTS.SKY_COLOR);
        
        // Inicializar componentes
        this.launchStructure = new LaunchStructure(this.assetLoader);
        this.groundEnvironment = new GroundEnvironment(this.assetLoader);
        this.explosionEffect = new ExplosionEffect(this.scene);
        this.throttleDisplay = new ThrottleDisplay('#telemetry');
        this.controlsDisplay = new ControlsDisplay('#telemetry');
        
        // Inicializar controladores
        this.cameraController = new CameraController(this.gameState);
        this.camera = this.cameraController.setupCamera();
        this.inputController = new InputController(this.gameState);
        
        // Motor de física
        this.physics = new PhysicsEngine(gameState);
        
        // Fábrica de foguetes
        this.rocketFactory = new RocketFactory(assetLoader);
        this.engineController = new EngineController(this.gameState, this.rocketFactory);
        
        // Animações
        this.animations = new LaunchAnimations();
        
        // Configurar iluminação
        this.setupLights();
        
        // Configurar ambiente de lançamento
        this.setupEnvironment();
        
        // Container do foguete na cena
        this.rocketGroup = new THREE.Group();
        this.scene.add(this.rocketGroup);
        
        // Referências a objetos importantes da cena
        this.rocket = null;
        this.launchPad = null;
        
        // Rastreamento de tempo
        this.elapsedTime = 0;
        this.lastUpdateTime = 0;
        
        // Configurar controles iniciais
        this.setupInitialControls();
    }
    
    setupInitialControls() {
        // Definir valores iniciais para os controles de voo
        if (this.gameState.flight) {
            this.gameState.flight.throttle = 50; // 50% de potência inicial
            this.gameState.flight.pitch = 0;
            this.gameState.flight.yaw = 0;
            this.gameState.flight.roll = 0;
        }
    }
    
    setupLights() {
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0x666666, 1);
        this.scene.add(ambientLight);
        
        // Luz solar direcional
        const sunLight = new THREE.DirectionalLight(0xFFFFCC, 1);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        
        // Configurar sombras
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        
        this.scene.add(sunLight);
        
        // Luz auxiliar para ver detalhes do foguete
        const fillLight = new THREE.DirectionalLight(0xCCCCFF, 0.4);
        fillLight.position.set(-10, 20, -10);
        this.scene.add(fillLight);
    }
    
    setupEnvironment() {
        // Criar ambiente com terreno, plataforma e skybox
        this.groundEnvironment.setupEnvironment(this.scene);
        this.launchPad = this.groundEnvironment.launchPad;
        
        // Criar estrutura de lançamento
        const structure = this.launchStructure.create();
        this.scene.add(structure);
    }
    
    setupLaunch(rocketConfig) {
        // Limpar qualquer foguete anterior
        this.resetRocket();
        
        // Inicializar array de tweens
        this.animations.resetTweens();
        
        // Construir o foguete da configuração
        this.rocket = this.rocketFactory.createRocket(rocketConfig);
        console.log('Foguete criado:', this.rocket ? 'Sucesso' : 'Falha');
        
        // Adicionar o foguete ao grupo
        this.rocketGroup.add(this.rocket);
        
        // Posicionar foguete na plataforma de lançamento
        this.rocket.position.set(0, 0.25, 0);
        
        // Localizar partes de motor do foguete para efeitos
        const engines = this.engineController.findEngines(this.rocket);
        console.log(`Encontrados ${engines.length} motores no foguete`);
        
        // Preparar simulação física
        this.physics.setupSimulation(rocketConfig);
        
        // Atualizar estado do jogo
        this.gameState.setState(this.gameState.STATES.LAUNCH_SIMULATION);
        this.gameState.flight.status = 'pre-launch';
        
        // Resetar tempo
        this.elapsedTime = 0;
        this.lastUpdateTime = 0;
        
        // Posicionar câmera para uma boa visualização do lançamento
        this.cameraController.resetCamera(this.rocket);
        
        // Mostrar controles e throttle
        this.controlsDisplay.show();
        this.controlsDisplay.updateStatus('pre-launch');
        this.throttleDisplay.show();
        this.throttleDisplay.update(this.gameState.flight.throttle);
        
        // Resetar configurações de controle
        this.setupInitialControls();
    }
    
    resetRocket() {
        // Remover foguete atual
        if (this.rocket) {
            this.rocketGroup.remove(this.rocket);
            this.rocket = null;
        }
    }
    
    startLaunch() {
        if (this.gameState.flight.status === 'pre-launch') {
            this.gameState.flight.status = 'launching';
            console.log('Preparando para lançamento - Contagem regressiva iniciada');
            
            // Iniciar contagem regressiva de 5 segundos
            this.gameState.flight.missionTime = -5;
            
            // Ativar modo de controle manual
            this.inputController.manualControl = true;
            
            // Quando a contagem terminar, mudar para status flying
            setTimeout(() => {
                if (this.gameState.flight.status === 'launching') {
                    this.gameState.flight.status = 'flying';
                    this.gameState.flight.missionTime = 0;
                    
                    // Ativar motores
                    this.engineController.activateEngines();
                    
                    // Esconder estrutura de lançamento
                    this.launchStructure.hide(this.scene, this.animations.tweens);
                    
                    console.log('Lançamento iniciado! Use SHIFT/CTRL para controlar throttle, WASD para direção, Q/E para rotação');
                }
            }, 5000);
            
            // Atualizar interface
            this.controlsDisplay.updateStatus('launching');
        }
    }
    
    abortLaunch() {
        if (this.gameState.flight.status === 'pre-launch' || 
            this.gameState.flight.status === 'launching') {
            // Apenas mudar o estado se ainda não decolou
            this.gameState.flight.status = 'aborted';
            
            // Desativar motores
            this.engineController.deactivateEngines();
            
            // Atualizar interface
            this.controlsDisplay.updateStatus('aborted');
        } else if (this.gameState.flight.status === 'flying') {
            // Se já estiver voando, criar uma explosão/falha
            this.createExplosion();
            
            // Mudar estado
            this.gameState.flight.status = 'crashed';
            
            // Atualizar interface
            this.controlsDisplay.updateStatus('crashed');
        }
    }
    
    createExplosion() {
        // Criar efeito de explosão na posição atual do foguete
        if (this.rocket) {
            this.explosionEffect.createExplosion(this.rocket.position, this.animations.tweens);
            
            // Esconder o foguete
            this.rocket.visible = false;
        }
    }
    
    getRocketData() {
        // Retornar dados do foguete para outras cenas
        return {
            position: this.rocket ? this.rocket.position.clone() : new THREE.Vector3(0, 0, 0),
            rotation: this.rocket ? this.rocket.rotation.clone() : new THREE.Euler(),
            velocity: this.physics.getCurrentVelocity(),
            config: this.gameState.rocket,
            engineParts: this.engineController.engineParts.map(engine => ({
                mesh: engine,
                active: this.gameState.flight.throttle > 0
            }))
        };
    }
    
    update(deltaTime) {
        // Verificar se deltaTime é válido
        if (!deltaTime || isNaN(deltaTime) || deltaTime <= 0) {
            deltaTime = 0.016; // Valor padrão (aproximadamente 60 FPS)
        }

        // Verificar se é a primeira atualização após inicialização e aplicar debug apenas uma vez
        if (this.elapsedTime === 0) {
            // Chamada de debug apenas na primeira vez - comentado para reduzir logs
            // this.debugScene();
        }

        // Atualizar tempo decorrido
        this.elapsedTime += deltaTime;
        
        // Calcular tempo desde a última atualização
        const timeSinceLastUpdate = this.elapsedTime - this.lastUpdateTime;
        this.lastUpdateTime = this.elapsedTime;
        
        // Log de depuração a cada segundo
        if (Math.floor(this.elapsedTime) > Math.floor(this.elapsedTime - deltaTime)) {
            console.log(`Simulação: t=${this.elapsedTime.toFixed(1)}s, status=${this.gameState.flight.status}`);
        }
        
        // Atualizar controlador de entrada
        this.inputController.update(deltaTime);
        
        // Atualizar a simulação física se o foguete estiver em voo
        if ((this.gameState.flight.status === 'flying' || 
             this.gameState.flight.status === 'launching') && this.rocket) {
            
            // Simular física
            const newState = this.physics.simulateStep(deltaTime);
            
            // Atualizar posição do foguete com base nos resultados da física
            this.updateRocketFromPhysics(newState);
            
            // Atualizar contagem de tempo de missão
            if (this.gameState.flight.status === 'flying') {
                this.gameState.flight.missionTime += deltaTime;
            } else if (this.gameState.flight.status === 'launching') {
                // Durante a contagem regressiva
                this.gameState.flight.missionTime = Math.min(0, this.gameState.flight.missionTime - deltaTime);
            }
            
            // Checar se o foguete atingiu o espaço
            if (newState.altitude >= LAUNCH_CONSTANTS.SPACE_ALTITUDE) {
                // Espaço alcançado (linha de Kármán a 100km)
                this.gameState.checkSpaceReached(newState.altitude);
                this.controlsDisplay.updateStatus('space');
            }
        }
        
        // Atualizar efeitos dos motores
        this.engineController.updateEngines();
        
        // Atualizar câmera
        this.cameraController.updateCamera(this.rocket, this.elapsedTime);
        
        // Atualizar animações
        this.animations.updateTweens(deltaTime);
        
        // Atualizar interface
        this.updateUI();
    }
    
    updateRocketFromPhysics(physicsState) {
        if (!this.rocket) return;
        
        // Atualizar posição vertical (altitude)
        this.rocket.position.y = LaunchHelpers.altitudeToPosition(physicsState.altitude);
        
        // Atualizar posição lateral
        this.rocket.position.x = physicsState.position.x * 0.01; // Escala para visualização
        this.rocket.position.z = physicsState.position.z * 0.01; // Escala para visualização
        
        // Atualizar rotação do foguete com base na orientação
        this.rocket.rotation.x = physicsState.orientation.pitch;
        this.rocket.rotation.y = physicsState.orientation.yaw;
        this.rocket.rotation.z = physicsState.orientation.roll;
    }
    
    updateUI() {
        // Atualizar displays
        this.throttleDisplay.update(this.gameState.flight.throttle);
        this.controlsDisplay.updateStatus(this.gameState.flight.status);
    }
    
    dispose() {
        // Limpar recursos
        this.resetRocket();
        
        // Limpar animações
        this.animations.resetTweens();
        
        // Remover displays de UI
        this.throttleDisplay.dispose();
        this.controlsDisplay.dispose();
        
        // Remover input controller
        this.inputController.dispose();
    }
    
    // Método de depuração para verificar a estrutura da cena
    debugScene() {
        // Método mantido, mas chamado apenas sob demanda, não automaticamente
        console.log('====== DEBUG DA CENA DE LANÇAMENTO ======');
        
        // Verificar a cena
        console.log('Scene:', this.scene ? 'OK' : 'AUSENTE');
        if (this.scene) {
            console.log(`Número de objetos na cena: ${this.scene.children.length}`);
            console.log('Objetos principais:');
            this.scene.children.forEach((child, index) => {
                console.log(`- Objeto ${index}: ${child.type}`, 
                    child.name ? `(${child.name})` : '',
                    `Visível: ${child.visible}`);
            });
        }
        
        // Verificar o foguete
        console.log('Foguete:', this.rocket ? 'CRIADO' : 'AUSENTE');
        if (this.rocket) {
            console.log(`Posição do foguete: x=${this.rocket.position.x.toFixed(2)}, y=${this.rocket.position.y.toFixed(2)}, z=${this.rocket.position.z.toFixed(2)}`);
            console.log(`Rotação do foguete: x=${this.rocket.rotation.x.toFixed(2)}, y=${this.rocket.rotation.y.toFixed(2)}, z=${this.rocket.rotation.z.toFixed(2)}`);
        }
        
        // Verificar a câmera
        console.log('Câmera:', this.camera ? 'OK' : 'AUSENTE');
        if (this.camera) {
            console.log(`Posição da câmera: x=${this.camera.position.x.toFixed(2)}, y=${this.camera.position.y.toFixed(2)}, z=${this.camera.position.z.toFixed(2)}`);
            console.log(`Rotação da câmera: x=${this.camera.rotation.x.toFixed(2)}, y=${this.camera.rotation.y.toFixed(2)}, z=${this.camera.rotation.z.toFixed(2)}`);
        }
        
        // Verificar outros componentes importantes
        console.log('Estrutura de lançamento:', this.launchStructure.structure ? 'CRIADA' : 'AUSENTE');
        console.log('Plataforma de lançamento:', this.launchPad ? 'CRIADA' : 'AUSENTE');
        console.log('Partes de motor encontradas:', this.engineController.engineParts.length);
        
        console.log('Estado do voo:', this.gameState.flight.status);
        console.log('====== FIM DO DEBUG DA CENA ======');
    }
} 