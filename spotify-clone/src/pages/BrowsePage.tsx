import React from 'react';
import { Link } from 'react-router-dom';
import { playlists, songs } from '../mockData';

const BrowsePage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Browse</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Featured Playlists</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {playlists.slice(0, 10).map((playlist) => (
            <div key={playlist.id} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
              <img src={playlist.image} alt={playlist.title} className="w-full aspect-square object-cover rounded-md mb-3" />
              <h3 className="text-white font-semibold truncate">{playlist.title}</h3>
              <p className="text-gray-400 text-sm truncate">{playlist.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Top Charts</h2>
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 text-left text-gray-400">
                <th className="p-3">#</th>
                <th className="p-3">Title</th>
                <th className="p-3">Album</th>
                <th className="p-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {songs.slice(0, 10).map((song, index) => (
                <tr key={song.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors duration-200">
                  <td className="p-3 text-gray-400">{index + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center">
                      <img src={song.albumImage} alt={song.title} className="w-10 h-10 mr-3" />
                      <div>
                        <div className="text-white">{song.title}</div>
                        <div className="text-gray-400 text-sm">{song.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-gray-400">{song.album}</td>
                  <td className="p-3 text-gray-400">{song.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BrowsePage;