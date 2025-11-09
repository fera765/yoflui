import React from 'react';

const Player = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Controles de reprodução */}
        <div className="flex items-center space-x-4 w-1/4">
          <button className="text-white hover:text-gray-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 5v10l7-5-7-5z" />
            </svg>
          </button>
          <button className="text-white hover:text-gray-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4h2v12H5V4zm6 0h2v12h-2V4z" />
            </svg>
          </button>
          <button className="text-white hover:text-gray-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12 5v10l7-5-7-5z" />
            </svg>
          </button>
        </div>

        {/* Informações da música */}
        <div className="flex-1 flex flex-col items-center">
          <div className="text-white text-sm font-medium">Nome da Música</div>
          <div className="text-gray-400 text-xs">Artista</div>
        </div>

        {/* Controles de volume */}
        <div className="flex items-center space-x-2 w-1/4 justify-end">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 011 1v1H2V5a1 1 0 011-1h4z" />
          </svg>
          <div className="w-24 bg-gray-700 h-1 rounded-full">
            <div className="bg-gray-300 h-1 rounded-full w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;