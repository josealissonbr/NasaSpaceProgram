import { AssetLoader } from '../utils/AssetLoader.js';
import { SceneManager } from './SceneManager.js';
import { InputManager } from '../utils/InputManager.js';
import { AudioManager } from '../utils/AudioManager.js';
import { PhysicsEngine } from '../physics/PhysicsEngine.js';

class Game {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.querySelector('.progress');
        this.loadingText = document.querySelector('.loading-text');
        this.gameContainer = document.getElementById('game-container');
        
        // Inicializa gerenciadores principais
        this.assetLoader = new AssetLoader();
        this.sceneManager = new SceneManager(this.gameContainer);
        this.inputManager = new InputManager();
        this.audioManager = new AudioManager();
        this.physicsEngine = new PhysicsEngine();
        
        this.init();
    }
    
    async init() {
        // Configurar eventos de entrada
        this.inputManager.initialize();
        
        // Carregar recursos
        this.loadAssets();
    }
    
    loadAssets() {
        const assetsToLoad = {
            models: [
                { name: 'rocketBase', path: 'src/assets/models/rocket_base.glb' },
                { name: 'engineModel', path: 'src/assets/models/engine.glb' },
                { name: 'fuelTank', path: 'src/assets/models/fuel_tank.glb' }
            ],
            textures: [
                { name: 'earthTexture', path: 'src/assets/textures/earth.jpg' },
                { name: 'skyboxTexture', path: 'src/assets/textures/space_skybox.jpg' }
            ],
            sounds: [
                { name: 'engineSound', path: 'src/assets/sounds/rocket_engine.mp3' },
                { name: 'uiClick', path: 'src/assets/sounds/click.mp3' }
            ]
        };
        
        this.assetLoader.loadAssets(assetsToLoad, this.updateProgress.bind(this), this.onAssetsLoaded.bind(this));
    }
    
    updateProgress(progress) {
        this.progressBar.style.width = `${progress * 100}%`;
        this.loadingText.textContent = `Carregando recursos... ${Math.floor(progress * 100)}%`;
    }
    
    onAssetsLoaded() {
        // Esconder tela de carregamento
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            
            // Iniciar o jogo com a cena do menu principal
            this.startGame();
        }, 1000);
    }
    
    startGame() {
        // Configurar e carregar cena do menu principal
        this.sceneManager.loadScene('mainMenu');
    }
}

// Iniciar o jogo quando a página terminar de carregar
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
}); 