import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { RocketFactory } from '../components/RocketFactory.js';

export class RocketBuilderScene {
    constructor(gameState, assetLoader) {
        this.gameState = gameState;
        this.assetLoader = assetLoader;
        
        // Inicializar cena Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111133);
        
        // Configurar câmera
        this.setupCamera();
        
        // Inicializar fábrica de foguetes
        this.rocketFactory = new RocketFactory(this.assetLoader);
        
        // Container do foguete na cena
        this.rocketContainer = new THREE.Group();
        this.scene.add(this.rocketContainer);
        
        // Lista de peças adicionadas
        this.addedParts = [];
        
        // Configurar iluminação
        this.setupLights();
        
        // Configurar grid e outros elementos de cena
        this.setupScene();
        
        // Foguete atual
        this.currentRocket = null;
    }
    
    setupCamera() {
        // Criar câmera em perspectiva
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Adicionar controles de órbita para que o usuário possa girar a câmera
        this.controls = new OrbitControls(this.camera, document.getElementById('builder-canvas'));
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 20;
    }
    
    setupLights() {
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);
        
        // Luz direcional principal (como o sol)
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 100;
        mainLight.shadow.camera.left = -15;
        mainLight.shadow.camera.right = 15;
        mainLight.shadow.camera.top = 15;
        mainLight.shadow.camera.bottom = -15;
        this.scene.add(mainLight);
        
        // Luz de preenchimento para iluminar áreas sombreadas
        const fillLight = new THREE.DirectionalLight(0xaaaaff, 0.4);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }
    
    setupScene() {
        // Grid helper para referência visual
        const gridHelper = new THREE.GridHelper(20, 20, 0x808080, 0x404040);
        this.scene.add(gridHelper);
        
        // Plano para sombras
        const planeGeometry = new THREE.PlaneGeometry(30, 30);
        const planeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);
    }
    
    setupBuilder() {
        // Limpar qualquer foguete anterior
        this.resetRocket();
        
        // Preparar a cena para construção
        this.gameState.resetRocket();
        
        // Posicionar a câmera adequadamente
        this.camera.position.set(0, 5, 10);
        this.controls.update();
    }
    
    resetRocket() {
        // Remover todas as peças do container
        while (this.rocketContainer.children.length > 0) {
            const child = this.rocketContainer.children[0];
            this.rocketContainer.remove(child);
            
            // Disposar geometrias e materiais para evitar vazamento de memória
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
        
        // Limpar a lista de peças
        this.addedParts = [];
        
        // Limpar dados no gameState
        this.gameState.resetRocket();
    }
    
    addPart(partData) {
        // Obter a posição onde a nova peça será adicionada
        const position = this.calculatePartPosition(partData);
        
        // Criar a mesh 3D para a peça
        const mesh = this.createPartMesh(partData);
        if (!mesh) return false;
        
        // Posicionar a peça
        mesh.position.copy(position);
        
        // Adicionar à cena
        this.rocketContainer.add(mesh);
        
        // Adicionar à lista de peças
        this.addedParts.push({
            id: partData.id,
            type: partData.type,
            mesh,
            data: partData
        });
        
        // Adicionar ao gameState
        this.gameState.rocket.parts.push(partData);
        
        // Recalcular estatísticas do foguete
        this.calculateRocketStats();
        
        return true;
    }
    
    calculatePartPosition(partData) {
        // Posição padrão (origem)
        const position = new THREE.Vector3(0, 0, 0);
        
        // Se não houver peças, esta será a base
        if (this.addedParts.length === 0) {
            // Se for um motor ou comando, adicionar uma certa altura do chão
            if (partData.type === 'engine') {
                position.y = 0.5; // Altura do motor
            } else {
                position.y = 0; // No chão
            }
            return position;
        }
        
        // Encontrar a altura atual do foguete
        let currentHeight = 0;
        this.addedParts.forEach(part => {
            // Obter a posição Y mais alta baseada na geometria da mesh
            if (part.mesh.position.y + this.getPartHeight(part.data) > currentHeight) {
                currentHeight = part.mesh.position.y + this.getPartHeight(part.data);
            }
        });
        
        // Ajustar posição com base no tipo de peça
        position.y = currentHeight;
        
        return position;
    }
    
    getPartHeight(partData) {
        // Alturas aproximadas para cada tipo de peça
        const heights = {
            command: 2,
            fuel_tank_small: 3,
            fuel_tank_medium: 5,
            engine_small: 1,
            engine_medium: 2,
            stage_separator: 0.5
        };
        
        return heights[partData.type] || 1;
    }
    
    createPartMesh(partData) {
        let mesh;
        
        // Obter modelo baseado no tipo de peça
        if (partData.id === 'command_module') {
            mesh = this.assetLoader.getModel('command_module');
        } else if (partData.id === 'fuel_tank_small') {
            mesh = this.assetLoader.getModel('fuel_tank_small');
        } else if (partData.id === 'fuel_tank_medium') {
            mesh = this.assetLoader.getModel('fuel_tank_medium');
        } else if (partData.id === 'engine_small') {
            mesh = this.assetLoader.getModel('engine_small');
        } else if (partData.id === 'engine_medium') {
            mesh = this.assetLoader.getModel('engine_medium');
        } else if (partData.id === 'stage_separator') {
            mesh = this.assetLoader.getModel('stage_separator');
        } else {
            // Usar modelo genérico para tipos desconhecidos
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = this.assetLoader.getMaterial('rocketBody');
            mesh = new THREE.Mesh(geometry, material);
        }
        
        // Configurações gerais da mesh
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Tag com dados da peça para referência futura
        mesh.userData = {
            partId: partData.id,
            partType: partData.type
        };
        
        return mesh;
    }
    
    calculateRocketStats() {
        // Reiniciar estatísticas
        const rocketStats = {
            totalMass: 0,
            totalFuel: 0,
            thrust: 0,
            height: 0,
            stability: 0,
            valid: false
        };
        
        // Verificar se há peças no foguete
        if (this.addedParts.length === 0) {
            this.gameState.rocket = rocketStats;
            return;
        }
        
        // Calcular estatísticas
        this.addedParts.forEach(part => {
            // Adicionar massa
            rocketStats.totalMass += part.data.mass || 0;
            
            // Adicionar combustível
            if (part.data.fuel) {
                rocketStats.totalFuel += part.data.fuel;
            }
            
            // Adicionar empuxo
            if (part.data.thrust) {
                rocketStats.thrust += part.data.thrust;
            }
        });
        
        // Calcular altura do foguete
        let maxHeight = 0;
        this.addedParts.forEach(part => {
            const partTop = part.mesh.position.y + this.getPartHeight(part.data);
            if (partTop > maxHeight) {
                maxHeight = partTop;
            }
        });
        rocketStats.height = maxHeight;
        
        // Calcular estabilidade (simplificado)
        const thrustToMassRatio = rocketStats.thrust / rocketStats.totalMass;
        rocketStats.stability = Math.min(1, Math.max(0, thrustToMassRatio / 1.2));
        
        // Verificar se o foguete é válido para lançamento
        const hasCommand = this.addedParts.some(part => part.data.type === 'command');
        const hasEngine = this.addedParts.some(part => part.data.type === 'engine');
        const hasFuelTank = this.addedParts.some(part => part.data.type.includes('fuel_tank'));
        const hasMinThrust = thrustToMassRatio >= 0.1; // 10% da massa em empuxo
        
        rocketStats.valid = hasCommand && hasEngine && hasFuelTank && hasMinThrust;
        
        // Atualizar estado do jogo
        this.gameState.rocket = rocketStats;
    }
    
    getRocketConfiguration() {
        // Retornar configuração completa do foguete para uso na simulação
        return {
            parts: this.addedParts.map(part => ({
                id: part.id,
                type: part.type,
                position: new THREE.Vector3().copy(part.mesh.position),
                data: part.data
            })),
            stats: { ...this.gameState.rocket }
        };
    }
    
    update(deltaTime) {
        // Atualizar controles da câmera
        if (this.controls) {
            this.controls.update();
        }
        
        // Rotacionar lentamente o foguete para exibição
        if (this.rocketContainer && this.addedParts.length > 0) {
            this.rocketContainer.rotation.y += 0.002;
        }
    }
    
    dispose() {
        // Limpar recursos
        this.controls.dispose();
        
        this.resetRocket();
        
        // Disposar de outras geometrias/materiais criados diretamente nesta classe
        // (Não implementado, pois não criamos geometrias adicionais neste exemplo)
    }
} 