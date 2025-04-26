import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Anime, Season } from '../types';
import MainLayout from '../components/layout/MainLayout';
import { FaStar, FaPlay, FaCalendarAlt, FaClock, FaList, FaThLarge, FaAngleDown } from 'react-icons/fa';
import { animeApi } from '../services/api';

const AnimeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [relatedAnime, setRelatedAnime] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [visibleEpisodes, setVisibleEpisodes] = useState<number>(10);
  
  useEffect(() => {
    const fetchAnime = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await animeApi.getAnimeInfo(id);
        
        if (data) {
          setAnime(data);
          
          // Set the first season as selected by default
          if (data.seasons.length > 0) {
            setSelectedSeason(data.seasons[0]);
          }
          
          // We could store these in the state for future use
          // Using any[] type since we're keeping the original API format
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/anime/zoro/info?id=${id}`);
          const apiData = await response.json();
          setRelatedAnime(apiData.relatedAnime || []);
          setRecommendations(apiData.recommendations || []);
        }
        
        setLoading(false);
      } catch (error) {
        console.error(`Error fetching anime with id ${id}:`, error);
        setLoading(false);
      }
    };
    
    fetchAnime();
  }, [id]);
  
  // Reset visible episodes when changing seasons
  useEffect(() => {
    setVisibleEpisodes(10);
  }, [selectedSeason]);
  
  // Load saved view mode preference
  useEffect(() => {
    const savedViewMode = localStorage.getItem('episodesViewMode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
  }, []);
  
  // Toggle view mode and save preference
  const toggleViewMode = () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    localStorage.setItem('episodesViewMode', newMode);
  };

  // Load more episodes
  const loadMoreEpisodes = () => {
    if (!selectedSeason) return;
    
    // Show 20 more episodes or all remaining episodes (whichever is less)
    const nextBatch = Math.min(visibleEpisodes + 20, selectedSeason.episodes.length);
    setVisibleEpisodes(nextBatch);
  };
  
  // Show all episodes
  const showAllEpisodes = () => {
    if (!selectedSeason) return;
    setVisibleEpisodes(selectedSeason.episodes.length);
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (!anime) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Anime Not Found</h1>
          <p className="text-gray-300 mb-8">The anime you are looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Go Back
          </button>
        </div>
      </MainLayout>
    );
  }
  
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };
  
  return (
    <MainLayout>
      {/* Hero Banner */}
      <div className="relative h-[50vh] sm:h-[60vh] z-0">
        <div className="absolute inset-0">
          <img 
            src={anime.bannerImage || anime.coverImage} 
            alt={anime.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        </div>
        
        <div className="container mx-auto px-4 relative h-full flex items-end pb-8">
          <div className="flex flex-col md:flex-row gap-8 w-full">
            {/* Poster - Move to after title on mobile */}
            <div className="hidden md:block flex-shrink-0 w-32 sm:w-40 md:w-56 md:-mb-32 z-[5] mx-auto md:mx-0 -mb-16 sm:-mb-20">
              <img 
                src={anime.coverImage} 
                alt={anime.title} 
                className="w-full rounded-lg shadow-lg border border-jetblack-800"
              />
            </div>
            
            {/* Title and Info */}
            <div className="flex-1 text-center md:text-left z-[5]">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-2 shadow-text">{anime.title}</h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3 sm:mb-4">
                <div className="flex items-center">
                  <FaStar className="text-yellow-400 mr-1" />
                  <span className="text-white font-medium">{anime.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="text-gray-400 mr-1" />
                  <span className="text-gray-300">{anime.releaseYear}</span>
                </div>
                <span className={`text-xs text-white ${
                  anime.status === 'ongoing' ? 'bg-green-700' : 'bg-blue-700'
                } rounded-full px-3 py-1`}>
                  {anime.status === 'ongoing' ? 'Ongoing' : 'Completed'}
                </span>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4 max-w-full overflow-hidden">
                {anime.genres.slice(0, 4).map((genre, index) => (
                  <Link 
                    key={index} 
                    to={`/browse?genre=${encodeURIComponent(genre)}`}
                    className="bg-jet-card hover:bg-jet-hover text-gray-300 text-sm rounded-full px-3 py-1 transition-colors"
                  >
                    {genre}
                  </Link>
                ))}
                {anime.genres.length > 4 && (
                  <span className="text-gray-300 text-sm">+{anime.genres.length - 4} more</span>
                )}
              </div>
              
              {anime.seasons[0]?.episodes[0] && (
                <div className="flex justify-center md:justify-start">
                  <Link
                    to={`/watch/${anime.id}/${anime.seasons[0].id}/${anime.seasons[0].episodes[0].id}`}
                    className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-colors font-medium"
                  >
                    <FaPlay className="mr-2" /> Watch Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 mt-24 sm:mt-32 md:mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Left Column - Seasons and Episodes */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Episodes</h2>
              
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">View:</span>
                <button
                  onClick={toggleViewMode}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-jet-card text-gray-400 hover:bg-jet-hover'}`}
                  title="List View"
                >
                  <FaList size={16} />
                </button>
                <button
                  onClick={toggleViewMode}
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-jet-card text-gray-400 hover:bg-jet-hover'}`}
                  title="Grid View"
                >
                  <FaThLarge size={16} />
                </button>
              </div>
            </div>
            
            {/* Seasons Tabs */}
            {anime.seasons.length > 1 && (
              <div className="flex border-b border-gray-800 mb-6 overflow-x-auto">
                {anime.seasons.map((season) => (
                  <button
                    key={season.id}
                    className={`px-4 py-2 font-medium ${
                      selectedSeason?.id === season.id
                        ? 'text-primary-500 border-b-2 border-primary-500'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setSelectedSeason(season)}
                  >
                    {season.title}
                  </button>
                ))}
              </div>
            )}
            
            {/* Episodes Count */}
            {selectedSeason && selectedSeason.episodes.length > 0 && (
              <div className="text-sm text-gray-400 mb-4">
                Showing {Math.min(visibleEpisodes, selectedSeason.episodes.length)} of {selectedSeason.episodes.length} episodes
              </div>
            )}
            
            {/* Episodes List */}
            {selectedSeason && (
              <>
                {/* List View Mode */}
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {selectedSeason.episodes.slice(0, visibleEpisodes).map((episode) => (
                      <Link
                        key={episode.id}
                        to={`/watch/${anime.id}/${selectedSeason.id}/${episode.id}`}
                        className="block bg-jet-card rounded-lg overflow-hidden hover:bg-jet-hover transition-colors border border-jetblack-800 group"
                      >
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative sm:w-60 h-36 overflow-hidden flex-shrink-0">
                            <img
                              src={episode.thumbnail}
                              alt={episode.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              style={{ aspectRatio: '16/9', objectPosition: 'center' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                              <div className="absolute bottom-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium z-10 pointer-events-none">
                                Episode {episode.number}
                              </div>
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center z-10 pointer-events-none">
                                <FaClock className="mr-1 text-xs" />
                                {formatDuration(episode.duration)}
                              </div>
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <div className="bg-primary-600/80 rounded-full p-3 transform hover:scale-110 transition-transform">
                                  <FaPlay className="text-white text-xl" />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 flex flex-col justify-between flex-grow">
                            <div>
                              <h3 className="font-medium text-white text-lg mb-2 line-clamp-1 hover:text-primary-400 transition-colors">
                                {episode.title}
                              </h3>
                              <div className="hidden sm:block text-gray-400 text-sm mb-3 line-clamp-2">
                                {/* Generated episode description since it's not in the data model */}
                                {`Watch episode ${episode.number} of ${anime.title} - ${episode.title}`}
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <div className="text-gray-400 flex items-center text-sm">
                                <FaCalendarAlt className="mr-1" />
                                {new Date(episode.releaseDate).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <span className="text-primary-500 font-medium text-sm hover:underline">Watch Now</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Grid View Mode */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {selectedSeason.episodes.slice(0, visibleEpisodes).map((episode) => (
                      <Link
                        key={episode.id}
                        to={`/watch/${anime.id}/${selectedSeason.id}/${episode.id}`}
                        className="bg-jet-card rounded-lg overflow-hidden hover:bg-jet-hover transition-colors border border-jetblack-800 group h-full flex flex-col"
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={episode.thumbnail}
                            alt={episode.title}
                            className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                            <div className="absolute bottom-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium z-10 pointer-events-none">
                              Ep {episode.number}
                            </div>
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center z-10 pointer-events-none">
                              <FaClock className="mr-1 text-xs" />
                              {formatDuration(episode.duration)}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-primary-600/80 rounded-full p-2 transform hover:scale-110 transition-transform">
                                <FaPlay className="text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 flex flex-col flex-grow">
                          <h3 className="font-medium text-white text-sm mb-1 line-clamp-1 group-hover:text-primary-400 transition-colors">
                            {episode.title}
                          </h3>
                          <div className="text-gray-400 text-xs mt-auto">
                            {new Date(episode.releaseDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Show More Button */}
                {selectedSeason.episodes.length > visibleEpisodes && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={loadMoreEpisodes}
                      className="bg-jet-card hover:bg-jet-hover text-white px-6 py-3 rounded-lg inline-flex items-center transition-colors"
                    >
                      <FaAngleDown className="mr-2" /> Show More Episodes
                    </button>
                    <button
                      onClick={showAllEpisodes}
                      className="ml-4 text-primary-500 hover:text-primary-400 transition-colors text-sm"
                    >
                      Show All
                    </button>
                  </div>
                )}
              </>
            )}
            
            {/* Recommendations Section */}
            {recommendations.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">You May Also Like</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recommendations.slice(0, 10).map((item, index) => (
                    <Link key={index} to={`/anime/${item.id}`} className="group">
                      <div className="bg-jet-card rounded-lg overflow-hidden hover:bg-jet-hover transition-colors h-full">
                        <div className="relative aspect-[2/3] overflow-hidden">
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                        <div className="p-3">
                          <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-primary-400 transition-colors">
                            {item.title}
                          </h3>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-400">{item.type}</span>
                            {item.episodes > 0 && (
                              <span className="text-xs text-gray-400">{item.episodes} eps</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Details */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Synopsis</h2>
            <p className="text-gray-300 mb-6">{anime.description}</p>
            
            <div className="bg-jet-card rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">Details</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white font-medium">
                    {anime.status === 'ongoing' ? 'Ongoing' : 'Completed'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Released:</span>
                  <span className="text-white font-medium">{anime.releaseYear}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Episodes:</span>
                  <span className="text-white font-medium">
                    {anime.seasons.reduce((acc, season) => acc + season.episodes.length, 0)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Seasons:</span>
                  <span className="text-white font-medium">{anime.seasons.length}</span>
                </li>
              </ul>
            </div>
            
            {/* Related Anime Section */}
            {relatedAnime.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white mb-3">Related Anime</h3>
                <div className="space-y-3">
                  {relatedAnime.map((item, index) => (
                    <Link key={index} to={`/anime/${item.id}`} className="flex items-center gap-3 group">
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-medium group-hover:text-primary-400 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <span className="text-xs text-gray-400">{item.type}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AnimeDetailPage; 