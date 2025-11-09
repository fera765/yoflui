import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Cards from './components/Cards';
import { mockPlaylists, mockSongs } from './data/mockData';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        
        {/* Área de conteúdo principal */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto ml-0 md:ml-64">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Boas vindas</h1>
            <p className="text-gray-400">Descubra músicas incríveis hoje</p>
          </div>
          
          <Cards title="Playlists Recomendadas" items={mockPlaylists} />
          <Cards title="Músicas Populares" items={mockSongs} />
        </main>
      </div>
      
      <Player />
    </div>
  );
}

export default App;