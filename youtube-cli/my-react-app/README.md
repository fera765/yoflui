# Music Player App

Um aplicativo de música desenvolvido com React, TypeScript e Tailwind CSS.

## Funcionalidades

- Player de música com controles básicos
- Lista de playlists com músicas
- Interface responsiva (mobile, tablet, desktop)
- Sidebar de navegação
- Header com informações do usuário

## Tecnologias Utilizadas

- React
- TypeScript
- Tailwind CSS
- Vite
- React Icons

## Estrutura de Arquivos

```
src/
├── components/
│   ├── Header.tsx
│   ├── Layout.tsx
│   ├── Player.tsx
│   ├── PlaylistCard.tsx
│   └── Sidebar.tsx
├── data/
│   └── mockData.ts
├── index.css
└── main.tsx
```

## Instalação

1. Clone o repositório
2. Execute `npm install` para instalar as dependências
3. Execute `npm run dev` para iniciar o servidor de desenvolvimento
4. Acesse `http://localhost:5173` no seu navegador

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria uma build de produção
- `npm run preview` - Inicia um servidor local para visualizar a build de produção

## Componentes

### Header
Componente que exibe o cabeçalho da aplicação com informações do usuário.

### Sidebar
Componente de navegação lateral com links para diferentes seções da aplicação.

### Player
Componente do player de música com controles de reprodução.

### PlaylistCard
Componente que exibe informações sobre uma playlist, incluindo nome, imagem e número de músicas.

### Layout
Componente que estrutura o layout principal da aplicação com header, sidebar e conteúdo principal.