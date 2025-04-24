import React from 'react';
import { Link } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';
import { Anime } from '../../types';
import AnimeCard from './AnimeCard';

interface AnimeGridProps {
  title: string;
  animes: Anime[];
  viewAllLink?: string;
  className?: string;
}

const AnimeGrid: React.FC<AnimeGridProps> = ({ 
  title, 
  animes, 
  viewAllLink,
  className = ''
}) => {
  if (!animes.length) return null;
  
  return (
    <section className={`py-8 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {viewAllLink && (
            <Link 
              to={viewAllLink}
              className="flex items-center text-primary-500 hover:text-primary-400 transition-colors"
            >
              View All <FaChevronRight className="ml-1 h-3 w-3" />
            </Link>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {animes.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnimeGrid; 