import React from 'react';

const HomeSection: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Início</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Seu Daily Mix</h2>
          <p>Músicas selecionadas especialmente para você</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Top Hits</h2>
          <p>As melhores músicas do momento</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Para você</h2>
          <p>Recomendado com base no que você ouve</p>
        </div>
      </div>
    </div>
  );
};

export default HomeSection;