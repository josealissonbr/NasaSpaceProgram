export class PhysicsEngine {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Constantes físicas
        this.G = 6.67430e-11; // Constante gravitacional universal em m³kg⁻¹s⁻²
        this.EARTH_RADIUS = 6371000; // Raio da Terra em metros
        this.EARTH_MASS = 5.972e24; // Massa da Terra em kg
        this.AIR_DENSITY_SEA_LEVEL = 1.225; // Densidade do ar ao nível do mar em kg/m³
        
        // Constantes para controle manual
        this.CONTROL_SENSITIVITY = 1.5; // Aumentado para melhor resposta
        this.MAX_ANGULAR_VELOCITY = 0.2; // Aumentado para permitir rotações mais rápidas
        this.STABILIZATION_FACTOR = 0.95; // Ajustado para estabilização mais suave
        this.THRUST_VECTOR_MAX_ANGLE = 15; // Ângulo máximo de vetorização do empuxo em graus
        
        // Estado da simulação
        this.reset();
    }
    
    reset() {
        this.altitude = 0; // m
        this.velocity = 0; // m/s
        this.acceleration = 0; // m/s²
        this.mass = 1000; // kg
        this.dragCoefficient = 0.2;
        this.crossSectionalArea = 1; // m²
        this.thrust = 0; // N
        this.fuel = 0; // kg
        this.fuelConsumptionRate = 0; // kg/s
        this.throttle = 0; // porcentagem (0-100)
        this.gravity = 9.81; // m/s²
        
        // Variáveis de orientação
        this.orientation = {
            pitch: 0, // Ângulo de arfagem (para cima/baixo)
            yaw: 0,   // Ângulo de guinada (esquerda/direita)
            roll: 0   // Ângulo de rolagem
        };
        
        // Velocidades angulares
        this.angularVelocity = {
            pitch: 0,
            yaw: 0,
            roll: 0
        };
        
        // Vetores de direção
        this.direction = {
            x: 0,      // Componente lateral
            y: 1,      // Componente vertical
            z: 0       // Componente de profundidade
        };
        
        // Posição lateral
        this.position = {
            x: 0,
            z: 0
        };
        
        // Estágios do foguete
        this.stages = [];
        this.currentStage = 0;
    }
    
    setupSimulation(rocketConfig) {
        // Reiniciar a simulação
        this.reset();
        
        // Configurar baseado nos dados do foguete
        if (rocketConfig && rocketConfig.stats) {
            this.mass = rocketConfig.stats.totalMass;
            this.fuel = rocketConfig.stats.totalFuel;
            this.thrust = rocketConfig.stats.thrust * 1000; // Converter kN para N
        }
        
        // Estimar consumo de combustível baseado no empuxo
        this.fuelConsumptionRate = this.thrust / (3000 * 9.81); // Assumindo um ISP de ~300s
        
        // Configurar estágios se houver separadores de estágio
        if (rocketConfig && rocketConfig.parts) {
            this.setupStages(rocketConfig.parts);
        }
        
        // Configuração do foguete no estado do jogo
        this.gameState.flight.fuel = this.fuel;
        this.gameState.flight.throttle = 100; // Começar com 100% de potência
        this.throttle = 1.0;
    }
    
    setupStages(parts) {
        let currentStage = {
            engines: [],
            fuelTanks: [],
            otherParts: [],
            totalMass: 0,
            fuelMass: 0,
            dryMass: 0,
            thrust: 0
        };
        
        this.stages = [];
        
        // Organizar peças em estágios
        for (const part of parts) {
            if (part.data.type === 'engine') {
                currentStage.engines.push(part.data);
                currentStage.thrust += part.data.thrust * 1000; // kN para N
                currentStage.dryMass += part.data.mass;
            } else if (part.data.type === 'stage_separator') {
                // Finalizar estágio atual
                if (currentStage.engines.length > 0) {
                    this.finalizeStage(currentStage);
                    this.stages.push(currentStage);
                }
                
                // Iniciar novo estágio
                currentStage = {
                    engines: [],
                    fuelTanks: [],
                    otherParts: [],
                    totalMass: 0,
                    fuelMass: 0,
                    dryMass: 0,
                    thrust: 0
                };
            } else if (part.data.type.includes('fuel_tank')) {
                currentStage.fuelTanks.push(part.data);
                currentStage.fuelMass += part.data.fuel || 0;
                currentStage.dryMass += part.data.mass;
            } else {
                currentStage.otherParts.push(part.data);
                currentStage.dryMass += part.data.mass;
            }
        }
        
        // Adicionar último estágio
        if (currentStage.engines.length > 0) {
            this.finalizeStage(currentStage);
            this.stages.push(currentStage);
        }
        
        // Inverter a ordem dos estágios (o primeiro a disparar é o último da lista)
        this.stages.reverse();
        
        // Configurar estágio atual
        this.currentStage = 0;
        
        // Configurar contadores no estado do jogo
        this.gameState.missionPhase.maxStages = this.stages.length;
        this.gameState.missionPhase.currentStage = this.currentStage;
    }
    
    finalizeStage(stage) {
        stage.totalMass = stage.dryMass + stage.fuelMass;
        stage.fuelConsumptionRate = stage.thrust / (3000 * 9.81); // Estimativa baseada em ISP
    }
    
    getCurrentStage() {
        if (this.stages.length === 0 || this.currentStage >= this.stages.length) {
            return null;
        }
        return this.stages[this.currentStage];
    }
    
    getGravityAtAltitude(altitude) {
        // Calcular força gravitacional com base na altitude
        const r = this.EARTH_RADIUS + altitude;
        return (this.G * this.EARTH_MASS) / (r * r);
    }
    
    getAirDensityAtAltitude(altitude) {
        // Modelo simplificado de densidade do ar
        if (altitude > 100000) { // Acima de 100km (espaço)
            return 0;
        }
        
        // Modelo exponencial simplificado da atmosfera
        return this.AIR_DENSITY_SEA_LEVEL * Math.exp(-altitude / 8500);
    }
    
    calculateDrag(velocity, altitude) {
        const airDensity = this.getAirDensityAtAltitude(altitude);
        return 0.5 * airDensity * velocity * velocity * this.dragCoefficient * this.crossSectionalArea;
    }
    
    stageJettison() {
        // Atualizar o estado do jogo
        this.gameState.missionPhase.stageSeparated = true;
        
        // Incrementar o estágio atual
        this.currentStage++;
        
        if (this.currentStage < this.stages.length) {
            // Atualizar dados do estágio atual
            this.gameState.missionPhase.currentStage = this.currentStage;
            
            // Registrar evento
            this.gameState.logEvent({
                type: 'stage_separation',
                stage: this.currentStage,
                altitude: this.altitude / 1000, // km
                time: this.gameState.flight.missionTime
            });
            
            return true;
        } else {
            // Sem mais estágios
            this.thrust = 0;
            this.fuel = 0;
            
            // Atualizar estado do jogo
            this.gameState.flight.status = 'coasting';
            
            // Registrar evento
            this.gameState.logEvent({
                type: 'all_stages_exhausted',
                altitude: this.altitude / 1000, // km
                time: this.gameState.flight.missionTime
            });
            
            return false;
        }
    }
    
    simulateStep(deltaTime) {
        // Verificar estado
        if (this.gameState.flight.status !== 'flying') {
            return this.getCurrentState();
        }
        
        // Processar inputs de controle do usuário
        this.processControls(deltaTime);
        
        const stage = this.getCurrentStage();
        
        // Verificar combustível e estágio atual
        if (stage && this.fuel > 0) {
            // Calcular consumo de combustível
            const fuelUsed = this.fuelConsumptionRate * this.throttle * deltaTime;
            this.fuel = Math.max(0, this.fuel - fuelUsed);
            
            // Atualizar massa
            const currentMass = this.getTotalMass();
            
            // Calcular forças
            const gravity = this.getGravityAtAltitude(this.altitude);
            const dragForce = this.calculateDrag(this.velocity, this.altitude);
            const effectiveThrust = this.thrust * this.throttle;
            
            // Calcular vetor de empuxo
            const thrustVector = this.calculateThrustVector(effectiveThrust);
            
            // Calcular aceleração vertical
            this.acceleration = (thrustVector.y - dragForce) / currentMass - gravity;
            
            // Atualizar velocidade e altitude
            this.velocity += this.acceleration * deltaTime;
            this.altitude += this.velocity * deltaTime;
            
            // Atualizar posição lateral
            this.updateLateralPosition(deltaTime, thrustVector);
            
            // Verificar se o combustível acabou
            if (this.fuel <= 0) {
                this.stageJettison();
            }
        } else {
            // Sem empuxo, apenas gravidade e arrasto
            const gravity = this.getGravityAtAltitude(this.altitude);
            const dragForce = this.calculateDrag(this.velocity, this.altitude);
            const currentMass = this.getTotalMass();
            
            // Calcular aceleração
            this.acceleration = -dragForce / currentMass - gravity;
            
            // Atualizar velocidade e altitude
            this.velocity += this.acceleration * deltaTime;
            this.altitude += this.velocity * deltaTime;
            
            // Atualizar posição lateral com menor controle
            this.updateLateralPosition(deltaTime);
        }
        
        // Retornar estado atual
        return this.getCurrentState();
    }
    
    processControls(deltaTime) {
        if (!this.gameState.flight) return;
        
        // Atualizar throttle
        this.throttle = this.gameState.flight.throttle / 100;
        
        // Processar entradas de controle com amortecimento
        const dampingFactor = Math.pow(this.STABILIZATION_FACTOR, deltaTime * 60);
        
        // Pitch (W/S)
        const targetPitch = this.gameState.flight.pitch * this.CONTROL_SENSITIVITY;
        this.angularVelocity.pitch = (targetPitch - this.orientation.pitch) * (1 - dampingFactor);
        this.orientation.pitch += this.angularVelocity.pitch * deltaTime;
        
        // Yaw (A/D)
        const targetYaw = this.gameState.flight.yaw * this.CONTROL_SENSITIVITY;
        this.angularVelocity.yaw = (targetYaw - this.orientation.yaw) * (1 - dampingFactor);
        this.orientation.yaw += this.angularVelocity.yaw * deltaTime;
        
        // Roll (Q/E)
        const targetRoll = this.gameState.flight.roll * this.CONTROL_SENSITIVITY;
        this.angularVelocity.roll = (targetRoll - this.orientation.roll) * (1 - dampingFactor);
        this.orientation.roll += this.angularVelocity.roll * deltaTime;
        
        // Limitar ângulos
        this.orientation.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.orientation.pitch));
        this.orientation.yaw = ((this.orientation.yaw + Math.PI) % (2 * Math.PI)) - Math.PI;
        this.orientation.roll = ((this.orientation.roll + Math.PI) % (2 * Math.PI)) - Math.PI;
        
        // Atualizar direção do foguete
        this.updateDirection();
    }
    
    updateDirection() {
        // Criar matriz de rotação usando quaternions para evitar gimbal lock
        const quaternion = new THREE.Quaternion();
        const euler = new THREE.Euler(
            this.orientation.pitch,
            this.orientation.yaw,
            this.orientation.roll,
            'YXZ' // Ordem de rotação: primeiro yaw, depois pitch, por fim roll
        );
        quaternion.setFromEuler(euler);
        
        // Vetor base apontando para cima
        const baseVector = new THREE.Vector3(0, 1, 0);
        
        // Aplicar rotação
        baseVector.applyQuaternion(quaternion);
        
        // Atualizar direção
        this.direction.x = baseVector.x;
        this.direction.y = baseVector.y;
        this.direction.z = baseVector.z;
        
        // Normalizar o vetor de direção
        const magnitude = Math.sqrt(
            this.direction.x * this.direction.x +
            this.direction.y * this.direction.y +
            this.direction.z * this.direction.z
        );
        
        if (magnitude > 0) {
            this.direction.x /= magnitude;
            this.direction.y /= magnitude;
            this.direction.z /= magnitude;
        }
    }
    
    calculateThrustVector(thrust) {
        // Calcular vetor de empuxo considerando a orientação do foguete
        return {
            x: thrust * this.direction.x,
            y: thrust * this.direction.y,
            z: thrust * this.direction.z
        };
    }
    
    updateLateralPosition(deltaTime, thrustVector = null) {
        const lateralDamping = 0.98; // Fator de amortecimento para movimento lateral
        
        if (thrustVector) {
            // Movimento lateral com empuxo
            this.position.x += (thrustVector.x / this.getTotalMass()) * deltaTime * deltaTime;
            this.position.z += (thrustVector.z / this.getTotalMass()) * deltaTime * deltaTime;
        }
        
        // Aplicar amortecimento
        this.position.x *= lateralDamping;
        this.position.z *= lateralDamping;
    }
    
    getCurrentState() {
        return {
            altitude: this.altitude / 1000, // Converter para km
            velocity: this.velocity,
            acceleration: this.acceleration,
            fuel: this.fuel,
            position: this.position,
            orientation: this.orientation,
            angularVelocity: this.angularVelocity,
            throttle: this.throttle
        };
    }
    
    setThrottle(throttlePercent) {
        // Ajustar potência do motor (0-100%)
        this.throttle = Math.max(0, Math.min(1, throttlePercent / 100));
        this.gameState.flight.throttle = throttlePercent;
    }
    
    getCurrentVelocity() {
        return this.velocity;
    }
    
    getTotalMass() {
        // Calcular massa total atual (massa seca + combustível restante)
        let totalMass = 0;
        
        // Adicionar massas dos estágios
        for (let i = this.currentStage; i < this.stages.length; i++) {
            const stage = this.stages[i];
            totalMass += stage.dryMass;
            
            // Apenas o estágio atual tem combustível ativo
            if (i === this.currentStage) {
                totalMass += stage.fuelMass;
            }
        }
        
        return totalMass;
    }
} 