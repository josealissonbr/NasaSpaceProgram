export class Config {
    constructor() {
        // Configurações gerais
        this.debug = false;
        
        // Configurações de renderização
        this.renderer = {
            antialias: true,
            shadows: true,
            pixelRatio: window.devicePixelRatio,
            clearColor: 0x000000
        };
        
        // Configurações da câmera
        this.camera = {
            fov: 75,
            near: 0.1,
            far: 100000,
            initialPosition: { x: 0, y: 5, z: 10 }
        };
        
        // Configurações da física
        this.physics = {
            gravity: -9.81,
            timeStep: 1/60,
            maxSubSteps: 3
        };
        
        // Configurações do ambiente espacial
        this.space = {
            earthRadius: 6371, // km
            atmosphereHeight: 100, // km
            spaceThreshold: 100, // Altura (km) onde considera-se que o foguete atingiu o espaço
            earthRotationSpeed: 0.1
        };
        
        // Configurações do foguete
        this.rocket = {
            maxFuel: 1000,
            maxThrust: 500,
            baseMass: 100, // kg
            dragCoefficient: 0.1
        };
        
        // Configurações de peças do foguete
        this.rocketParts = {
            maxEngines: 3,
            maxFuelTanks: 3,
            maxStages: 3,
            maxPayloads: 1
        };
        
        // Restrições de lançamento
        this.launchConstraints = {
            minThrust: 120, // % da massa total
            minFuel: 100,
            minStability: 0.5
        };
    }
    
    // Método para carregar configurações de um arquivo externo (implementar futuramente)
    async loadFromFile(path) {
        try {
            const response = await fetch(path);
            const config = await response.json();
            
            // Mesclar configurações
            Object.assign(this, config);
            
            return true;
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            return false;
        }
    }
} 