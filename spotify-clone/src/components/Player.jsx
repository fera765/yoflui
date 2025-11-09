import React from 'react';

const Player = () => {
  return (
    <div className="bg-spotify-darker border-t border-gray-800 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4 w-1/4">
        <img 
          src="https://placehold.co/60x60" 
          alt="Capa da música" 
          className="w-14 h-14 rounded"
        />
        <div>
          <div className="text-white font-medium">Nome da Música</div>
          <div className="text-gray-400 text-sm">Artista</div>
        </div>
        <button className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      
      <div className="flex flex-col items-center w-2/4">
        <div className="flex items-center space-x-6 mb-2">
          <button className="player-control">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          </button>
          <button className="player-control bg-white text-black rounded-full p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button className="player-control">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
        <div className="w-full flex items-center space-x-2">
          <span className="text-xs text-gray-400">0:00</span>
          <div className="h-1 bg-gray-600 flex-1 rounded-full overflow-hidden">
            <div className="h-full bg-gray-400 w-1/4 bg-spotify-green"></div>
          </div>
          <span className="text-xs text-gray-400">3:00</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 w-1/4 justify-end">
        <button className="player-control">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button className="player-control">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414-1.414m-2.828 2.828a9 9 0 010-12.728" />
          </svg>
        </button>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15.536a5 5 0 001.414-1.414" />
          </svg>
          <div className="w-20 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div className="h-full bg-spotify-green w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;