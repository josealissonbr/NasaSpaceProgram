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
        
        // Flag para verificar se os elementos da UI foram carregados
        this.uiLoaded = false;
        
        // Inicializar UI
        this.init();
        
        // Registrar para eventos de mudança de estatísticas
        if (this.gameState && typeof this.gameState.registerStatsChangedCallback === 'function') {
            this.gameState.registerStatsChangedCallback(() => {
                this.updateRocketStats();
            });
        }
    }
    
    init() {
        // Verificar se todos os elementos da UI foram encontrados
        let allElementsFound = true;
        
        for (const key in this.elements) {
            if (!this.elements[key]) {
                console.error(`Elemento UI não encontrado: ${key}`);
                allElementsFound = false;
            }
        }
        
        this.uiLoaded = allElementsFound;
        
        if (this.uiLoaded) {
            console.log('Interface do usuário inicializada com sucesso');
        } else {
            console.error('Falha ao inicializar interface do usuário - alguns elementos não foram encontrados');
        }
    }
    
    // Mostrar e esconder seções da UI
    
    showMainMenu() {
        this.hideAllSections();
        
        if (this.elements.mainMenu) {
            this.elements.mainMenu.classList.remove('hidden');
        }
        
        if (this.gameState && this.gameState.setState) {
            this.gameState.setState(this.gameState.STATES.MAIN_MENU);
        }
        
        console.log('Menu principal exibido');
    }
    
    showRocketBuilder() {
        // Verificar se a UI foi carregada
        if (!this.uiLoaded) {
            console.error('UI não inicializada corretamente');
            return;
        }
        
        this.hideAllSections();
        
        if (this.elements.rocketBuilder) {
            this.elements.rocketBuilder.classList.remove('hidden');
        }
        
        if (this.gameState && this.gameState.setState) {
            this.gameState.setState(this.gameState.STATES.ROCKET_BUILDER);
        }
        
        // Inicializar o construtor de foguetes
        this.populateRocketParts();
        this.updateRocketStats();
        
        // Inicializar a cena 3D
        if (this.sceneManager && this.sceneManager.showRocketBuilder) {
            try {
                this.sceneManager.showRocketBuilder();
                console.log('Construtor de foguete exibido');
            } catch (error) {
                console.error('Erro ao exibir cena do construtor de foguete:', error);
            }
        } else {
            console.error('SceneManager não inicializado corretamente');
        }
    }
    
    showLaunchSimulation() {
        this.hideAllSections();
        
        if (this.elements.launchSimulation) {
            this.elements.launchSimulation.classList.remove('hidden');
        }
        
        if (this.gameState && this.gameState.setState) {
            this.gameState.setState(this.gameState.STATES.LAUNCH_SIMULATION);
        }
        
        // Inicializar telemetria
        this.updateTelemetry();
        
        // Inicializar a cena de lançamento
        if (this.sceneManager && this.sceneManager.startLaunchSimulation) {
            try {
                this.sceneManager.startLaunchSimulation();
                console.log('Simulação de lançamento exibida');
            } catch (error) {
                console.error('Erro ao exibir cena de lançamento:', error);
            }
        } else {
            console.error('SceneManager não inicializado corretamente');
        }
    }
    
    hideAllSections() {
        // Ocultar todos os elementos da interface
        ['loaderContainer', 'mainMenu', 'rocketBuilder', 'launchSimulation'].forEach(elementKey => {
            if (this.elements[elementKey]) {
                this.elements[elementKey].classList.add('hidden');
            }
        });
    }
    
    // Métodos para o construtor de foguetes
    
    populateRocketParts() {
        if (!this.elements.partsContainer) {
            console.error('Container de peças não encontrado');
            return;
        }
        
        try {
            // Limpar o container
            this.elements.partsContainer.innerHTML = '';
            
            // Obter peças disponíveis
            const availableParts = this.getRocketParts();
            
            if (!availableParts || availableParts.length === 0) {
                console.error('Nenhuma peça disponível');
                return;
            }
            
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
            
            console.log(`${availableParts.length} peças carregadas no construtor`);
        } catch (error) {
            console.error('Erro ao popular peças do foguete:', error);
        }
    }
    
    // Obter peças de foguete disponíveis
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
        // Verificar se a cena do construtor de foguetes existe
        if (!this.sceneManager || !this.sceneManager.scenes || !this.sceneManager.scenes.builder) {
            console.error('Cena do construtor de foguetes não encontrada');
            return;
        }
        
        try {
            console.log(`Selecionando peça: ${part.id} (${part.type})`);
            
            // Adicionar a peça ao foguete
            const added = this.sceneManager.scenes.builder.addPart(part);
            
            if (added) {
                console.log(`Peça adicionada com sucesso: ${part.id}`);
                
                // Atualizar estatísticas
                this.updateRocketStats();
                
                // Adicionar efeito de feedback visual
                const partElement = document.querySelector(`[data-part-id="${part.id}"]`);
                if (partElement) {
                    partElement.classList.add('selected');
                    setTimeout(() => {
                        partElement.classList.remove('selected');
                    }, 500);
                }
            } else {
                console.error(`Falha ao adicionar peça: ${part.id}`);
            }
        } catch (error) {
            console.error('Erro ao selecionar peça do foguete:', error);
        }
    }
    
    // Atualizar estatísticas do foguete
    updateRocketStats() {
        if (!this.elements.statsContainer || !this.gameState || !this.gameState.rocket) {
            return;
        }
        
        try {
            const { totalMass, totalFuel, thrust, stability, height, valid } = this.gameState.rocket;
            
            // Garantir que todos os valores sejam números para evitar erros no toFixed()
            const formatNumber = (value) => {
                return typeof value === 'number' ? value.toFixed(0) : '0';
            };
            
            const formatDecimal = (value) => {
                return typeof value === 'number' ? value.toFixed(1) : '0.0';
            };
            
            this.elements.statsContainer.innerHTML = `
                <h3>Estatísticas do Foguete</h3>
                <p>Massa total: ${formatNumber(totalMass)} kg</p>
                <p>Combustível: ${formatNumber(totalFuel)} unidades</p>
                <p>Empuxo total: ${formatNumber(thrust)} kN</p>
                <p>Estabilidade: ${formatDecimal(stability * 100)}%</p>
                <p>Altura: ${formatDecimal(height)} m</p>
                <p class="${valid ? 'valid' : 'invalid'}">Status: ${valid ? 'Pronto para lançamento' : 'Incompleto'}</p>
            `;
            
            // Atualizar estado do botão de lançamento
            const launchButton = document.getElementById('launch-button');
            if (launchButton) {
                launchButton.disabled = !valid;
            }
        } catch (error) {
            console.error('Erro ao atualizar estatísticas do foguete:', error);
        }
    }
    
    // Métodos para a simulação de lançamento
    
    startLaunch() {
        if (!this.gameState || !this.gameState.rocket) {
            console.error('GameState não inicializado corretamente');
            return;
        }
        
        if (!this.gameState.rocket.valid) {
            alert('Seu foguete não está pronto para o lançamento. Verifique o design.');
            return;
        }
        
        this.showLaunchSimulation();
    }
    
    updateTelemetry() {
        if (!this.elements.telemetry || !this.gameState || !this.gameState.flight) {
            return;
        }
        
        try {
            // Atualizar dados de telemetria
            const { altitude, velocity, acceleration, fuel, throttle, angle, status, missionTime } = this.gameState.flight;
            
            // Garantir que todos os valores sejam números
            const formatNumber = (value) => {
                return typeof value === 'number' ? value.toFixed(1) : '0.0';
            };
            
            this.elements.telemetry.innerHTML = `
                <h3>Telemetria de Voo</h3>
                <p>T+: ${formatNumber(missionTime)}s</p>
                <p>Altitude: ${formatNumber(altitude)} km</p>
                <p>Velocidade: ${formatNumber(velocity)} m/s</p>
                <p>Aceleração: ${formatNumber(acceleration)} m/s²</p>
                <p>Combustível: ${formatNumber(fuel)} / ${formatNumber(this.gameState.rocket.totalFuel)}</p>
                <p>Potência: ${throttle || 0}%</p>
                <p>Ângulo: ${formatNumber(angle)}°</p>
                <p>Status: ${this.getStatusText(status)}</p>
            `;
        } catch (error) {
            console.error('Erro ao atualizar telemetria:', error);
        }
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
        
        return statusMap[status] || status || 'Desconhecido';
    }
    
    abortLaunch() {
        if (!this.sceneManager || !this.sceneManager.abortLaunch) {
            console.error('SceneManager não inicializado corretamente');
            return;
        }
        
        try {
            this.sceneManager.abortLaunch();
            
            setTimeout(() => {
                if (confirm('Lançamento abortado. Voltar ao menu principal?')) {
                    this.showMainMenu();
                }
            }, 2000);
        } catch (error) {
            console.error('Erro ao abortar lançamento:', error);
        }
    }
    
    // Método de atualização geral chamado a cada frame
    update() {
        if (!this.gameState) {
            return;
        }
        
        try {
            // Atualizar UI com base no estado atual
            const currentState = this.gameState.currentState;
            
            if (currentState === this.gameState.STATES.ROCKET_BUILDER) {
                // Não atualizar estatísticas a cada frame, apenas quando solicitado
                // this.updateRocketStats();
            } else if (currentState === this.gameState.STATES.LAUNCH_SIMULATION || 
                       currentState === this.gameState.STATES.SPACE_EXPLORATION) {
                this.updateTelemetry();
            }
        } catch (error) {
            console.error('Erro ao atualizar interface:', error);
        }
    }
} 