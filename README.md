# NASA Space Program

Um jogo de simulação espacial inspirado em Kerbal Space Program, desenvolvido em JavaScript e Three.js.

## Sobre o Projeto

NASA Space Program é um jogo de simulação espacial que permite aos jogadores construir e lançar seus próprios foguetes, executar manobras orbitais e explorar o espaço. O jogo foi desenvolvido com foco em uma experiência educativa e divertida sobre física orbital e exploração espacial.

## Funcionalidades

- **Construção de Foguetes**: Interface modular para montar foguetes com diferentes componentes
- **Simulação Física**: Motor de física que simula gravitação, aerodinâmica e órbitas
- **Lançamento e Controle de Voo**: Sistema de controle de aceleração e separação de estágios
- **Visão 3D Imersiva**: Gráficos 3D utilizando Three.js

## Instalação

1. Clone o repositório:
```
git clone https://github.com/josealissonbr/NasaSpaceProgram.git
```

2. Navegue até o diretório do projeto:
```
cd nasa-space-program
```

3. Abra o arquivo `index.html` em um navegador web moderno.

## Como Jogar

1. **Menu Principal**: Ao iniciar o jogo, você será apresentado ao menu principal onde pode iniciar uma nova missão ou ir para o construtor de foguetes.

2. **Construtor de Foguetes**:
   - Adicione componentes como cápsulas, motores e tanques de combustível
   - Nomeie seu foguete e salve-o para uso futuro
   - Pressione "Lançar Foguete" quando estiver pronto

3. **Lançamento**:
   - Use a barra de espaço para iniciar o lançamento
   - Controle a aceleração com as teclas W/S ou setas para cima/baixo
   - Pressione barra de espaço novamente para separar estágios
   - Monitore a telemetria para alcançar a órbita

## Controles

- **Construtor de Foguetes**:
  - Clique nas peças para selecioná-las
  - Use o mouse para rotacionar a câmera

- **Lançamento**:
  - ESPAÇO: Lançar/Separar estágio
  - W/SETA PARA CIMA: Aumentar aceleração
  - S/SETA PARA BAIXO: Diminuir aceleração
  - MOUSE: Controlar a câmera
  - R: Reiniciar lançamento
  - M: Voltar ao menu

## Tecnologias Utilizadas

- **JavaScript**: Linguagem principal
- **Three.js**: Renderização 3D
- **HTML5/CSS3**: Interface do usuário

## Estrutura do Projeto

```
/
├── index.html          # Ponto de entrada principal
├── public/
│   └── styles.css      # Estilos CSS
├── src/
│   ├── core/           # Núcleo do jogo
│   │   ├── main.js
│   │   └── SceneManager.js
│   ├── scenes/         # Cenas do jogo
│   │   ├── LoadingScene.js
│   │   ├── MainMenuScene.js
│   │   ├── RocketBuilderScene.js
│   │   └── LaunchScene.js
│   ├── components/     # Componentes reutilizáveis
│   ├── physics/        # Motor de física
│   │   └── PhysicsEngine.js
│   ├── utils/          # Utilitários
│   │   ├── AssetLoader.js
│   │   ├── InputManager.js
│   │   └── AudioManager.js
│   └── assets/         # Recursos do jogo
│       ├── models/
│       ├── textures/
│       └── sounds/
```

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para enviar pull requests ou abrir issues para melhorias e correções.

## Licença

Este projeto está licenciado sob a licença MIT. 
