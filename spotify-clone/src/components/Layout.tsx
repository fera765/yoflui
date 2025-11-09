import React from 'react';
import Sidebar from './Sidebar';
import Player from './Player';
import Header from './Header';
import ScrollableContent from './ScrollableContent';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header fixo */}
      <Header />
      
      {/* Conteúdo principal com sidebar e área de conteúdo */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar fixa à esquerda */}
        <div className="hidden md:block w-64 bg-gray-900 flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* Área de conteúdo com scroll */}
        <main className="flex-1 bg-gradient-to-b from-gray-800 to-gray-900">
          <ScrollableContent>
            {children}
          </ScrollableContent>
        </main>
      </div>
      
      {/* Player fixo inferior */}
      <div className="bg-gray-800 border-t border-gray-700">
        <Player />
      </div>
    </div>
  );
};

export default Layout;