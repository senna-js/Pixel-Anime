import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import { Anime } from '../../types';

interface AnimeCardProps {
  anime: Anime;
  className?: string;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, className = '' }) => {
  return (
    <Link 
      to={`/anime/${anime.id}`} 
      className={`block group rounded-lg overflow-hidden bg-jet-card shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1 ${className}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={anime.coverImage}
          alt={anime.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 p-3 w-full">
            <div className="flex items-center mb-1">
              <FaStar className="text-yellow-400 mr-1" />
              <span className="text-white text-sm font-medium">{anime.rating.toFixed(1)}</span>
            </div>
            <div className="flex flex-wrap">
              {anime.genres.slice(0, 2).map((genre, index) => (
                <span 
                  key={index} 
                  className="text-xs text-white bg-primary-700 rounded-full px-2 py-0.5 mr-1 mb-1"
                >
                  {genre}
                </span>
              ))}
              {anime.status === 'ongoing' && (
                <span className="text-xs text-white bg-green-700 rounded-full px-2 py-0.5 mr-1 mb-1">
                  Ongoing
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-white truncate">{anime.title}</h3>
        <p className="text-gray-400 text-sm mt-1">{anime.releaseYear}</p>
      </div>
    </Link>
  );
};

export default AnimeCard; 