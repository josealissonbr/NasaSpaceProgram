import { THREE } from '../../../utils/ThreeImports.js';

export class LaunchStructure {
    constructor(assetLoader) {
        this.assetLoader = assetLoader;
        this.structure = null;
    }

    create() {
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
        
        this.structure = structureGroup;
        return structureGroup;
    }

    hide(scene, tweens) {
        // Animar a remoção da estrutura de lançamento
        if (this.structure) {
            // Criar uma animação simples para mover a estrutura para fora do caminho
            const tween = {
                progress: 0,
                update: () => {
                    this.structure.position.x += 0.1;
                    this.structure.position.z -= 0.05;
                    
                    // Detectar quando terminar de mover
                    if (this.structure.position.x > 10) {
                        this.structure.visible = false;
                    }
                }
            };
            
            // Adicionar à lista de atualizações
            tweens.push(tween);
        }
    }
} 