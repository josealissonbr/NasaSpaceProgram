export class MainMenuScene {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.camera = sceneManager.camera;
        this.scene = new THREE.Scene();
        
        // Elementos da UI
        this.menuElement = null;
    }
    
    load(params = {}) {
        // Criar a cena 3D de fundo
        this.createBackground();
        
        // Criar a UI do menu
        this.createMenuUI();
        
        // Configurar controles
        this.setupControls();
    }
    
    createBackground() {
        // Adicionar um skybox
        const textureEquirec = window.game.assetLoader.getTexture('skyboxTexture');
        if (textureEquirec) {
            const skyboxGeometry = new THREE.SphereGeometry(500, 60, 40);
            const skyboxMaterial = new THREE.MeshBasicMaterial({
                map: textureEquirec,
                side: THREE.BackSide
            });
            const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
            this.scene.add(skybox);
        }
        
        // Adicionar a Terra como objeto 3D girando lentamente
        const earthTexture = window.game.assetLoader.getTexture('earthTexture');
        if (earthTexture) {
            const earthGeometry = new THREE.SphereGeometry(10, 32, 32);
            const earthMaterial = new THREE.MeshStandardMaterial({
                map: earthTexture,
                roughness: 0.5,
                metalness: 0
            });
            this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
            this.earth.position.set(0, 0, -30);
            this.scene.add(this.earth);
        }
        
        // Adicionar luzes
        const ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(10, 5, 5);
        this.scene.add(sunLight);
    }
    
    createMenuUI() {
        // Criar o elemento do menu no DOM
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'main-menu';
        this.menuElement.className = 'scene';
        
        const menuContainer = document.createElement('div');
        menuContainer.className = 'menu-container';
        
        // Título do jogo
        const title = document.createElement('h1');
        title.textContent = 'NASA Space Program';
        title.style.fontSize = '3rem';
        title.style.marginBottom = '2rem';
        menuContainer.appendChild(title);
        
        // Botões do menu
        const buttons = [
            { text: 'Nova Missão', action: () => this.startNewMission() },
            { text: 'Construir Foguete', action: () => this.buildRocket() },
            { text: 'Configurações', action: () => this.openSettings() },
            { text: 'Créditos', action: () => this.showCredits() }
        ];
        
        buttons.forEach(button => {
            const btnElement = document.createElement('button');
            btnElement.className = 'menu-btn';
            btnElement.textContent = button.text;
            btnElement.addEventListener('click', () => {
                // Tocar som de clique
                window.game.audioManager.playSound('uiClick');
                button.action();
            });
            menuContainer.appendChild(btnElement);
        });
        
        this.menuElement.appendChild(menuContainer);
        document.body.appendChild(this.menuElement);
        
        // Exibir o menu com transição
        setTimeout(() => {
            this.menuElement.style.display = 'flex';
        }, 100);
    }
    
    setupControls() {
        // Nada especial para controlar no menu,
        // mas poderia registrar teclas de atalho aqui
    }
    
    update() {
        // Animar a Terra girando
        if (this.earth) {
            this.earth.rotation.y += 0.001;
        }
    }
    
    unload() {
        // Remover a UI
        if (this.menuElement && this.menuElement.parentNode) {
            this.menuElement.parentNode.removeChild(this.menuElement);
        }
        
        // Limpar a cena
        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            this.scene.remove(object);
        }
    }
    
    startNewMission() {
        this.sceneManager.loadScene('launch');
    }
    
    buildRocket() {
        this.sceneManager.loadScene('rocketBuilder');
    }
    
    openSettings() {
        console.log('Abrir configurações');
        // Implementar lógica para configurações
    }
    
    showCredits() {
        console.log('Mostrar créditos');
        // Implementar lógica para créditos
    }
} 