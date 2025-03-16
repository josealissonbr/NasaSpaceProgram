// Arquivo centralizador para importações do Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Exportando os módulos para uso em todo o projeto
export { THREE, OrbitControls, GLTFLoader };

// Caminho para os módulos do Three.js (mantidos para referência)
export const THREE_PATH = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
export const ORBIT_CONTROLS_PATH = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
export const GLTF_LOADER_PATH = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js'; 