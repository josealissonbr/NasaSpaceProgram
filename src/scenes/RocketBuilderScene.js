export class RocketBuilderScene {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.camera = sceneManager.camera;
        this.scene = new THREE.Scene();
        
        // Elementos da UI
        this.builderUI = null;
        
        // Controles da câmera
        this.controls = null;
        
        // Foguete que está sendo construído
        this.rocketParts = [];
        this.currentRocket = {
            name: 'Novo Foguete',
            parts: []
        };
        
        // Raycaster para seleção
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Peça atualmente selecionada
        this.selectedPart = null;
        
        // Plano de construção
        this.buildPlane = null;
    }
    
    load(params = {}) {
        // Configurar a câmera para a cena de construção
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Inicializar controles de órbita para a câmera
        if (typeof THREE.OrbitControls === 'function') {
            this.controls = new THREE.OrbitControls(this.camera, this.sceneManager.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.1;
            this.controls.screenSpacePanning = true;
        } else {
            console.error('OrbitControls não está disponível! Verifique se o script foi carregado corretamente.');
            // Placeholder simples para evitar erros
            this.controls = {
                update: () => {},
                dispose: () => {}
            };
        }
        
        // Criar a cena de construção
        this.createBuildingArea();
        
        // Criar a interface do construtor
        this.createBuilderUI();
        
        // Configurar eventos de mouse para seleção de peças
        this.setupControls();
    }
    
    createBuildingArea() {
        // Adicionar um skybox simples
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
        
        // Adicionar uma grid para melhor percepção de profundidade
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        this.scene.add(gridHelper);
        
        // Adicionar um plano para colidir com o raycaster
        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            visible: false 
        });
        this.buildPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.buildPlane.rotation.x = -Math.PI / 2;
        this.buildPlane.position.y = 0;
        this.scene.add(this.buildPlane);
        
        // Adicionar luzes
        const ambientLight = new THREE.AmbientLight(0x666666);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }
    
    createBuilderUI() {
        // Criar o elemento UI do constructor
        this.builderUI = document.createElement('div');
        this.builderUI.id = 'rocket-builder';
        this.builderUI.className = 'builder-ui';
        this.builderUI.style.position = 'absolute';
        this.builderUI.style.top = '0';
        this.builderUI.style.right = '0';
        this.builderUI.style.width = '300px';
        this.builderUI.style.height = '100%';
        this.builderUI.style.backgroundColor = 'rgba(20, 20, 40, 0.8)';
        this.builderUI.style.padding = '20px';
        this.builderUI.style.color = 'white';
        this.builderUI.style.overflow = 'auto';
        
        // Título
        const title = document.createElement('h2');
        title.textContent = 'Construtor de Foguetes';
        title.style.marginBottom = '20px';
        this.builderUI.appendChild(title);
        
        // Input para nome do foguete
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Nome do Foguete:';
        nameLabel.style.display = 'block';
        nameLabel.style.marginBottom = '5px';
        this.builderUI.appendChild(nameLabel);
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = this.currentRocket.name;
        nameInput.style.width = '100%';
        nameInput.style.marginBottom = '20px';
        nameInput.style.padding = '5px';
        nameInput.style.backgroundColor = '#333';
        nameInput.style.border = '1px solid #555';
        nameInput.style.color = 'white';
        nameInput.addEventListener('change', (e) => {
            this.currentRocket.name = e.target.value;
        });
        this.builderUI.appendChild(nameInput);
        
        // Abas para tipos de peças
        const partTypes = ['Cápsulas', 'Motores', 'Tanques de Combustível', 'Acessórios'];
        
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container';
        tabsContainer.style.display = 'flex';
        tabsContainer.style.marginBottom = '10px';
        
        partTypes.forEach(type => {
            const tab = document.createElement('div');
            tab.textContent = type;
            tab.className = 'part-tab';
            tab.style.padding = '8px';
            tab.style.backgroundColor = '#2d5dc2';
            tab.style.marginRight = '5px';
            tab.style.cursor = 'pointer';
            tab.style.borderRadius = '5px 5px 0 0';
            tab.style.fontSize = '0.9rem';
            tab.addEventListener('click', () => {
                this.showPartCategory(type);
                
                // Destacar aba selecionada
                document.querySelectorAll('.part-tab').forEach(t => {
                    t.style.backgroundColor = '#2d5dc2';
                });
                tab.style.backgroundColor = '#4287f5';
            });
            tabsContainer.appendChild(tab);
        });
        
        this.builderUI.appendChild(tabsContainer);
        
        // Contêiner para peças
        const partsContainer = document.createElement('div');
        partsContainer.id = 'parts-container';
        partsContainer.style.backgroundColor = '#1a1a2e';
        partsContainer.style.padding = '10px';
        partsContainer.style.borderRadius = '0 5px 5px 5px';
        partsContainer.style.marginBottom = '20px';
        partsContainer.style.minHeight = '200px';
        this.builderUI.appendChild(partsContainer);
        
        // Informações da peça selecionada
        const selectionInfo = document.createElement('div');
        selectionInfo.id = 'selection-info';
        selectionInfo.style.backgroundColor = '#1a1a2e';
        selectionInfo.style.padding = '10px';
        selectionInfo.style.borderRadius = '5px';
        selectionInfo.style.marginBottom = '20px';
        selectionInfo.innerHTML = '<h3>Nenhuma peça selecionada</h3>';
        this.builderUI.appendChild(selectionInfo);
        
        // Botões de ação
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.gap = '10px';
        
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Salvar Foguete';
        saveButton.className = 'menu-btn';
        saveButton.addEventListener('click', () => this.saveRocket());
        buttonContainer.appendChild(saveButton);
        
        const launchButton = document.createElement('button');
        launchButton.textContent = 'Lançar Foguete';
        launchButton.className = 'menu-btn';
        launchButton.addEventListener('click', () => this.launchRocket());
        buttonContainer.appendChild(launchButton);
        
        const backButton = document.createElement('button');
        backButton.textContent = 'Voltar ao Menu';
        backButton.className = 'menu-btn';
        backButton.style.backgroundColor = '#555';
        backButton.addEventListener('click', () => this.goBackToMenu());
        buttonContainer.appendChild(backButton);
        
        this.builderUI.appendChild(buttonContainer);
        
        document.body.appendChild(this.builderUI);
        
        // Mostrar a primeira categoria por padrão
        this.showPartCategory(partTypes[0]);
    }
    
    showPartCategory(category) {
        const partsContainer = document.getElementById('parts-container');
        partsContainer.innerHTML = '';
        
        // Implementar listas de peças para cada categoria
        let parts = [];
        
        switch(category) {
            case 'Cápsulas':
                parts = [
                    { id: 'capsule1', name: 'Cápsula Básica', mass: 1200, crew: 1 },
                    { id: 'capsule2', name: 'Cápsula Avançada', mass: 2500, crew: 3 }
                ];
                break;
            case 'Motores':
                parts = [
                    { id: 'engine1', name: 'Motor Básico', mass: 800, thrust: 1500 },
                    { id: 'engine2', name: 'Motor Médio', mass: 1200, thrust: 2800 },
                    { id: 'engine3', name: 'Motor Avançado', mass: 1800, thrust: 4200 }
                ];
                break;
            case 'Tanques de Combustível':
                parts = [
                    { id: 'tank1', name: 'Tanque Pequeno', mass: 400, fuel: 800 },
                    { id: 'tank2', name: 'Tanque Médio', mass: 800, fuel: 1600 },
                    { id: 'tank3', name: 'Tanque Grande', mass: 1200, fuel: 2800 }
                ];
                break;
            case 'Acessórios':
                parts = [
                    { id: 'parachute', name: 'Paraquedas', mass: 100 },
                    { id: 'decoupler', name: 'Separador', mass: 50 },
                    { id: 'solar', name: 'Painel Solar', mass: 200 }
                ];
                break;
        }
        
        parts.forEach(part => {
            const partElement = document.createElement('div');
            partElement.className = 'part-item';
            partElement.style.backgroundColor = '#2d2d4a';
            partElement.style.margin = '5px 0';
            partElement.style.padding = '10px';
            partElement.style.borderRadius = '5px';
            partElement.style.cursor = 'pointer';
            partElement.style.transition = 'background-color 0.2s';
            
            partElement.innerHTML = `
                <div>${part.name}</div>
                <div style="font-size: 0.8rem; color: #aaa;">Massa: ${part.mass} kg</div>
            `;
            
            partElement.addEventListener('click', () => {
                this.addPartToRocket(part);
            });
            
            partElement.addEventListener('mouseover', () => {
                partElement.style.backgroundColor = '#3d3d5a';
            });
            
            partElement.addEventListener('mouseout', () => {
                partElement.style.backgroundColor = '#2d2d4a';
            });
            
            partsContainer.appendChild(partElement);
        });
    }
    
    addPartToRocket(partData) {
        // Aqui deveria carregar o modelo 3D correspondente
        // Por enquanto, vamos usar formas básicas
        let geometry, material, part;
        
        if (partData.id.includes('capsule')) {
            geometry = new THREE.ConeGeometry(1, 2, 16);
            material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            part = new THREE.Mesh(geometry, material);
            part.position.y = 1;
        } else if (partData.id.includes('engine')) {
            geometry = new THREE.CylinderGeometry(0.7, 1, 1.5, 16);
            material = new THREE.MeshStandardMaterial({ color: 0x333333 });
            part = new THREE.Mesh(geometry, material);
            part.position.y = 0.75;
        } else if (partData.id.includes('tank')) {
            geometry = new THREE.CylinderGeometry(1, 1, 3, 16);
            material = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
            part = new THREE.Mesh(geometry, material);
            part.position.y = 1.5;
        } else {
            geometry = new THREE.BoxGeometry(1, 0.5, 1);
            material = new THREE.MeshStandardMaterial({ color: 0x888888 });
            part = new THREE.Mesh(geometry, material);
            part.position.y = 0.25;
        }
        
        // Adicionar dados extras à parte
        part.userData = {
            ...partData,
            isRocketPart: true
        };
        
        // Calcular posição com base nas partes existentes
        if (this.rocketParts.length > 0) {
            const lastPart = this.rocketParts[this.rocketParts.length - 1];
            const lastPartHeight = lastPart.geometry.parameters.height || 1;
            const newPartHeight = part.geometry.parameters.height || 1;
            
            part.position.y = lastPart.position.y + (lastPartHeight / 2) + (newPartHeight / 2);
        }
        
        this.rocketParts.push(part);
        this.scene.add(part);
        
        // Atualizar o objeto de dados do foguete
        this.currentRocket.parts.push({
            id: partData.id,
            type: partData.id.includes('capsule') ? 'capsule' : 
                  partData.id.includes('engine') ? 'engine' :
                  partData.id.includes('tank') ? 'tank' : 'accessory',
            name: partData.name,
            position: { x: part.position.x, y: part.position.y, z: part.position.z }
        });
        
        // Selecionar a peça adicionada
        this.selectPart(part);
    }
    
    selectPart(part) {
        // Remover highlight da peça anterior
        if (this.selectedPart) {
            this.selectedPart.material.emissive.setHex(0x000000);
        }
        
        // Destacar a nova peça selecionada
        this.selectedPart = part;
        if (this.selectedPart) {
            this.selectedPart.material.emissive.setHex(0x112233);
            
            // Atualizar informações da seleção
            const selectionInfo = document.getElementById('selection-info');
            selectionInfo.innerHTML = `
                <h3>${part.userData.name}</h3>
                <p>Massa: ${part.userData.mass} kg</p>
                ${part.userData.thrust ? `<p>Empuxo: ${part.userData.thrust} kN</p>` : ''}
                ${part.userData.fuel ? `<p>Combustível: ${part.userData.fuel} unidades</p>` : ''}
                ${part.userData.crew ? `<p>Tripulação: ${part.userData.crew}</p>` : ''}
                <button id="remove-part" style="background-color: #aa3333; padding: 5px 10px; border: none; color: white; margin-top: 10px; cursor: pointer;">Remover Peça</button>
            `;
            
            // Adicionar evento para o botão de remoção
            document.getElementById('remove-part').addEventListener('click', () => {
                this.removePart(part);
            });
        }
    }
    
    removePart(part) {
        // Encontrar o índice da peça
        const partIndex = this.rocketParts.indexOf(part);
        if (partIndex !== -1) {
            // Remover a peça da cena e do array
            this.scene.remove(part);
            this.rocketParts.splice(partIndex, 1);
            this.currentRocket.parts.splice(partIndex, 1);
            
            // Reposicionar as peças seguintes
            for (let i = partIndex; i < this.rocketParts.length; i++) {
                const currentPart = this.rocketParts[i];
                const previousPart = i > 0 ? this.rocketParts[i - 1] : null;
                
                if (previousPart) {
                    const previousPartHeight = previousPart.geometry.parameters.height || 1;
                    const currentPartHeight = currentPart.geometry.parameters.height || 1;
                    
                    currentPart.position.y = previousPart.position.y + (previousPartHeight / 2) + (currentPartHeight / 2);
                } else {
                    // Se não houver peça anterior, posicionar na base
                    currentPart.position.y = (currentPart.geometry.parameters.height || 1) / 2;
                }
                
                // Atualizar posição nos dados do foguete
                this.currentRocket.parts[i].position = {
                    x: currentPart.position.x,
                    y: currentPart.position.y,
                    z: currentPart.position.z
                };
            }
            
            // Limpar seleção
            this.selectedPart = null;
            const selectionInfo = document.getElementById('selection-info');
            selectionInfo.innerHTML = '<h3>Nenhuma peça selecionada</h3>';
        }
    }
    
    setupControls() {
        // Adicionar gerenciador de eventos para selecionar peças com o raycaster
        window.game.inputManager.on('mousedown', (event) => {
            if (event.button === 0) { // Botão esquerdo
                this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                
                this.raycaster.setFromCamera(this.mouse, this.camera);
                
                const intersects = this.raycaster.intersectObjects(this.rocketParts);
                
                if (intersects.length > 0) {
                    this.selectPart(intersects[0].object);
                } else {
                    // Desselecionar se clicar fora
                    if (this.selectedPart) {
                        this.selectedPart.material.emissive.setHex(0x000000);
                        this.selectedPart = null;
                        
                        const selectionInfo = document.getElementById('selection-info');
                        selectionInfo.innerHTML = '<h3>Nenhuma peça selecionada</h3>';
                    }
                }
            }
        });
    }
    
    update() {
        // Atualizar controles da câmera
        if (this.controls) {
            this.controls.update();
        }
    }
    
    unload() {
        // Desativar controles de órbita
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Remover UI de construtor
        if (this.builderUI && this.builderUI.parentNode) {
            this.builderUI.parentNode.removeChild(this.builderUI);
        }
        
        // Limpar a cena
        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            this.scene.remove(object);
        }
        
        // Resetar arrays
        this.rocketParts = [];
    }
    
    saveRocket() {
        console.log('Foguete salvo:', this.currentRocket);
        // Aqui implementaríamos a lógica para salvar o foguete
        
        alert(`Foguete "${this.currentRocket.name}" salvo com sucesso!`);
    }
    
    launchRocket() {
        // Verificar se o foguete tem pelo menos um motor e uma cápsula
        const hasEngine = this.currentRocket.parts.some(part => part.type === 'engine');
        const hasCapsule = this.currentRocket.parts.some(part => part.type === 'capsule');
        
        if (!hasEngine || !hasCapsule) {
            alert('Seu foguete precisa ter pelo menos uma cápsula e um motor para lançamento!');
            return;
        }
        
        // Transferir os dados do foguete para a cena de lançamento
        this.sceneManager.loadScene('launch', { rocket: this.currentRocket });
    }
    
    goBackToMenu() {
        // Perguntar se deseja salvar antes de sair
        if (this.rocketParts.length > 0) {
            if (confirm('Deseja salvar seu foguete antes de sair?')) {
                this.saveRocket();
            }
        }
        
        this.sceneManager.loadScene('mainMenu');
    }
} 