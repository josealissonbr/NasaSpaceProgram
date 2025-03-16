export class LoadingScene {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.camera = sceneManager.camera;
        this.scene = new THREE.Scene();
        
        // Estado de carregamento
        this.loadingProgress = 0;
        
        // Elemento da tela de carregamento
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.querySelector('.progress');
    }
    
    load(params = {}) {
        // Configurar a câmera
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Criar uma cena de carregamento simples
        this.createLoadingScene();
        
        // Iniciar o carregamento de recursos
        this.startLoading();
    }
    
    createLoadingScene() {
        // Adicionar fundo sólido
        this.scene.background = new THREE.Color(0x0a0a2a);
        
        // Adicionar texto 3D ou logo (simplificado para este exemplo)
        const geometry = new THREE.TorusKnotGeometry(2, 0.5, 100, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x4287f5,
            wireframe: true
        });
        
        this.loadingModel = new THREE.Mesh(geometry, material);
        this.scene.add(this.loadingModel);
        
        // Iluminação básica
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
    }
    
    startLoading() {
        // Garantir que a tela de carregamento esteja visível
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
        }
        
        // Simular carregamento progressivo
        this.simulateLoading();
    }
    
    simulateLoading() {
        // Em um jogo real, isso seria substituído pelo carregamento real dos ativos
        const loadingInterval = setInterval(() => {
            this.loadingProgress += 0.05;
            
            if (this.progressBar) {
                this.progressBar.style.width = `${this.loadingProgress * 100}%`;
            }
            
            // Quando o carregamento estiver completo
            if (this.loadingProgress >= 1) {
                clearInterval(loadingInterval);
                this.onLoadingComplete();
            }
        }, 100);
    }
    
    onLoadingComplete() {
        // Transição para o menu principal após um pequeno atraso
        setTimeout(() => {
            this.sceneManager.loadScene('mainMenu');
        }, 500);
    }
    
    update() {
        // Animar o modelo de carregamento
        if (this.loadingModel) {
            this.loadingModel.rotation.x += 0.01;
            this.loadingModel.rotation.y += 0.02;
        }
    }
    
    unload() {
        // Limpar a cena
        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            this.scene.remove(object);
        }
    }
} 