import React from 'react';

const LibrarySection: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Biblioteca</h1>
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Músicas Curtidas</h2>
          <p>Suas músicas favoritas em um só lugar</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Álbuns</h2>
          <p>Coleção de álbuns que você segue</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Playlists</h2>
          <p>Suas playlists criadas e favoritas</p>
        </div>
      </div>
    </div>
  );
};

export default LibrarySection;