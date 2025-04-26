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
    action: 'https://www.pride.org.my/wp-content/uploads/2021/03/lgi39qi7kmzdipemivm1.jpg',
    adventure: 'https://static1.srcdn.com/wordpress/wp-content/uploads/2023/10/the-main-cast-of-frieren.jpg',
    cars: 'https://imgix.ranker.com/list_img_v2/19242/1839242/original/1839242-u3',
    comedy: 'https://static1.colliderimages.com/wordpress/wp-content/uploads/2024/10/daily_lives_of_high_school_boys.jpg',
    dementia: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0pjqPy-wo1FfCxHrmYD9n-bTVNxMPefUr4w&s',
    demons: 'https://staticg.sportskeeda.com/editor/2023/11/44d5a-17002924082331-1920.jpg',
    drama: 'https://imgix.ranker.com/list_img_v2/15115/2795115/original/best-drama-anime?auto=format&q=50&fit=crop&fm=pjpg&dpr=2&crop=faces&h=185.86387434554973&w=355',
    ecchi: 'https://thecinemaholic.com/wp-content/uploads/2018/08/_d_improd_/sankarea_f_improf_900x506.jpg',
    game: 'https://static1.dualshockersimages.com/wordpress/wp-content/uploads/2023/05/10-best-anime-about-gaming.jpg',
    harem: 'https://imgix.ranker.com/list_img_v2/14804/1834804/original/1834804-u3?auto=format&q=50&fit=crop&fm=pjpg&dpr=2&crop=faces&h=185.86387434554973&w=355',
    historical: 'https://a.storyblok.com/f/178900/960x540/8bb18b7440/the-elusive-samurai.jpg/m/filters:quality(95)format(webp)',
    fantasy: 'https://static1.moviewebimages.com/wordpress/wp-content/uploads/2024/05/20-underrated-dark-fantasy-anime-you-should-watch.jpg',
    horror: 'https://static1.srcdn.com/wordpress/wp-content/uploads/2023/10/horror-anime-featured.jpg',
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