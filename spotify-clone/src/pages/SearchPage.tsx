import React, { useState } from 'react';
import { songs } from '../mockData';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  
  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(query.toLowerCase()) || 
    song.artist.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Search</h1>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="What do you want to listen to?"
          className="w-full max-w-lg bg-gray-800 text-white rounded-full py-3 px-6 focus:outline-none focus:ring-2 focus:ring-gray-600"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      
      {query && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Songs</h2>
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
                {filteredSongs.slice(0, 10).map((song, index) => (
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
      )}
    </div>
  );
};

export default SearchPage;