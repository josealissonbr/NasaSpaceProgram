export class AudioManager {
    constructor() {
        this.listener = new THREE.AudioListener();
        this.sounds = {};
        this.music = null;
        
        this.globalVolume = 1.0;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.8;
        this.muted = false;
    }
    
    initialize(camera) {
        // Adicionar o listener à câmera
        camera.add(this.listener);
    }
    
    createSound(name, buffer, loop = false, volume = 1.0, is3D = false) {
        // Criar um som positional (3D) ou não
        const sound = is3D 
            ? new THREE.PositionalAudio(this.listener) 
            : new THREE.Audio(this.listener);
            
        sound.setBuffer(buffer);
        sound.setLoop(loop);
        sound.setVolume(volume * this.sfxVolume * this.globalVolume);
        
        this.sounds[name] = sound;
        return sound;
    }
    
    playSound(name, object = null) {
        if (!this.sounds[name]) {
            console.warn(`Som "${name}" não encontrado`);
            return null;
        }
        
        const sound = this.sounds[name];
        
        // Se for 3D e tiver um objeto, adicionar o som ao objeto
        if (sound instanceof THREE.PositionalAudio && object) {
            object.add(sound);
        }
        
        if (sound.isPlaying) {
            sound.stop();
        }
        
        sound.play();
        return sound;
    }
    
    stopSound(name) {
        if (this.sounds[name] && this.sounds[name].isPlaying) {
            this.sounds[name].stop();
        }
    }
    
    stopAllSounds() {
        Object.values(this.sounds).forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
    }
    
    playMusic(buffer) {
        // Parar a música atual se estiver tocando
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
        
        // Criar uma nova instância de música
        this.music = new THREE.Audio(this.listener);
        this.music.setBuffer(buffer);
        this.music.setLoop(true);
        this.music.setVolume(this.musicVolume * this.globalVolume);
        this.music.play();
    }
    
    stopMusic() {
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
    }
    
    // Ajustes de volume
    setMasterVolume(volume) {
        this.globalVolume = Math.max(0, Math.min(volume, 1));
        this.updateAllVolumes();
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(volume, 1));
        if (this.music) {
            this.music.setVolume(this.musicVolume * this.globalVolume);
        }
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(volume, 1));
        this.updateAllVolumes();
    }
    
    updateAllVolumes() {
        Object.values(this.sounds).forEach(sound => {
            sound.setVolume(this.sfxVolume * this.globalVolume);
        });
        
        if (this.music) {
            this.music.setVolume(this.musicVolume * this.globalVolume);
        }
    }
    
    muteAll(mute) {
        this.muted = mute;
        
        if (mute) {
            this.listener.setMasterVolume(0);
        } else {
            this.listener.setMasterVolume(1);
        }
    }
    
    toggleMute() {
        this.muteAll(!this.muted);
        return this.muted;
    }
} 