import React from 'react';

const SearchSection: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Buscar</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="O que você quer ouvir?"
          className="w-full p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-1">Pop</h2>
          <p className="text-gray-400 text-sm">Músicas pop</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-1">Rock</h2>
          <p className="text-gray-400 text-sm">Músicas rock</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-1">Eletrônica</h2>
          <p className="text-gray-400 text-sm">Músicas eletrônicas</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-1">Hip Hop</h2>
          <p className="text-gray-400 text-sm">Músicas de hip hop</p>
        </div>
      </div>
    </div>
  );
};

export default SearchSection;