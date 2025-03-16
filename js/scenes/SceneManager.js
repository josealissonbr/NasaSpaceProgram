import { THREE } from '../utils/ThreeImports.js';
import { RocketBuilderScene } from './builder/RocketBuilderScene.js';
import { LaunchScene } from './launch/LaunchScene.js';
import { SpaceScene } from './space/SpaceScene.js';

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
            // Criar instâncias das cenas
            console.log('Criando cenas...');
            
            // Cena do construtor de foguetes
            this.scenes.builder = new RocketBuilderScene(this.gameState, this.assetLoader);
            console.log('Cena do construtor de foguetes criada:', 
                this.scenes.builder ? 'Sucesso' : 'Falha');
            
            // Cena de lançamento
            this.scenes.launch = new LaunchScene(this.gameState, this.assetLoader);
            console.log('Cena de lançamento criada:', 
                this.scenes.launch ? 'Sucesso' : 'Falha', 
                this.scenes.launch.scene ? 'Cena OK' : 'Sem cena',
                this.scenes.launch.camera ? 'Câmera OK' : 'Sem câmera');
            
            // Cena espacial
            this.scenes.space = new SpaceScene(this.gameState, this.assetLoader);
            console.log('Cena espacial criada:', 
                this.scenes.space ? 'Sucesso' : 'Falha');
            
            console.log('Cenas criadas com sucesso');
            
            // Adicionar elementos do renderer às cenas
            this.attachRenderer();
        } catch (error) {
            console.error('Erro ao criar cenas:', error);
        }
    }
    
    attachRenderer() {
        try {
            // Determinar o elemento DOM correto
            let targetElementId = null;
            let targetElement = null;
            
            // Verificar se o GameState existe
            if (!this.gameState) {
                console.error('GameState não inicializado ao anexar renderer');
                return;
            }
            
            // Obter o estado atual
            const currentState = this.gameState.currentState;
            console.log(`Anexando renderer para o estado: ${currentState}`);
            
            // Determinar o elemento alvo com base no estado
            if (currentState === this.gameState.STATES.ROCKET_BUILDER) {
                targetElementId = 'builder-canvas';
            } else if (currentState === this.gameState.STATES.LAUNCH_SIMULATION || 
                      currentState === this.gameState.STATES.SPACE_EXPLORATION) {
                targetElementId = 'simulation-canvas';
            } else if (currentState === this.gameState.STATES.LOADING || 
                      currentState === this.gameState.STATES.MAIN_MENU) {
                // Não é necessário anexar o renderer para estes estados
                console.log(`Não é necessário anexar renderer para o estado: ${currentState}`);
                return;
            } else {
                console.error(`Estado desconhecido ao anexar renderer: ${currentState}`);
                // Tentar usar o elemento do construtor como fallback
                targetElementId = 'builder-canvas';
            }
            
            console.log(`Tentando anexar renderer ao elemento: ${targetElementId}`);
            
            // Obter elemento
            targetElement = document.getElementById(targetElementId);
            
            // Verificar se o elemento existe
            if (!targetElement) {
                console.error(`Elemento DOM alvo não encontrado: ${targetElementId}`);
                
                // Tentar criar o elemento se não existir
                const parentElement = document.querySelector('#rocket-builder, #launch-simulation');
                if (parentElement) {
                    console.log(`Tentando criar elemento ${targetElementId} em ${parentElement.id}`);
                    targetElement = document.createElement('div');
                    targetElement.id = targetElementId;
                    targetElement.style.width = '100%';
                    targetElement.style.height = '100%';
                    parentElement.appendChild(targetElement);
                } else {
                    // Listar todos os elementos canvas disponíveis
                    const canvasElements = document.querySelectorAll('canvas, #builder-canvas, #simulation-canvas');
                    console.log('Elementos canvas encontrados:', Array.from(canvasElements).map(el => el.id || 'sem id'));
                    return;
                }
            }
            
            // Remover qualquer conteúdo anterior
            while (targetElement.firstChild) {
                targetElement.removeChild(targetElement.firstChild);
            }
            
            // Garantir que o elemento esteja visível
            targetElement.style.display = 'block';
            
            // Verificar se o renderer existe
            if (!this.renderer) {
                console.error('Renderer não inicializado ao tentar anexá-lo');
                return;
            }
            
            // Anexar o canvas do renderer
            targetElement.appendChild(this.renderer.domElement);
            console.log(`Renderer anexado com sucesso ao elemento: ${targetElementId}`);
            
            // Verificar estilo e visibilidade
            const computedStyle = window.getComputedStyle(targetElement);
            console.log(`Visibilidade do elemento: display=${computedStyle.display}, visibility=${computedStyle.visibility}, opacity=${computedStyle.opacity}`);
        } catch (error) {
            console.error('Erro ao anexar renderer:', error);
            console.error('Stack trace:', error.stack);
        }
    }
    
    getCurrentScene() {
        // Retornar a cena apropriada baseada no estado atual do jogo
        if (!this.gameState) {
            console.error('GameState não inicializado');
            return null;
        }
        
        const state = this.gameState.currentState;
        console.log(`Obtendo cena atual. Estado: ${state}`);
        
        // Verificar se o estado é válido
        if (!state) {
            console.error('Estado atual é nulo ou indefinido');
            console.log('Estados conhecidos:', Object.values(this.gameState.STATES));
            return null;
        }
        
        // Verificar se as cenas existem
        if (!this.scenes) {
            console.error('Cenas não inicializadas');
            return null;
        }
        
        // Depuração de cenas disponíveis
        console.log(`Cenas disponíveis: ${Object.keys(this.scenes).join(', ')}`);
        console.log(`Builder: ${this.scenes.builder ? 'OK' : 'Ausente'}, Launch: ${this.scenes.launch ? 'OK' : 'Ausente'}, Space: ${this.scenes.space ? 'OK' : 'Ausente'}`);
        
        // Tratar estados especiais
        if (state === this.gameState.STATES.LOADING || state === this.gameState.STATES.MAIN_MENU) {
            console.log(`Estado ${state} não requer cena ativa. Usando cena do construtor como fallback.`);
            
            // Nos estados de loading e menu principal, podemos retornar a cena do construtor como fallback
            // ou null se preferir não renderizar nada
            return this.scenes.builder;
        }
        
        if (state === this.gameState.STATES.ROCKET_BUILDER) {
            if (!this.scenes.builder) {
                console.error('Cena do construtor de foguetes não encontrada');
                return null;
            }
            return this.scenes.builder;
        } else if (state === this.gameState.STATES.LAUNCH_SIMULATION) {
            if (!this.scenes.launch) {
                console.error('Cena de lançamento não encontrada');
                return null;
            }
            return this.scenes.launch;
        } else if (state === this.gameState.STATES.SPACE_EXPLORATION) {
            if (!this.scenes.space) {
                console.error('Cena espacial não encontrada');
                return null;
            }
            return this.scenes.space;
        }
        
        console.error(`Estado desconhecido: ${state}`);
        console.log('Estados conhecidos:', Object.values(this.gameState.STATES));
        return null;
    }
    
    update(deltaTime) {
        // Verificar inicialização do renderer
        if (!this.renderer) {
            console.error('Renderer não inicializado no método update');
            return;
        }
        
        // Verificar se estamos em um estado que não requer renderização
        if (this.gameState && this.gameState.currentState) {
            const currentState = this.gameState.currentState;
            
            // Log de estado para depuração (a cada segundo aproximadamente)
            if (!this._lastUpdateLogTime || Date.now() - this._lastUpdateLogTime > 1000) {
                console.log(`Update executando. Estado: ${currentState}`);
                this._lastUpdateLogTime = Date.now();
            }
            
            // Verificar se é um estado como LOADING que não precisa de renderização
            if (currentState === this.gameState.STATES.LOADING) {
                // Não renderizar nada durante o carregamento
                return;
            }
        }
        
        // Obter a cena atual
        const currentScene = this.getCurrentScene();
        
        if (!currentScene) {
            // Se não houver cena atual mas estivermos no menu principal, não é um erro
            if (this.gameState && this.gameState.currentState === this.gameState.STATES.MAIN_MENU) {
                // No menu principal, podemos ter um fundo estático ou nenhuma cena 3D
                return;
            }
            
            console.error('Cena atual não encontrada no método update');
            if (this.gameState) {
                console.log(`Estado atual: ${this.gameState.currentState}`);
            }
            return;
        }
        
        try {
            // Atualizar a cena atual
            if (typeof currentScene.update === 'function') {
                currentScene.update(deltaTime);
            } else {
                console.error(`Método update não encontrado na cena ${this.gameState.currentState}`);
                console.log('Métodos disponíveis:', Object.getOwnPropertyNames(Object.getPrototypeOf(currentScene)));
            }
            
            // Verificar se a cena e câmera estão disponíveis para renderização
            if (!currentScene.scene) {
                console.error(`Propriedade scene não encontrada na cena ${this.gameState.currentState}`);
                return;
            }
            
            if (!currentScene.camera) {
                console.error(`Propriedade camera não encontrada na cena ${this.gameState.currentState}`);
                return;
            }
            
            // Renderizar a cena
            console.log(`Renderizando cena: ${this.gameState.currentState}. Camera em (${currentScene.camera.position.x.toFixed(1)}, ${currentScene.camera.position.y.toFixed(1)}, ${currentScene.camera.position.z.toFixed(1)})`);
            this.renderer.render(currentScene.scene, currentScene.camera);
            
            // Verificar transição para o espaço
            if (this.gameState && this.gameState.isState && 
                this.gameState.isState(this.gameState.STATES.LAUNCH_SIMULATION) && 
                this.gameState.checkSpaceReached && 
                this.gameState.flight && this.gameState.flight.altitude &&
                this.gameState.checkSpaceReached(this.gameState.flight.altitude)) {
                
                console.log('Altitude suficiente atingida. Iniciando transição para o espaço...');
                this.transitionToSpace();
            }
        } catch (error) {
            console.error('Erro ao atualizar/renderizar cena:', error);
            console.error('Stack trace:', error.stack);
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
        console.log('Iniciando preparação da simulação de lançamento...');
        
        // Verificar cenas necessárias
        if (!this.scenes) {
            console.error('Objeto scenes não inicializado');
            return;
        }
        
        if (!this.scenes.launch) {
            console.error('Cena de lançamento não encontrada');
            return;
        }
        
        if (!this.scenes.builder) {
            console.error('Cena do construtor não encontrada');
            return;
        }
        
        // Verificar estado do jogo
        if (!this.gameState) {
            console.error('GameState não inicializado');
            return;
        }
        
        try {
            // Parar qualquer renderização anterior
            this.stopRendering();
            console.log('Renderização anterior parada');
            
            // Definir o estado para simulação de lançamento
            const stateSuccess = this.gameState.setState(this.gameState.STATES.LAUNCH_SIMULATION);
            console.log(`Estado definido para LAUNCH_SIMULATION: ${stateSuccess ? 'Sucesso' : 'Falha'}`);
            console.log(`Estado atual: ${this.gameState.currentState}`);
            
            // Transferir dados do foguete para cena de lançamento
            const rocketConfig = this.scenes.builder.getRocketConfiguration();
            console.log('Configuração do foguete obtida:', rocketConfig ? 'Sucesso' : 'Falha');
            
            this.scenes.launch.setupLaunch(rocketConfig);
            console.log('Configuração de lançamento concluída');
            
            // Atualizar estado do voo
            if (typeof this.gameState.resetFlight === 'function') {
                this.gameState.resetFlight();
                console.log('Estado de voo resetado');
            } else {
                console.error('Método resetFlight não encontrado no GameState');
            }
            
            // Anexar renderer novamente
            this.attachRenderer();
            console.log('Renderer anexado para simulação de lançamento');
            
            // Iniciar renderização
            this.startRendering();
            console.log('Loop de renderização iniciado');
            
            // Iniciar o lançamento do foguete
            console.log('Chamando método startLaunch na cena de lançamento...');
            if (typeof this.scenes.launch.startLaunch === 'function') {
                this.scenes.launch.startLaunch();
                console.log('Método startLaunch chamado com sucesso');
            } else {
                console.error('Método startLaunch não encontrado na cena de lançamento');
            }
            
            console.log('Simulação de lançamento inicializada com sucesso');
        } catch (error) {
            console.error('Erro ao iniciar simulação de lançamento:', error);
            console.error('Stack trace:', error.stack);
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