export class UIController {
    constructor(gameState, sceneManager) {
        this.gameState = gameState;
        this.sceneManager = sceneManager;
        
        // Elementos da UI
        this.elements = {
            loaderContainer: document.getElementById('loader-container'),
            mainMenu: document.getElementById('main-menu'),
            rocketBuilder: document.getElementById('rocket-builder'),
            launchSimulation: document.getElementById('launch-simulation'),
            telemetry: document.getElementById('telemetry'),
            partsContainer: document.getElementById('parts-container'),
            statsContainer: document.getElementById('stats-container')
        };
        
        // Inicializar UI
        this.init();
    }
    
    init() {
        // Verificar se todos os elementos da UI foram encontrados
        for (const key in this.elements) {
            if (!this.elements[key]) {
                console.error(`Elemento UI não encontrado: ${key}`);
            }
        }
    }
    
    // Mostrar e esconder seções da UI
    
    showMainMenu() {
        this.hideAllSections();
        this.elements.mainMenu.classList.remove('hidden');
        this.gameState.setState(this.gameState.STATES.MAIN_MENU);
    }
    
    showRocketBuilder() {
        this.hideAllSections();
        this.elements.rocketBuilder.classList.remove('hidden');
        this.gameState.setState(this.gameState.STATES.ROCKET_BUILDER);
        
        // Inicializar o construtor de foguetes
        this.populateRocketParts();
        this.updateRocketStats();
        
        // Inicializar a cena 3D
        this.sceneManager.showRocketBuilder();
    }
    
    showLaunchSimulation() {
        this.hideAllSections();
        this.elements.launchSimulation.classList.remove('hidden');
        this.gameState.setState(this.gameState.STATES.LAUNCH_SIMULATION);
        
        // Inicializar telemetria
        this.updateTelemetry();
        
        // Inicializar a cena de lançamento
        this.sceneManager.startLaunchSimulation();
    }
    
    hideAllSections() {
        this.elements.loaderContainer.classList.add('hidden');
        this.elements.mainMenu.classList.add('hidden');
        this.elements.rocketBuilder.classList.add('hidden');
        this.elements.launchSimulation.classList.add('hidden');
    }
    
    // Métodos para o construtor de foguetes
    
    populateRocketParts() {
        if (!this.elements.partsContainer) return;
        
        // Limpar o container
        this.elements.partsContainer.innerHTML = '';
        
        // Obter peças disponíveis
        const availableParts = this.getRocketParts();
        
        // Criar elementos para cada peça
        availableParts.forEach(part => {
            const partElement = document.createElement('div');
            partElement.className = 'part-item';
            partElement.setAttribute('data-part-id', part.id);
            
            partElement.innerHTML = `
                <h3>${part.name}</h3>
                <p>${part.description}</p>
                <div class="part-stats">
                    <span>Massa: ${part.mass} kg</span>
                    ${part.fuel ? `<span>Combustível: ${part.fuel}</span>` : ''}
                    ${part.thrust ? `<span>Empuxo: ${part.thrust} kN</span>` : ''}
                </div>
            `;
            
            // Adicionar evento de clique para selecionar a peça
            partElement.addEventListener('click', () => {
                this.selectRocketPart(part);
            });
            
            this.elements.partsContainer.appendChild(partElement);
        });
    }
    
    // Obter peças de foguete disponíveis (placeholder)
    getRocketParts() {
        return [
            {
                id: 'command_module',
                name: 'Módulo de Comando',
                description: 'Módulo de controle para astronautas',
                mass: 1000,
                type: 'command'
            },
            {
                id: 'fuel_tank_small',
                name: 'Tanque de Combustível P',
                description: 'Tanque pequeno de combustível',
                mass: 400,
                fuel: 800,
                type: 'fuel_tank'
            },
            {
                id: 'fuel_tank_medium',
                name: 'Tanque de Combustível M',
                description: 'Tanque médio de combustível',
                mass: 900,
                fuel: 2000,
                type: 'fuel_tank'
            },
            {
                id: 'engine_small',
                name: 'Motor Pequeno',
                description: 'Motor de baixo empuxo',
                mass: 200,
                thrust: 150,
                type: 'engine'
            },
            {
                id: 'engine_medium',
                name: 'Motor Médio',
                description: 'Motor de empuxo médio',
                mass: 600,
                thrust: 400,
                type: 'engine'
            },
            {
                id: 'stage_separator',
                name: 'Separador de Estágio',
                description: 'Separa estágios do foguete',
                mass: 50,
                type: 'stage_separator'
            }
        ];
    }
    
    // Selecionar uma peça de foguete
    selectRocketPart(part) {
        // Adicionar a peça ao foguete
        this.sceneManager.scenes.builder.addPart(part);
        
        // Atualizar estatísticas
        this.updateRocketStats();
    }
    
    // Atualizar estatísticas do foguete
    updateRocketStats() {
        if (!this.elements.statsContainer) return;
        
        const { totalMass, totalFuel, thrust, stability, height, valid } = this.gameState.rocket;
        
        this.elements.statsContainer.innerHTML = `
            <h3>Estatísticas do Foguete</h3>
            <p>Massa total: ${totalMass.toFixed(0)} kg</p>
            <p>Combustível: ${totalFuel.toFixed(0)} unidades</p>
            <p>Empuxo total: ${thrust.toFixed(0)} kN</p>
            <p>Estabilidade: ${(stability * 100).toFixed(1)}%</p>
            <p>Altura: ${height.toFixed(1)} m</p>
            <p class="${valid ? 'valid' : 'invalid'}">Status: ${valid ? 'Pronto para lançamento' : 'Incompleto'}</p>
        `;
        
        // Atualizar estado do botão de lançamento
        const launchButton = document.getElementById('launch-button');
        if (launchButton) {
            launchButton.disabled = !valid;
        }
    }
    
    // Métodos para a simulação de lançamento
    
    startLaunch() {
        if (!this.gameState.rocket.valid) {
            alert('Seu foguete não está pronto para o lançamento. Verifique o design.');
            return;
        }
        
        this.showLaunchSimulation();
    }
    
    updateTelemetry() {
        if (!this.elements.telemetry) return;
        
        // Atualizar dados de telemetria
        const { altitude, velocity, acceleration, fuel, throttle, angle, status, missionTime } = this.gameState.flight;
        
        this.elements.telemetry.innerHTML = `
            <h3>Telemetria de Voo</h3>
            <p>T+: ${missionTime.toFixed(1)}s</p>
            <p>Altitude: ${altitude.toFixed(1)} km</p>
            <p>Velocidade: ${velocity.toFixed(1)} m/s</p>
            <p>Aceleração: ${acceleration.toFixed(1)} m/s²</p>
            <p>Combustível: ${fuel.toFixed(0)} / ${this.gameState.rocket.totalFuel.toFixed(0)}</p>
            <p>Potência: ${throttle}%</p>
            <p>Ângulo: ${angle.toFixed(1)}°</p>
            <p>Status: ${this.getStatusText(status)}</p>
        `;
    }
    
    getStatusText(status) {
        const statusMap = {
            'pre-launch': 'Pré-lançamento',
            'launching': 'Lançando',
            'flying': 'Em voo',
            'orbit': 'Em órbita',
            'crashed': 'Acidente',
            'success': 'Missão bem-sucedida',
            'aborted': 'Missão abortada'
        };
        
        return statusMap[status] || status;
    }
    
    abortLaunch() {
        this.sceneManager.abortLaunch();
        setTimeout(() => {
            if (confirm('Lançamento abortado. Voltar ao menu principal?')) {
                this.showMainMenu();
            }
        }, 2000);
    }
    
    // Método de atualização geral chamado a cada frame
    update() {
        // Atualizar UI com base no estado atual
        const currentState = this.gameState.currentState;
        
        if (currentState === this.gameState.STATES.ROCKET_BUILDER) {
            this.updateRocketStats();
        } else if (currentState === this.gameState.STATES.LAUNCH_SIMULATION || 
                  currentState === this.gameState.STATES.SPACE_EXPLORATION) {
            this.updateTelemetry();
        }
    }
} 