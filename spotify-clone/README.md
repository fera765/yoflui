# React TypeScript Music Player

Um player de música moderno desenvolvido com React e TypeScript, utilizando Vite como bundler e Tailwind CSS para estilização.

## Tecnologias Utilizadas

- React 18+
- TypeScript
- Vite
- Tailwind CSS
- npm

## Funcionalidades

- Player de música com controles de play/pause
- Barra de progresso animada
- Controle de volume visual
- Navegação entre seções
- Funcionalidade de like em músicas
- Design responsivo (mobile, tablet e desktop)
- Transições e animações suaves

## Estrutura de Pastas

```
src/
├── components/     # Componentes React
├── utils/          # Utilitários
├── types/          # Tipagens TypeScript
├── assets/         # Imagens e outros recursos
├── styles/         # Estilos globais
├── hooks/          # Hooks personalizados
├── contexts/       # Contextos React
├── services/       # Serviços
├── api/            # Integrações com API
├── config/         # Configurações
├── constants/      # Constantes
├── helpers/        # Funções auxiliares
├── layouts/        # Layouts da aplicação
├── pages/          # Páginas da aplicação
├── routes/         # Rotas da aplicação
├── store/          # Gerenciamento de estado
├── theme/          # Temas
├── locales/        # Internacionalização
├── tests/          # Testes
└── __mocks__/      # Dados mockados
```

## Instalação

1. Clone o repositório
2. Execute `npm install` para instalar as dependências
3. Execute `npm run dev` para iniciar o servidor de desenvolvimento

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria uma build de produção
- `npm run preview` - Inicia um servidor de preview local para testar a build de produção

## Componentes Principais

- `Header.tsx` - Cabeçalho da aplicação
- `Sidebar.tsx` - Barra lateral com navegação
- `Player.tsx` - Controles do player de música
- `PlaylistCard.tsx` - Componente para exibir playlists
- `Layout.tsx` - Estrutura principal do layout

## Mock Data

O projeto inclui dados mockados para simular uma API, localizados em `src/__mocks__/mockData.ts`, contendo playlists, faixas musicais e informações do usuário.