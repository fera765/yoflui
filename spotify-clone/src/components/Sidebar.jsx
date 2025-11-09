import React from 'react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-black text-white p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-spotify-green">Flui AGI</h1>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-4">
          <li>
            <a href="#" className="sidebar-item flex items-center space-x-3 text-white">
              <span>🏠</span>
              <span>Início</span>
            </a>
          </li>
          <li>
            <a href="#" className="sidebar-item flex items-center space-x-3">
              <span>🔍</span>
              <span>Buscar</span>
            </a>
          </li>
          <li>
            <a href="#" className="sidebar-item flex items-center space-x-3">
              <span>📚</span>
              <span>Sua Biblioteca</span>
            </a>
          </li>
        </ul>
        
        <div className="mt-8">
          <button className="btn-primary w-full text-left mb-4">
            Criar playlist
          </button>
          <button className="text-gray-400 hover:text-white text-left w-full">
            Curtidas
          </button>
        </div>
        
        <div className="mt-6 border-t border-gray-800 pt-4">
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            <li><a href="#" className="text-gray-400 hover:text-white text-sm block">Playlist 1</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm block">Playlist 2</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm block">Playlist 3</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm block">Playlist 4</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm block">Playlist 5</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm block">Playlist 6</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm block">Playlist 7</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white text-sm block">Playlist 8</a></li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;