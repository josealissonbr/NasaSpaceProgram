import { AssetLoader } from './loaders/AssetLoader.js';
import { GameState } from './models/GameState.js';
import { SceneManager } from './scenes/SceneManager.js';
import { UIController } from './controllers/UIController.js';
import { Config } from './config/Config.js';
import { SoundManager } from './audio/SoundManager.js';

class Game {
    constructor() {
        this.config = new Config();
        this.gameState = new GameState();
        this.assetLoader = new AssetLoader();
        this.sceneManager = null;
        this.uiController = null;
        this.soundManager = new SoundManager();
        window.soundManager = this.soundManager;
        
        this.init();
    }
    
    async init() {
        // Mostrar a tela de carregamento
        document.getElementById('loader-container').classList.remove('hidden');
        
        try {
            // Carregar todos os assets necessários
            await this.assetLoader.loadAssets();
            
            // Inicializar o gerenciador de cenas
            this.sceneManager = new SceneManager(this.gameState, this.assetLoader);
            
            // Inicializar o controlador da UI
            this.uiController = new UIController(this.gameState, this.sceneManager);
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Esconder a tela de carregamento e mostrar o menu principal
            document.getElementById('loader-container').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
            
            // Iniciar o loop do jogo
            this.gameLoop();
        } catch (error) {
            console.error('Erro ao inicializar o jogo:', error);
        }
    }
    
    setupEventListeners() {
        // Botões do menu principal
        document.getElementById('start-button').addEventListener('click', () => {
            this.uiController.showRocketBuilder();
        });
        
        document.getElementById('options-button').addEventListener('click', () => {
            // Implementar opções posteriormente
            console.log('Opções ainda não implementadas');
        });
        
        document.getElementById('credits-button').addEventListener('click', () => {
            // Implementar créditos posteriormente
            console.log('Créditos ainda não implementados');
        });
        
        // Botões do construtor de foguetes
        document.getElementById('launch-button').addEventListener('click', () => {
            this.uiController.startLaunch();
        });
        
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.uiController.showMainMenu();
        });
        
        // Botões da simulação de lançamento
        document.getElementById('abort-launch').addEventListener('click', () => {
            this.uiController.abortLaunch();
        });
        
        // Eventos de redimensionamento da janela
        window.addEventListener('resize', () => {
            this.sceneManager.onWindowResize();
        });
    }
    
    gameLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            try {
                // Obter o tempo delta
                if (!this.gameState || !this.gameState.clock) {
                    console.error('GameState ou clock não inicializado');
                    return;
                }
                
                const delta = this.gameState.clock.getDelta();
                
                // Verificar o estado atual
                if (this.gameState.currentState) {
                    // Remover logs de estado que são gerados a cada segundo
                    // if (!this._lastLogTime || Date.now() - this._lastLogTime > 1000) {
                    //     console.log(`Game loop executando. Estado: ${this.gameState.currentState}`);
                    //     this._lastLogTime = Date.now();
                    // }
                } else {
                    console.error('Estado do jogo não definido');
                }
                
                // Atualizar as cenas ativas baseado no estado do jogo
                if (this.sceneManager) {
                    this.sceneManager.update(delta);
                } else {
                    console.error('SceneManager não inicializado');
                }
                
                // Atualizar a UI se necessário
                if (this.uiController) {
                    this.uiController.update();
                } else {
                    console.error('UIController não inicializado');
                }
            } catch (error) {
                console.error('Erro no game loop:', error);
                console.error('Stack trace:', error.stack);
            }
        };
        
        animate();
    }
}

// Iniciar o jogo quando a página for carregada
window.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 