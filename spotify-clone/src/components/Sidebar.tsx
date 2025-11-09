import React from 'react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Spotify Clone</h1>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <a href="#" className="block p-2 hover:bg-gray-700 rounded">
              Home
            </a>
          </li>
          <li>
            <a href="#" className="block p-2 hover:bg-gray-700 rounded">
              Search
            </a>
          </li>
          <li>
            <a href="#" className="block p-2 hover:bg-gray-700 rounded">
              Your Library
            </a>
          </li>
          <li className="mt-6">
            <a href="#" className="block p-2 hover:bg-gray-700 rounded">
              Create Playlist
            </a>
          </li>
          <li>
            <a href="#" className="block p-2 hover:bg-gray-700 rounded">
              Liked Songs
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;