import React from 'react';

const Cards = ({ title, items = [] }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {items.map((item, index) => (
          <div key={index} className="card-spotify group">
            <div className="relative mb-4">
              <img 
                src={item.image || "https://placehold.co/300x300"} 
                alt={item.title || "Imagem do card"} 
                className="w-full aspect-square object-cover rounded-lg"
              />
              <button className="absolute bottom-2 right-2 bg-spotify-green rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-y-2 group-hover:translate-y-0">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              </button>
            </div>
            <h3 className="font-bold text-white truncate">{item.title || "Título do card"}</h3>
            <p className="text-gray-400 text-sm truncate">{item.description || "Descrição do card"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cards;