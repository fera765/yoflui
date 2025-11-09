import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-b from-gray-900 to-black text-white p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-green-500">Spotify</h1>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="hover:text-green-400 transition-colors">Home</a>
            <a href="#" className="hover:text-green-400 transition-colors">Search</a>
            <a href="#" className="hover:text-green-400 transition-colors">Your Library</a>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-semibold transition-colors">
            Upgrade
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            <span className="text-sm font-bold">U</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;