import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="w-64 bg-gray-900 text-white p-4 flex flex-col h-full fixed left-0 top-0 bottom-0 z-10 transform transition-transform duration-300 ease-in-out">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-green-500">FLUI AGI Music</h1>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <Link 
              to="/" 
              className={`flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200 ${
                isActive('/') ? 'bg-green-600' : 'hover:bg-gray-800'
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>Início</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/browse" 
              className={`flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200 ${
                isActive('/browse') ? 'bg-green-600' : 'hover:bg-gray-800'
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Buscar</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/library" 
              className={`flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200 ${
                isActive('/library') ? 'bg-green-600' : 'hover:bg-gray-800'
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm-2 4a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <span>Sua Biblioteca</span>
            </Link>
          </li>
        </ul>
        
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">Playlists</h2>
          <ul className="space-y-2">
            {[
              { id: '1', name: 'Favoritas' },
              { id: '2', name: 'Para treinar' },
              { id: '3', name: 'Relax' },
              { id: '4', name: 'Foco' },
              { id: '5', name: 'Festa' }
            ].map((playlist) => (
              <li key={playlist.id}>
                <Link 
                  to={`/playlist/${playlist.id}`}
                  className={`block p-2 rounded transition-colors duration-200 ${
                    location.pathname === `/playlist/${playlist.id}` ? 'text-green-400' : 'hover:bg-gray-800'
                  }`}
                >
                  {playlist.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      
      <div className="mt-auto">
        <button className="w-full bg-green-600 hover:bg-green-700 transition-colors duration-200 text-white py-2 px-4 rounded-lg">
          Criar Playlist
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;