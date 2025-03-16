/**
 * Gerenciador de carregamento de assets avançado
 * Utiliza o THREE.LoadingManager para acompanhar o progresso
 */
export class AdvancedAssetLoader {
    constructor() {
        this.assets = {
            models: {},
            textures: {},
            sounds: {},
            shaders: {}
        };
        
        // Elementos da interface
        this.progressBar = document.querySelector('.progress');
        this.progressText = document.querySelector('.loading-text');
        this.loadingScreen = document.getElementById('loading-screen');
        
        // Configurar gerenciador de carregamento
        this.loadingManager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        
        // Verificar e configurar o GLTFLoader
        if (typeof THREE.GLTFLoader === 'function') {
            this.gltfLoader = new THREE.GLTFLoader(this.loadingManager);
        } else {
            console.error('GLTFLoader não está disponível!');
            this.gltfLoader = {
                load: (path, onLoad) => {
                    console.error(`Não foi possível carregar o modelo: ${path}`);
                    onLoad({ scene: new THREE.Object3D() });
                }
            };
        }
        
        // Verificar e configurar o AudioLoader
        if (typeof THREE.AudioLoader === 'function') {
            this.audioLoader = new THREE.AudioLoader(this.loadingManager);
        } else {
            console.error('AudioLoader não está disponível!');
            this.audioLoader = {
                load: (path, onLoad) => {
                    console.error(`Não foi possível carregar o áudio: ${path}`);
                    onLoad(null);
                }
            };
        }
        
        // Contador para carregamento de shaders
        this.shaderLoadingCount = 0;
        this.shaderTotalCount = 0;
        
        // Configurar callbacks do gerenciador
        this.configureCallbacks();
    }
    
    configureCallbacks() {
        // Evento de início
        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            console.log(`Iniciando carregamento de ${itemsTotal} recursos`);
            
            if (this.progressText) {
                this.progressText.textContent = 'Carregando recursos...';
            }
            
            if (this.loadingScreen) {
                this.loadingScreen.style.display = 'flex';
            }
        };
        
        // Evento de progresso
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const totalItems = itemsTotal + this.shaderTotalCount;
            const loadedItems = itemsLoaded + this.shaderLoadingCount;
            const progress = loadedItems / totalItems;
            
            console.log(`Carregando ${url}: ${itemsLoaded} de ${itemsTotal} (${Math.round(progress * 100)}%)`);
            
            if (this.progressBar) {
                this.progressBar.style.width = `${progress * 100}%`;
            }
            
            if (this.progressText) {
                this.progressText.textContent = `Carregando recursos... ${Math.floor(progress * 100)}%`;
            }
        };
        
        // Evento de conclusão
        this.loadingManager.onLoad = () => {
            console.log('Todos os recursos foram carregados com sucesso!');
            
            if (this.progressText) {
                this.progressText.textContent = 'Carregamento concluído!';
            }
            
            // Transição suave para esconder a tela de carregamento
            if (this.loadingScreen) {
                setTimeout(() => {
                    this.hideLoadingScreen();
                }, 500);
            }
        };
        
        // Evento de erro
        this.loadingManager.onError = (url) => {
            console.error(`Erro ao carregar recurso: ${url}`);
            
            if (this.progressText) {
                this.progressText.textContent = `Erro ao carregar ${url.split('/').pop()}`;
            }
        };
    }
    
    /**
     * Carrega todos os assets especificados
     * @param {Object} assetsToLoad Objeto com arrays de texturas, modelos e sons para carregar
     * @param {Function} onComplete Função chamada quando o carregamento for concluído
     */
    loadAssets(assetsToLoad, onComplete) {
        const totalAssets = 
            (assetsToLoad.models?.length || 0) + 
            (assetsToLoad.textures?.length || 0) + 
            (assetsToLoad.sounds?.length || 0) +
            (assetsToLoad.shaders?.length || 0);
        
        if (totalAssets === 0) {
            console.warn('Nenhum asset para carregar');
            if (onComplete) onComplete();
            return;
        }
        
        // Sobrescrever o callback de conclusão se fornecido
        if (onComplete) {
            const originalOnLoad = this.loadingManager.onLoad;
            this.loadingManager.onLoad = () => {
                originalOnLoad();
                onComplete();
            };
        }
        
        // Carregar texturas
        if (assetsToLoad.textures) {
            this.loadTextures(assetsToLoad.textures);
        }
        
        // Carregar modelos
        if (assetsToLoad.models) {
            this.loadModels(assetsToLoad.models);
        }
        
        // Carregar sons
        if (assetsToLoad.sounds) {
            this.loadSounds(assetsToLoad.sounds);
        }
        
        // Carregar shaders
        if (assetsToLoad.shaders) {
            this.shaderTotalCount = assetsToLoad.shaders.length * 2; // Cada shader tem vertex e fragment
            this.loadShaders(assetsToLoad.shaders);
        }
    }
    
    loadTextures(textures) {
        textures.forEach(texture => {
            this.textureLoader.load(
                texture.path,
                (tex) => {
                    this.assets.textures[texture.name] = tex;
                    if (texture.options) {
                        this.applyTextureOptions(tex, texture.options);
                    }
                }
            );
        });
    }
    
    loadModels(models) {
        models.forEach(model => {
            this.gltfLoader.load(
                model.path,
                (gltf) => {
                    this.assets.models[model.name] = gltf;
                }
            );
        });
    }
    
    loadSounds(sounds) {
        sounds.forEach(sound => {
            this.audioLoader.load(
                sound.path,
                (buffer) => {
                    this.assets.sounds[sound.name] = buffer;
                }
            );
        });
    }
    
    loadShaders(shaders) {
        shaders.forEach(shader => {
            // Carregar vertex shader
            fetch(shader.vertexPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro ao carregar shader: ${shader.vertexPath}`);
                    }
                    return response.text();
                })
                .then(content => {
                    if (!this.assets.shaders[shader.name]) {
                        this.assets.shaders[shader.name] = {};
                    }
                    this.assets.shaders[shader.name].vertex = content;
                    this.shaderLoadingCount++;
                    this.updateProgress();
                })
                .catch(error => {
                    console.error(error);
                    this.shaderLoadingCount++;
                    this.updateProgress();
                });
                
            // Carregar fragment shader
            fetch(shader.fragmentPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro ao carregar shader: ${shader.fragmentPath}`);
                    }
                    return response.text();
                })
                .then(content => {
                    if (!this.assets.shaders[shader.name]) {
                        this.assets.shaders[shader.name] = {};
                    }
                    this.assets.shaders[shader.name].fragment = content;
                    this.shaderLoadingCount++;
                    this.updateProgress();
                })
                .catch(error => {
                    console.error(error);
                    this.shaderLoadingCount++;
                    this.updateProgress();
                });
        });
    }
    
    updateProgress() {
        // Atualizar manualmente o progresso para shaders carregados via fetch
        if (this.loadingManager.onProgress) {
            // URL fictícia apenas para indicar o tipo de arquivo
            this.loadingManager.onProgress('shader.glsl', 0, 1);
        }
    }
    
    applyTextureOptions(texture, options) {
        if (options.repeat) {
            texture.repeat.set(options.repeat.x || 1, options.repeat.y || 1);
        }
        
        if (options.wrapS) {
            texture.wrapS = options.wrapS;
        }
        
        if (options.wrapT) {
            texture.wrapT = options.wrapT;
        }
        
        if (options.anisotropy && renderer) {
            const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
            texture.anisotropy = Math.min(options.anisotropy, maxAnisotropy);
        }
        
        if (options.encoding) {
            texture.encoding = options.encoding;
        }
        
        if (options.flipY !== undefined) {
            texture.flipY = options.flipY;
        }
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            this.loadingScreen.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    showLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
            this.loadingScreen.style.opacity = '1';
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
    
    getShader(name) {
        return this.assets.shaders[name] || null;
    }
} 