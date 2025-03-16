import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class RocketFactory {
    constructor(assetLoader) {
        this.assetLoader = assetLoader;
    }
    
    // Criar um foguete inteiro baseado em uma configuração
    createRocket(rocketConfig) {
        const rocketGroup = new THREE.Group();
        
        // Adicionar todas as peças na configuração
        if (rocketConfig && rocketConfig.parts) {
            rocketConfig.parts.forEach(part => {
                const mesh = this.createPartMesh(part.data);
                
                if (mesh) {
                    // Posicionar a peça
                    if (part.position) {
                        mesh.position.copy(part.position);
                    }
                    
                    // Adicionar ao grupo
                    rocketGroup.add(mesh);
                }
            });
        }
        
        return rocketGroup;
    }
    
    // Criar uma mesh para uma peça específica
    createPartMesh(partData) {
        let mesh;
        
        // Selecionar o modelo correto com base no ID da peça
        if (partData.id === 'command_module') {
            mesh = this.createCommandModule(partData);
        } else if (partData.id.includes('fuel_tank')) {
            mesh = this.createFuelTank(partData);
        } else if (partData.id.includes('engine')) {
            mesh = this.createEngine(partData);
        } else if (partData.id === 'stage_separator') {
            mesh = this.createStageSeparator(partData);
        } else {
            // Modelo genérico para tipos desconhecidos
            mesh = this.createGenericPart(partData);
        }
        
        // Configurar propriedades comuns
        if (mesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // Adicionar dados para referência
            mesh.userData = {
                partId: partData.id,
                partType: partData.type,
                partData: partData
            };
        }
        
        return mesh;
    }
    
    // Criar módulo de comando
    createCommandModule(partData) {
        // Tentar obter modelo carregado
        let mesh = this.assetLoader.getModel('command_module');
        
        // Se não houver modelo, criar geometria básica
        if (!mesh || !mesh.isObject3D) {
            const geometry = new THREE.ConeGeometry(1, 2, 16);
            const material = this.assetLoader.getMaterial('commandModule');
            mesh = new THREE.Mesh(geometry, material);
        }
        
        return mesh;
    }
    
    // Criar tanque de combustível
    createFuelTank(partData) {
        // Determinar qual modelo de tanque usar
        const modelName = partData.id;
        
        // Tentar obter modelo carregado
        let mesh = this.assetLoader.getModel(modelName);
        
        // Se não houver modelo, criar geometria básica
        if (!mesh || !mesh.isObject3D) {
            let geometry;
            
            if (partData.id === 'fuel_tank_small') {
                geometry = new THREE.CylinderGeometry(1, 1, 3, 16);
            } else if (partData.id === 'fuel_tank_medium') {
                geometry = new THREE.CylinderGeometry(1.2, 1.2, 5, 16);
            } else {
                geometry = new THREE.CylinderGeometry(1, 1, 4, 16);
            }
            
            const material = this.assetLoader.getMaterial('rocketBody');
            this.assetLoader.applyTextureToMaterial(material, 'metal');
            
            mesh = new THREE.Mesh(geometry, material);
        }
        
        return mesh;
    }
    
    // Criar motor
    createEngine(partData) {
        // Determinar qual modelo de motor usar
        const modelName = partData.id;
        
        // Tentar obter modelo carregado
        let mesh = this.assetLoader.getModel(modelName);
        
        // Se não houver modelo, criar geometria básica
        if (!mesh || !mesh.isObject3D) {
            let geometry;
            
            if (partData.id === 'engine_small') {
                geometry = new THREE.CylinderGeometry(0.8, 1.2, 1.5, 16);
            } else if (partData.id === 'engine_medium') {
                geometry = new THREE.CylinderGeometry(1, 1.5, 2, 16);
            } else {
                geometry = new THREE.CylinderGeometry(0.5, 1, 1, 16);
            }
            
            const material = this.assetLoader.getMaterial('engine');
            
            mesh = new THREE.Mesh(geometry, material);
            
            // Adicionar bocal do motor
            const nozzleGeometry = new THREE.ConeGeometry(0.8, 1, 16, 1, true);
            const nozzleMaterial = new THREE.MeshStandardMaterial({
                color: 0x555555,
                metalness: 0.9,
                roughness: 0.2
            });
            
            const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
            nozzle.position.y = -1;
            nozzle.rotation.x = Math.PI; // Inverter cone
            
            mesh.add(nozzle);
        }
        
        return mesh;
    }
    
    // Criar separador de estágio
    createStageSeparator(partData) {
        // Tentar obter modelo carregado
        let mesh = this.assetLoader.getModel('stage_separator');
        
        // Se não houver modelo, criar geometria básica
        if (!mesh || !mesh.isObject3D) {
            const geometry = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0x666666,
                metalness: 0.6,
                roughness: 0.4
            });
            
            mesh = new THREE.Mesh(geometry, material);
            
            // Adicionar detalhes
            const ringGeometry = new THREE.TorusGeometry(1.2, 0.1, 8, 24);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.7,
                roughness: 0.3
            });
            
            const topRing = new THREE.Mesh(ringGeometry, ringMaterial);
            topRing.rotation.x = Math.PI / 2;
            topRing.position.y = 0.25;
            mesh.add(topRing);
            
            const bottomRing = new THREE.Mesh(ringGeometry, ringMaterial);
            bottomRing.rotation.x = Math.PI / 2;
            bottomRing.position.y = -0.25;
            mesh.add(bottomRing);
        }
        
        return mesh;
    }
    
    // Criar uma peça genérica para tipos desconhecidos
    createGenericPart(partData) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0xFF00FF, // Rosa para indicar peça desconhecida
            metalness: 0.3,
            roughness: 0.7
        });
        
        return new THREE.Mesh(geometry, material);
    }
    
    // Criar efeito de chama para o motor
    createEngineFlame() {
        const flameGroup = new THREE.Group();
        
        // Criar geometria para a chama
        const coreGeometry = new THREE.ConeGeometry(0.5, 2, 16);
        const outerGeometry = new THREE.ConeGeometry(0.8, 1.5, 16);
        
        // Materiais para diferentes partes da chama
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9
        });
        
        const outerMaterial = this.assetLoader.getMaterial('flame');
        
        // Criar meshes
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        const outer = new THREE.Mesh(outerGeometry, outerMaterial);
        
        core.position.y = -1;
        outer.position.y = -0.75;
        
        // Rotacionar para apontar para baixo
        core.rotation.x = Math.PI;
        outer.rotation.x = Math.PI;
        
        flameGroup.add(core);
        flameGroup.add(outer);
        
        return flameGroup;
    }
    
    // Ativar efeito de chama em um motor
    activateEngineFlame(engineMesh, power = 1.0) {
        // Verificar se o motor já tem chama
        let flame = engineMesh.getObjectByName('flame');
        
        if (!flame) {
            // Criar nova chama
            flame = this.createEngineFlame();
            flame.name = 'flame';
            
            // Adicionar ao motor na posição correta
            flame.position.y = -1.5;
            engineMesh.add(flame);
        }
        
        // Ajustar tamanho da chama com base na potência
        flame.scale.set(1, power * 1.5, 1);
        
        // Tornar visível
        flame.visible = true;
        
        return flame;
    }
    
    // Desativar efeito de chama
    deactivateEngineFlame(engineMesh) {
        const flame = engineMesh.getObjectByName('flame');
        if (flame) {
            flame.visible = false;
        }
    }
} 