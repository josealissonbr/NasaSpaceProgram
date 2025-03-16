import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
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
        
        // Inicializar o renderer
        this.initRenderer();
        
        // Criar cenas
        this.createScenes();
        
        // Ajustar ao tamanho da janela
        this.onWindowResize();
    }
    
    initRenderer() {
        // Criar o renderer Three.js
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }
    
    createScenes() {
        // Inicializar cenas
        this.scenes.builder = new RocketBuilderScene(this.gameState, this.assetLoader);
        this.scenes.launch = new LaunchScene(this.gameState, this.assetLoader);
        this.scenes.space = new SpaceScene(this.gameState, this.assetLoader);
        
        // Adicionar elementos do renderer às cenas
        this.attachRenderer();
    }
    
    attachRenderer() {
        // Adicionar canvas do rocket builder à DOM
        const builderCanvas = document.getElementById('builder-canvas');
        if (builderCanvas) {
            builderCanvas.appendChild(this.renderer.domElement.cloneNode(true));
        }
        
        // Adicionar canvas da simulação de lançamento à DOM
        const simulationCanvas = document.getElementById('simulation-canvas');
        if (simulationCanvas) {
            simulationCanvas.appendChild(this.renderer.domElement.cloneNode(true));
        }
    }
    
    getCurrentScene() {
        // Retornar a cena apropriada baseada no estado atual do jogo
        const state = this.gameState.currentState;
        
        if (state === this.gameState.STATES.ROCKET_BUILDER) {
            return this.scenes.builder;
        } else if (state === this.gameState.STATES.LAUNCH_SIMULATION || 
                  state === this.gameState.STATES.SPACE_EXPLORATION) {
            return this.isInSpace() ? this.scenes.space : this.scenes.launch;
        }
        
        return null;
    }
    
    isInSpace() {
        // Verificar se o foguete atingiu o espaço
        return this.gameState.flight.reachedSpace;
    }
    
    update(deltaTime) {
        const currentScene = this.getCurrentScene();
        
        if (!currentScene) {
            return;
        }
        
        // Atualizar a cena atual
        currentScene.update(deltaTime);
        
        // Renderizar a cena
        this.renderer.render(currentScene.scene, currentScene.camera);
        
        // Verificar transição para o espaço
        if (this.gameState.isState(this.gameState.STATES.LAUNCH_SIMULATION) && 
            this.gameState.checkSpaceReached(this.gameState.flight.altitude)) {
            this.transitionToSpace();
        }
    }
    
    transitionToSpace() {
        // Transição do estado do jogo
        this.gameState.setState(this.gameState.STATES.SPACE_EXPLORATION);
        
        // Transferir dados do foguete da cena de lançamento para a cena espacial
        const rocketData = this.scenes.launch.getRocketData();
        this.scenes.space.setRocketData(rocketData);
        
        // Inicializar a cena espacial
        this.scenes.space.initializeSpace();
    }
    
    onWindowResize() {
        // Atualizar tamanho do renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Atualizar dimensões das câmeras em todas as cenas
        for (const sceneName in this.scenes) {
            const scene = this.scenes[sceneName];
            if (scene && scene.camera) {
                if (scene.camera instanceof THREE.PerspectiveCamera) {
                    scene.camera.aspect = window.innerWidth / window.innerHeight;
                    scene.camera.updateProjectionMatrix();
                }
            }
        }
    }
    
    // Métodos para as diferentes cenas
    
    // Construtor de foguetes
    showRocketBuilder() {
        this.scenes.builder.setupBuilder();
        this.renderer.setAnimationLoop(() => this.update());
    }
    
    // Simulação de lançamento
    startLaunchSimulation() {
        // Transferir dados do foguete para cena de lançamento
        const rocketConfig = this.scenes.builder.getRocketConfiguration();
        this.scenes.launch.setupLaunch(rocketConfig);
        
        // Atualizar estado do jogo
        this.gameState.resetFlight();
        
        // Iniciar a simulação
        this.renderer.setAnimationLoop(() => this.update());
    }
    
    // Abortar lançamento
    abortLaunch() {
        this.scenes.launch.abortLaunch();
        this.gameState.flight.status = 'aborted';
    }
    
    // Limpar todas as cenas
    dispose() {
        // Parar o loop de animação
        this.renderer.setAnimationLoop(null);
        
        // Limpar cenas
        for (const sceneName in this.scenes) {
            const scene = this.scenes[sceneName];
            if (scene && typeof scene.dispose === 'function') {
                scene.dispose();
            }
        }
    }
} 