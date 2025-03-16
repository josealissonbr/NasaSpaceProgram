import { THREE } from '../../../utils/ThreeImports.js';

export class CameraController {
    constructor(gameState) {
        this.gameState = gameState;
        this.camera = null;
        this.elapsedTime = 0;
    }

    setupCamera() {
        // Câmera em perspectiva
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
        this.camera.position.set(0, 10, 25);
        this.camera.lookAt(0, 0, 0);
        
        return this.camera;
    }

    resetCamera(rocket) {
        // Posicionar a câmera para visualizar o lançamento
        if (!rocket) {
            // Posição padrão se o foguete não estiver disponível
            this.camera.position.set(15, 8, 15);
            this.camera.lookAt(0, 5, 0);
            console.log("Câmera posicionada na visão padrão para o lançamento");
        } else {
            // Posicionar para olhar para o foguete
            const rocketPosition = rocket.position.clone();
            this.camera.position.set(
                rocketPosition.x + 15,
                rocketPosition.y + 10,
                rocketPosition.z + 15
            );
            this.camera.lookAt(rocketPosition);
            console.log(`Câmera posicionada para o lançamento, olhando para o foguete em: ${rocketPosition.x}, ${rocketPosition.y}, ${rocketPosition.z}`);
        }
    }

    updateCamera(rocket, elapsedTime) {
        this.elapsedTime = elapsedTime;
        
        // Se o foguete estiver voando, a câmera deve seguir
        if (this.gameState.flight.status === 'flying' && rocket) {
            // Altura mínima para a câmera
            const minCameraY = 5;
            
            // Calcular posição da câmera relativa ao foguete
            const cameraOffset = new THREE.Vector3(
                Math.sin(this.elapsedTime * 0.1) * 15,
                Math.max(minCameraY, rocket.position.y + 5),
                Math.cos(this.elapsedTime * 0.1) * 15
            );
            
            // Interpolar suavemente a posição da câmera
            this.camera.position.lerp(cameraOffset.add(rocket.position), 0.05);
            
            // Manter a câmera olhando para o foguete
            this.camera.lookAt(rocket.position);
        }
    }
} 