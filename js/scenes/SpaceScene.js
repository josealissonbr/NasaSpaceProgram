import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

export class SpaceScene {
    constructor(gameState, assetLoader) {
        this.gameState = gameState;
        this.assetLoader = assetLoader;
        
        // Inicializar cena Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000005); // Preto com um toque de azul para o espaço
        
        // Configurar câmera
        this.setupCamera();
        
        // Container do foguete na cena
        this.rocketGroup = new THREE.Group();
        this.scene.add(this.rocketGroup);
        
        // Referências a objetos importantes
        this.rocket = null;
        this.earth = null;
        this.moon = null;
        this.stars = null;
        
        // Configurar iluminação
        this.setupLights();
        
        // Ambiente espacial
        this.setupSpaceEnvironment();
        
        // Rastreamento de tempo
        this.elapsedTime = 0;
        this.orbitAngle = 0;
    }
    
    setupCamera() {
        // Câmera em perspectiva
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
        this.camera.position.set(0, 200, 600);
        this.camera.lookAt(0, 0, 0);
        
        // Adicionar controles de órbita para interatividade
        this.controls = new OrbitControls(this.camera, document.getElementById('simulation-canvas'));
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 200;
        this.controls.maxDistance = 5000;
    }
    
    setupLights() {
        // Luz ambiente fraca para o espaço
        const ambientLight = new THREE.AmbientLight(0x111111, 0.2);
        this.scene.add(ambientLight);
        
        // Luz direcional representando o sol
        const sunLight = new THREE.DirectionalLight(0xFFFFFF, 2.0);
        sunLight.position.set(5000, 1000, 1000);
        this.scene.add(sunLight);
        
        // Adicionar um ponto de luz representando o sol
        const sunGeometry = new THREE.SphereGeometry(100, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF80,
            transparent: true,
            opacity: 0.8
        });
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.copy(sunLight.position.clone().normalize().multiplyScalar(10000));
        this.scene.add(this.sun);
        
        // Adicionar brilho ao sol
        const sunGlow = new THREE.PointLight(0xFFFF80, 2, 10000);
        sunGlow.position.copy(this.sun.position);
        this.scene.add(sunGlow);
    }
    
    setupSpaceEnvironment() {
        // Criar Terra
        this.createEarth();
        
        // Criar Lua
        this.createMoon();
        
        // Criar estrelas de fundo
        this.createStars();
    }
    
    createEarth() {
        const radius = 6371; // Raio da Terra em km
        const earthGeometry = new THREE.SphereGeometry(radius, 64, 64);
        
        // Tentar carregar textura da Terra
        const earthTexture = this.assetLoader.getTexture('earth');
        
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: earthTexture,
            bumpScale: 10,
            specular: new THREE.Color(0x333333),
            shininess: 15
        });
        
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        
        // Adicionar atmosfera simples
        const atmosphereGeometry = new THREE.SphereGeometry(radius + 100, 64, 64);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x88AAFF,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.earth.add(atmosphere);
        
        // Posicionar a Terra abaixo
        this.earth.position.set(0, -radius, 0);
        
        // Adicionar à cena
        this.scene.add(this.earth);
    }
    
    createMoon() {
        const radius = 1737; // Raio da Lua em km
        const moonGeometry = new THREE.SphereGeometry(radius, 32, 32);
        
        // Tentar carregar textura da Lua
        const moonTexture = this.assetLoader.getTexture('moon');
        
        const moonMaterial = new THREE.MeshPhongMaterial({
            map: moonTexture,
            bumpScale: 1,
            color: 0xAAAAAA
        });
        
        this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
        
        // Posicionar a Lua (distância média de ~384,400 km)
        this.moon.position.set(384400 / 10, 0, 0); // Dividir por 10 para escala
        
        // Adicionar à cena
        this.scene.add(this.moon);
    }
    
    createStars() {
        // Criar campo de estrelas
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1,
            sizeAttenuation: false
        });
        
        // Gerar posições aleatórias para estrelas
        const starsCount = 10000;
        const starsPositions = new Float32Array(starsCount * 3);
        
        for (let i = 0; i < starsCount * 3; i += 3) {
            starsPositions[i] = (Math.random() - 0.5) * 100000;
            starsPositions[i + 1] = (Math.random() - 0.5) * 100000;
            starsPositions[i + 2] = (Math.random() - 0.5) * 100000;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
        
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
        
        // Tentar criar skybox com textura de estrelas
        this.createSkybox();
    }
    
    createSkybox() {
        // Criar skybox com textura de estrelas
        const skyboxGeometry = new THREE.BoxGeometry(90000, 90000, 90000);
        const skyboxMaterial = new THREE.MeshBasicMaterial({
            map: this.assetLoader.getTexture('stars'),
            side: THREE.BackSide
        });
        
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        this.scene.add(skybox);
    }
    
    initializeSpace() {
        // Chamado quando o foguete atinge o espaço
        this.gameState.setState(this.gameState.STATES.SPACE_EXPLORATION);
        
        // Posicionar a câmera para uma boa visualização
        this.camera.position.set(0, 200, 600);
        this.camera.lookAt(0, 0, 0);
        
        // Resetar tempo
        this.elapsedTime = 0;
        this.orbitAngle = 0;
    }
    
    setRocketData(rocketData) {
        // Limpar qualquer foguete existente
        if (this.rocket) {
            this.rocketGroup.remove(this.rocket);
        }
        
        // Criar novo foguete com os dados recebidos
        if (rocketData.config) {
            // Aqui você poderia usar uma versão simplificada do foguete
            // Para esta demonstração, usamos uma geometria simples
            const rocketGeometry = new THREE.ConeGeometry(10, 40, 16);
            const rocketMaterial = new THREE.MeshPhongMaterial({
                color: 0xCCCCCC,
                emissive: 0x222222,
                shininess: 30
            });
            
            this.rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
            
            // Rotacionar para apontar na direção do movimento
            this.rocket.rotation.z = -Math.PI / 2;
            
            // Adicionar à cena
            this.rocketGroup.add(this.rocket);
        }
    }
    
    update(deltaTime) {
        // Atualizar tempo
        this.elapsedTime += deltaTime;
        
        // Atualizar controles da câmera
        if (this.controls) {
            this.controls.update();
        }
        
        // Rotação da Terra
        if (this.earth) {
            this.earth.rotation.y += deltaTime * 0.1; // Rotação simplificada
        }
        
        // Rotação da Lua
        if (this.moon) {
            // Orbit around Earth
            this.orbitAngle += deltaTime * 0.02;
            const orbitRadius = 384400 / 10; // Dividir por 10 para escala
            this.moon.position.x = Math.cos(this.orbitAngle) * orbitRadius;
            this.moon.position.z = Math.sin(this.orbitAngle) * orbitRadius;
            
            // Self rotation
            this.moon.rotation.y += deltaTime * 0.01;
        }
        
        // Animar foguete em órbita
        if (this.rocket && this.gameState.flight.status === 'orbit') {
            // Orbitar a Terra a uma altitude baseada na simulação física
            const orbitRadius = 6371 + this.gameState.flight.altitude; // Raio da Terra + altitude
            const orbitSpeed = 0.05; // Velocidade de órbita
            
            this.rocket.position.x = Math.cos(this.elapsedTime * orbitSpeed) * orbitRadius;
            this.rocket.position.z = Math.sin(this.elapsedTime * orbitSpeed) * orbitRadius;
            
            // Rotacionar o foguete para apontar na direção do movimento
            this.rocket.lookAt(
                Math.cos((this.elapsedTime + 0.1) * orbitSpeed) * orbitRadius,
                this.rocket.position.y,
                Math.sin((this.elapsedTime + 0.1) * orbitSpeed) * orbitRadius
            );
            
            // Inclinar levemente para órbita
            this.rocket.rotateZ(Math.PI / 2);
        }
    }
    
    dispose() {
        // Limpar recursos
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Limpar o foguete
        if (this.rocket) {
            this.rocketGroup.remove(this.rocket);
            this.rocket = null;
        }
    }
} 