export class ControlsDisplay {
    constructor(containerSelector = '#telemetry') {
        this.container = document.querySelector(containerSelector);
        this.display = null;
        
        // Criar a interface
        this.createDisplay();
    }
    
    createDisplay() {
        if (!this.container) {
            console.error('Container para ControlsDisplay não encontrado');
            return;
        }
        
        // Criar container principal
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls-container';
        controlsContainer.style.cssText = `
            background-color: rgba(0,0,0,0.7);
            color: #fff;
            padding: 10px;
            border-radius: 5px;
            position: fixed;
            left: 20px;
            bottom: 20px;
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            z-index: 1000;
        `;
        
        // Título
        const title = document.createElement('div');
        title.className = 'controls-title';
        title.textContent = 'CONTROLES DE VOO';
        title.style.cssText = `
            font-weight: bold;
            color: #ffcc00;
            margin-bottom: 8px;
            text-align: center;
            font-size: 14px;
        `;
        
        // Lista de controles
        const controlsList = document.createElement('div');
        controlsList.className = 'controls-list';
        
        const controls = [
            { key: 'ESPAÇO', action: 'Iniciar Lançamento' },
            { key: 'SHIFT', action: 'Aumentar Potência' },
            { key: 'CTRL', action: 'Diminuir Potência' },
            { key: 'W / S', action: 'Pitch (Apontar Cima/Baixo)' },
            { key: 'A / D', action: 'Yaw (Virar Esquerda/Direita)' },
            { key: 'Q / E', action: 'Roll (Rotação Lateral)' }
        ];
        
        controls.forEach(control => {
            const controlItem = document.createElement('div');
            controlItem.className = 'control-item';
            controlItem.style.cssText = `
                margin-bottom: 5px;
                display: flex;
                justify-content: space-between;
            `;
            
            const keySpan = document.createElement('span');
            keySpan.className = 'key';
            keySpan.textContent = control.key;
            keySpan.style.cssText = `
                background-color: #333;
                padding: 2px 6px;
                border-radius: 3px;
                margin-right: 10px;
                font-weight: bold;
                color: #ffcc00;
                min-width: 50px;
                text-align: center;
            `;
            
            const actionSpan = document.createElement('span');
            actionSpan.className = 'action';
            actionSpan.textContent = control.action;
            actionSpan.style.cssText = `
                color: #ccc;
            `;
            
            controlItem.appendChild(keySpan);
            controlItem.appendChild(actionSpan);
            controlsList.appendChild(controlItem);
        });
        
        // Status de voo
        const statusContainer = document.createElement('div');
        statusContainer.className = 'flight-status';
        statusContainer.style.cssText = `
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #555;
        `;
        
        const statusTitle = document.createElement('div');
        statusTitle.textContent = 'STATUS:';
        statusTitle.style.cssText = `
            font-weight: bold;
            margin-bottom: 5px;
        `;
        
        const statusValue = document.createElement('div');
        statusValue.className = 'status-value';
        statusValue.textContent = 'AGUARDANDO LANÇAMENTO';
        statusValue.style.cssText = `
            color: #ffcc00;
            font-weight: bold;
        `;
        
        statusContainer.appendChild(statusTitle);
        statusContainer.appendChild(statusValue);
        
        // Montar tudo
        controlsContainer.appendChild(title);
        controlsContainer.appendChild(controlsList);
        controlsContainer.appendChild(statusContainer);
        
        this.container.appendChild(controlsContainer);
        
        // Salvar referência
        this.display = {
            container: controlsContainer,
            statusValue: statusValue
        };
    }
    
    updateStatus(status) {
        if (!this.display || !this.display.statusValue) return;
        
        // Mapear status para texto amigável
        const statusMap = {
            'pre-launch': 'AGUARDANDO LANÇAMENTO',
            'launching': 'CONTAGEM REGRESSIVA',
            'flying': 'EM VOO',
            'orbit': 'EM ÓRBITA',
            'crashed': 'FOGUETE DESTRUÍDO',
            'aborted': 'LANÇAMENTO ABORTADO',
            'space': 'NO ESPAÇO'
        };
        
        const statusText = statusMap[status] || status.toUpperCase();
        this.display.statusValue.textContent = statusText;
        
        // Atualizar cor com base no status
        if (status === 'crashed' || status === 'aborted') {
            this.display.statusValue.style.color = '#ff3333';
        } else if (status === 'flying' || status === 'launching') {
            this.display.statusValue.style.color = '#33cc33';
        } else if (status === 'orbit' || status === 'space') {
            this.display.statusValue.style.color = '#3399ff';
        } else {
            this.display.statusValue.style.color = '#ffcc00';
        }
    }
    
    show() {
        if (this.display) {
            this.display.container.style.display = 'block';
        }
    }
    
    hide() {
        if (this.display) {
            this.display.container.style.display = 'none';
        }
    }
    
    dispose() {
        if (this.display && this.display.container && this.display.container.parentNode) {
            this.display.container.parentNode.removeChild(this.display.container);
        }
    }
} 