import React from 'react';
import { FiHome, FiSearch, FiBook, FiPlus, FiHeart, FiPlay } from 'react-icons/fi';
import { FaMedal, FaRegClock } from 'react-icons/fa';
import { IoMusicalNote } from 'react-icons/io5';

const Sidebar = () => {
  const navItems = [
    { icon: <FiHome size={24} />, label: 'Home' },
    { icon: <FiSearch size={24} />, label: 'Search' },
    { icon: <FiBook size={24} />, label: 'Your Library' },
  ];

  const playlistItems = [
    { icon: <FiPlus size={24} />, label: 'Create Playlist' },
    { icon: <FiHeart size={24} />, label: 'Liked Songs' },
    { icon: <FaMedal size={24} />, label: 'Top Mixes' },
    { icon: <IoMusicalNote size={24} />, label: 'Made for You' },
    { icon: <FaRegClock size={24} />, label: 'Recently Played' },
  ];

  return (
    <div className="w-64 bg-black text-white p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-green-500">Spotify</h1>
      </div>

      {/* Navigation */}
      <nav className="mb-8">
        <ul className="space-y-4">
          {navItems.map((item, index) => (
            <li key={index} className="flex items-center space-x-4 hover:text-gray-300 cursor-pointer">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>

      {/* Playlists */}
      <div className="border-t border-gray-800 pt-6">
        <ul className="space-y-4">
          {playlistItems.map((item, index) => (
            <li key={index} className="flex items-center space-x-4 hover:text-gray-300 cursor-pointer">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Playlists List */}
      <div className="mt-8 overflow-y-auto flex-grow">
        <ul className="space-y-2">
          {[...Array(10)].map((_, index) => (
            <li key={index} className="text-gray-400 hover:text-white text-sm cursor-pointer py-1">
              Playlist {index + 1}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;import React from 'react';
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
          <FaPlus />
          <span>Criar playlist</span>
        </button>
        <button className="flex items-center space-x-3 text-white hover:text-gray-300 mb-4">
          <FaHeart />
          <span>Músicas Curtidas</span>
        </button>
        <button className="flex items-center space-x-3 text-white hover:text-gray-300">
          <FaDownload />
          <span>Downloads</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;