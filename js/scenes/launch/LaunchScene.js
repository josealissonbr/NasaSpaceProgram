import { THREE } from '../../utils/ThreeImports.js';
import { PhysicsEngine } from '../../physics/PhysicsEngine.js';
import { RocketFactory } from '../../components/RocketFactory.js';

// Importar componentes
import { LaunchStructure } from './components/LaunchStructure.js';
import { GroundEnvironment } from './components/GroundEnvironment.js';
import { ExplosionEffect } from './components/ExplosionEffect.js';

// Importar controladores
import { CameraController } from './controllers/CameraController.js';
import { EngineController } from './controllers/EngineController.js';

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
        
        // Inicializar controladores
        this.cameraController = new CameraController(this.gameState);
        this.camera = this.cameraController.setupCamera();
        
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
        
        // Adicionar o foguete ao grupo
        this.rocketGroup.add(this.rocket);
        
        // Posicionar foguete na plataforma de lançamento
        this.rocket.position.set(0, 0.25, 0);
        
        // Localizar partes de motor do foguete para efeitos
        this.engineController.findEngines(this.rocket);
        
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
    }
    
    resetRocket() {
        // Remover foguete atual
        if (this.rocket) {
            this.rocketGroup.remove(this.rocket);
            this.rocket = null;
        }
    }
    
    startLaunch() {
        // Atualizar estado do jogo
        this.gameState.flight.status = 'launching';
        
        // Definir tempo de missão para -5 (contagem regressiva de 5 segundos)
        this.gameState.flight.missionTime = -LAUNCH_CONSTANTS.COUNTDOWN_TIME;
        
        console.log(`Iniciando contagem regressiva de ${LAUNCH_CONSTANTS.COUNTDOWN_TIME} segundos...`);
        
        // Inicia a contagem regressiva
        setTimeout(() => {
            // Atualizar estado
            this.gameState.flight.status = 'flying';
            
            // Ativar motores
            this.engineController.activateEngines();
            
            // Esconder estrutura de lançamento
            this.launchStructure.hide(this.scene, this.animations.tweens);
            
            console.log('Contagem regressiva concluída! Foguete iniciando voo...');
        }, LAUNCH_CONSTANTS.COUNTDOWN_TIME * 1000);
    }
    
    abortLaunch() {
        if (this.gameState.flight.status === 'pre-launch' || 
            this.gameState.flight.status === 'launching') {
            // Apenas mudar o estado se ainda não decolou
            this.gameState.flight.status = 'aborted';
            
            // Desativar motores
            this.engineController.deactivateEngines();
        } else if (this.gameState.flight.status === 'flying') {
            // Se já estiver voando, criar uma explosão/falha
            this.createExplosion();
            
            // Mudar estado
            this.gameState.flight.status = 'crashed';
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

        // Atualizar tempo decorrido
        this.elapsedTime += deltaTime;
        
        // Calcular tempo desde a última atualização
        const timeSinceLastUpdate = this.elapsedTime - this.lastUpdateTime;
        this.lastUpdateTime = this.elapsedTime;
        
        // Log de depuração a cada segundo
        if (Math.floor(this.elapsedTime) > Math.floor(this.elapsedTime - deltaTime)) {
            console.log(`Simulação: t=${this.elapsedTime.toFixed(1)}s, status=${this.gameState.flight.status}`);
        }
        
        // Atualizar a simulação física se o foguete estiver em voo
        if (this.gameState.flight.status === 'flying' && this.rocket) {
            // Simular física
            const newState = this.physics.simulateStep(deltaTime);
            
            // Atualizar posição do foguete na cena
            this.rocket.position.y = LaunchHelpers.altitudeToPosition(newState.altitude);
            
            // Se estiver acima da plataforma de lançamento, adicionar movimento lateral
            if (newState.altitude > LAUNCH_CONSTANTS.LATERAL_MOVEMENT_START) {
                this.rocket.position.x = Math.sin(this.elapsedTime * LAUNCH_CONSTANTS.CAMERA_ORBITAL_SPEED) * 
                                         LAUNCH_CONSTANTS.LATERAL_MOVEMENT_FACTOR;
                this.rocket.position.z = Math.cos(this.elapsedTime * LAUNCH_CONSTANTS.CAMERA_ORBITAL_SPEED) * 
                                         LAUNCH_CONSTANTS.LATERAL_MOVEMENT_FACTOR;
            }
            
            // Inclinar levemente o foguete na direção do movimento
            if (newState.altitude > LAUNCH_CONSTANTS.ORBIT_TILT_START) {
                // Começar a inclinar para atingir órbita
                const targetAngle = LaunchHelpers.calculateTiltAngle(newState.altitude);
                this.rocket.rotation.z = THREE.MathUtils.lerp(
                    this.rocket.rotation.z,
                    targetAngle,
                    LAUNCH_CONSTANTS.TILT_INTERPOLATION_SPEED
                );
            }
            
            // Atualizar contagem de tempo de missão
            this.gameState.flight.missionTime += deltaTime;
            
            // Checar se o foguete atingiu o espaço
            if (newState.altitude >= LAUNCH_CONSTANTS.SPACE_ALTITUDE) {
                // Espaço alcançado (linha de Kármán a 100km)
                this.gameState.checkSpaceReached(newState.altitude);
            }
        } else if (this.gameState.flight.status === 'launching' && this.rocket) {
            // Durante a contagem regressiva, apenas atualizar o tempo de missão com valores negativos
            this.gameState.flight.missionTime = Math.min(0, this.gameState.flight.missionTime - deltaTime);
        }
        
        // Atualizar efeitos dos motores
        this.engineController.updateEngines();
        
        // Atualizar câmera
        this.cameraController.updateCamera(this.rocket, this.elapsedTime);
        
        // Atualizar animações
        this.animations.updateTweens(deltaTime);
    }
    
    dispose() {
        // Limpar recursos
        this.resetRocket();
        
        // Limpar animações
        this.animations.resetTweens();
    }
} 