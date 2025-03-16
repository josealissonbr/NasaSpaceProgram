import { THREE } from '../utils/ThreeImports.js';
import { RocketBuilderScene } from './RocketBuilderScene.js';
import { LaunchScene } from './LaunchScene.js';
import { SpaceScene } from './SpaceScene.js';

export class SceneManager {
    constructor(gameState, assetLoader) {
        this.gameState = gameState;
        this.assetLoader = assetLoader;
        
        // Cenas do jogo
        this.scenes = {
            builder: null,
            launch: null,
            space: null
        };
        
        // Armazenar elementos DOM
        this.domElements = {
            builderCanvas: document.getElementById('builder-canvas'),
            simulationCanvas: document.getElementById('simulation-canvas')
        };
        
        // Inicializar o renderer
        this.initRenderer();
        
        // Criar cenas
        this.createScenes();
        
        // Ajustar ao tamanho da janela
        this.onWindowResize();
        
        // Definir estado inicial como não renderizando
        this.isRendering = false;
        
        // Adicionar evento de redimensionamento
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    initRenderer() {
        try {
            // Criar o renderer Three.js
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true
            });
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            console.log('Renderer Three.js inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar renderer Three.js:', error);
        }
    }
    
    createScenes() {
        try {
            // Inicializar cenas
            this.scenes.builder = new RocketBuilderScene(this.gameState, this.assetLoader);
            this.scenes.launch = new LaunchScene(this.gameState, this.assetLoader);
            this.scenes.space = new SpaceScene(this.gameState, this.assetLoader);
            
            console.log('Cenas criadas com sucesso');
            
            // Adicionar elementos do renderer às cenas
            this.attachRenderer();
        } catch (error) {
            console.error('Erro ao criar cenas:', error);
        }
    }
    
    attachRenderer() {
        if (!this.renderer) {
            console.error('Renderer não inicializado');
            return;
        }
        
        try {
            // Determinar qual elemento DOM usar com base no estado atual
            let targetElement = null;
            
            if (this.gameState && this.gameState.currentState) {
                if (this.gameState.currentState === this.gameState.STATES.ROCKET_BUILDER) {
                    targetElement = this.domElements.builderCanvas;
                } else if (this.gameState.currentState === this.gameState.STATES.LAUNCH_SIMULATION ||
                          this.gameState.currentState === this.gameState.STATES.SPACE_EXPLORATION) {
                    targetElement = this.domElements.simulationCanvas;
                }
            }
            
            // Usar elemento padrão se não conseguir determinar
            if (!targetElement) {
                console.warn('Não foi possível determinar o elemento DOM alvo. Usando o elemento do construtor de foguetes.');
                targetElement = this.domElements.builderCanvas;
            }
            
            // Limpar canvas existentes
            if (targetElement) {
                // Remover qualquer conteúdo anterior
                while (targetElement.firstChild) {
                    targetElement.removeChild(targetElement.firstChild);
                }
                
                // Anexar o canvas do renderer
                targetElement.appendChild(this.renderer.domElement);
                console.log(`Renderer anexado ao elemento: ${targetElement.id}`);
            } else {
                console.error('Elemento DOM alvo não encontrado');
            }
        } catch (error) {
            console.error('Erro ao anexar renderer:', error);
        }
    }
    
    getCurrentScene() {
        // Retornar a cena apropriada baseada no estado atual do jogo
        if (!this.gameState) {
            console.error('GameState não inicializado');
            return null;
        }
        
        const state = this.gameState.currentState;
        
        if (state === this.gameState.STATES.ROCKET_BUILDER) {
            return this.scenes.builder;
        } else if (state === this.gameState.STATES.LAUNCH_SIMULATION) {
            return this.scenes.launch;
        } else if (state === this.gameState.STATES.SPACE_EXPLORATION) {
            return this.scenes.space;
        }
        
        return null;
    }
    
    update(deltaTime) {
        if (!this.renderer) {
            console.error('Renderer não inicializado');
            return;
        }
        
        const currentScene = this.getCurrentScene();
        
        if (!currentScene) {
            return;
        }
        
        try {
            // Atualizar a cena atual
            if (typeof currentScene.update === 'function') {
                currentScene.update(deltaTime);
            }
            
            // Renderizar a cena
            if (currentScene.scene && currentScene.camera) {
                this.renderer.render(currentScene.scene, currentScene.camera);
            } else {
                console.warn('Cena ou câmera não definidas para renderização');
            }
            
            // Verificar transição para o espaço
            if (this.gameState.isState && 
                this.gameState.isState(this.gameState.STATES.LAUNCH_SIMULATION) && 
                this.gameState.checkSpaceReached && 
                this.gameState.checkSpaceReached(this.gameState.flight.altitude)) {
                this.transitionToSpace();
            }
        } catch (error) {
            console.error('Erro ao atualizar/renderizar cena:', error);
        }
    }
    
    startRendering() {
        if (this.isRendering) {
            return;
        }
        
        this.isRendering = true;
        this.renderer.setAnimationLoop(() => this.update());
        console.log('Loop de renderização iniciado');
    }
    
    stopRendering() {
        this.isRendering = false;
        this.renderer.setAnimationLoop(null);
        console.log('Loop de renderização parado');
    }
    
    transitionToSpace() {
        if (!this.scenes.launch || !this.scenes.space) {
            console.error('Cenas necessárias não inicializadas');
            return;
        }
        
        // Transição do estado do jogo
        this.gameState.setState(this.gameState.STATES.SPACE_EXPLORATION);
        
        try {
            // Transferir dados do foguete da cena de lançamento para a cena espacial
            const rocketData = this.scenes.launch.getRocketData();
            this.scenes.space.setRocketData(rocketData);
            
            // Inicializar a cena espacial
            this.scenes.space.initializeSpace();
            
            console.log('Transição para o espaço concluída');
        } catch (error) {
            console.error('Erro durante transição para o espaço:', error);
        }
    }
    
    onWindowResize() {
        if (!this.renderer) {
            return;
        }
        
        // Obter dimensões da janela
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Atualizar tamanho do renderer
        this.renderer.setSize(width, height);
        
        // Atualizar dimensões das câmeras em todas as cenas
        for (const sceneName in this.scenes) {
            const scene = this.scenes[sceneName];
            if (scene && typeof scene.onWindowResize === 'function') {
                scene.onWindowResize(width, height);
            } else if (scene && scene.camera) {
                if (scene.camera instanceof THREE.PerspectiveCamera) {
                    scene.camera.aspect = width / height;
                    scene.camera.updateProjectionMatrix();
                }
            }
        }
        
        console.log('Dimensões da janela atualizadas:', width, height);
    }
    
    // Métodos para as diferentes cenas
    
    // Construtor de foguetes
    showRocketBuilder() {
        // Verificar se a cena do construtor de foguetes existe
        if (!this.scenes || !this.scenes.builder) {
            console.error('Cena do construtor de foguetes não encontrada');
            return;
        }
        
        try {
            // Parar qualquer renderização anterior
            this.stopRendering();
            
            // Configurar cena
            this.scenes.builder.setupBuilder();
            
            // Anexar renderer novamente
            this.attachRenderer();
            
            // Iniciar renderização
            this.startRendering();
            
            console.log('Cena de construção de foguete inicializada');
        } catch (error) {
            console.error('Erro ao mostrar construtor de foguetes:', error);
        }
    }
    
    // Simulação de lançamento
    startLaunchSimulation() {
        if (!this.scenes || !this.scenes.launch || !this.scenes.builder) {
            console.error('Cenas necessárias não encontradas');
            return;
        }
        
        try {
            // Parar qualquer renderização anterior
            this.stopRendering();
            
            // Transferir dados do foguete para cena de lançamento
            const rocketConfig = this.scenes.builder.getRocketConfiguration();
            this.scenes.launch.setupLaunch(rocketConfig);
            
            // Atualizar estado do jogo
            if (this.gameState.resetFlight) {
                this.gameState.resetFlight();
            }
            
            // Anexar renderer novamente
            this.attachRenderer();
            
            // Iniciar renderização
            this.startRendering();
            
            // Iniciar o lançamento do foguete
            console.log('Iniciando o lançamento do foguete');
            this.scenes.launch.startLaunch();
            
            console.log('Simulação de lançamento inicializada');
        } catch (error) {
            console.error('Erro ao iniciar simulação de lançamento:', error);
        }
    }
    
    // Abortar lançamento
    abortLaunch() {
        if (!this.scenes || !this.scenes.launch) {
            console.error('Cena de lançamento não encontrada');
            return;
        }
        
        try {
            this.scenes.launch.abortLaunch();
            this.gameState.flight.status = 'aborted';
            console.log('Lançamento abortado');
        } catch (error) {
            console.error('Erro ao abortar lançamento:', error);
        }
    }
    
    // Limpar todas as cenas
    dispose() {
        // Parar o loop de animação
        this.stopRendering();
        
        // Limpar cenas
        for (const sceneName in this.scenes) {
            const scene = this.scenes[sceneName];
            if (scene && typeof scene.dispose === 'function') {
                try {
                    scene.dispose();
                } catch (error) {
                    console.error(`Erro ao dispor cena ${sceneName}:`, error);
                }
            }
        }
        
        // Remover eventos
        window.removeEventListener('resize', this.onWindowResize);
        
        console.log('Recursos do SceneManager liberados');
    }
} 