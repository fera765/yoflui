import { Music } from '../types/music';

interface MusicItemProps {
  music: Music;
  onLikeToggle: (id: string) => void;
  onPlay: (music: Music) => void;
}

const MusicItem = ({ music, onLikeToggle, onPlay }: MusicItemProps) => {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg transition-colors">
      <div className="flex items-center space-x-4">
        <img 
          src={music.cover} 
          alt={music.title} 
          className="w-10 h-10 rounded object-cover"
        />
        <div>
          <h4 className="font-medium text-white">{music.title}</h4>
          <p className="text-sm text-gray-400">{music.artist}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => onLikeToggle(music.id)}
          className="text-gray-400 hover:text-green-500 transition-colors"
          aria-label={music.liked ? "Unlike" : "Like"}
        >
          {music.liked ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          )}
        </button>
        <button 
          onClick={() => onPlay(music)}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Play"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MusicItem;