export class EngineController {
    constructor(gameState, rocketFactory) {
        this.gameState = gameState;
        this.rocketFactory = rocketFactory;
        this.engineParts = [];
    }

    findEngines(rocket) {
        // Percorrer hierarquia do foguete para encontrar motores
        this.engineParts = [];
        
        rocket.traverse(child => {
            if (child.userData && child.userData.partType === 'engine') {
                this.engineParts.push(child);
            }
        });
        
        return this.engineParts;
    }

    activateEngines() {
        // Ativar chamas em todos os motores
        this.engineParts.forEach(engine => {
            this.rocketFactory.activateEngineFlame(engine, this.gameState.flight.throttle / 100);
        });
    }

    updateEngines() {
        // Atualizar chamas dos motores com base no throttle atual
        if (this.gameState.flight.status === 'flying' || 
            this.gameState.flight.status === 'launching') {
            this.engineParts.forEach(engine => {
                this.rocketFactory.activateEngineFlame(engine, this.gameState.flight.throttle / 100);
            });
        } else {
            // Desativar chamas se não estiver voando
            this.engineParts.forEach(engine => {
                this.rocketFactory.deactivateEngineFlame(engine);
            });
        }
    }

    deactivateEngines() {
        // Desativar chamas em todos os motores
        this.engineParts.forEach(engine => {
            this.rocketFactory.deactivateEngineFlame(engine);
        });
    }
} 