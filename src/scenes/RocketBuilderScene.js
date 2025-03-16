// Removendo a importação do three.js pois ele já é carregado globalmente
// import * as THREE from 'three';
import { RocketPart } from '../components/RocketPart.js';
import { DragAndDrop } from '../components/DragAndDrop.js';
import { CameraController } from '../components/CameraController.js';
import { BuildUI } from '../components/BuildUI.js';

export class RocketBuilderScene {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.camera = sceneManager.camera;
        this.renderer = sceneManager.renderer;
        this.scene = new THREE.Scene();
        
        // Sistema de arrastar e soltar
        this.dragAndDrop = null;
        
        // Controlador de câmera
        this.cameraController = null;
        
        // Interface do construtor
        this.builderUI = null;
        
        // Catálogo de peças disponíveis (definido nas configs)
        this.partsCatalog = null;
        
        // Peças no cenário
        this.rocketParts = [];
        this.draggableObjects = [];
        
        // Foguete que está sendo construído
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
        
        // Gravidade (aceleração em m/s²)
        this.gravity = 9.81;
    }
    
    load(params = {}) {
        // Configurar a câmera para a cena de construção
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Inicializar o controlador de câmera personalizado
        this.cameraController = new CameraController(this.camera, this.renderer.domElement);
        this.cameraController.phi = Math.PI / 6; // 30 graus acima do horizonte
        this.cameraController.theta = -Math.PI / 4; // -45 graus (olhando para o canto)
        this.cameraController.distance = 15;
        this.cameraController.updateCameraPosition();
        
        // Carregar peças disponíveis
        this.loadPartsCatalog();
        
        // Criar a cena de construção
        this.createBuildingArea();
        
        // Inicializar o sistema de drag and drop
        this.dragAndDrop = new DragAndDrop(this.scene, this.camera, this.renderer);
        this.dragAndDrop.setDraggableObjects(this.draggableObjects);
        this.dragAndDrop.setRocketParts(this.rocketParts);
        
        // Criar a interface do construtor
        this.createBuilderUI();
        
        // Se houver um foguete em params, carregá-lo
        if (params.rocket) {
            this.loadRocket(params.rocket);
        }
    }
    
    loadPartsCatalog() {
        // Definir o catálogo de peças disponíveis
        this.partsCatalog = {
            capsules: [
                {
                    id: 'capsule1',
                    name: 'Cápsula Básica',
                    type: 'capsule',
                    model: 'capsule_basic',
                    mass: 1200,
                    crew: 1,
                    height: 1.8,
                    radius: 1.0,
                    snapPoints: {
                        bottom: {
                            position: new THREE.Vector3(0, -0.9, 0),
                            direction: new THREE.Vector3(0, -1, 0)
                        }
                    },
                    validConnections: {
                        bottom: ['tank']
                    }
                },
                {
                    id: 'capsule2',
                    name: 'Cápsula Avançada',
                    type: 'capsule',
                    model: 'capsule_advanced',
                    mass: 2500,
                    crew: 3,
                    height: 2.5,
                    radius: 1.5,
                    snapPoints: {
                        bottom: {
                            position: new THREE.Vector3(0, -1.25, 0),
                            direction: new THREE.Vector3(0, -1, 0)
                        }
                    },
                    validConnections: {
                        bottom: ['tank']
                    }
                }
            ],
            engines: [
                {
                    id: 'engine1',
                    name: 'Motor Básico',
                    type: 'engine',
                    model: 'engine_basic',
                    mass: 800,
                    thrust: 15000,
                    consumption: 5.0,
                    height: 1.5,
                    radius: 1.0,
                    snapPoints: {
                        top: {
                            position: new THREE.Vector3(0, 0.75, 0),
                            direction: new THREE.Vector3(0, 1, 0)
                        }
                    },
                    validConnections: {
                        top: ['tank']
                    }
                },
                {
                    id: 'engine2',
                    name: 'Motor Médio',
                    type: 'engine',
                    model: 'engine_medium',
                    mass: 1200,
                    thrust: 28000,
                    consumption: 8.5,
                    height: 2.0,
                    radius: 1.2,
                    snapPoints: {
                        top: {
                            position: new THREE.Vector3(0, 1.0, 0),
                            direction: new THREE.Vector3(0, 1, 0)
                        }
                    },
                    validConnections: {
                        top: ['tank']
                    }
                },
                {
                    id: 'engine3',
                    name: 'Motor Avançado',
                    type: 'engine',
                    model: 'engine_advanced',
                    mass: 1800,
                    thrust: 42000,
                    consumption: 12.0,
                    height: 2.5,
                    radius: 1.5,
                    snapPoints: {
                        top: {
                            position: new THREE.Vector3(0, 1.25, 0),
                            direction: new THREE.Vector3(0, 1, 0)
                        }
                    },
                    validConnections: {
                        top: ['tank']
                    }
                }
            ],
            tanks: [
                {
                    id: 'tank1',
                    name: 'Tanque Pequeno',
                    type: 'tank',
                    model: 'tank_small',
                    mass: 400,
                    fuel: 800,
                    height: 2.0,
                    radius: 1.0,
                    snapPoints: {
                        top: {
                            position: new THREE.Vector3(0, 1.0, 0),
                            direction: new THREE.Vector3(0, 1, 0)
                        },
                        bottom: {
                            position: new THREE.Vector3(0, -1.0, 0),
                            direction: new THREE.Vector3(0, -1, 0)
                        },
                        left: {
                            position: new THREE.Vector3(-1.0, 0, 0),
                            direction: new THREE.Vector3(-1, 0, 0)
                        },
                        right: {
                            position: new THREE.Vector3(1.0, 0, 0),
                            direction: new THREE.Vector3(1, 0, 0)
                        }
                    },
                    validConnections: {
                        top: ['capsule', 'tank'],
                        bottom: ['engine', 'tank'],
                        left: ['booster', 'wing'],
                        right: ['booster', 'wing']
                    }
                },
                {
                    id: 'tank2',
                    name: 'Tanque Médio',
                    type: 'tank',
                    model: 'tank_medium',
                    mass: 800,
                    fuel: 1600,
                    height: 3.0,
                    radius: 1.0,
                    snapPoints: {
                        top: {
                            position: new THREE.Vector3(0, 1.5, 0),
                            direction: new THREE.Vector3(0, 1, 0)
                        },
                        bottom: {
                            position: new THREE.Vector3(0, -1.5, 0),
                            direction: new THREE.Vector3(0, -1, 0)
                        },
                        left: {
                            position: new THREE.Vector3(-1.0, 0, 0),
                            direction: new THREE.Vector3(-1, 0, 0)
                        },
                        right: {
                            position: new THREE.Vector3(1.0, 0, 0),
                            direction: new THREE.Vector3(1, 0, 0)
                        }
                    },
                    validConnections: {
                        top: ['capsule', 'tank'],
                        bottom: ['engine', 'tank'],
                        left: ['booster', 'wing'],
                        right: ['booster', 'wing']
                    }
                },
                {
                    id: 'tank3',
                    name: 'Tanque Grande',
                    type: 'tank',
                    model: 'tank_large',
                    mass: 1200,
                    fuel: 2800,
                    height: 4.0,
                    radius: 1.2,
                    snapPoints: {
                        top: {
                            position: new THREE.Vector3(0, 2.0, 0),
                            direction: new THREE.Vector3(0, 1, 0)
                        },
                        bottom: {
                            position: new THREE.Vector3(0, -2.0, 0),
                            direction: new THREE.Vector3(0, -1, 0)
                        },
                        left: {
                            position: new THREE.Vector3(-1.2, 0, 0),
                            direction: new THREE.Vector3(-1, 0, 0)
                        },
                        right: {
                            position: new THREE.Vector3(1.2, 0, 0),
                            direction: new THREE.Vector3(1, 0, 0)
                        }
                    },
                    validConnections: {
                        top: ['capsule', 'tank'],
                        bottom: ['engine', 'tank'],
                        left: ['booster', 'wing'],
                        right: ['booster', 'wing']
                    }
                }
            ],
            boosters: [
                {
                    id: 'booster1',
                    name: 'Booster Pequeno',
                    type: 'booster',
                    model: 'booster_small',
                    mass: 600,
                    fuel: 1200,
                    thrust: 18000,
                    consumption: 6.0,
                    height: 3.5,
                    radius: 0.8,
                    snapPoints: {
                        attach: {
                            position: new THREE.Vector3(0, 0, 0),
                            direction: new THREE.Vector3(1, 0, 0)
                        }
                    },
                    validConnections: {
                        attach: ['tank']
                    }
                },
                {
                    id: 'booster2',
                    name: 'Booster Grande',
                    type: 'booster',
                    model: 'booster_large',
                    mass: 1000,
                    fuel: 2200,
                    thrust: 32000,
                    consumption: 10.0,
                    height: 5.0,
                    radius: 1.0,
                    snapPoints: {
                        attach: {
                            position: new THREE.Vector3(0, 0, 0),
                            direction: new THREE.Vector3(1, 0, 0)
                        }
                    },
                    validConnections: {
                        attach: ['tank']
                    }
                }
            ],
            wings: [
                {
                    id: 'wing1',
                    name: 'Asa Básica',
                    type: 'wing',
                    model: 'wing_basic',
                    mass: 200,
                    height: 0.5,
                    radius: 2.0,
                    snapPoints: {
                        attach: {
                            position: new THREE.Vector3(0, 0, 0),
                            direction: new THREE.Vector3(1, 0, 0)
                        }
                    },
                    validConnections: {
                        attach: ['tank']
                    }
                },
                {
                    id: 'wing2',
                    name: 'Asa Delta',
                    type: 'wing',
                    model: 'wing_delta',
                    mass: 350,
                    height: 0.6,
                    radius: 2.5,
                    snapPoints: {
                        attach: {
                            position: new THREE.Vector3(0, 0, 0),
                            direction: new THREE.Vector3(1, 0, 0)
                        }
                    },
                    validConnections: {
                        attach: ['tank']
                    }
                }
            ]
        };
    }
    
    createBuildingArea() {
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
        } else {
            // Skybox de fallback
            const skyColor = new THREE.Color(0x87ceeb);
            this.scene.background = skyColor;
        }
        
        // Adicionar uma grid para melhor percepção de profundidade
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        this.scene.add(gridHelper);
        
        // Adicionar um plano para colidir com o raycaster
        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x666666,
            transparent: true,
            opacity: 0.5
        });
        this.buildPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.buildPlane.rotation.x = -Math.PI / 2;
        this.buildPlane.position.y = 0;
        this.scene.add(this.buildPlane);
        
        // Adicionar o plano aos objetos arrastáveis (para poder arrastar no espaço vazio)
        this.draggableObjects.push(this.buildPlane);
        
        // Adicionar luzes
        const ambientLight = new THREE.AmbientLight(0x666666);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        
        // Configurar sombras
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -15;
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        
        this.scene.add(directionalLight);
        
        // Adicionar um indicador de origem
        const axesHelper = new THREE.AxesHelper(2);
        this.scene.add(axesHelper);
    }
    
    createBuilderUI() {
        // Obter ou criar o elemento container para a UI
        let container = document.getElementById('builder-ui');
        if (!container) {
            container = document.createElement('div');
            container.id = 'builder-ui';
            document.body.appendChild(container);
        }
        
        // Criar a interface do construtor
        this.builderUI = new BuildUI(container);
        
        // Registrar o catálogo de peças
        this.builderUI.registerPartsCatalog({
            capsules: this.partsCatalog.capsules,
            tanks: this.partsCatalog.tanks,
            engines: this.partsCatalog.engines,
            boosters: this.partsCatalog.boosters,
            wings: this.partsCatalog.wings
        });
        
        // Configurar callbacks
        this.builderUI.onPartSelected = (partData) => this.addPartToRocket(partData);
        this.builderUI.onSaveClicked = () => this.saveRocket();
        this.builderUI.onLaunchClicked = () => this.launchRocket();
        this.builderUI.onBackClicked = () => this.goBackToMenu();
        
        // Atualizar métricas iniciais
        this.updateRocketMetrics();
    }
    
    addPartToRocket(partData) {
        // Criar uma nova instância da peça
        const part = new RocketPart(partData);
        
        // Posicionar a peça em uma posição razoável
        // Começamos acima do plano de construção
        part.object3D.position.set(0, part.height / 2, 0);
        
        // Adicionar a peça à cena
        this.scene.add(part.object3D);
        
        // Adicionar aos arrays de rastreamento
        this.rocketParts.push(part);
        this.draggableObjects.push(part.object3D);
        
        // Atualizar os arrays do sistema de drag and drop
        this.dragAndDrop.setDraggableObjects(this.draggableObjects);
        this.dragAndDrop.setRocketParts(this.rocketParts);
        
        // Selecionar a nova peça
        this.selectPart(part);
        
        // Atualizar as métricas do foguete
        this.updateRocketMetrics();
        
        return part;
    }
    
    selectPart(part) {
        // Desativar o destaque da peça previamente selecionada
        if (this.selectedPart) {
            this.selectedPart.highlight(false);
        }
        
        // Definir a nova peça selecionada
        this.selectedPart = part;
        
        // Ativar o destaque da nova peça selecionada
        if (part) {
            part.highlight(true);
            
            // Atualizar as informações na UI
            this.builderUI.updateSelectedPart(part);
        } else {
            this.builderUI.updateSelectedPart(null);
        }
    }
    
    removePart(part) {
        if (!part) return;
        
        // Remover conexões
        part.disconnect();
        
        // Se esta peça tiver peças conectadas, removê-las também
        const attachedParts = [...part.attachedParts];
        for (const attachedPart of attachedParts) {
            this.removePart(attachedPart);
        }
        
        // Remover da cena
        this.scene.remove(part.object3D);
        
        // Remover dos arrays de rastreamento
        const partIndex = this.rocketParts.indexOf(part);
        if (partIndex !== -1) {
            this.rocketParts.splice(partIndex, 1);
        }
        
        const objectIndex = this.draggableObjects.indexOf(part.object3D);
        if (objectIndex !== -1) {
            this.draggableObjects.splice(objectIndex, 1);
        }
        
        // Atualizar os arrays no sistema de drag and drop
        this.dragAndDrop.setDraggableObjects(this.draggableObjects);
        this.dragAndDrop.setRocketParts(this.rocketParts);
        
        // Se a peça removida era a selecionada, limpar a seleção
        if (part === this.selectedPart) {
            this.selectPart(null);
        }
        
        // Atualizar as métricas do foguete
        this.updateRocketMetrics();
    }
    
    loadRocket(rocketData) {
        // Limpar o foguete atual
        this.clearRocket();
        
        // Definir o nome do foguete
        this.currentRocket.name = rocketData.name || 'Foguete Carregado';
        
        // Mapear os IDs das peças para objetos de peça
        const partMap = {};
        
        // Primeiro passo: criar todas as peças
        for (const partData of rocketData.parts) {
            // Encontrar a definição da peça no catálogo
            let partTemplate = null;
            for (const category of Object.values(this.partsCatalog)) {
                partTemplate = category.find(p => p.id === partData.partId);
                if (partTemplate) break;
            }
            
            if (partTemplate) {
                // Criar a peça
                const part = this.addPartToRocket(partTemplate);
                
                // Posicionar conforme os dados salvos
                if (partData.position) {
                    part.object3D.position.set(
                        partData.position.x,
                        partData.position.y,
                        partData.position.z
                    );
                }
                
                if (partData.rotation) {
                    part.object3D.rotation.set(
                        partData.rotation.x,
                        partData.rotation.y,
                        partData.rotation.z
                    );
                }
                
                // Salvar referência para o segundo passo
                partMap[partData.id] = part;
            }
        }
        
        // Segundo passo: estabelecer conexões
        for (const partData of rocketData.parts) {
            if (partData.connection && partMap[partData.id] && partMap[partData.connection.partId]) {
                const part = partMap[partData.id];
                const targetPart = partMap[partData.connection.partId];
                
                part.connectTo(
                    targetPart,
                    partData.connection.thisSnapKey,
                    partData.connection.otherSnapKey
                );
            }
        }
        
        // Atualizar métricas
        this.updateRocketMetrics();
    }
    
    clearRocket() {
        // Remover todas as peças
        while (this.rocketParts.length > 0) {
            this.removePart(this.rocketParts[0]);
        }
        
        // Limpar seleção
        this.selectPart(null);
        
        // Resetar o nome do foguete
        this.currentRocket.name = 'Novo Foguete';
    }
    
    updateRocketMetrics() {
        let totalMass = 0;
        let dryMass = 0;
        let fuelMass = 0;
        let totalThrust = 0;
        
        // Calcular métricas básicas
        for (const part of this.rocketParts) {
            totalMass += part.getTotalMass();
            dryMass += part.mass;
            fuelMass += part.fuel || 0;
            totalThrust += part.thrust || 0;
        }
        
        // Calcular TWR (Thrust to Weight Ratio)
        const weight = totalMass * this.gravity; // Peso = massa * gravidade
        const twr = weight > 0 ? totalThrust / weight : 0;
        
        // Calcular Delta-V aproximado usando a equação de Tsiolkovsky
        // Delta-v = g0 * Isp * ln(m0 / mf)
        // Onde: g0 = 9.81 m/s², Isp = eficiência específica do motor, m0 = massa total, mf = massa seca
        
        // Isp médio aproximado (segundos)
        const isp = 300;
        
        // Calcular delta-v
        let deltaV = 0;
        if (dryMass > 0 && totalMass > dryMass) {
            deltaV = this.gravity * isp * Math.log(totalMass / dryMass);
        }
        
        // Atualizar a UI
        const metrics = {
            totalMass,
            dryMass,
            fuelMass,
            totalThrust,
            twr,
            deltaV
        };
        
        this.builderUI.updateRocketMetrics(metrics);
    }
    
    saveRocket() {
        // Obter o nome do foguete da UI
        this.currentRocket.name = this.builderUI.getRocketName();
        
        // Criar um objeto representando o estado atual do foguete
        const rocketData = {
            name: this.currentRocket.name,
            parts: this.rocketParts.map(part => part.serialize())
        };
        
        // Salvar no localStorage
        try {
            const savedRockets = JSON.parse(localStorage.getItem('savedRockets')) || {};
            savedRockets[this.currentRocket.name] = rocketData;
            localStorage.setItem('savedRockets', JSON.stringify(savedRockets));
            
            alert(`Foguete "${this.currentRocket.name}" salvo com sucesso!`);
        } catch (error) {
            console.error('Erro ao salvar o foguete:', error);
            alert('Falha ao salvar o foguete. Verifique o console para mais detalhes.');
        }
    }
    
    launchRocket() {
        // Verificar se há um foguete válido para lançar
        if (this.rocketParts.length === 0) {
            alert('Não há foguete para lançar! Adicione algumas peças primeiro.');
            return;
        }
        
        // Verificar requisitos mínimos (motor, tanque e cápsula)
        const hasEngine = this.rocketParts.some(part => part.type === 'engine');
        const hasTank = this.rocketParts.some(part => part.type === 'tank');
        const hasCapsule = this.rocketParts.some(part => part.type === 'capsule');
        
        if (!hasEngine || !hasTank || !hasCapsule) {
            alert('O foguete precisa ter pelo menos um motor, um tanque de combustível e uma cápsula!');
            return;
        }
        
        // Calcular e verificar TWR (relação de empuxo/peso)
        let totalMass = 0;
        let totalThrust = 0;
        
        for (const part of this.rocketParts) {
            totalMass += part.getTotalMass();
            totalThrust += part.thrust || 0;
        }
        
        const twr = totalThrust / (totalMass * this.gravity);
        
        if (twr < 1.2) {
            if (!confirm('Aviso: A relação de empuxo/peso é baixa (menor que 1.2). O foguete pode não decolar. Deseja lançar mesmo assim?')) {
                return;
            }
        }
        
        // Salvar o estado atual do foguete
        this.saveRocket();
        
        // Transição para a cena de lançamento
        this.sceneManager.loadScene('launch', {
            rocket: {
                name: this.currentRocket.name,
                parts: this.rocketParts.map(part => part.serialize())
            }
        });
    }
    
    goBackToMenu() {
        // Perguntar se deseja salvar antes de sair
        if (this.rocketParts.length > 0) {
            if (confirm('Deseja salvar o foguete atual antes de voltar ao menu?')) {
                this.saveRocket();
            }
        }
        
        // Voltar para o menu principal
        this.sceneManager.loadScene('mainMenu');
    }
    
    update() {
        // Atualizar o controlador de câmera
        if (this.cameraController) {
            this.cameraController.update();
        }
        
        // Atualizar peças do foguete
        for (const part of this.rocketParts) {
            part.update();
        }
    }
    
    unload() {
        // Desativar o sistema de drag and drop
        if (this.dragAndDrop) {
            this.dragAndDrop.dispose();
            this.dragAndDrop = null;
        }
        
        // Desativar o controlador de câmera
        if (this.cameraController) {
            this.cameraController.dispose();
            this.cameraController = null;
        }
        
        // Remover a UI do construtor
        if (this.builderUI) {
            this.builderUI.dispose();
            this.builderUI = null;
        }
        
        // Limpar as peças do foguete
        this.clearRocket();
        
        // Limpar a cena
        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            this.scene.remove(object);
        }
        
        // Limpar referencias
        this.draggableObjects = [];
        this.rocketParts = [];
        this.selectedPart = null;
    }
} 