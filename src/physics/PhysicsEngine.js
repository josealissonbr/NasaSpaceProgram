export class PhysicsEngine {
    constructor() {
        // Constantes físicas
        this.G = 6.67430e-11; // Constante gravitacional universal em m^3 kg^-1 s^-2
        
        // Configurações do planeta
        this.planetMass = 5.97e24; // kg (Terra por padrão)
        this.planetRadius = 6371; // km (Terra por padrão)
        
        // Configurações do foguete
        this.rocketMass = 1000; // kg
        this.rocketDryMass = 500; // kg (sem combustível)
        this.maxThrust = 20000; // N
        
        // Estado atual da simulação
        this.state = {
            altitude: 0, // km
            velocity: 0, // m/s
            acceleration: 0, // m/s^2
            time: 0, // s
            orbit: false
        };
    }
    
    initialize(config) {
        // Configurar propriedades a partir do objeto de configuração
        if (config) {
            if (config.rocketMass) this.rocketMass = config.rocketMass;
            if (config.rocketDryMass) this.rocketDryMass = config.rocketDryMass;
            if (config.fuel) this.initialFuel = config.fuel;
            if (config.planetMass) this.planetMass = config.planetMass;
            if (config.planetRadius) this.planetRadius = config.planetRadius;
            if (config.maxThrust) this.maxThrust = config.maxThrust;
        }
        
        // Calcular empuxo com base na proporção motor/massa 
        // (simplificação: cada unidade de motor produz X newtons de empuxo)
        this.maxThrust = 15000 * Math.max(1, (this.rocketMass / 1000));
        
        // Reiniciar o estado
        this.resetState();
    }
    
    resetState() {
        this.state = {
            altitude: 0,
            velocity: 0,
            acceleration: 0,
            time: 0,
            orbit: false
        };
    }
    
    updateRocketMass(newMass) {
        this.rocketMass = newMass;
    }
    
    update(deltaTime, controls) {
        // Extrair controles ou usar valores padrão
        const throttle = controls?.throttle ?? 0;
        this.state.altitude = controls?.altitude ?? this.state.altitude;
        
        // Atualizar tempo
        this.state.time += deltaTime;
        
        // Calcular força gravitacional
        const distance = (this.planetRadius + this.state.altitude) * 1000; // km para m
        const gravityForce = this.calculateGravity(distance);
        
        // Calcular empuxo do foguete
        const thrustForce = this.calculateThrust(throttle);
        
        // Força resultante (positiva = para cima)
        const netForce = thrustForce - gravityForce;
        
        // Calcular aceleração (F = ma)
        this.state.acceleration = netForce / this.rocketMass;
        
        // Atualizar velocidade (v = v0 + a*t)
        this.state.velocity += this.state.acceleration * deltaTime;
        
        // Atualizar altitude (h = h0 + v*t + 0.5*a*t^2)
        const deltaAltitude = (this.state.velocity * deltaTime + 0.5 * this.state.acceleration * deltaTime * deltaTime) / 1000; // m para km
        this.state.altitude += deltaAltitude;
        
        // Verificar colisão com o planeta
        if (this.state.altitude < 0) {
            this.state.altitude = 0;
            this.state.velocity = 0;
            this.state.acceleration = 0;
        }
        
        // Verificar condições de órbita
        this.checkOrbit();
        
        // Retornar o estado atual
        return { ...this.state };
    }
    
    calculateGravity(distance) {
        // Lei da Gravitação Universal de Newton: F = G * (m1 * m2) / r^2
        return this.G * (this.planetMass * this.rocketMass) / (distance * distance);
    }
    
    calculateThrust(throttle) {
        // Empuxo com base no acelerador (throttle)
        return this.maxThrust * throttle;
    }
    
    checkOrbit() {
        // Simplificação para determinar se o foguete está em órbita
        // Velocidade orbital = sqrt(G * M / r)
        const distance = (this.planetRadius + this.state.altitude) * 1000; // km para m
        const orbitalVelocity = Math.sqrt(this.G * this.planetMass / distance);
        
        // Verificar se altitude é suficiente e velocidade é próxima da orbital
        if (this.state.altitude > 100 && // Acima da atmosfera
            Math.abs(this.state.velocity - orbitalVelocity) / orbitalVelocity < 0.1) { // Velocidade dentro de 10% da orbital
            this.state.orbit = true;
        }
    }
    
    // Métodos para cálculos mais detalhados de trajetória orbital
    calculateOrbitalParameters() {
        // Seria usado para cálculos mais avançados de elementos orbitais
        // como semi-eixo maior, excentricidade, inclinação, etc.
        // Simplificado para a versão atual
        
        const distance = (this.planetRadius + this.state.altitude) * 1000; // km para m
        const orbitalVelocity = Math.sqrt(this.G * this.planetMass / distance);
        
        return {
            orbitalVelocity: orbitalVelocity,
            escapeVelocity: Math.sqrt(2) * orbitalVelocity,
            period: 2 * Math.PI * distance / orbitalVelocity / 60, // em minutos
            altitude: this.state.altitude
        };
    }
} 