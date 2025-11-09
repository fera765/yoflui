import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="bg-gradient-to-r from-purple-900 via-blue-900 to-green-900 text-white p-6 rounded-lg mb-6 shadow-lg animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="animate-slideInLeft">
          <h1 className="text-3xl font-bold">FLUI AGI Music</h1>
          <p className="text-gray-300 mt-2">Sua plataforma de streaming inteligente</p>
        </div>
        <div className="flex items-center space-x-4 animate-slideInRight">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar músicas, artistas..."
              className="bg-black bg-opacity-30 border border-gray-600 rounded-full py-2 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 w-64 hover:shadow-lg"
            />
            <svg 
              className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex items-center space-x-2">
            <img 
              src="https://via.placeholder.com/40x40" 
              alt="User" 
              className="w-10 h-10 rounded-full border-2 border-white transition-transform duration-200 hover:scale-110 hover:rotate-3"
            />
            <span className="font-medium hover:text-green-400 transition-colors duration-200">Usuário</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;