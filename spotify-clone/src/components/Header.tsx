import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-800 text-white p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Spotify Clone</h1>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <a href="#" className="hover:text-purple-300 transition-colors duration-200">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-purple-300 transition-colors duration-200">
                Search
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-purple-300 transition-colors duration-200">
                Library
              </a>
            </li>
          </ul>
        </nav>
        <div className="flex items-center space-x-4">
          <button className="bg-white text-purple-900 px-4 py-2 rounded-full font-semibold hover:bg-purple-200 transition-colors duration-200">
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;