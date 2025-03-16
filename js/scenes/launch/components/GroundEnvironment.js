import { THREE } from '../../../utils/ThreeImports.js';

export class GroundEnvironment {
    constructor(assetLoader) {
        this.assetLoader = assetLoader;
        this.launchPad = null;
    }

    createGround(scene) {
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
        scene.add(ground);
        
        return ground;
    }

    createLaunchPad(scene) {
        // Criar plataforma de lançamento
        const padGeometry = new THREE.BoxGeometry(10, 0.5, 10);
        const padMaterial = this.assetLoader.getMaterial('launchpad');
        this.assetLoader.applyTextureToMaterial(padMaterial, 'launchpad');
        
        this.launchPad = new THREE.Mesh(padGeometry, padMaterial);
        this.launchPad.position.y = 0;
        this.launchPad.receiveShadow = true;
        scene.add(this.launchPad);
        
        return this.launchPad;
    }

    createSkybox(scene) {
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
        scene.add(skybox);
        
        return skybox;
    }

    setupEnvironment(scene) {
        this.createGround(scene);
        this.createLaunchPad(scene);
        this.createSkybox(scene);
    }
} 