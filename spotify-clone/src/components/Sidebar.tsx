import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-800 p-4 hidden md:block">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">Music App</h2>
      </div>
      <nav>
        <ul className="space-y-2">
          <li>
            <a href="#" className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
              </svg>
              Your Library
            </a>
          </li>
        </ul>
      </nav>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Playlists</h3>
        <ul className="space-y-2">
          <li>
            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors duration-200 truncate">
              Liked Songs
            </a>
          </li>
          <li>
            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors duration-200 truncate">
              My Playlist #1
            </a>
          </li>
          <li>
            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors duration-200 truncate">
              Road Trip Tunes
            </a>
          </li>
          <li>
            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors duration-200 truncate">
              Workout Hits
            </a>
          </li>
          <li>
            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors duration-200 truncate">
              Chill Vibes
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;