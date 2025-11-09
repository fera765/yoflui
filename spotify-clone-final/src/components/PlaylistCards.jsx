import React from 'react';

const PlaylistCards = () => {
  const playlists = [
    { id: 1, title: 'Discover Weekly', description: 'Your weekly mixtape of fresh music', image: 'https://placehold.co/200x200' },
    { id: 2, title: 'Daily Mix 1', description: 'A mix of songs you love, plus new discoveries', image: 'https://placehold.co/200x200' },
    { id: 3, title: 'Chill Vibes', description: 'Relaxing beats for your downtime', image: 'https://placehold.co/200x200' },
    { id: 4, title: 'Workout Hits', description: 'Pump up the volume with these tracks', image: 'https://placehold.co/200x200' },
    { id: 5, title: 'Indie Mix', description: 'The best indie tracks right now', image: 'https://placehold.co/200x200' },
    { id: 6, title: 'Throwback Classics', description: 'Songs that never get old', image: 'https://placehold.co/200x200' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Recently Played</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition cursor-pointer group">
            <div className="relative mb-4">
              <img 
                src={playlist.image} 
                alt={playlist.title}
                className="w-full aspect-square object-cover rounded"
              />
              <button className="absolute bottom-2 right-2 bg-green-500 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105">
                ▶
              </button>
            </div>
            <h3 className="text-white font-semibold truncate">{playlist.title}</h3>
            <p className="text-gray-400 text-sm mt-1 truncate">{playlist.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistCards;