import { PhysicsEngine } from '../physics/PhysicsEngine.js';

export class LaunchScene {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.camera = sceneManager.camera;
        this.scene = new THREE.Scene();
        
        // Configuração da física
        this.physics = new PhysicsEngine();
        
        // Objeto do foguete
        this.rocket = null;
        this.rocketData = null;
        this.rocketModel = null;
        
        // Estado do lançamento
        this.launchState = {
            launched: false,
            altitude: 0,
            velocity: 0,
            acceleration: 0,
            fuel: 0,
            throttle: 1.0,
            stage: 1,
            orbit: false
        };
        
        // Controles de câmera
        this.controls = null;
        
        // Terra, órbitas, etc
        this.earth = null;
        this.orbitPath = null;
        
        // Interface de lançamento
        this.launchUI = null;
        
        // Relógio para controle de física
        this.clock = new THREE.Clock();
    }
    
    load(params = {}) {
        this.rocketData = params.rocket || null;
        
        if (!this.rocketData) {
            console.error('Nenhum foguete fornecido para a cena de lançamento!');
            // Voltar para o menu ou para o construtor
            this.sceneManager.loadScene('mainMenu');
            return;
        }
        
        // Configurar câmera
        this.setupCamera();
        
        // Criar ambiente do espaço
        this.createEnvironment();
        
        // Construir o foguete
        this.buildRocket();
        
        // Inicializar a física
        this.initializePhysics();
        
        // Criar a interface de lançamento
        this.createLaunchUI();
        
        // Configurar eventos de teclado e mouse
        this.setupControls();
        
        // Iniciar o relógio para física
        this.clock.start();
    }
    
    setupCamera() {
        // Configurar posição inicial
        this.camera.position.set(0, 10, 30);
        this.camera.lookAt(0, 0, 0);
        
        // Controles de órbita
        if (typeof THREE.OrbitControls === 'function') {
            this.controls = new THREE.OrbitControls(this.camera, this.sceneManager.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.maxDistance = 500;
        } else {
            console.error('OrbitControls não está disponível! Verifique se o script foi carregado corretamente.');
            // Placeholder simples para evitar erros
            this.controls = {
                update: () => {},
                dispose: () => {}
            };
        }
    }
    
    createEnvironment() {
        // Skybox
        const textureEquirec = window.game.assetLoader.getTexture('skyboxTexture');
        if (textureEquirec) {
            const skyboxGeometry = new THREE.SphereGeometry(1000, 60, 40);
            const skyboxMaterial = new THREE.MeshBasicMaterial({
                map: textureEquirec,
                side: THREE.BackSide
            });
            const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
            this.scene.add(skybox);
        }
        
        // Terra
        const earthTexture = window.game.assetLoader.getTexture('earthTexture');
        if (earthTexture) {
            const earthGeometry = new THREE.SphereGeometry(6371, 64, 64); // Raio real da Terra em km
            const earthMaterial = new THREE.MeshPhongMaterial({
                map: earthTexture,
                specular: 0x333333,
                shininess: 5
            });
            this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
            this.scene.add(this.earth);
            
            // Atmosfera
            const atmosphereGeometry = new THREE.SphereGeometry(6471, 64, 64); // +100km
            const atmosphereMaterial = new THREE.MeshPhongMaterial({
                color: 0x3366ff,
                transparent: true,
                opacity: 0.2,
                side: THREE.BackSide
            });
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            this.earth.add(atmosphere);
        }
        
        // Base de lançamento
        const launchpadGeometry = new THREE.CylinderGeometry(50, 50, 10, 16);
        const launchpadMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888
        });
        this.launchpad = new THREE.Mesh(launchpadGeometry, launchpadMaterial);
        this.launchpad.position.y = 6371; // Na superfície da Terra
        this.scene.add(this.launchpad);
        
        // Adicionar luzes
        const ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(10000, 0, 0);
        this.scene.add(sunLight);
    }
    
    buildRocket() {
        // Criar um grupo para o foguete
        this.rocket = new THREE.Group();
        
        // Escala menor para visualização
        const SCALE = 0.01; // 1:100
        
        // Construir o foguete com base nos dados
        if (this.rocketData && this.rocketData.parts) {
            // Ordenar partes por posição (de baixo para cima)
            const sortedParts = [...this.rocketData.parts].sort((a, b) => a.position.y - b.position.y);
            
            // Calcular total de combustível e massa
            let totalFuel = 0;
            let totalMass = 0;
            
            sortedParts.forEach(partData => {
                let geometry, material, part;
                
                // Criar geometria com base no tipo
                if (partData.type === 'capsule') {
                    geometry = new THREE.ConeGeometry(100, 200, 16);
                    material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
                } else if (partData.type === 'engine') {
                    geometry = new THREE.CylinderGeometry(70, 100, 150, 16);
                    material = new THREE.MeshStandardMaterial({ color: 0x333333 });
                    
                    // Efeito de fogo do motor (partículas seria melhor)
                    const fireGeometry = new THREE.ConeGeometry(80, 200, 16);
                    const fireMaterial = new THREE.MeshBasicMaterial({
                        color: 0xff5500,
                        transparent: true,
                        opacity: 0.7
                    });
                    const fire = new THREE.Mesh(fireGeometry, fireMaterial);
                    fire.position.y = -175;
                    fire.rotation.x = Math.PI;
                    fire.visible = false;
                    fire.name = 'engine-fire';
                    
                    // Adicionar à parte
                    part = new THREE.Group();
                    const engineMesh = new THREE.Mesh(geometry, material);
                    part.add(engineMesh);
                    part.add(fire);
                } else if (partData.type === 'tank') {
                    geometry = new THREE.CylinderGeometry(100, 100, 300, 16);
                    material = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
                    part = new THREE.Mesh(geometry, material);
                    
                    // Adicionar ao combustível total
                    if (partData.id.includes('tank1')) totalFuel += 800;
                    else if (partData.id.includes('tank2')) totalFuel += 1600;
                    else if (partData.id.includes('tank3')) totalFuel += 2800;
                } else {
                    // Acessórios
                    geometry = new THREE.BoxGeometry(100, 50, 100);
                    material = new THREE.MeshStandardMaterial({ color: 0x888888 });
                    part = new THREE.Mesh(geometry, material);
                }
                
                // Se a parte ainda não for um grupo, criar o mesh
                if (!part) {
                    part = new THREE.Mesh(geometry, material);
                }
                
                // Adicionar dados como userData
                part.userData = partData;
                
                // Posicionar conforme os dados
                part.position.set(
                    partData.position.x * 100,  // Escala para visualização
                    partData.position.y * 100,
                    partData.position.z * 100
                );
                
                // Adicionar ao grupo do foguete
                this.rocket.add(part);
                
                // Adicionar à massa total
                if (partData.id.includes('capsule1')) totalMass += 1200;
                else if (partData.id.includes('capsule2')) totalMass += 2500;
                else if (partData.id.includes('engine1')) totalMass += 800;
                else if (partData.id.includes('engine2')) totalMass += 1200;
                else if (partData.id.includes('engine3')) totalMass += 1800;
                else if (partData.id.includes('tank1')) totalMass += 400;
                else if (partData.id.includes('tank2')) totalMass += 800;
                else if (partData.id.includes('tank3')) totalMass += 1200;
                else if (partData.id.includes('parachute')) totalMass += 100;
                else if (partData.id.includes('decoupler')) totalMass += 50;
                else if (partData.id.includes('solar')) totalMass += 200;
            });
            
            // Configurar estado do lançamento com base nas configurações do foguete
            this.launchState.fuel = totalFuel;
            this.launchState.maxFuel = totalFuel;
            this.launchState.mass = totalMass;
            this.launchState.dryMass = totalMass - totalFuel * 0.2; // Simplificação: tanques vazios pesam 80% do total
        }
        
        // Posicionar o foguete na base
        this.rocket.position.set(0, 6371 + 5, 0); // 5km acima da superfície (base)
        
        // Adicionar à cena
        this.scene.add(this.rocket);
        
        // Ajustar escala
        this.rocket.scale.set(SCALE, SCALE, SCALE);
    }
    
    initializePhysics() {
        // Inicializar a física com os dados do foguete e planeta
        this.physics.initialize({
            rocketMass: this.launchState.mass,
            rocketDryMass: this.launchState.dryMass,
            fuel: this.launchState.fuel,
            planetMass: 5.97e24, // Massa da Terra em kg
            planetRadius: 6371    // Raio da Terra em km
        });
    }
    
    createLaunchUI() {
        // Criar elementos da UI
        this.launchUI = document.createElement('div');
        this.launchUI.id = 'launch-ui';
        this.launchUI.style.position = 'absolute';
        this.launchUI.style.left = '20px';
        this.launchUI.style.bottom = '20px';
        this.launchUI.style.width = '300px';
        this.launchUI.style.padding = '15px';
        this.launchUI.style.backgroundColor = 'rgba(20, 20, 40, 0.8)';
        this.launchUI.style.borderRadius = '10px';
        this.launchUI.style.color = 'white';
        this.launchUI.style.fontFamily = 'monospace';
        
        // Título
        const title = document.createElement('h3');
        title.textContent = this.rocketData.name || 'Lançamento';
        title.style.margin = '0 0 15px 0';
        title.style.textAlign = 'center';
        this.launchUI.appendChild(title);
        
        // Controles de lançamento
        const launchButton = document.createElement('button');
        launchButton.id = 'launch-btn';
        launchButton.textContent = 'LANÇAR';
        launchButton.style.width = '100%';
        launchButton.style.padding = '10px';
        launchButton.style.marginBottom = '15px';
        launchButton.style.backgroundColor = '#ff3333';
        launchButton.style.border = 'none';
        launchButton.style.borderRadius = '5px';
        launchButton.style.color = 'white';
        launchButton.style.fontWeight = 'bold';
        launchButton.style.cursor = 'pointer';
        launchButton.addEventListener('click', () => this.launch());
        this.launchUI.appendChild(launchButton);
        
        // Controle de aceleração (throttle)
        const throttleContainer = document.createElement('div');
        throttleContainer.style.marginBottom = '15px';
        
        const throttleLabel = document.createElement('div');
        throttleLabel.textContent = 'Aceleração: 100%';
        throttleLabel.id = 'throttle-label';
        throttleContainer.appendChild(throttleLabel);
        
        const throttleSlider = document.createElement('input');
        throttleSlider.type = 'range';
        throttleSlider.min = '0';
        throttleSlider.max = '100';
        throttleSlider.value = '100';
        throttleSlider.id = 'throttle-slider';
        throttleSlider.style.width = '100%';
        throttleSlider.style.margin = '5px 0';
        throttleSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.setThrottle(value / 100);
            document.getElementById('throttle-label').textContent = `Aceleração: ${value}%`;
        });
        throttleContainer.appendChild(throttleSlider);
        
        this.launchUI.appendChild(throttleContainer);
        
        // Separar estágio
        const stageButton = document.createElement('button');
        stageButton.id = 'stage-btn';
        stageButton.textContent = 'SEPARAR ESTÁGIO';
        stageButton.style.width = '100%';
        stageButton.style.padding = '8px';
        stageButton.style.marginBottom = '15px';
        stageButton.style.backgroundColor = '#3366cc';
        stageButton.style.border = 'none';
        stageButton.style.borderRadius = '5px';
        stageButton.style.color = 'white';
        stageButton.style.cursor = 'pointer';
        stageButton.addEventListener('click', () => this.separateStage());
        this.launchUI.appendChild(stageButton);
        
        // Painel de telemetria
        const telemetryPanel = document.createElement('div');
        telemetryPanel.id = 'telemetry';
        telemetryPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        telemetryPanel.style.padding = '10px';
        telemetryPanel.style.borderRadius = '5px';
        telemetryPanel.style.fontFamily = 'monospace';
        telemetryPanel.style.fontSize = '12px';
        telemetryPanel.innerHTML = `
            <div>Altitude: <span id="altitude">0.00</span> km</div>
            <div>Velocidade: <span id="velocity">0.00</span> m/s</div>
            <div>Aceleração: <span id="acceleration">0.00</span> m/s²</div>
            <div>Combustível: <span id="fuel">100</span>%</div>
            <div>Estágio: <span id="stage">1</span></div>
            <div>Status: <span id="status">Pronto</span></div>
        `;
        this.launchUI.appendChild(telemetryPanel);
        
        document.body.appendChild(this.launchUI);
    }
    
    setupControls() {
        // Teclas para controle de aceleração
        window.game.inputManager.on('keydown', (event) => {
            switch (event.code) {
                case 'Space':
                    if (!this.launchState.launched) {
                        this.launch();
                    } else {
                        this.separateStage();
                    }
                    break;
                case 'KeyW':
                case 'ArrowUp':
                    // Aumentar aceleração
                    this.adjustThrottle(0.1);
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    // Diminuir aceleração
                    this.adjustThrottle(-0.1);
                    break;
                case 'KeyR':
                    // Reset
                    this.resetLaunch();
                    break;
                case 'KeyM':
                    // Voltar ao menu
                    this.goBackToMenu();
                    break;
            }
        });
    }
    
    update() {
        const delta = this.clock.getDelta();
        
        if (this.launchState.launched) {
            // Atualizar a física
            this.updatePhysics(delta);
            
            // Atualizar a UI
            this.updateUI();
            
            // Atualizar efeitos visuais
            this.updateVisualEffects();
            
            // Verificar condições de órbita ou falha
            this.checkLaunchStatus();
        }
        
        // Atualizar controles da câmera
        if (this.controls) {
            this.controls.update();
        }
        
        // Rotação lenta da Terra
        if (this.earth) {
            this.earth.rotation.y += 0.0001;
        }
    }
    
    updatePhysics(deltaTime) {
        // Consumir combustível com base na aceleração
        if (this.launchState.fuel > 0 && this.launchState.throttle > 0) {
            const fuelConsumption = deltaTime * this.launchState.throttle * 10; // Unidades por segundo
            this.launchState.fuel = Math.max(0, this.launchState.fuel - fuelConsumption);
            
            // Atualizar massa do foguete (combustível gasto)
            this.physics.updateRocketMass(
                this.launchState.dryMass + this.launchState.fuel * 0.2 // Simplificação
            );
        }
        
        // Verificar se ainda tem combustível
        if (this.launchState.fuel <= 0) {
            this.launchState.throttle = 0;
        }
        
        // Calcular nova física
        const physicsUpdate = this.physics.update(deltaTime, {
            throttle: this.launchState.throttle,
            altitude: this.launchState.altitude
        });
        
        // Atualizar o estado do lançamento
        this.launchState.altitude = physicsUpdate.altitude;
        this.launchState.velocity = physicsUpdate.velocity;
        this.launchState.acceleration = physicsUpdate.acceleration;
        this.launchState.orbit = physicsUpdate.orbit;
        
        // Atualizar posição do foguete com base na física
        if (this.rocket) {
            // Ajustar posição vertical com base na altitude (em escala)
            const rocketHeight = 6371 + this.launchState.altitude;
            this.rocket.position.y = rocketHeight;
        }
    }
    
    updateUI() {
        // Atualizar telemetria
        document.getElementById('altitude').textContent = this.launchState.altitude.toFixed(2);
        document.getElementById('velocity').textContent = this.launchState.velocity.toFixed(2);
        document.getElementById('acceleration').textContent = this.launchState.acceleration.toFixed(2);
        
        const fuelPercentage = (this.launchState.fuel / this.launchState.maxFuel) * 100;
        document.getElementById('fuel').textContent = fuelPercentage.toFixed(0);
        
        document.getElementById('stage').textContent = this.launchState.stage;
        
        // Atualizar status
        let status = 'Em voo';
        if (this.launchState.orbit) {
            status = 'Em órbita!';
        } else if (this.launchState.fuel <= 0 && this.launchState.velocity < 7800) {
            status = 'Combustível esgotado';
        } else if (this.launchState.altitude > 100 && this.launchState.velocity > 7800) {
            status = 'Aproximando-se da órbita';
        }
        
        document.getElementById('status').textContent = status;
    }
    
    updateVisualEffects() {
        // Atualizar efeito de fogo dos motores
        this.rocket.traverse(object => {
            if (object.name === 'engine-fire') {
                // Visível apenas se tiver combustível e aceleração
                object.visible = this.launchState.fuel > 0 && this.launchState.throttle > 0;
                
                // Ajustar tamanho do fogo com base na aceleração
                if (object.visible) {
                    const scale = 0.5 + this.launchState.throttle * 0.5;
                    object.scale.set(scale, scale, scale);
                }
            }
        });
    }
    
    checkLaunchStatus() {
        // Verificar se atingiu órbita
        if (this.launchState.orbit && !this.orbitPath) {
            this.createOrbitPath();
            alert('Parabéns! Seu foguete entrou em órbita!');
        }
        
        // Verificar falha de combustível
        if (this.launchState.fuel <= 0 && this.launchState.velocity < 7800 && !this.launchState.orbit) {
            // Poderia implementar lógica de queda e colisão
        }
    }
    
    createOrbitPath() {
        // Criar uma linha representando a órbita
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            linewidth: 2
        });
        
        // Gerar pontos para uma órbita circular simplificada
        const points = [];
        const segments = 128;
        const radius = 6371 + this.launchState.altitude; // Raio da Terra + altitude
        
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(
                new THREE.Vector3(
                    Math.cos(theta) * radius,
                    0,
                    Math.sin(theta) * radius
                )
            );
        }
        
        orbitGeometry.setFromPoints(points);
        this.orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
        
        // Inclinar a órbita para ficar mais realista
        this.orbitPath.rotation.x = Math.PI / 2;
        
        this.scene.add(this.orbitPath);
    }
    
    launch() {
        if (this.launchState.launched) return;
        
        this.launchState.launched = true;
        document.getElementById('launch-btn').disabled = true;
        document.getElementById('launch-btn').textContent = 'LANÇADO';
        document.getElementById('launch-btn').style.backgroundColor = '#555';
        document.getElementById('status').textContent = 'Decolando';
        
        // Tocar som do motor
        window.game.audioManager.playSound('engineSound');
    }
    
    separateStage() {
        if (!this.launchState.launched) return;
        
        // Aumentar o número do estágio
        this.launchState.stage++;
        
        // Remover o primeiro motor e tanque
        let engineRemoved = false;
        let tankRemoved = false;
        
        for (let i = this.rocket.children.length - 1; i >= 0; i--) {
            const part = this.rocket.children[i];
            
            if (!engineRemoved && part.userData.type === 'engine') {
                this.rocket.remove(part);
                engineRemoved = true;
                continue;
            }
            
            if (!tankRemoved && part.userData.type === 'tank') {
                this.rocket.remove(part);
                tankRemoved = true;
                continue;
            }
            
            if (engineRemoved && tankRemoved) break;
        }
        
        // Atualizar o número do estágio na UI
        document.getElementById('stage').textContent = this.launchState.stage;
    }
    
    setThrottle(value) {
        this.launchState.throttle = Math.max(0, Math.min(1, value));
        document.getElementById('throttle-slider').value = this.launchState.throttle * 100;
        document.getElementById('throttle-label').textContent = `Aceleração: ${Math.round(this.launchState.throttle * 100)}%`;
    }
    
    adjustThrottle(delta) {
        this.setThrottle(this.launchState.throttle + delta);
    }
    
    resetLaunch() {
        // Recarregar a cena
        this.sceneManager.loadScene('launch', { rocket: this.rocketData });
    }
    
    goBackToMenu() {
        // Voltar ao menu principal
        this.sceneManager.loadScene('mainMenu');
    }
    
    unload() {
        // Limpar sons
        window.game.audioManager.stopAllSounds();
        
        // Remover UI
        if (this.launchUI && this.launchUI.parentNode) {
            this.launchUI.parentNode.removeChild(this.launchUI);
        }
        
        // Limpar controles
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Limpar a cena
        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            this.scene.remove(object);
        }
        
        // Parar o relógio
        this.clock.stop();
    }
} 