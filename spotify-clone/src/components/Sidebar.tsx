import React from 'react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-black text-white p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-green-500">Spotify</h1>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-4">
          <li>
            <a href="#" className="flex items-center space-x-3 text-white hover:text-green-500 transition-colors">
              <span className="text-xl">🏠</span>
              <span>Início</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center space-x-3 text-white hover:text-green-500 transition-colors">
              <span className="text-xl">🔍</span>
              <span>Buscar</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center space-x-3 text-white hover:text-green-500 transition-colors">
              <span className="text-xl">📚</span>
              <span>Sua Biblioteca</span>
            </a>
          </li>
        </ul>
        
        <div className="mt-8">
          <h3 className="text-gray-400 text-sm uppercase font-semibold mb-4">Sua Biblioteca</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="block text-gray-300 hover:text-white text-sm py-1">Criar playlist</a>
            </li>
            <li>
              <a href="#" className="block text-gray-300 hover:text-white text-sm py-1">Músicas curtidas</a>
            </li>
            <li>
              <a href="#" className="block text-gray-300 hover:text-white text-sm py-1">Álbuns</a>
            </li>
            <li>
              <a href="#" className="block text-gray-300 hover:text-white text-sm py-1">Artistas</a>
            </li>
            <li>
              <a href="#" className="block text-gray-300 hover:text-white text-sm py-1">Podcasts</a>
            </li>
          </ul>
        </div>
      </nav>
      
      <div className="mt-auto pt-4 border-t border-gray-800">
        <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-full text-left transition-colors">
          Português do Brasil
        </button>
      </div>
    </div>
  );
};

export default Sidebar;