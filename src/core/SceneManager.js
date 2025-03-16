import { LoadingScene } from '../scenes/LoadingScene.js';
import { MainMenuScene } from '../scenes/MainMenuScene.js';
import { RocketBuilderScene } from '../scenes/RocketBuilderScene.js';
import { LaunchScene } from '../scenes/LaunchScene.js';

export class SceneManager {
    constructor(container) {
        this.container = container;
        this.currentScene = null;
        this.scenes = {};
        
        // Configuração do renderer e câmera principal
        this.setupRenderer();
        this.setupCamera();
        
        // Registrar as cenas
        this.registerScenes();
        
        // Configurar o loop de renderização
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
        
        // Lidar com redimensionamento da janela
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            10000
        );
    }
    
    registerScenes() {
        this.scenes = {
            'loading': new LoadingScene(this),
            'mainMenu': new MainMenuScene(this),
            'rocketBuilder': new RocketBuilderScene(this),
            'launch': new LaunchScene(this)
        };
    }
    
    loadScene(sceneName, params = {}) {
        // Limpar a cena atual se existir
        if (this.currentScene) {
            this.currentScene.unload();
        }
        
        // Carregar a nova cena
        this.currentScene = this.scenes[sceneName];
        if (this.currentScene) {
            this.currentScene.load(params);
            return true;
        }
        
        console.error(`Cena "${sceneName}" não encontrada!`);
        return false;
    }
    
    animate() {
        requestAnimationFrame(this.animate);
        
        // Atualizar a cena atual
        if (this.currentScene) {
            this.currentScene.update();
        }
        
        // Renderizar
        if (this.currentScene && this.currentScene.scene) {
            this.renderer.render(this.currentScene.scene, this.camera);
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Notificar a cena atual sobre o redimensionamento
        if (this.currentScene && this.currentScene.onResize) {
            this.currentScene.onResize();
        }
    }
} 