import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Player from './components/Player';
import PlaylistCards from './components/PlaylistCards';

function App() {
  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        {/* Área de Conteúdo */}
        <main className="flex-1 overflow-y-auto p-6">
          <PlaylistCards />
        </main>
        
        {/* Player */}
        <Player />
      </div>
    </div>
  );
}

export default App;