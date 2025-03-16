import { THREE, GLTFLoader } from '../utils/ThreeImports.js';

export class AssetLoader {
    constructor() {
        // Loaders
        this.textureLoader = new THREE.TextureLoader();
        this.gltfLoader = new GLTFLoader();
        
        // Cache para assets
        this.textures = {};
        this.models = {};
        this.materials = {};
        
        // Lista de assets para carregar
        this.assetList = {
            textures: [
                { name: 'earth', url: '../assets/textures/earth.jpg' },
                { name: 'moon', url: '../assets/textures/moon.jpg' },
                { name: 'stars', url: '../assets/textures/stars.jpg' },
                { name: 'metal', url: '../assets/textures/metal.jpg' },
                { name: 'launchpad', url: '../assets/textures/launchpad.jpg' }
            ],
            models: [
                { name: 'command_module', url: '../assets/models/command_module.glb' },
                { name: 'fuel_tank_small', url: '../assets/models/fuel_tank_small.glb' },
                { name: 'fuel_tank_medium', url: '../assets/models/fuel_tank_medium.glb' },
                { name: 'engine_small', url: '../assets/models/engine_small.glb' },
                { name: 'engine_medium', url: '../assets/models/engine_medium.glb' },
                { name: 'stage_separator', url: '../assets/models/stage_separator.glb' }
            ]
        };
        
        // Contadores de progresso
        this.progress = {
            total: 0,
            loaded: 0
        };
    }
    
    // Carregar todos os assets necessários
    async loadAssets() {
        // Criar materiais básicos
        this.createBasicMaterials();
        
        // Calcular total de assets
        this.progress.total = this.assetList.textures.length + this.assetList.models.length;
        
        // Criar texturas e modelos geométricos simples para uso inicial
        this.createFallbackAssets();
        
        try {
            // Carregar texturas
            const texturePromises = this.assetList.textures.map(texture => 
                this.loadTexture(texture.name, texture.url)
            );
            
            // Carregar modelos
            const modelPromises = this.assetList.models.map(model => 
                this.loadModel(model.name, model.url)
            );
            
            // Aguardar carregamento de todos os assets
            await Promise.all([...texturePromises, ...modelPromises]);
            
            console.log('Todos os assets foram carregados');
            return true;
        } catch (error) {
            console.error('Erro ao carregar assets:', error);
            return false;
        }
    }
    
    // Criar materiais básicos
    createBasicMaterials() {
        this.materials = {
            rocketBody: new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
                metalness: 0.7,
                roughness: 0.3
            }),
            engine: new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.8,
                roughness: 0.2
            }),
            commandModule: new THREE.MeshStandardMaterial({
                color: 0xCCCCCC,
                metalness: 0.5,
                roughness: 0.5
            }),
            flame: new THREE.MeshBasicMaterial({
                color: 0xFF5500,
                transparent: true,
                opacity: 0.8
            }),
            earth: new THREE.MeshStandardMaterial({
                color: 0x2233AA,
                roughness: 1.0
            }),
            launchpad: new THREE.MeshStandardMaterial({
                color: 0x888888,
                roughness: 0.7
            })
        };
    }
    
    // Criar assets de fallback
    createFallbackAssets() {
        // Criar modelos geométricos simples para caso os modelos GLB não carreguem
        const geometry = {
            commandModule: new THREE.ConeGeometry(1, 2, 16),
            fuelTankSmall: new THREE.CylinderGeometry(1, 1, 3, 16),
            fuelTankMedium: new THREE.CylinderGeometry(1, 1, 5, 16),
            engineSmall: new THREE.CylinderGeometry(0.8, 1.2, 1, 16),
            engineMedium: new THREE.CylinderGeometry(1.2, 1.8, 2, 16),
            stageSeparator: new THREE.CylinderGeometry(1, 1, 0.5, 16)
        };
        
        // Criar meshes de fallback
        for (const [name, geo] of Object.entries(geometry)) {
            const mesh = new THREE.Mesh(geo, this.materials.rocketBody);
            const modelName = name.replace(/([A-Z])/g, '_$1').toLowerCase(); // camelCase para snake_case
            this.models[modelName] = { scene: mesh };
        }
        
        // Criar texturas de fallback
        const fallbackTexture = new THREE.Texture();
        for (const texture of this.assetList.textures) {
            this.textures[texture.name] = fallbackTexture;
        }
    }
    
    // Carregar uma textura
    loadTexture(name, url) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    this.textures[name] = texture;
                    this.updateProgress();
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn(`Não foi possível carregar a textura ${name}:`, error);
                    this.updateProgress();
                    resolve(null); // Resolver mesmo com erro para não interromper o carregamento
                }
            );
        });
    }
    
    // Carregar um modelo
    loadModel(name, url) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                url,
                (gltf) => {
                    this.models[name] = gltf;
                    this.updateProgress();
                    resolve(gltf);
                },
                undefined,
                (error) => {
                    console.warn(`Não foi possível carregar o modelo ${name}:`, error);
                    this.updateProgress();
                    resolve(null); // Resolver mesmo com erro para não interromper o carregamento
                }
            );
        });
    }
    
    // Atualizar progresso
    updateProgress() {
        this.progress.loaded++;
        const percent = Math.floor((this.progress.loaded / this.progress.total) * 100);
        console.log(`Carregando: ${percent}%`);
    }
    
    // Obter textura por nome
    getTexture(name) {
        if (this.textures[name]) {
            return this.textures[name];
        }
        console.warn(`Textura não encontrada: ${name}`);
        return new THREE.Texture();
    }
    
    // Obter modelo por nome
    getModel(name) {
        if (this.models[name]) {
            if (this.models[name].scene) {
                return this.models[name].scene.clone();
            }
            return this.models[name].clone();
        }
        console.warn(`Modelo não encontrado: ${name}`);
        return new THREE.Object3D();
    }
    
    // Obter material por nome
    getMaterial(name) {
        if (this.materials[name]) {
            return this.materials[name].clone();
        }
        console.warn(`Material não encontrado: ${name}`);
        return new THREE.MeshBasicMaterial({ color: 0xFF00FF }); // Material rosa para indicar erro
    }
    
    // Aplicar textura a um material
    applyTextureToMaterial(material, textureName, mapType = 'map') {
        const texture = this.getTexture(textureName);
        material[mapType] = texture;
        
        if (mapType === 'map') {
            material.needsUpdate = true;
        }
        
        return material;
    }
} 