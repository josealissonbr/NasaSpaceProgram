export class PhysicsEngine {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Constantes físicas
        this.G = 6.67430e-11; // Constante gravitacional universal em m³kg⁻¹s⁻²
        this.EARTH_RADIUS = 6371000; // Raio da Terra em metros
        this.EARTH_MASS = 5.972e24; // Massa da Terra em kg
        this.AIR_DENSITY_SEA_LEVEL = 1.225; // Densidade do ar ao nível do mar em kg/m³
        
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
        this.throttle = 1.0; // 0-1
        this.gravity = 9.81; // m/s²
        
        // Configuração dos estágios
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
                fuel: this.fuel
            };
        }
        
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
            
            // Verificar colisão com o solo
            if (this.altitude < 0) {
                this.altitude = 0;
                this.velocity = 0;
                this.acceleration = 0;
                this.gameState.flight.status = 'crashed';
            }
        } else {
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
            
            // Calcular forças
            const gravity = this.getGravityAtAltitude(this.altitude);
            const dragForce = this.calculateDrag(this.velocity, this.altitude);
            const thrustForce = this.thrust;
            
            // Calcular aceleração resultante (F = ma)
            this.acceleration = (thrustForce / currentMass) - gravity - (dragForce / currentMass);
            
            // Atualizar velocidade e posição
            this.velocity += this.acceleration * deltaTime;
            this.altitude += this.velocity * deltaTime;
            
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
            
            // Verificar se atingiu o espaço (100km)
            if (this.altitude >= 100000 && !this.gameState.flight.reachedSpace) {
                this.gameState.flight.reachedSpace = true;
                
                this.gameState.logEvent({
                    type: 'reached_space',
                    altitude: this.altitude / 1000, // km
                    time: this.gameState.flight.missionTime
                });
            }
            
            // Verificar órbita (simplificado) - se altura > 200km e velocidade > 7800 m/s
            if (this.altitude > 200000 && this.velocity > 7800) {
                this.gameState.flight.status = 'orbit';
                
                this.gameState.logEvent({
                    type: 'orbit_achieved',
                    altitude: this.altitude / 1000, // km
                    velocity: this.velocity,
                    time: this.gameState.flight.missionTime
                });
            }
        }
        
        // Atualizar estado do jogo
        this.gameState.flight.altitude = this.altitude / 1000; // Converter para km
        this.gameState.flight.velocity = this.velocity;
        this.gameState.flight.acceleration = this.acceleration;
        this.gameState.flight.fuel = this.fuel;
        
        return {
            altitude: this.altitude / 1000, // Converter para km
            velocity: this.velocity,
            acceleration: this.acceleration,
            fuel: this.fuel
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