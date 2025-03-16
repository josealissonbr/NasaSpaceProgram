import { THREE } from '../utils/ThreeImports.js';

export class GameState {
    constructor() {
        // Estados possíveis do jogo
        this.STATES = {
            LOADING: 'loading',
            MAIN_MENU: 'main_menu',
            ROCKET_BUILDER: 'rocket_builder',
            LAUNCH_SIMULATION: 'launch_simulation',
            SPACE_EXPLORATION: 'space_exploration'
        };
        
        // Estado atual
        this.currentState = this.STATES.LOADING;
        
        // Clock para cálculos de tempo
        this.clock = new THREE.Clock();
        
        // Dados do foguete
        this.rocket = {
            parts: [],
            totalMass: 0,
            totalFuel: 0,
            thrust: 0,
            stability: 0,
            height: 0,
            valid: false
        };
        
        // Dados do voo
        this.flight = {
            altitude: 0,
            velocity: 0,
            acceleration: 0,
            fuel: 0,
            throttle: 100, // porcentagem
            angle: 90, // ângulo de lançamento em graus (90 = vertical)
            reachedSpace: false,
            status: 'pre-launch', // 'pre-launch', 'launching', 'flying', 'orbit', 'crashed', 'success'
            missionTime: 0
        };
        
        // Fases da missão
        this.missionPhase = {
            currentStage: 0,
            stageSeparated: false,
            maxStages: 1
        };
        
        // Registrador de eventos
        this.events = [];
        
        // Estatísticas do jogo
        this.stats = {
            successfulLaunches: 0,
            totalLaunches: 0,
            maxAltitude: 0,
            unlocked: {
                parts: [],
                missions: []
            }
        };
    }
    
    // Método para transição de estado
    setState(newState) {
        if (this.STATES[newState] || Object.values(this.STATES).includes(newState)) {
            const oldState = this.currentState;
            this.currentState = newState;
            
            this.logEvent({
                type: 'state_change',
                from: oldState,
                to: newState,
                time: this.clock.getElapsedTime()
            });
            
            return true;
        }
        
        console.error(`Estado inválido: ${newState}`);
        return false;
    }
    
    // Método para verificar o estado atual
    isState(state) {
        return this.currentState === state;
    }
    
    // Redefinir o estado do foguete
    resetRocket() {
        this.rocket = {
            parts: [],
            totalMass: 0,
            totalFuel: 0,
            thrust: 0,
            stability: 0,
            height: 0,
            valid: false
        };
    }
    
    // Redefinir o estado do voo
    resetFlight() {
        this.flight = {
            altitude: 0,
            velocity: 0,
            acceleration: 0,
            fuel: this.rocket.totalFuel,
            throttle: 100,
            angle: 90,
            reachedSpace: false,
            status: 'pre-launch',
            missionTime: 0
        };
        
        this.missionPhase = {
            currentStage: 0,
            stageSeparated: false,
            maxStages: this.calculateMaxStages()
        };
    }
    
    // Calcular o número máximo de estágios
    calculateMaxStages() {
        let stages = 0;
        this.rocket.parts.forEach(part => {
            if (part.type === 'stage_separator') {
                stages++;
            }
        });
        
        return stages + 1; // Sempre há pelo menos um estágio
    }
    
    // Adicionar um evento ao log
    logEvent(event) {
        this.events.push({
            ...event,
            timestamp: new Date().toISOString()
        });
        
        if (this.events.length > 1000) {
            this.events.shift(); // Manter o log em um tamanho razoável
        }
    }
    
    // Verificar se o foguete atingiu o espaço
    checkSpaceReached(altitude) {
        if (!this.flight.reachedSpace && altitude >= 100) { // 100 km (linha de Kármán)
            this.flight.reachedSpace = true;
            
            this.logEvent({
                type: 'reached_space',
                altitude,
                time: this.flight.missionTime
            });
            
            return true;
        }
        
        return false;
    }
    
    // Salvar estado do jogo
    saveGame() {
        try {
            const saveData = {
                stats: this.stats,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('nasa_space_program_save', JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Erro ao salvar jogo:', error);
            return false;
        }
    }
    
    // Carregar estado do jogo
    loadGame() {
        try {
            const saveData = localStorage.getItem('nasa_space_program_save');
            
            if (saveData) {
                const parsedData = JSON.parse(saveData);
                this.stats = parsedData.stats;
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erro ao carregar jogo:', error);
            return false;
        }
    }
} 