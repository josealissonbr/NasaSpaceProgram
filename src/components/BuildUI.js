export class BuildUI {
    constructor(containerElement) {
        this.container = containerElement;
        this.partsCatalog = {};
        this.currentCategory = null;
        this.onPartSelected = null;
        this.onLaunchClicked = null;
        this.onSaveClicked = null;
        this.onBackClicked = null;
        
        // Armazenamento de referências de elementos
        this.elements = {
            categoryTabs: {},
            partsContainer: null,
            selectionInfo: null,
            rocketStats: null,
            nameInput: null
        };
        
        // Métricas do foguete atual
        this.rocketMetrics = {
            totalMass: 0,
            dryMass: 0,
            fuelMass: 0,
            totalThrust: 0,
            totalDeltaV: 0,
            twr: 0
        };
        
        this._createUI();
    }
    
    _createUI() {
        // Limpar o container
        this.container.innerHTML = '';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.right = '0';
        this.container.style.width = '300px';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(20, 20, 40, 0.8)';
        this.container.style.padding = '20px';
        this.container.style.color = 'white';
        this.container.style.overflow = 'auto';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.zIndex = '10';
        
        // Cabeçalho
        const header = document.createElement('div');
        header.style.marginBottom = '20px';
        
        const title = document.createElement('h2');
        title.textContent = 'Construtor de Foguetes';
        title.style.margin = '0 0 10px 0';
        header.appendChild(title);
        
        // Input para nome do foguete
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Nome do Foguete:';
        nameLabel.style.display = 'block';
        nameLabel.style.marginBottom = '5px';
        header.appendChild(nameLabel);
        
        this.elements.nameInput = document.createElement('input');
        this.elements.nameInput.type = 'text';
        this.elements.nameInput.value = 'Novo Foguete';
        this.elements.nameInput.style.width = '100%';
        this.elements.nameInput.style.padding = '5px';
        this.elements.nameInput.style.backgroundColor = '#333';
        this.elements.nameInput.style.border = '1px solid #555';
        this.elements.nameInput.style.color = 'white';
        this.elements.nameInput.style.borderRadius = '4px';
        header.appendChild(this.elements.nameInput);
        
        this.container.appendChild(header);
        
        // Seção de estatísticas do foguete
        this._createRocketStats();
        
        // Abas para categorias de peças
        this._createCategoryTabs();
        
        // Contêiner para exibição de peças
        this._createPartsContainer();
        
        // Informações da peça selecionada
        this._createSelectionInfo();
        
        // Botões de ação
        this._createActionButtons();
    }
    
    _createRocketStats() {
        const statsContainer = document.createElement('div');
        statsContainer.className = 'rocket-stats';
        statsContainer.style.backgroundColor = '#1a1a2e';
        statsContainer.style.padding = '10px';
        statsContainer.style.borderRadius = '5px';
        statsContainer.style.marginBottom = '20px';
        
        const statsTitle = document.createElement('h3');
        statsTitle.textContent = 'Estatísticas do Foguete';
        statsTitle.style.fontSize = '1rem';
        statsTitle.style.margin = '0 0 10px 0';
        statsContainer.appendChild(statsTitle);
        
        this.elements.rocketStats = document.createElement('div');
        
        // Criar os itens de estatística
        const statItems = [
            { id: 'totalMass', label: 'Massa Total:', value: '0 kg' },
            { id: 'dryMass', label: 'Massa Seca:', value: '0 kg' },
            { id: 'fuelMass', label: 'Combustível:', value: '0 kg' },
            { id: 'totalThrust', label: 'Empuxo Total:', value: '0 N' },
            { id: 'twr', label: 'Relação Empuxo/Peso (TWR):', value: '0' },
            { id: 'deltaV', label: 'Delta-V:', value: '0 m/s' }
        ];
        
        statItems.forEach(item => {
            const statRow = document.createElement('div');
            statRow.style.display = 'flex';
            statRow.style.justifyContent = 'space-between';
            statRow.style.marginBottom = '5px';
            
            const statLabel = document.createElement('span');
            statLabel.textContent = item.label;
            statRow.appendChild(statLabel);
            
            const statValue = document.createElement('span');
            statValue.id = `rocket-stat-${item.id}`;
            statValue.textContent = item.value;
            statValue.style.fontWeight = 'bold';
            statRow.appendChild(statValue);
            
            this.elements.rocketStats.appendChild(statRow);
        });
        
        statsContainer.appendChild(this.elements.rocketStats);
        this.container.appendChild(statsContainer);
    }
    
    _createCategoryTabs() {
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container';
        tabsContainer.style.display = 'flex';
        tabsContainer.style.marginBottom = '10px';
        tabsContainer.style.overflowX = 'auto';
        tabsContainer.style.whiteSpace = 'nowrap';
        
        const categories = [
            { id: 'capsules', label: 'Cápsulas' },
            { id: 'tanks', label: 'Tanques' },
            { id: 'engines', label: 'Motores' },
            { id: 'boosters', label: 'Boosters' },
            { id: 'wings', label: 'Asas' }
        ];
        
        categories.forEach(cat => {
            const tab = document.createElement('div');
            tab.textContent = cat.label;
            tab.dataset.category = cat.id;
            tab.className = 'part-tab';
            tab.style.padding = '8px';
            tab.style.backgroundColor = '#2d5dc2';
            tab.style.marginRight = '5px';
            tab.style.cursor = 'pointer';
            tab.style.borderRadius = '5px 5px 0 0';
            tab.style.minWidth = '70px';
            tab.style.textAlign = 'center';
            
            tab.addEventListener('click', () => {
                this.showCategory(cat.id);
                
                // Destacar aba selecionada
                document.querySelectorAll('.part-tab').forEach(t => {
                    t.style.backgroundColor = '#2d5dc2';
                });
                tab.style.backgroundColor = '#4287f5';
            });
            
            this.elements.categoryTabs[cat.id] = tab;
            tabsContainer.appendChild(tab);
        });
        
        this.container.appendChild(tabsContainer);
    }
    
    _createPartsContainer() {
        const partsWrapper = document.createElement('div');
        partsWrapper.style.backgroundColor = '#1a1a2e';
        partsWrapper.style.padding = '10px';
        partsWrapper.style.borderRadius = '0 5px 5px 5px';
        partsWrapper.style.marginBottom = '20px';
        
        this.elements.partsContainer = document.createElement('div');
        this.elements.partsContainer.id = 'parts-container';
        this.elements.partsContainer.style.display = 'grid';
        this.elements.partsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        this.elements.partsContainer.style.gap = '10px';
        this.elements.partsContainer.style.minHeight = '150px';
        
        partsWrapper.appendChild(this.elements.partsContainer);
        this.container.appendChild(partsWrapper);
    }
    
    _createSelectionInfo() {
        const selectionWrapper = document.createElement('div');
        selectionWrapper.style.backgroundColor = '#1a1a2e';
        selectionWrapper.style.padding = '10px';
        selectionWrapper.style.borderRadius = '5px';
        selectionWrapper.style.marginBottom = '20px';
        
        const selectionTitle = document.createElement('h3');
        selectionTitle.textContent = 'Peça Selecionada';
        selectionTitle.style.fontSize = '1rem';
        selectionTitle.style.margin = '0 0 10px 0';
        selectionWrapper.appendChild(selectionTitle);
        
        this.elements.selectionInfo = document.createElement('div');
        this.elements.selectionInfo.id = 'selection-info';
        this.elements.selectionInfo.innerHTML = '<p>Nenhuma peça selecionada</p>';
        
        selectionWrapper.appendChild(this.elements.selectionInfo);
        this.container.appendChild(selectionWrapper);
    }
    
    _createActionButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.gap = '10px';
        
        // Estilo comum para botões
        const buttonStyle = {
            padding: '10px 15px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'background-color 0.2s'
        };
        
        // Botão Salvar
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Salvar Foguete';
        saveButton.className = 'action-btn save-btn';
        Object.assign(saveButton.style, buttonStyle);
        saveButton.style.backgroundColor = '#4caf50';
        saveButton.style.color = 'white';
        saveButton.addEventListener('click', () => {
            if (this.onSaveClicked) this.onSaveClicked();
        });
        saveButton.addEventListener('mouseover', () => {
            saveButton.style.backgroundColor = '#3d8b40';
        });
        saveButton.addEventListener('mouseout', () => {
            saveButton.style.backgroundColor = '#4caf50';
        });
        buttonContainer.appendChild(saveButton);
        
        // Botão Lançar
        const launchButton = document.createElement('button');
        launchButton.textContent = 'Lançar Foguete';
        launchButton.className = 'action-btn launch-btn';
        Object.assign(launchButton.style, buttonStyle);
        launchButton.style.backgroundColor = '#f44336';
        launchButton.style.color = 'white';
        launchButton.addEventListener('click', () => {
            if (this.onLaunchClicked) this.onLaunchClicked();
        });
        launchButton.addEventListener('mouseover', () => {
            launchButton.style.backgroundColor = '#d32f2f';
        });
        launchButton.addEventListener('mouseout', () => {
            launchButton.style.backgroundColor = '#f44336';
        });
        buttonContainer.appendChild(launchButton);
        
        // Botão Voltar
        const backButton = document.createElement('button');
        backButton.textContent = 'Voltar ao Menu';
        backButton.className = 'action-btn back-btn';
        Object.assign(backButton.style, buttonStyle);
        backButton.style.backgroundColor = '#777';
        backButton.style.color = 'white';
        backButton.addEventListener('click', () => {
            if (this.onBackClicked) this.onBackClicked();
        });
        backButton.addEventListener('mouseover', () => {
            backButton.style.backgroundColor = '#555';
        });
        backButton.addEventListener('mouseout', () => {
            backButton.style.backgroundColor = '#777';
        });
        buttonContainer.appendChild(backButton);
        
        this.container.appendChild(buttonContainer);
    }
    
    registerPartsCatalog(catalog) {
        this.partsCatalog = catalog;
        
        // Mostrar a primeira categoria por padrão
        const firstCategory = Object.keys(catalog)[0];
        if (firstCategory) {
            this.showCategory(firstCategory);
        }
    }
    
    showCategory(categoryId) {
        this.currentCategory = categoryId;
        
        // Destacar a aba da categoria
        Object.values(this.elements.categoryTabs).forEach(tab => {
            tab.style.backgroundColor = '#2d5dc2';
        });
        
        if (this.elements.categoryTabs[categoryId]) {
            this.elements.categoryTabs[categoryId].style.backgroundColor = '#4287f5';
        }
        
        // Limpar o container de peças
        this.elements.partsContainer.innerHTML = '';
        
        // Preencher com as peças da categoria
        const parts = this.partsCatalog[categoryId] || [];
        
        if (parts.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Nenhuma peça disponível nesta categoria.';
            emptyMessage.style.gridColumn = '1 / span 2';
            emptyMessage.style.textAlign = 'center';
            this.elements.partsContainer.appendChild(emptyMessage);
            return;
        }
        
        parts.forEach(part => {
            const partElement = this._createPartElement(part);
            this.elements.partsContainer.appendChild(partElement);
        });
    }
    
    _createPartElement(part) {
        const partElement = document.createElement('div');
        partElement.className = 'part-item';
        partElement.style.backgroundColor = '#2a2a4a';
        partElement.style.padding = '10px';
        partElement.style.borderRadius = '5px';
        partElement.style.cursor = 'pointer';
        partElement.style.transition = 'background-color 0.2s';
        
        // Imagem da peça (se disponível)
        if (part.thumbnail) {
            const thumbnail = document.createElement('img');
            thumbnail.src = part.thumbnail;
            thumbnail.alt = part.name;
            thumbnail.style.width = '100%';
            thumbnail.style.height = '60px';
            thumbnail.style.objectFit = 'contain';
            thumbnail.style.marginBottom = '5px';
            partElement.appendChild(thumbnail);
        } else {
            // Placeholder se não houver imagem
            const placeholder = document.createElement('div');
            placeholder.style.width = '100%';
            placeholder.style.height = '60px';
            placeholder.style.backgroundColor = '#222';
            placeholder.style.marginBottom = '5px';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            
            const icon = document.createElement('span');
            icon.textContent = '🚀';
            icon.style.fontSize = '24px';
            placeholder.appendChild(icon);
            
            partElement.appendChild(placeholder);
        }
        
        // Nome da peça
        const nameElement = document.createElement('div');
        nameElement.textContent = part.name;
        nameElement.style.fontWeight = 'bold';
        nameElement.style.fontSize = '0.9rem';
        nameElement.style.whiteSpace = 'nowrap';
        nameElement.style.overflow = 'hidden';
        nameElement.style.textOverflow = 'ellipsis';
        partElement.appendChild(nameElement);
        
        // Propriedade principal da peça
        let mainProperty = '';
        if (part.type === 'engine') {
            mainProperty = `Empuxo: ${part.thrust} N`;
        } else if (part.type === 'tank') {
            mainProperty = `Combustível: ${part.fuel} kg`;
        } else if (part.type === 'capsule') {
            mainProperty = `Tripulação: ${part.crew}`;
        } else {
            mainProperty = `Massa: ${part.mass} kg`;
        }
        
        const propertyElement = document.createElement('div');
        propertyElement.textContent = mainProperty;
        propertyElement.style.fontSize = '0.8rem';
        propertyElement.style.color = '#aaa';
        partElement.appendChild(propertyElement);
        
        // Eventos
        partElement.addEventListener('mouseover', () => {
            partElement.style.backgroundColor = '#3a3a6a';
        });
        
        partElement.addEventListener('mouseout', () => {
            partElement.style.backgroundColor = '#2a2a4a';
        });
        
        partElement.addEventListener('click', () => {
            if (this.onPartSelected) {
                this.onPartSelected(part);
            }
        });
        
        return partElement;
    }
    
    updateSelectedPart(part) {
        if (!part) {
            this.elements.selectionInfo.innerHTML = '<p>Nenhuma peça selecionada</p>';
            return;
        }
        
        let html = `
            <h4 style="margin: 0 0 5px 0;">${part.name}</h4>
            <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #aaa;">Tipo: ${this._formatType(part.type)}</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
        `;
        
        // Adicionar propriedades relevantes
        if (part.mass) {
            html += `<div>Massa:</div><div>${part.mass} kg</div>`;
        }
        
        if (part.fuel) {
            html += `<div>Combustível:</div><div>${part.fuel} kg</div>`;
        }
        
        if (part.thrust) {
            html += `<div>Empuxo:</div><div>${part.thrust} N</div>`;
        }
        
        if (part.consumption) {
            html += `<div>Consumo:</div><div>${part.consumption} kg/s</div>`;
        }
        
        if (part.crew) {
            html += `<div>Tripulação:</div><div>${part.crew}</div>`;
        }
        
        html += `</div>`;
        
        this.elements.selectionInfo.innerHTML = html;
    }
    
    _formatType(type) {
        // Converter tipo para um formato legível
        const typeMap = {
            'capsule': 'Cápsula',
            'tank': 'Tanque de Combustível',
            'engine': 'Motor',
            'booster': 'Booster',
            'wing': 'Asa'
        };
        
        return typeMap[type] || type;
    }
    
    updateRocketMetrics(metrics) {
        // Atualizar os valores no display
        const elements = {
            totalMass: document.getElementById('rocket-stat-totalMass'),
            dryMass: document.getElementById('rocket-stat-dryMass'),
            fuelMass: document.getElementById('rocket-stat-fuelMass'),
            totalThrust: document.getElementById('rocket-stat-totalThrust'),
            twr: document.getElementById('rocket-stat-twr'),
            deltaV: document.getElementById('rocket-stat-deltaV')
        };
        
        if (elements.totalMass) elements.totalMass.textContent = `${metrics.totalMass.toFixed(1)} kg`;
        if (elements.dryMass) elements.dryMass.textContent = `${metrics.dryMass.toFixed(1)} kg`;
        if (elements.fuelMass) elements.fuelMass.textContent = `${metrics.fuelMass.toFixed(1)} kg`;
        if (elements.totalThrust) elements.totalThrust.textContent = `${metrics.totalThrust.toFixed(0)} N`;
        if (elements.twr) elements.twr.textContent = metrics.twr.toFixed(2);
        if (elements.deltaV) elements.deltaV.textContent = `${metrics.deltaV.toFixed(0)} m/s`;
    }
    
    getRocketName() {
        return this.elements.nameInput.value;
    }
    
    dispose() {
        // Remover elementos da UI
        this.container.innerHTML = '';
        
        // Limpar referências
        this.partsCatalog = {};
        this.currentCategory = null;
        this.onPartSelected = null;
        this.onLaunchClicked = null;
        this.onSaveClicked = null;
        this.onBackClicked = null;
        this.elements = {
            categoryTabs: {},
            partsContainer: null,
            selectionInfo: null,
            rocketStats: null,
            nameInput: null
        };
    }
} 