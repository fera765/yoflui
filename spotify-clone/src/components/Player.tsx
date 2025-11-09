import React from 'react';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiRepeat, FiShuffle, FiVolume2 } from 'react-icons/fi';

const Player = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Informações da música */}
        <div className="flex items-center space-x-3 w-1/4">
          <img 
            src="https://placehold.co/60x60" 
            alt="Capa do álbum" 
            className="w-14 h-14 rounded"
          />
          <div>
            <div className="text-white text-sm font-medium">Nome da Música</div>
            <div className="text-gray-400 text-xs">Artista</div>
          </div>
        </div>

        {/* Controles centrais */}
        <div className="flex flex-col items-center w-2/4">
          <div className="flex items-center space-x-6 mb-2">
            <button className="text-gray-400 hover:text-white transition-colors">
              <FiShuffle size={16} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <FiSkipBack size={20} />
            </button>
            <button className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform">
              <FiPlay size={20} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <FiSkipForward size={20} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <FiRepeat size={16} />
            </button>
          </div>
          <div className="flex items-center w-full max-w-md space-x-2">
            <span className="text-gray-400 text-xs">0:00</span>
            <div className="flex-1 h-1 bg-gray-700 rounded-full">
              <div className="h-1 bg-gray-400 rounded-full w-1/3"></div>
            </div>
            <span className="text-gray-400 text-xs">3:45</span>
          </div>
        </div>

        {/* Controles direita */}
        <div className="flex items-center justify-end space-x-3 w-1/4">
          <button className="text-gray-400 hover:text-white transition-colors">
            <FiVolume2 size={16} />
          </button>
          <div className="w-24 h-1 bg-gray-700 rounded-full">
            <div className="h-1 bg-gray-400 rounded-full w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;import React from 'react';
import { FaStepBackward, FaStepForward, FaPlay, FaPause, FaRandom, FaRedo } from 'react-icons/fa';

const Player = () => {
  return (
    <div className="bg-gray-800 border-t border-gray-700 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4 w-1/3">
        <img 
          src="https://placehold.co/60x60" 
          alt="Album cover" 
          className="w-14 h-14 rounded"
        />
        <div>
          <div className="text-white text-sm font-medium">Nome da Música</div>
          <div className="text-gray-400 text-xs">Artista</div>
        </div>
        <div className="text-red-500">
          <FaHeart />
        </div>
      </div>
      
      <div className="flex flex-col items-center w-1/3">
        <div className="flex items-center space-x-6 mb-2">
          <button className="text-gray-400 hover:text-white">
            <FaRandom />
          </button>
          <button className="text-gray-400 hover:text-white">
            <FaStepBackward />
          </button>
          <button className="bg-white text-black rounded-full p-2 hover:bg-gray-200">
            <FaPlay />
          </button>
          <button className="text-gray-400 hover:text-white">
            <FaStepForward />
          </button>
          <button className="text-gray-400 hover:text-white">
            <FaRedo />
          </button>
        </div>
        <div className="w-full max-w-md flex items-center space-x-2">
          <span className="text-xs text-gray-400">0:00</span>
          <div className="flex-1 h-1 bg-gray-600 rounded-full">
            <div className="h-1 bg-gray-200 rounded-full w-1/4"></div>
          </div>
          <span className="text-xs text-gray-400">3:00</span>
        </div>
      </div>
      
      <div className="flex items-center justify-end space-x-4 w-1/3">
        <button className="text-gray-400 hover:text-white">
          <span className="text-xs">0:00</span>
        </button>
        <div className="w-24 h-1 bg-gray-600 rounded-full">
          <div className="h-1 bg-gray-200 rounded-full w-3/4"></div>
        </div>
        <button className="text-gray-400 hover:text-white">
          <span className="text-xs">100%</span>
        </button>
      </div>
    </div>
  );
};

export default Player;