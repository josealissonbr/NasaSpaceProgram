// Removendo a importação do three.js pois ele já é carregado globalmente
// import * as THREE from 'three';

export class RocketPart {
    constructor(data) {
        // Dados básicos da peça
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.model = data.model;
        
        // Propriedades físicas
        this.mass = data.mass || 0; // kg
        this.fuel = data.fuel || 0; // kg
        this.thrust = data.thrust || 0; // Newtons
        this.consumption = data.consumption || 0; // kg/s
        this.crew = data.crew || 0;
        
        // Dimensões para colisão
        this.height = data.height || 1;
        this.radius = data.radius || 0.5;
        
        // Pontos de encaixe (snap points)
        this.snapPoints = data.snapPoints || {};
        
        // Regras de conexão
        this.validConnections = data.validConnections || {};
        
        // Objeto 3D da peça
        this.object3D = null;
        this.mesh = null;
        
        // Estado da peça
        this.isAttached = false;
        this.connectedTo = null;
        this.attachedParts = [];
        this.connectionPoint = null;
        
        // Mesh para visualização de conexão
        this.connectionHelper = null;
        this.isValidPlacement = false;
        
        // Posição original (para retornar caso o drop seja inválido)
        this.originalPosition = new THREE.Vector3();
        
        this._createObject();
    }
    
    _createObject() {
        this.object3D = new THREE.Group();
        
        // Carregar o modelo se disponível
        if (this.model && window.game && window.game.assetLoader) {
            const modelObject = window.game.assetLoader.getModel(this.model);
            if (modelObject) {
                const model = modelObject.clone();
                this.mesh = model;
                this.object3D.add(model);
            } else {
                console.warn(`Modelo ${this.model} não encontrado. Usando geometria básica.`);
                this._createBasicMesh();
            }
        } else {
            this._createBasicMesh();
        }
        
        // Criar auxiliar de conexão
        this.connectionHelper = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                transparent: true,
                opacity: 0.7,
                visible: false
            })
        );
        this.object3D.add(this.connectionHelper);
        
        // Adicionar caixa de contorno para depuração (invisível por padrão)
        const boundingBox = new THREE.BoxHelper(this.object3D, 0xffff00);
        boundingBox.visible = false;
        this.object3D.add(boundingBox);
        this.boundingBox = boundingBox;
    }
    
    _createBasicMesh() {
        // Cria uma geometria básica baseada no tipo da peça
        let geometry, material;
        
        switch (this.type) {
            case 'capsule':
                geometry = new THREE.CapsuleGeometry(this.radius, this.height, 16, 16);
                material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
                break;
                
            case 'tank':
                geometry = new THREE.CylinderGeometry(this.radius, this.radius, this.height, 32);
                material = new THREE.MeshStandardMaterial({ color: 0x888888 });
                break;
                
            case 'engine':
                geometry = new THREE.ConeGeometry(this.radius, this.height, 32);
                material = new THREE.MeshStandardMaterial({ color: 0x444444 });
                break;
                
            case 'booster':
                geometry = new THREE.CylinderGeometry(this.radius * 0.8, this.radius * 0.4, this.height, 16);
                material = new THREE.MeshStandardMaterial({ color: 0x555555 });
                break;
                
            case 'wing':
                geometry = new THREE.BoxGeometry(this.radius * 2, this.height * 0.1, this.height);
                material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
                break;
                
            default:
                geometry = new THREE.BoxGeometry(this.radius, this.height, this.radius);
                material = new THREE.MeshStandardMaterial({ color: 0x999999 });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Alinhar a peça corretamente (Y+ para cima)
        if (this.type === 'engine') {
            this.mesh.rotation.x = Math.PI; // Inverte o cone para que a ponta fique para baixo
        } else if (this.type === 'wing') {
            this.mesh.rotation.z = Math.PI / 2; // Rotaciona as asas
        }
        
        this.object3D.add(this.mesh);
    }
    
    highlight(isHighlighted = true) {
        if (!this.mesh) return;
        
        if (this.mesh.material) {
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(mat => {
                    mat.emissive = isHighlighted ? new THREE.Color(0x333333) : new THREE.Color(0x000000);
                });
            } else {
                this.mesh.material.emissive = isHighlighted ? new THREE.Color(0x333333) : new THREE.Color(0x000000);
            }
        }
    }
    
    showConnectionPoint(snapKey, isValid) {
        const snapPoint = this.snapPoints[snapKey];
        if (!snapPoint) return;
        
        this.connectionHelper.visible = true;
        this.connectionHelper.position.copy(snapPoint.position);
        this.connectionHelper.material.color.set(isValid ? 0x00ff00 : 0xff0000);
        this.isValidPlacement = isValid;
    }
    
    hideConnectionPoint() {
        if (this.connectionHelper) {
            this.connectionHelper.visible = false;
        }
    }
    
    canConnectTo(otherPart, thisSnapKey, otherSnapKey) {
        // Verifica se esta peça pode se conectar à outra parte
        if (!this.validConnections[thisSnapKey]) return false;
        
        // Verifica se os tipos de peças são compatíveis
        const allowedTypes = this.validConnections[thisSnapKey];
        return allowedTypes.includes(otherPart.type);
    }
    
    // Salvar a posição original antes de começar a arrastar
    saveOriginalPosition() {
        this.originalPosition.copy(this.object3D.position);
    }
    
    // Retornar à posição original
    resetPosition() {
        this.object3D.position.copy(this.originalPosition);
    }
    
    // Calcular centro de massa local
    getCenterOfMass() {
        return new THREE.Vector3(0, this.height / 2, 0);
    }
    
    // Calcular a massa total (massa seca + combustível)
    getTotalMass() {
        return this.mass + this.fuel;
    }
    
    // Atualizar a peça
    update() {
        if (this.boundingBox) {
            this.boundingBox.update();
        }
    }
    
    // Conectar a outra peça
    connectTo(otherPart, thisSnapKey, otherSnapKey) {
        this.isAttached = true;
        this.connectedTo = otherPart;
        this.connectionPoint = { thisSnapKey, otherSnapKey };
        
        otherPart.attachedParts.push(this);
    }
    
    // Desconectar de outra peça
    disconnect() {
        if (this.connectedTo) {
            // Remover esta peça da lista de peças anexadas da peça pai
            const index = this.connectedTo.attachedParts.indexOf(this);
            if (index !== -1) {
                this.connectedTo.attachedParts.splice(index, 1);
            }
            
            this.isAttached = false;
            this.connectedTo = null;
            this.connectionPoint = null;
        }
    }
    
    // Ajustar posição relativa a outra peça
    alignToSnapPoint(otherPart, thisSnapKey, otherSnapKey) {
        const thisSnap = this.snapPoints[thisSnapKey];
        const otherSnap = otherPart.snapPoints[otherSnapKey];
        
        if (!thisSnap || !otherSnap) return false;
        
        // Converter pontos para coordenadas globais
        const worldPosThis = new THREE.Vector3();
        const worldPosOther = new THREE.Vector3();
        
        this.object3D.localToWorld(worldPosThis.copy(thisSnap.position));
        otherPart.object3D.localToWorld(worldPosOther.copy(otherSnap.position));
        
        // Ajustar posição para alinhar os pontos de encaixe
        const offset = worldPosOther.clone().sub(worldPosThis);
        this.object3D.position.add(offset);
        
        // Ajustar rotação (se necessário)
        if (thisSnap.rotation && otherSnap.rotation) {
            // Implementar lógica de alinhamento de rotação aqui se necessário
        }
        
        return true;
    }
    
    // Criar uma representação para salvar
    serialize() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            model: this.model,
            mass: this.mass,
            fuel: this.fuel, 
            thrust: this.thrust,
            consumption: this.consumption,
            crew: this.crew,
            position: {
                x: this.object3D.position.x,
                y: this.object3D.position.y,
                z: this.object3D.position.z
            },
            rotation: {
                x: this.object3D.rotation.x,
                y: this.object3D.rotation.y,
                z: this.object3D.rotation.z
            },
            connection: this.connectionPoint ? {
                partId: this.connectedTo.id,
                thisSnapKey: this.connectionPoint.thisSnapKey,
                otherSnapKey: this.connectionPoint.otherSnapKey
            } : null
        };
    }
} 