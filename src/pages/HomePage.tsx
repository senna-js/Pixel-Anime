import React, { useEffect, useState } from 'react';
import { Anime } from '../types';
import Carousel from '../components/ui/Carousel';
import AnimeGrid from '../components/ui/AnimeGrid';
import MainLayout from '../components/layout/MainLayout';
import { animeApi } from '../services/api';

const HomePage: React.FC = () => {
  const [featuredAnimes, setFeaturedAnimes] = useState<Anime[]>([]);
  const [trendingAnimes, setTrendingAnimes] = useState<Anime[]>([]);
  const [recentlyAddedAnimes, setRecentlyAddedAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use the new real API endpoints
        const [topAiring, mostPopular, recentlyAdded] = await Promise.all([
          animeApi.getMostPopular(),
          animeApi.getTopAiring(),
          animeApi.getRecentlyAdded()
        ]);
        
        // Top airing anime for the carousel
        setFeaturedAnimes(topAiring);
        
        // Most popular anime for the trending section
        setTrendingAnimes(mostPopular);
        
        // Recently added anime
        setRecentlyAddedAnimes(recentlyAdded);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data for homepage:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      {/* Hero Carousel */}
      <Carousel items={featuredAnimes} />
      
      {/* Trending Anime Section */}
      <AnimeGrid 
        title="Trending Now" 
        animes={trendingAnimes} 
        viewAllLink="/browse?sort=trending" 
      />
      
      {/* Recently Added Section */}
      <AnimeGrid 
        title="Recently Added" 
        animes={recentlyAddedAnimes} 
        viewAllLink="/browse?sort=recent" 
      />
      
      {/* Call to Action */}
      <section className="py-12 bg-gradient-to-r from-jetblack-900 to-jet-gray">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Discover Your Next Favorite Anime
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            With thousands of anime to choose from and new episodes added daily, 
            there's always something exciting to watch.
          </p>
          <a 
            href="/browse" 
            className="inline-block bg-primary-700 hover:bg-primary-600 text-white font-medium rounded-md px-8 py-3 transition-colors"
          >
            Browse All Anime
          </a>
        </div>
      </section>
    </MainLayout>
  );
};

export default HomePage; 