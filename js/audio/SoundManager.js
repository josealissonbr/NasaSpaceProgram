export class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.initialized = false;
        this.context = null;
        
        // Tentar inicializar o contexto de áudio
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            this.initialized = true;
            
            // Carregar sons
            this.loadSounds();
        } catch (e) {
            console.warn('Web Audio API não suportada neste navegador');
            this.initialized = false;
        }
    }
    
    async loadSounds() {
        if (!this.initialized) return;
        
        const soundFiles = {
            countdown: '/assets/sounds/countdown.mp3',
            launch: '/assets/sounds/launch.mp3',
            engine: '/assets/sounds/engine.mp3',
            explosion: '/assets/sounds/explosion.mp3',
            stageJettison: '/assets/sounds/stage_jettison.mp3'
        };
        
        for (const [name, path] of Object.entries(soundFiles)) {
            try {
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                this.sounds.set(name, audioBuffer);
            } catch (e) {
                console.warn(`Erro ao carregar som ${name}: ${e.message}`);
            }
        }
    }
    
    playSound(name, options = {}) {
        if (!this.initialized || !this.sounds.has(name)) return;
        
        const source = this.context.createBufferSource();
        source.buffer = this.sounds.get(name);
        
        // Criar nó de ganho para controle de volume
        const gainNode = this.context.createGain();
        gainNode.gain.value = options.volume || 1.0;
        
        // Conectar nós
        source.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        // Configurar loop se necessário
        if (options.loop) {
            source.loop = true;
        }
        
        // Iniciar reprodução
        source.start(0);
        
        return {
            source,
            gainNode,
            stop: () => {
                try {
                    source.stop();
                } catch (e) {
                    console.warn('Erro ao parar som:', e);
                }
            }
        };
    }
    
    playEngineSound(throttle) {
        if (!this.engineSound) {
            this.engineSound = this.playSound('engine', { loop: true, volume: 0 });
        }
        
        if (this.engineSound && this.engineSound.gainNode) {
            // Ajustar volume com base no throttle (0-100)
            const volume = (throttle / 100) * 0.7; // Máximo 70% do volume para não ficar muito alto
            this.engineSound.gainNode.gain.value = volume;
        }
    }
    
    stopEngineSound() {
        if (this.engineSound) {
            this.engineSound.stop();
            this.engineSound = null;
        }
    }
    
    playCountdown() {
        return this.playSound('countdown', { volume: 0.8 });
    }
    
    playLaunch() {
        return this.playSound('launch', { volume: 0.9 });
    }
    
    playExplosion() {
        return this.playSound('explosion', { volume: 1.0 });
    }
    
    playStageJettison() {
        return this.playSound('stageJettison', { volume: 0.8 });
    }
} 