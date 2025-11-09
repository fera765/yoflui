import React from 'react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-black text-white p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Spotify</h1>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-4">
          <li>
            <a href="#" className="flex items-center space-x-3 text-white hover:text-gray-300 transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>Home</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center space-x-3 text-white hover:text-gray-300 transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <span>Search</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center space-x-3 text-white hover:text-gray-300 transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <span>Your Library</span>
            </a>
          </li>
        </ul>
      </nav>
      
      <div className="mt-8">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Playlists</h3>
        <ul className="space-y-2">
          <li>
            <a href="#" className="block text-gray-400 hover:text-white transition">Liked Songs</a>
          </li>
          <li>
            <a href="#" className="block text-gray-400 hover:text-white transition">My Playlist #1</a>
          </li>
          <li>
            <a href="#" className="block text-gray-400 hover:text-white transition">Discover Weekly</a>
          </li>
          <li>
            <a href="#" className="block text-gray-400 hover:text-white transition">Release Radar</a>
          </li>
          <li>
            <a href="#" className="block text-gray-400 hover:text-white transition">Daily Mix 1</a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;