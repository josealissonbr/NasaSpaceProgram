# Programa Espacial NASA

Um simulador sandbox 3D de criação e lançamento de foguetes desenvolvido com JavaScript e Three.js.

## Funcionalidades

- **Construção de Foguetes**: Interface intuitiva para projetar foguetes personalizados
- **Simulação Física Realista**: Motor de física que simula gravidade, arrasto e empuxo
- **Múltiplos Estágios**: Suporte para foguetes com vários estágios
- **Simulação de Lançamento**: Veja seu foguete decolar e atingir o espaço
- **Exploração Espacial**: Continue a missão no espaço após ultrapassar a atmosfera
- **Visualização 3D**: Gráficos 3D utilizando a biblioteca Three.js

## Como Jogar

1. **Menu Principal**: Inicie o jogo e selecione "Iniciar Missão"
2. **Construção do Foguete**: Adicione peças ao seu foguete (módulo de comando, tanques de combustível, motores, etc.)
3. **Lançamento**: Quando seu foguete estiver pronto, clique em "Lançar" para iniciar a contagem regressiva
4. **Controle de Voo**: Monitore a telemetria durante o voo e ajuste a trajetória se necessário
5. **Espaço**: Se seu foguete atingir altitude suficiente, você entrará no modo de exploração espacial

## Tecnologias Utilizadas

- **JavaScript**: Linguagem principal
- **Three.js**: Biblioteca 3D para renderização gráfica
- **HTML5/CSS3**: Interface do usuário
- **Arquitetura MVC**: Organização do código em Model-View-Controller

## Requisitos

- Navegador web moderno com suporte a WebGL
- Conexão à internet para carregar as bibliotecas CDN

## Instalação e Execução

1. Clone este repositório: `git clone https://github.com/seu-usuario/nasa-space-program.git`
2. Navegue até o diretório: `cd nasa-space-program`
3. Abra o arquivo `index.html` em seu navegador ou use um servidor local

## Estrutura do Projeto

```
/
├── index.html              # Página principal HTML
├── css/                    # Estilos CSS
│   └── style.css           # Estilos principais
├── js/                     # Código JavaScript
│   ├── main.js             # Ponto de entrada principal
│   ├── models/             # Classes de modelo (dados)
│   ├── views/              # Classes de visualização 
│   ├── controllers/        # Classes de controle
│   ├── scenes/             # Cenas Three.js
│   ├── components/         # Componentes reutilizáveis
│   ├── physics/            # Motor de física
│   ├── utils/              # Utilitários
│   ├── loaders/            # Carregadores de assets
│   └── config/             # Configurações
└── assets/                 # Recursos (texturas, modelos, etc.)
    ├── textures/           # Texturas
    └── models/             # Modelos 3D
```

## Créditos

Este projeto foi desenvolvido como um simulador educacional de lançamento de foguetes. Todas as simulações são aproximações e não têm a intenção de representar com precisão absoluta as dinâmicas reais de voo espacial. 