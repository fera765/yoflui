import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-50 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button className="text-white hover:text-green-400 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="text-gray-400 hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 max-w-md mx-6">
          <div className="relative">
            <input
              type="text"
              placeholder="O que você quer ouvir?"
              className="w-full bg-gray-800 text-white rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="bg-black text-white rounded-full px-6 py-1.5 font-medium hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
            Inscrever-se
          </button>
          <button className="bg-white text-black rounded-full px-6 py-1.5 font-medium hover:bg-gray-200 transition-all duration-300 transform hover:scale-105">
            Entrar
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;