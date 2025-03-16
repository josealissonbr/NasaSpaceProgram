export class LaunchAnimations {
    constructor() {
        this.tweens = [];
    }

    resetTweens() {
        this.tweens = [];
    }

    addTween(tween) {
        this.tweens.push(tween);
    }

    updateTweens(deltaTime) {
        if (this.tweens.length > 0) {
            // Filtrar tweens completos
            this.tweens = this.tweens.filter(tween => {
                if (typeof tween.update === 'function') {
                    return !tween.update(deltaTime);
                }
                return false;
            });
        }
    }

    createCountdownAnimation(onComplete) {
        const countdownTime = 5; // segundos
        
        // Criar animação de contagem regressiva
        const countdown = {
            time: countdownTime,
            update: (deltaTime) => {
                this.time -= deltaTime;
                
                // Disparar callback quando terminar
                if (this.time <= 0) {
                    if (onComplete) onComplete();
                    return true; // Remover este tween
                }
                
                return false;
            }
        };
        
        this.addTween(countdown);
        return countdown;
    }
} 