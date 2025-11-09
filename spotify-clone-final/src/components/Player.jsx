import React from 'react';

const Player = () => {
  return (
    <div className="bg-gray-900 text-white h-20 flex items-center justify-between px-4">
      <div className="flex items-center space-x-4 w-1/3">
        <img 
          src="https://placehold.co/60x60" 
          alt="Album cover" 
          className="w-14 h-14 rounded"
        />
        <div>
          <div className="font-semibold">Song Title</div>
          <div className="text-gray-400 text-sm">Artist Name</div>
        </div>
        <button className="text-gray-400 hover:text-white">
          ♥
        </button>
      </div>
      <div className="flex flex-col items-center w-1/3">
        <div className="flex items-center space-x-6 mb-2">
          <button className="text-gray-400 hover:text-white">
            ⏮
          </button>
          <button className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center hover:scale-105">
            ▶
          </button>
          <button className="text-gray-400 hover:text-white">
            ⏭
          </button>
        </div>
        <div className="flex items-center w-full max-w-md">
          <span className="text-xs text-gray-400 mr-2">0:00</span>
          <div className="flex-1 h-1 bg-gray-600 rounded-full">
            <div className="h-1 bg-gray-200 rounded-full w-1/3"></div>
          </div>
          <span className="text-xs text-gray-400 ml-2">3:00</span>
        </div>
      </div>
      <div className="flex items-center space-x-4 w-1/3 justify-end">
        <button className="text-gray-400 hover:text-white">
          🔈
        </button>
        <div className="w-24 h-1 bg-gray-600 rounded-full">
          <div className="h-1 bg-gray-200 rounded-full w-3/4"></div>
        </div>
      </div>
    </div>
  );
};

export default Player;