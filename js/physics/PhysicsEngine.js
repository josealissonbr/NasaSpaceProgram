export class PhysicsEngine {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Constantes físicas
        this.G = 6.67430e-11; // Constante gravitacional universal em m³kg⁻¹s⁻²
        this.EARTH_RADIUS = 6371000; // Raio da Terra em metros
        this.EARTH_MASS = 5.972e24; // Massa da Terra em kg
        this.AIR_DENSITY_SEA_LEVEL = 1.225; // Densidade do ar ao nível do mar em kg/m³
        
        // Constantes para controle manual
        this.CONTROL_SENSITIVITY = 0.5; // Sensibilidade dos controles
        this.MAX_ANGULAR_VELOCITY = 0.1; // Velocidade angular máxima
        this.STABILIZATION_FACTOR = 0.9; // Fator de estabilização automática
        
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
            return {
                altitude: this.altitude / 1000, // Converter para km
                velocity: this.velocity,
                acceleration: this.acceleration,
                fuel: this.fuel,
                position: this.position,
                orientation: this.orientation
            };
        }
        
        // Processar inputs de controle do usuário
        this.processControls(deltaTime);
        
        const stage = this.getCurrentStage();
        
        // Verificar se há um estágio atual
        if (!stage) {
            // Apenas gravidade e arrasto
            const gravity = this.getGravityAtAltitude(this.altitude);
            const dragForce = this.calculateDrag(this.velocity, this.altitude);
            
            // Calcular aceleração (apenas gravidade e arrasto)
            this.acceleration = -gravity - (dragForce / this.mass);
            
            // Atualizar velocidade e posição
            this.velocity += this.acceleration * deltaTime;
            this.altitude += this.velocity * deltaTime;
            
            // Atualizar posição lateral baseada na orientação
            this.updateLateralPosition(deltaTime);
            
            // Verificar colisão com o solo
            if (this.altitude < 0) {
                this.altitude = 0;
                this.velocity = 0;
                this.acceleration = 0;
                this.gameState.flight.status = 'crashed';
            }
        } else {
            // Obter o throttle diretamente do gameState para controle manual
            this.throttle = this.gameState.flight.throttle / 100;
            
            // Calcular consumo de combustível
            const fuelUsed = stage.fuelConsumptionRate * this.throttle * deltaTime;
            
            // Verificar se há combustível suficiente
            if (this.fuel <= 0 || stage.fuelMass <= 0) {
                // Sem combustível - verificar troca de estágio
                if (this.currentStage < this.stages.length - 1) {
                    this.stageJettison();
                } else {
                    // Último estágio sem combustível
                    this.thrust = 0;
                    this.gameState.flight.throttle = 0;
                    this.throttle = 0;
                }
            } else if (fuelUsed > this.fuel) {
                // Usar o combustível restante
                const partialThrottle = this.fuel / (stage.fuelConsumptionRate * deltaTime);
                this.thrust = stage.thrust * partialThrottle;
                this.fuel = 0;
                stage.fuelMass = 0;
            } else {
                // Combustível suficiente
                this.fuel -= fuelUsed;
                stage.fuelMass -= fuelUsed;
                this.thrust = stage.thrust * this.throttle;
            }
            
            // Calcular massa atual
            const currentMass = this.getTotalMass();
            
            // Calcular forças com base na orientação
            const gravity = this.getGravityAtAltitude(this.altitude);
            const dragForce = this.calculateDrag(this.velocity, this.altitude);
            
            // Decompor o empuxo com base na orientação
            const thrustVector = this.calculateThrustVector(this.thrust);
            
            // Calcular aceleração resultante (F = ma)
            const verticalThrust = thrustVector.y;
            this.acceleration = (verticalThrust / currentMass) - gravity - (dragForce / currentMass);
            
            // Atualizar velocidade e posição
            this.velocity += this.acceleration * deltaTime;
            this.altitude += this.velocity * deltaTime;
            
            // Atualizar posição lateral baseada na orientação e empuxo
            this.updateLateralPosition(deltaTime, thrustVector);
            
            // Verificar colisão com o solo
            if (this.altitude < 0) {
                this.altitude = 0;
                this.velocity = 0;
                this.acceleration = 0;
                this.gameState.flight.status = 'crashed';
                
                this.gameState.logEvent({
                    type: 'crash',
                    time: this.gameState.flight.missionTime
                });
            }
        }
        
        // Verificar se atingiu o espaço (100km)
        if (this.altitude >= 100000 && !this.gameState.flight.reachedSpace) {
            this.gameState.flight.reachedSpace = true;
            
            this.gameState.logEvent({
                type: 'reached_space',
                altitude: this.altitude / 1000, // km
                time: this.gameState.flight.missionTime
            });
        }
        
        // Retornar o estado atual da simulação
        return {
            altitude: this.altitude / 1000, // Converter para km
            velocity: this.velocity,
            acceleration: this.acceleration,
            fuel: this.fuel,
            position: this.position,
            orientation: this.orientation
        };
    }
    
    processControls(deltaTime) {
        // Obter os valores de controle atuais do gameState
        const { pitch, yaw, roll } = this.gameState.flight;
        
        // Atualizar velocidades angulares com base nos inputs do usuário
        this.angularVelocity.pitch += pitch * this.CONTROL_SENSITIVITY * deltaTime;
        this.angularVelocity.yaw += yaw * this.CONTROL_SENSITIVITY * deltaTime;
        this.angularVelocity.roll += roll * this.CONTROL_SENSITIVITY * deltaTime;
        
        // Limitar velocidades angulares máximas
        this.angularVelocity.pitch = Math.max(-this.MAX_ANGULAR_VELOCITY, 
                                         Math.min(this.MAX_ANGULAR_VELOCITY, this.angularVelocity.pitch));
        this.angularVelocity.yaw = Math.max(-this.MAX_ANGULAR_VELOCITY, 
                                       Math.min(this.MAX_ANGULAR_VELOCITY, this.angularVelocity.yaw));
        this.angularVelocity.roll = Math.max(-this.MAX_ANGULAR_VELOCITY, 
                                        Math.min(this.MAX_ANGULAR_VELOCITY, this.angularVelocity.roll));
        
        // Aplicar estabilização natural
        this.angularVelocity.pitch *= this.STABILIZATION_FACTOR;
        this.angularVelocity.yaw *= this.STABILIZATION_FACTOR;
        this.angularVelocity.roll *= this.STABILIZATION_FACTOR;
        
        // Atualizar orientação
        this.orientation.pitch += this.angularVelocity.pitch * deltaTime;
        this.orientation.yaw += this.angularVelocity.yaw * deltaTime;
        this.orientation.roll += this.angularVelocity.roll * deltaTime;
        
        // Atualizar vetor de direção
        this.updateDirection();
    }
    
    updateDirection() {
        // Calcular o vetor de direção com base na orientação atual
        // Começando com direção padrão (para cima)
        let dirX = 0;
        let dirY = 1;
        let dirZ = 0;
        
        // Aplicar rotação de pitch (em torno do eixo X)
        const pitchRad = this.orientation.pitch;
        const tempY = dirY * Math.cos(pitchRad) - dirZ * Math.sin(pitchRad);
        const tempZ = dirY * Math.sin(pitchRad) + dirZ * Math.cos(pitchRad);
        dirY = tempY;
        dirZ = tempZ;
        
        // Aplicar rotação de yaw (em torno do eixo Y)
        const yawRad = this.orientation.yaw;
        const tempX = dirX * Math.cos(yawRad) + dirZ * Math.sin(yawRad);
        const tempZ2 = -dirX * Math.sin(yawRad) + dirZ * Math.cos(yawRad);
        dirX = tempX;
        dirZ = tempZ2;
        
        // Normalizar o vetor
        const magnitude = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
        
        this.direction.x = dirX / magnitude;
        this.direction.y = dirY / magnitude;
        this.direction.z = dirZ / magnitude;
    }
    
    calculateThrustVector(thrust) {
        // Calcular componentes do empuxo com base na direção atual
        return {
            x: thrust * this.direction.x,
            y: thrust * this.direction.y,
            z: thrust * this.direction.z
        };
    }
    
    updateLateralPosition(deltaTime, thrustVector = null) {
        // Se houver um vetor de empuxo, usar suas componentes x e z
        if (thrustVector) {
            const lateralAccelX = thrustVector.x / this.mass;
            const lateralAccelZ = thrustVector.z / this.mass;
            
            // Aplicar aceleração lateral
            this.position.x += lateralAccelX * deltaTime * deltaTime * 0.5;
            this.position.z += lateralAccelZ * deltaTime * deltaTime * 0.5;
        }
        
        // Limitar o alcance lateral para simplificar
        const maxRange = 1000; // metros
        this.position.x = Math.max(-maxRange, Math.min(maxRange, this.position.x));
        this.position.z = Math.max(-maxRange, Math.min(maxRange, this.position.z));
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