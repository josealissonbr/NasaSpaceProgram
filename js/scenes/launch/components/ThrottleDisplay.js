export class ThrottleDisplay {
    constructor(containerSelector = '#telemetry') {
        this.container = document.querySelector(containerSelector);
        this.display = null;
        this.throttleValue = 50; // Valor inicial (%)
        
        // Criar a interface
        this.createDisplay();
    }
    
    createDisplay() {
        if (!this.container) {
            console.error('Container para ThrottleDisplay não encontrado');
            return;
        }
        
        // Criar container
        const throttleContainer = document.createElement('div');
        throttleContainer.className = 'throttle-container';
        throttleContainer.style.cssText = `
            width: 30px;
            height: 200px;
            background-color: #333;
            border-radius: 5px;
            position: relative;
            margin: 10px;
            overflow: hidden;
            border: 1px solid #555;
            display: flex;
            flex-direction: column-reverse;
        `;
        
        // Criar barra de throttle
        const throttleBar = document.createElement('div');
        throttleBar.className = 'throttle-bar';
        throttleBar.style.cssText = `
            width: 100%;
            height: 50%;
            background: linear-gradient(to top, #ff3300, #ffcc00);
            transition: height 0.1s ease-out;
        `;
        
        // Criar marcadores
        for (let i = 0; i <= 10; i++) {
            const marker = document.createElement('div');
            marker.className = 'throttle-marker';
            marker.style.cssText = `
                position: absolute;
                width: 5px;
                height: 1px;
                background-color: #aaa;
                left: 0;
                bottom: ${i * 10}%;
            `;
            throttleContainer.appendChild(marker);
            
            // Adicionar texto a cada 25%
            if (i % 2.5 === 0) {
                const label = document.createElement('div');
                label.className = 'throttle-label';
                label.textContent = `${i * 10}%`;
                label.style.cssText = `
                    position: absolute;
                    font-size: 8px;
                    color: #aaa;
                    right: -35px;
                    bottom: ${i * 10}%;
                    transform: translateY(50%);
                `;
                throttleContainer.appendChild(label);
            }
        }
        
        // Criar título
        const title = document.createElement('div');
        title.className = 'throttle-title';
        title.textContent = 'THROTTLE';
        title.style.cssText = `
            font-size: 10px;
            font-weight: bold;
            color: #ccc;
            margin-bottom: 5px;
            text-align: center;
        `;
        
        // Criar valor
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'throttle-value';
        valueDisplay.textContent = '50%';
        valueDisplay.style.cssText = `
            font-size: 12px;
            color: #ffcc00;
            margin-top: 5px;
            text-align: center;
        `;
        
        // Criar controles
        const controls = document.createElement('div');
        controls.className = 'throttle-controls';
        controls.innerHTML = '<div><span>SHIFT</span> Aumentar</div><div><span>CTRL</span> Diminuir</div>';
        controls.style.cssText = `
            font-size: 10px;
            color: #aaa;
            margin-top: 10px;
            text-align: left;
        `;
        controls.querySelectorAll('span').forEach(span => {
            span.style.cssText = `
                color: #ffcc00;
                font-weight: bold;
            `;
        });
        
        // Montar e adicionar ao DOM
        const wrapper = document.createElement('div');
        wrapper.className = 'throttle-wrapper';
        wrapper.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 10px;
            padding: 10px;
            background-color: rgba(0,0,0,0.7);
            border-radius: 5px;
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
        `;
        
        wrapper.appendChild(title);
        wrapper.appendChild(throttleContainer);
        throttleContainer.appendChild(throttleBar);
        wrapper.appendChild(valueDisplay);
        wrapper.appendChild(controls);
        
        this.container.appendChild(wrapper);
        
        // Salvar referências
        this.display = {
            container: wrapper,
            bar: throttleBar,
            value: valueDisplay
        };
    }
    
    update(throttlePercent) {
        if (!this.display) return;
        
        // Atualizar o valor
        this.throttleValue = Math.round(throttlePercent);
        
        // Atualizar a barra
        this.display.bar.style.height = `${this.throttleValue}%`;
        
        // Atualizar o texto
        this.display.value.textContent = `${this.throttleValue}%`;
        
        // Mudar cor com base no valor
        if (this.throttleValue > 75) {
            this.display.bar.style.background = 'linear-gradient(to top, #ff3300, #ff0000)';
            this.display.value.style.color = '#ff0000';
        } else if (this.throttleValue > 50) {
            this.display.bar.style.background = 'linear-gradient(to top, #ffcc00, #ff6600)';
            this.display.value.style.color = '#ff6600';
        } else {
            this.display.bar.style.background = 'linear-gradient(to top, #00cc00, #ffcc00)';
            this.display.value.style.color = '#ffcc00';
        }
    }
    
    show() {
        if (this.display) {
            this.display.container.style.display = 'flex';
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