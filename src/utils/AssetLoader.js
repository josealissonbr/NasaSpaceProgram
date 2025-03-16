export class AssetLoader {
    constructor() {
        this.assets = {
            models: {},
            textures: {},
            sounds: {}
        };
        
        // Usar o THREE global que foi carregado via script tag
        this.loadingManager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        
        // Verificar se GLTFLoader está disponível e usar corretamente
        if (typeof THREE.GLTFLoader === 'function') {
            this.gltfLoader = new THREE.GLTFLoader(this.loadingManager);
        } else {
            console.error('GLTFLoader não está disponível! Verifique se o script foi carregado corretamente.');
            // Criar um placeholder para evitar erros
            this.gltfLoader = {
                load: (path, onLoad) => {
                    console.error(`Não foi possível carregar o modelo: ${path}`);
                    onLoad({ scene: new THREE.Object3D() });
                }
            };
        }
        
        // Verificar se AudioLoader está disponível
        if (typeof THREE.AudioLoader === 'function') {
            this.audioLoader = new THREE.AudioLoader(this.loadingManager);
        } else {
            console.error('AudioLoader não está disponível! Verifique se o script foi carregado corretamente.');
            // Criar um placeholder para evitar erros
            this.audioLoader = {
                load: (path, onLoad) => {
                    console.error(`Não foi possível carregar o áudio: ${path}`);
                    onLoad(null);
                }
            };
        }
    }
    
    loadAssets(assetsToLoad, onProgress, onComplete) {
        const totalAssets = 
            (assetsToLoad.models?.length || 0) + 
            (assetsToLoad.textures?.length || 0) + 
            (assetsToLoad.sounds?.length || 0);
            
        let loadedAssets = 0;
        
        // Configurar gerenciador de carregamento
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            loadedAssets++;
            const progress = loadedAssets / totalAssets;
            if (onProgress) onProgress(progress);
        };
        
        this.loadingManager.onLoad = () => {
            console.log('Todos os recursos foram carregados');
            if (onComplete) onComplete();
        };
        
        this.loadingManager.onError = (url) => {
            console.error('Erro ao carregar recurso:', url);
        };
        
        // Carregar modelos
        if (assetsToLoad.models) {
            assetsToLoad.models.forEach(model => {
                this.gltfLoader.load(model.path, (gltf) => {
                    this.assets.models[model.name] = gltf;
                });
            });
        }
        
        // Carregar texturas
        if (assetsToLoad.textures) {
            assetsToLoad.textures.forEach(texture => {
                this.textureLoader.load(texture.path, (tex) => {
                    this.assets.textures[texture.name] = tex;
                });
            });
        }
        
        // Carregar sons
        if (assetsToLoad.sounds) {
            assetsToLoad.sounds.forEach(sound => {
                this.audioLoader.load(sound.path, (buffer) => {
                    this.assets.sounds[sound.name] = buffer;
                });
            });
        }
    }
    
    // Métodos para recuperar assets
    getModel(name) {
        if (this.assets.models[name]) {
            // Clonar o modelo para evitar problemas de referência
            return this.assets.models[name].scene.clone();
        }
        console.warn(`Modelo "${name}" não encontrado`);
        return null;
    }
    
    getTexture(name) {
        return this.assets.textures[name] || null;
    }
    
    getSound(name) {
        return this.assets.sounds[name] || null;
    }
} 