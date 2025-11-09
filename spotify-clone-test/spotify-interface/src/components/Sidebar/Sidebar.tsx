import React from 'react';
import { FaHome, FaSearch, FaBook, FaPlus, FaHeart, FaDownload } from 'react-icons/fa';

const Sidebar = () => {
  return (
    <div className="w-64 bg-black text-white p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-green-500">Spotify</h1>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-4">
          <li>
            <a href="#" className="flex items-center space-x-3 text-white hover:text-gray-300">
              <FaHome />
              <span>Início</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center space-x-3 text-white hover:text-gray-300">
              <FaSearch />
              <span>Buscar</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center space-x-3 text-white hover:text-gray-300">
              <FaBook />
              <span>Sua Biblioteca</span>
            </a>
          </li>
        </ul>
      </nav>
      
      <div className="mt-8">
        <button className="flex items-center space-x-3 text-white hover:text-gray-300 mb-4">
          <div className="bg-gray-800 p-1 rounded">
            <FaPlus />
          </div>
          <span>Criar playlist</span>
        </button>
        <button className="flex items-center space-x-3 text-white hover:text-gray-300 mb-4">
          <div className="bg-gradient-to-br from-purple-900 to-blue-500 p-1 rounded">
            <FaHeart />
          </div>
          <span>Músicas Curtidas</span>
        </button>
        <button className="flex items-center space-x-3 text-white hover:text-gray-300">
          <div className="bg-gradient-to-br from-blue-700 to-purple-900 p-1 rounded">
            <FaDownload />
          </div>
          <span>Seus Downloads</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;