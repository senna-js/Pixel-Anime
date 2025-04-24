import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { animeApi } from '../services/api';

const CategoriesPage: React.FC = () => {
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true);
        const data = await animeApi.getGenres();
        setGenres(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching genres:', error);
        setLoading(false);
      }
    };
    
    fetchGenres();
  }, []);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </MainLayout>
    );
  }
  
  // Create categories based on genres
  const genreImages: Record<string, string> = {
    action: 'https://image.tmdb.org/t/p/original/6YwkGolwdOMNpbTOmLjoehlVWs5.jpg',
    adventure: 'https://image.tmdb.org/t/p/original/lxD5ak7BOoinRNehOCA85CQ8ubr.jpg',
    comedy: 'https://image.tmdb.org/t/p/original/iJX9JQJ9grA22eIlJQp8kAJ2vJ.jpg',
    drama: 'https://image.tmdb.org/t/p/original/xDMIl84Qo5Tsu62c9DGWhmPI67A.jpg',
    fantasy: 'https://image.tmdb.org/t/p/original/m1t7EqzF2yaaFPXgxjbGGqcBm8N.jpg',
    horror: 'https://image.tmdb.org/t/p/original/vfuzELmhBjBTswXj2Vqxnu5ge4g.jpg',
    // Default image for other genres
    default: 'https://image.tmdb.org/t/p/original/r0FLFaxe4vaIl8iv46OaJLBPDXf.jpg'
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Genres</h1>
        
        <p className="text-gray-300 mb-8 max-w-3xl">
          Explore anime by genre. From action-packed adventures to heartwarming romances, 
          find your favorite genre and discover new titles to watch.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {genres.map((genre) => (
            <Link
              key={genre}
              to={`/browse?genre=${encodeURIComponent(genre)}`}
              className="group"
            >
              <div className="relative rounded-lg overflow-hidden h-48 bg-jet-card">
                <img 
                  src={genreImages[genre] || genreImages.default} 
                  alt={genre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 flex items-end">
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-white mb-1 capitalize">{genre}</h3>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default CategoriesPage; 