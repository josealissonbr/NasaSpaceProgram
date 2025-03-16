// Constantes para a cena de lançamento
export const LAUNCH_CONSTANTS = {
    COUNTDOWN_TIME: 5, // segundos
    MIN_CAMERA_HEIGHT: 5,
    CAMERA_FOLLOW_SPEED: 0.05,
    CAMERA_DISTANCE: 15,
    CAMERA_ORBITAL_SPEED: 0.1,
    ALTITUDE_SCALING: 0.01, // Escala para visualização (metros -> unidades Three.js)
    LATERAL_MOVEMENT_START: 5, // altitude em km
    LATERAL_MOVEMENT_FACTOR: 0.5,
    ORBIT_TILT_START: 10, // altitude em km
    MAX_TILT_ANGLE: Math.PI / 6, // 30 graus
    TILT_ALTITUDE_FACTOR: 500, // Quanto maior, mais lento o tilt
    TILT_INTERPOLATION_SPEED: 0.01,
    SPACE_ALTITUDE: 100, // Linha de Kármán em km
    GROUND_COLOR: 0x336633,
    SKY_COLOR: 0x88CCFF,
    STRUCTURE_COLOR: 0x777777
};

// Funções utilitárias para a cena de lançamento
export class LaunchHelpers {
    // Converte altitude (km) em posição y do foguete
    static altitudeToPosition(altitude) {
        return altitude * LAUNCH_CONSTANTS.ALTITUDE_SCALING;
    }
    
    // Calcula o ângulo de inclinação baseado na altitude
    static calculateTiltAngle(altitude) {
        if (altitude < LAUNCH_CONSTANTS.ORBIT_TILT_START) return 0;
        
        return Math.min(
            LAUNCH_CONSTANTS.MAX_TILT_ANGLE, 
            altitude / LAUNCH_CONSTANTS.TILT_ALTITUDE_FACTOR
        );
    }
    
    // Formata o tempo de missão para exibição
    static formatMissionTime(time) {
        const minutes = Math.floor(Math.abs(time) / 60);
        const seconds = Math.floor(Math.abs(time) % 60);
        const sign = time < 0 ? '-' : '+';
        
        return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
} 