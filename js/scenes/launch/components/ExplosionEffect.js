import { THREE } from '../../../utils/ThreeImports.js';

export class ExplosionEffect {
    constructor(scene) {
        this.scene = scene;
    }

    createExplosion(position, tweens) {
        // Criar efeito de explosão simples
        const explosionGeometry = new THREE.SphereGeometry(2, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF5500,
            transparent: true,
            opacity: 0.8
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        
        // Posicionar na localização especificada
        explosion.position.copy(position);
        this.scene.add(explosion);
        
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
        tweens.push(expandAndFade);
        
        return explosion;
    }
} 