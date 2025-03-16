import { THREE } from '../utils/ThreeImports.js';
import { RocketFactory } from '../components/RocketFactory.js';
import { PhysicsEngine } from '../physics/PhysicsEngine.js';

export class LaunchScene {
    constructor(gameState, assetLoader) {
        this.gameState = gameState;
        this.assetLoader = assetLoader;
        
        // Inicializar cena Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x88CCFF); // Céu azul
        
        // Motor de física
        this.physics = new PhysicsEngine(gameState);
        
        // Fábrica de foguetes
        this.rocketFactory = new RocketFactory(assetLoader);
        
        // Configurar câmera
        this.setupCamera();
        
        // Configurar iluminação
        this.setupLights();
        
        // Configurar ambiente de lançamento
        this.setupEnvironment();
        
        // Container do foguete na cena
        this.rocketGroup = new THREE.Group();
        this.scene.add(this.rocketGroup);
        
        // Referências a objetos importantes da cena
        this.rocket = null;
        this.engineParts = [];
        this.launchPad = null;
        
        // Rastreamento de tempo
        this.elapsedTime = 0;
        this.lastUpdateTime = 0;
    }
    
    setupCamera() {
        // Câmera em perspectiva
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
        this.camera.position.set(0, 10, 25);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupLights() {
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0x666666, 1);
        this.scene.add(ambientLight);
        
        // Luz solar direcional
        const sunLight = new THREE.DirectionalLight(0xFFFFCC, 1);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        
        // Configurar sombras
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        
        this.scene.add(sunLight);
        
        // Luz auxiliar para ver detalhes do foguete
        const fillLight = new THREE.DirectionalLight(0xCCCCFF, 0.4);
        fillLight.position.set(-10, 20, -10);
        this.scene.add(fillLight);
    }
    
    setupEnvironment() {
        // Criar terreno
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x336633,
            roughness: 1.0,
            metalness: 0.0
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Criar plataforma de lançamento
        const padGeometry = new THREE.BoxGeometry(10, 0.5, 10);
        const padMaterial = this.assetLoader.getMaterial('launchpad');
        this.assetLoader.applyTextureToMaterial(padMaterial, 'launchpad');
        
        this.launchPad = new THREE.Mesh(padGeometry, padMaterial);
        this.launchPad.position.y = 0;
        this.launchPad.receiveShadow = true;
        this.scene.add(this.launchPad);
        
        // Criar estrutura de lançamento (torres, suportes, etc.)
        this.createLaunchStructure();
        
        // Adicionar skybox
        this.createSkybox();
    }
    
    createLaunchStructure() {
        // Grupo para estrutura de lançamento
        const structureGroup = new THREE.Group();
        
        // Material para estrutura
        const structureMaterial = new THREE.MeshStandardMaterial({
            color: 0x777777,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Torres de suporte (4 torres nos cantos)
        const towerGeometry = new THREE.BoxGeometry(0.4, 12, 0.4);
        
        // Posições das torres (nos cantos da plataforma)
        const towerPositions = [
            new THREE.Vector3(4, 6, 4),
            new THREE.Vector3(-4, 6, 4),
            new THREE.Vector3(4, 6, -4),
            new THREE.Vector3(-4, 6, -4)
        ];
        
        towerPositions.forEach(position => {
            const tower = new THREE.Mesh(towerGeometry, structureMaterial);
            tower.position.copy(position);
            tower.castShadow = true;
            structureGroup.add(tower);
            
            // Adicionar vigas horizontais entre torres para mais realismo
            if (position.z === 4) {
                const beamGeometry = new THREE.BoxGeometry(8.4, 0.3, 0.3);
                const beam = new THREE.Mesh(beamGeometry, structureMaterial);
                beam.position.set(0, position.y + 3, position.z);
                beam.castShadow = true;
                structureGroup.add(beam);
            }
            
            if (position.x === 4) {
                const beamGeometry = new THREE.BoxGeometry(0.3, 0.3, 8.4);
                const beam = new THREE.Mesh(beamGeometry, structureMaterial);
                beam.position.set(position.x, position.y + 3, 0);
                beam.castShadow = true;
                structureGroup.add(beam);
            }
        });
        
        // Adicionar braços de suporte para o foguete
        const armGeometry = new THREE.BoxGeometry(0.3, 0.3, 3);
        
        // Posições dos braços de suporte (em diferentes alturas)
        const armPositions = [
            { pos: new THREE.Vector3(0, 2, 3), rot: new THREE.Euler(0, 0, 0) },
            { pos: new THREE.Vector3(0, 4, 3), rot: new THREE.Euler(0, 0, 0) },
            { pos: new THREE.Vector3(3, 3, 0), rot: new THREE.Euler(0, Math.PI/2, 0) },
            { pos: new THREE.Vector3(-3, 5, 0), rot: new THREE.Euler(0, Math.PI/2, 0) }
        ];
        
        armPositions.forEach(({pos, rot}) => {
            const arm = new THREE.Mesh(armGeometry, structureMaterial);
            arm.position.copy(pos);
            arm.rotation.copy(rot);
            arm.castShadow = true;
            structureGroup.add(arm);
        });
        
        // Adicionar estrutura inteira à cena
        this.scene.add(structureGroup);
        this.launchStructure = structureGroup;
    }
    
    createSkybox() {
        // Criar skybox simples com céu azul
        const skyGeometry = new THREE.BoxGeometry(5000, 5000, 5000);
        const skyMaterials = [];
        
        // Tentar carregar textura de skybox
        const skyTexture = this.assetLoader.getTexture('stars');
        
        // Criar materiais para cada face do skybox
        for (let i = 0; i < 6; i++) {
            const material = new THREE.MeshBasicMaterial({
                map: skyTexture,
                side: THREE.BackSide
            });
            skyMaterials.push(material);
        }
        
        const skybox = new THREE.Mesh(skyGeometry, skyMaterials);
        this.scene.add(skybox);
    }
    
    setupLaunch(rocketConfig) {
        // Limpar qualquer foguete anterior
        this.resetRocket();
        
        // Inicializar array de tweens
        this.tweens = [];
        
        // Construir o foguete da configuração
        this.rocket = this.rocketFactory.createRocket(rocketConfig);
        
        // Adicionar o foguete ao grupo
        this.rocketGroup.add(this.rocket);
        
        // Posicionar foguete na plataforma de lançamento
        this.rocket.position.set(0, 0.25, 0);
        
        // Localizar partes de motor do foguete para efeitos
        this.findEngines();
        
        // Preparar simulação física
        this.physics.setupSimulation(rocketConfig);
        
        // Atualizar estado do jogo
        this.gameState.setState(this.gameState.STATES.LAUNCH_SIMULATION);
        this.gameState.flight.status = 'pre-launch';
        
        // Resetar tempo
        this.elapsedTime = 0;
        this.lastUpdateTime = 0;
        
        // Posicionar câmera para uma boa visualização do lançamento
        this.resetCamera();
    }
    
    resetRocket() {
        // Remover foguete atual
        if (this.rocket) {
            this.rocketGroup.remove(this.rocket);
            this.rocket = null;
        }
        
        // Limpar lista de motores
        this.engineParts = [];
    }
    
    findEngines() {
        // Percorrer hierarquia do foguete para encontrar motores
        this.engineParts = [];
        
        this.rocket.traverse(child => {
            if (child.userData && child.userData.partType === 'engine') {
                this.engineParts.push(child);
            }
        });
    }
    
    resetCamera() {
        // Posicionar a câmera para visualizar o lançamento
        if (!this.rocket) {
            // Posição padrão se o foguete não estiver disponível
            this.camera.position.set(15, 8, 15);
            this.camera.lookAt(0, 5, 0);
            console.log("Câmera posicionada na visão padrão para o lançamento");
        } else {
            // Posicionar para olhar para o foguete
            const rocketPosition = this.rocket.position.clone();
            this.camera.position.set(
                rocketPosition.x + 15,
                rocketPosition.y + 10,
                rocketPosition.z + 15
            );
            this.camera.lookAt(rocketPosition);
            console.log(`Câmera posicionada para o lançamento, olhando para o foguete em: ${rocketPosition.x}, ${rocketPosition.y}, ${rocketPosition.z}`);
        }
    }
    
    startLaunch() {
        // Atualizar estado do jogo
        this.gameState.flight.status = 'launching';
        
        // Definir tempo de missão para -5 (contagem regressiva de 5 segundos)
        this.gameState.flight.missionTime = -5;
        
        console.log('Iniciando contagem regressiva de 5 segundos...');
        
        // Inicia a contagem regressiva (5 segundos)
        setTimeout(() => {
            // Atualizar estado
            this.gameState.flight.status = 'flying';
            
            // Ativar motores
            this.activateEngines();
            
            // Esconder estrutura de lançamento
            this.hideStructureOnLaunch();
            
            console.log('Contagem regressiva concluída! Foguete iniciando voo...');
        }, 5000);
    }
    
    activateEngines() {
        // Ativar chamas em todos os motores
        this.engineParts.forEach(engine => {
            this.rocketFactory.activateEngineFlame(engine, this.gameState.flight.throttle / 100);
        });
    }
    
    updateEngines() {
        // Atualizar chamas dos motores com base no throttle atual
        if (this.gameState.flight.status === 'flying' || 
            this.gameState.flight.status === 'launching') {
            this.engineParts.forEach(engine => {
                this.rocketFactory.activateEngineFlame(engine, this.gameState.flight.throttle / 100);
            });
        } else {
            // Desativar chamas se não estiver voando
            this.engineParts.forEach(engine => {
                this.rocketFactory.deactivateEngineFlame(engine);
            });
        }
    }
    
    hideStructureOnLaunch() {
        // Animar a remoção da estrutura de lançamento
        if (this.launchStructure) {
            // Criar uma animação simples para mover a estrutura para fora do caminho
            const tween = {
                progress: 0,
                update: () => {
                    this.launchStructure.position.x += 0.1;
                    this.launchStructure.position.z -= 0.05;
                    
                    // Detectar quando terminar de mover
                    if (this.launchStructure.position.x > 10) {
                        this.launchStructure.visible = false;
                    }
                }
            };
            
            // Adicionar à lista de atualizações
            this.tweens = this.tweens || [];
            this.tweens.push(tween);
        }
    }
    
    updateCamera() {
        // Se o foguete estiver voando, a câmera deve seguir
        if (this.gameState.flight.status === 'flying' && this.rocket) {
            // Altura mínima para a câmera
            const minCameraY = 5;
            
            // Calcular posição da câmera relativa ao foguete
            const cameraOffset = new THREE.Vector3(
                Math.sin(this.elapsedTime * 0.1) * 15,
                Math.max(minCameraY, this.rocket.position.y + 5),
                Math.cos(this.elapsedTime * 0.1) * 15
            );
            
            // Interpolar suavemente a posição da câmera
            this.camera.position.lerp(cameraOffset.add(this.rocket.position), 0.05);
            
            // Manter a câmera olhando para o foguete
            this.camera.lookAt(this.rocket.position);
        }
    }
    
    abortLaunch() {
        if (this.gameState.flight.status === 'pre-launch' || 
            this.gameState.flight.status === 'launching') {
            // Apenas mudar o estado se ainda não decolou
            this.gameState.flight.status = 'aborted';
            
            // Desativar motores
            this.engineParts.forEach(engine => {
                this.rocketFactory.deactivateEngineFlame(engine);
            });
        } else if (this.gameState.flight.status === 'flying') {
            // Se já estiver voando, criar uma explosão/falha
            this.createExplosion();
            
            // Mudar estado
            this.gameState.flight.status = 'crashed';
        }
    }
    
    createExplosion() {
        // Criar efeito de explosão simples
        const explosionGeometry = new THREE.SphereGeometry(2, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF5500,
            transparent: true,
            opacity: 0.8
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        
        // Posicionar na localização atual do foguete
        if (this.rocket) {
            explosion.position.copy(this.rocket.position);
            this.scene.add(explosion);
            
            // Esconder o foguete
            this.rocket.visible = false;
            
            // Animar a explosão
            const expandAndFade = {
                progress: 0,
                maxSize: 5,
                duration: 2, // segundos
                update: (delta) => {
                    this.progress += delta / this.duration;
                    
                    if (this.progress >= 1) {
                        explosion.scale.set(this.maxSize, this.maxSize, this.maxSize);
                        explosion.material.opacity = 0;
                        this.scene.remove(explosion);
                        return true; // Remover este tween
                    }
                    
                    explosion.scale.set(
                        1 + this.progress * this.maxSize,
                        1 + this.progress * this.maxSize,
                        1 + this.progress * this.maxSize
                    );
                    
                    explosion.material.opacity = 0.8 * (1 - this.progress);
                    
                    return false;
                }
            };
            
            // Adicionar à lista de atualizações
            this.tweens = this.tweens || [];
            this.tweens.push(expandAndFade);
        }
    }
    
    getRocketData() {
        // Retornar dados do foguete para outras cenas
        return {
            position: this.rocket ? this.rocket.position.clone() : new THREE.Vector3(0, 0, 0),
            rotation: this.rocket ? this.rocket.rotation.clone() : new THREE.Euler(),
            velocity: this.physics.getCurrentVelocity(),
            config: this.gameState.rocket,
            engineParts: this.engineParts.map(engine => ({
                mesh: engine,
                active: this.gameState.flight.throttle > 0
            }))
        };
    }
    
    update(deltaTime) {
        // Verificar se deltaTime é válido
        if (!deltaTime || isNaN(deltaTime) || deltaTime <= 0) {
            deltaTime = 0.016; // Valor padrão (aproximadamente 60 FPS)
        }

        // Atualizar tempo decorrido
        this.elapsedTime += deltaTime;
        
        // Calcular tempo desde a última atualização
        const timeSinceLastUpdate = this.elapsedTime - this.lastUpdateTime;
        this.lastUpdateTime = this.elapsedTime;
        
        // Log de depuração a cada segundo
        if (Math.floor(this.elapsedTime) > Math.floor(this.elapsedTime - deltaTime)) {
            console.log(`Simulação: t=${this.elapsedTime.toFixed(1)}s, status=${this.gameState.flight.status}`);
        }
        
        // Atualizar a simulação física se o foguete estiver em voo
        if (this.gameState.flight.status === 'flying' && this.rocket) {
            // Simular física
            const newState = this.physics.simulateStep(deltaTime);
            
            // Atualizar posição do foguete na cena
            this.rocket.position.y = newState.altitude * 0.01; // Escala para visualização
            
            // Se estiver acima da plataforma de lançamento, adicionar movimento lateral
            if (newState.altitude > 5) {
                this.rocket.position.x = Math.sin(this.elapsedTime * 0.1) * 0.5;
                this.rocket.position.z = Math.cos(this.elapsedTime * 0.1) * 0.5;
            }
            
            // Inclinar levemente o foguete na direção do movimento
            if (newState.altitude > 10) {
                // Começar a inclinar para atingir órbita
                const targetAngle = Math.min(Math.PI / 6, newState.altitude / 500);
                this.rocket.rotation.z = THREE.MathUtils.lerp(
                    this.rocket.rotation.z,
                    targetAngle,
                    0.01
                );
            }
            
            // Atualizar contagem de tempo de missão
            this.gameState.flight.missionTime += deltaTime;
            
            // Checar se o foguete atingiu o espaço
            if (newState.altitude >= 100) {
                // Espaço alcançado (linha de Kármán a 100km)
                this.gameState.checkSpaceReached(newState.altitude);
            }
        } else if (this.gameState.flight.status === 'launching' && this.rocket) {
            // Durante a contagem regressiva, apenas atualizar o tempo de missão com valores negativos
            this.gameState.flight.missionTime = Math.min(0, this.gameState.flight.missionTime - deltaTime);
        }
        
        // Atualizar efeitos dos motores
        this.updateEngines();
        
        // Atualizar câmera
        this.updateCamera();
        
        // Atualizar animações
        if (this.tweens && this.tweens.length > 0) {
            // Filtrar tweens completos
            this.tweens = this.tweens.filter(tween => {
                if (typeof tween.update === 'function') {
                    return !tween.update(deltaTime);
                }
                return false;
            });
        }
    }
    
    dispose() {
        // Limpar recursos
        this.resetRocket();
        
        // Limpar tweens
        this.tweens = [];
    }
} 