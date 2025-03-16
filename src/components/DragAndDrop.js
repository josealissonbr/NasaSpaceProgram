// Removendo a importação do three.js pois ele já é carregado globalmente
// import * as THREE from 'three';

export class DragAndDrop {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.domElement = renderer.domElement;
        
        // Raycaster para detecção de interseção
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Estado do drag and drop
        this.isDragging = false;
        this.draggedObject = null;
        this.draggedPart = null;
        this.originalParent = null;
        this.originalPosition = new THREE.Vector3();
        this.dragOffset = new THREE.Vector3();
        
        // Plano para arrastar em um espaço 3D
        this.dragPlane = new THREE.Plane();
        this.dragPlaneHelper = new THREE.PlaneHelper(this.dragPlane, 5, 0xffff00);
        this.dragPlaneHelper.visible = false;
        this.scene.add(this.dragPlaneHelper);
        
        // Snap durante o arrasto
        this.snapMode = true;
        this.snapDistance = 0.5;
        this.currentSnapTarget = null;
        this.currentSnapPoints = { source: null, target: null };
        
        // Objetos detectáveis para interação
        this.draggableObjects = [];
        this.rocketParts = [];
        
        // Vincular métodos ao contexto
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        
        // Adicionar event listeners
        this.domElement.addEventListener('mousedown', this.onMouseDown, false);
        this.domElement.addEventListener('mousemove', this.onMouseMove, false);
        this.domElement.addEventListener('mouseup', this.onMouseUp, false);
    }
    
    setDraggableObjects(objects) {
        this.draggableObjects = objects;
    }
    
    setRocketParts(parts) {
        this.rocketParts = parts;
    }
    
    updateMousePosition(event) {
        const rect = this.domElement.getBoundingClientRect();
        // Normalizar as coordenadas do mouse para o espaço de clipping (-1 a 1)
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    onMouseDown(event) {
        if (event.button !== 0) return; // Apenas botão esquerdo
        
        this.updateMousePosition(event);
        
        // Verificar interseção com objetos arrastáveis
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.draggableObjects, true);
        
        if (intersects.length > 0) {
            // Determinar qual objeto foi clicado
            let intersectedObject = intersects[0].object;
            let rocketPart = null;
            
            // Encontrar a parte do foguete associada ao objeto clicado
            for (const part of this.rocketParts) {
                if (part.object3D === intersectedObject || part.object3D.getObjectById(intersectedObject.id)) {
                    rocketPart = part;
                    intersectedObject = part.object3D; // Trabalhar com o grupo raiz da peça
                    break;
                }
            }
            
            if (rocketPart) {
                this.isDragging = true;
                this.draggedObject = intersectedObject;
                this.draggedPart = rocketPart;
                
                // Salvar a posição original para retornar em caso de drop inválido
                this.originalPosition.copy(intersectedObject.position);
                rocketPart.saveOriginalPosition();
                
                // Calcular o offset para que o objeto não "salte" para o cursor
                const intersectionPoint = intersects[0].point;
                this.dragOffset.copy(intersectedObject.position).sub(intersectionPoint);
                
                // Configurar o plano de arrasto perpendicular à câmera
                const normal = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                this.dragPlane.setFromNormalAndCoplanarPoint(normal, intersectionPoint);
                
                // Se a peça estiver conectada a outra, desconecte-a
                if (rocketPart.isAttached) {
                    rocketPart.disconnect();
                }
                
                // Destacar a peça selecionada
                rocketPart.highlight(true);
                
                // Mostrar o plano de arrasto (apenas para depuração)
                this.dragPlaneHelper.visible = false; // true para depuração
                
                event.preventDefault();
            }
        }
    }
    
    onMouseMove(event) {
        this.updateMousePosition(event);
        
        if (this.isDragging && this.draggedObject && this.draggedPart) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Calcular a interseção com o plano de arrasto
            const intersects = this.raycaster.ray.intersectPlane(this.dragPlane, new THREE.Vector3());
            
            if (intersects) {
                // Mover o objeto para a posição de interseção, considerando o offset
                const newPosition = intersects.clone().add(this.dragOffset);
                this.draggedObject.position.copy(newPosition);
                
                // Se estiver no modo snap, verificar possíveis conexões
                if (this.snapMode) {
                    this.checkForSnapPoints();
                }
                
                event.preventDefault();
            }
        } else {
            // Quando não estiver arrastando, pode verificar efeitos de hover
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.draggableObjects, true);
            
            // Resetar estado de hover em todas as peças
            for (const part of this.rocketParts) {
                if (!this.isDragging || part !== this.draggedPart) {
                    part.highlight(false);
                }
            }
            
            // Aplicar hover na peça sob o cursor
            if (intersects.length > 0) {
                const hoveredObject = intersects[0].object;
                
                for (const part of this.rocketParts) {
                    if (part.object3D === hoveredObject || part.object3D.getObjectById(hoveredObject.id)) {
                        if (!this.isDragging || part !== this.draggedPart) {
                            part.highlight(true);
                        }
                        break;
                    }
                }
            }
        }
    }
    
    onMouseUp(event) {
        if (!this.isDragging) return;
        
        if (this.draggedPart) {
            // Se houver um ponto de snap ativo, conectar as peças
            if (this.currentSnapTarget && this.currentSnapPoints.source && this.currentSnapPoints.target) {
                if (this.draggedPart.isValidPlacement) {
                    // Alinhar a peça corretamente ao ponto de snap
                    this.draggedPart.alignToSnapPoint(
                        this.currentSnapTarget,
                        this.currentSnapPoints.source,
                        this.currentSnapPoints.target
                    );
                    
                    // Conectar as peças logicamente
                    this.draggedPart.connectTo(
                        this.currentSnapTarget,
                        this.currentSnapPoints.source,
                        this.currentSnapPoints.target
                    );
                    
                    // Disparar evento de peça conectada
                    this.onPartConnected(this.draggedPart, this.currentSnapTarget);
                } else {
                    // Drop inválido, retornar à posição original
                    this.draggedPart.resetPosition();
                }
            } else {
                // Nenhum snap encontrado, verificar se a posição atual é válida
                // Por exemplo, se não estiver conectado a nada, só é válido se estiver no "chão"
                if (!this.isValidDropPosition()) {
                    this.draggedPart.resetPosition();
                }
            }
            
            // Desativar destaque
            this.draggedPart.highlight(false);
            this.draggedPart.hideConnectionPoint();
        }
        
        // Limpar o estado de todos os pontos de conexão
        for (const part of this.rocketParts) {
            part.hideConnectionPoint();
        }
        
        // Resetar estado de drag
        this.isDragging = false;
        this.draggedObject = null;
        this.draggedPart = null;
        this.currentSnapTarget = null;
        this.currentSnapPoints = { source: null, target: null };
        this.dragPlaneHelper.visible = false;
        
        event.preventDefault();
    }
    
    isValidDropPosition() {
        // Se a peça não estiver conectada, verificar se está em uma posição válida
        // Por padrão, peças não conectadas só podem ficar no "chão" (y=0)
        if (!this.draggedPart.isAttached) {
            const yPos = this.draggedPart.object3D.position.y;
            // Permitir uma pequena tolerância para o "chão"
            return Math.abs(yPos) < 0.1;
        }
        
        return true;
    }
    
    checkForSnapPoints() {
        if (!this.draggedPart) return;
        
        // Resetar estado atual
        this.currentSnapTarget = null;
        this.currentSnapPoints = { source: null, target: null };
        this.draggedPart.hideConnectionPoint();
        
        let closestDistance = Infinity;
        let bestMatch = null;
        
        // Verificar cada ponto de encaixe da peça arrastada contra pontos de outras peças
        for (const sourcePart of [this.draggedPart]) {
            // Ignorar peças já conectadas
            for (const targetPart of this.rocketParts) {
                // Não tentar conectar a si mesmo
                if (targetPart === sourcePart) continue;
                
                // Verificar todos os pares de pontos de encaixe possíveis
                for (const [sourceKey, sourcePoint] of Object.entries(sourcePart.snapPoints)) {
                    for (const [targetKey, targetPoint] of Object.entries(targetPart.snapPoints)) {
                        // Verificar se esta conexão é válida pelas regras de restrição
                        const canConnect = sourcePart.canConnectTo(targetPart, sourceKey, targetKey);
                        if (!canConnect) continue;
                        
                        // Converter os pontos para coordenadas do mundo
                        const worldPosSource = new THREE.Vector3();
                        const worldPosTarget = new THREE.Vector3();
                        
                        sourcePart.object3D.localToWorld(worldPosSource.copy(sourcePoint.position));
                        targetPart.object3D.localToWorld(worldPosTarget.copy(targetPoint.position));
                        
                        // Calcular a distância entre os pontos
                        const distance = worldPosSource.distanceTo(worldPosTarget);
                        
                        // Se estiver dentro da distância de snap e for a mais próxima até agora
                        if (distance < this.snapDistance && distance < closestDistance) {
                            closestDistance = distance;
                            bestMatch = {
                                sourcePart,
                                targetPart,
                                sourceKey,
                                targetKey,
                                canConnect
                            };
                        }
                    }
                }
            }
        }
        
        // Se encontrou um match válido
        if (bestMatch) {
            this.currentSnapTarget = bestMatch.targetPart;
            this.currentSnapPoints = {
                source: bestMatch.sourceKey,
                target: bestMatch.targetKey
            };
            
            // Mostrar o indicador de conexão
            this.draggedPart.showConnectionPoint(bestMatch.sourceKey, bestMatch.canConnect);
            this.currentSnapTarget.showConnectionPoint(bestMatch.targetKey, bestMatch.canConnect);
        } else {
            // Nenhum ponto de snap encontrado, esconder todos os indicadores
            for (const part of this.rocketParts) {
                part.hideConnectionPoint();
            }
        }
    }
    
    // Evento disparado quando uma peça é conectada
    onPartConnected(sourcePart, targetPart) {
        // Aqui seria implementado algum callback ou evento personalizado
        console.log(`Peça ${sourcePart.name} conectada a ${targetPart.name}`);
    }
    
    // Limpar recursos
    dispose() {
        this.domElement.removeEventListener('mousedown', this.onMouseDown);
        this.domElement.removeEventListener('mousemove', this.onMouseMove);
        this.domElement.removeEventListener('mouseup', this.onMouseUp);
        
        this.scene.remove(this.dragPlaneHelper);
        this.dragPlaneHelper.dispose();
    }
} 