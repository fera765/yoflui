import React from 'react';
import { FiSearch, FiHome, FiCompass, FiPlay, FiHeart, FiUser } from 'react-icons/fi';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-b from-gray-900 to-black text-white p-4 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left section - Logo and navigation */}
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold text-green-500">Spotify</h1>
          <nav className="flex items-center space-x-6">
            <a href="#" className="flex items-center space-x-2 hover:text-gray-300 transition">
              <FiHome className="text-lg" />
              <span>Home</span>
            </a>
            <a href="#" className="flex items-center space-x-2 hover:text-gray-300 transition">
              <FiCompass className="text-lg" />
              <span>Explore</span>
            </a>
            <a href="#" className="flex items-center space-x-2 hover:text-gray-300 transition">
              <FiSearch className="text-lg" />
              <span>Search</span>
            </a>
          </nav>
        </div>

        {/* Right section - User profile */}
        <div className="flex items-center space-x-4">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full flex items-center space-x-2 transition">
            <FiPlay />
            <span>Play</span>
          </button>
          <button className="flex items-center space-x-2 hover:text-gray-300 transition">
            <FiHeart className="text-lg" />
            <span>Favorites</span>
          </button>
          <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
              <FiUser className="text-white" />
            </div>
            <span>User</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;import React from 'react';
import { FaSearch, FaBell, FaUser } from 'react-icons/fa';

const Header = () => {
  return (
    <div className="bg-black text-white p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button className="bg-black rounded-full p-2 hover:bg-gray-800">
          <FaSearch />
        </button>
        <div className="relative">
          <input 
            type="text" 
            placeholder="O que você quer ouvir?" 
            className="bg-gray-800 rounded-full py-2 px-4 pl-10 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gray-600"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="bg-black rounded-full p-2 hover:bg-gray-800">
          <FaBell />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <FaUser className="text-black" />
          </div>
          <span className="text-sm">Usuário</span>
        </div>
      </div>
    </div>
  );
};

export default Header;