import React from 'react';

const Header = () => {
  return (
    <header className="bg-spotify-darker text-white p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button className="bg-black rounded-full p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="bg-black rounded-full p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <input
            type="text"
            placeholder="O que você quer ouvir?"
            className="w-full bg-black rounded-full py-2 px-4 pl-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green"
          />
          <svg className="w-5 h-5 text-gray-500 absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="bg-black text-white rounded-full px-6 py-2 font-bold hover:bg-gray-800 transition duration-200">
          Inscrever-se
        </button>
        <button className="bg-spotify-green text-black rounded-full px-6 py-2 font-bold hover:bg-green-400 transition duration-200">
          Entrar
        </button>
      </div>
    </header>
  );
};

export default Header;