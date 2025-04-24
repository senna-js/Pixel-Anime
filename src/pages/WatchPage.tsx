import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
// Remove the mock animeApi import
// import { animeApi } from '../services/api';
import { Anime, Episode, Season } from '../types';
import VideoPlayer from '../components/ui/VideoPlayer';
import MainLayout from '../components/layout/MainLayout';
import { FaArrowLeft, FaArrowRight, FaListUl } from 'react-icons/fa';
import { animeApi } from '../services/api';

const WatchPage: React.FC = () => {
  const { animeId, seasonId, episodeId } = useParams<{ 
    animeId: string; 
    seasonId: string; 
    episodeId: string;
  }>();
  const navigate = useNavigate();
  
  const [anime, setAnime] = useState<Anime | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [watchTime, setWatchTime] = useState<number>(0);
  const [videoSources, setVideoSources] = useState<any>(null);
  const [selectedServer, setSelectedServer] = useState<string>('vidcloud');
  const videoServers = ['vidcloud', 'streamsb', 'vidstreaming'];
  const [error, setError] = useState<string | null>(null);

  // Updated to only use animeApi
  const fetchAnime = async (id: string) => {
    try {
      const animeData = await animeApi.getAnimeInfo(id);
      if (animeData) {
        return animeData;
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!animeId) return;
      
      try {
        setLoading(true);
        
        // Only try animeApi
        const animeData = await fetchAnime(animeId);
        
        if (!animeData) {
          setLoading(false);
          return;
        }
        
        setAnime(animeData);
        
        // Find current season - only use first season if seasonId not specified
        let season;
        if (!seasonId) {
          // If no seasonId is provided, use the first season
          season = animeData.seasons[0];
        } else {
          // If seasonId is provided, try to find the matching season
          season = animeData.seasons.find(s => s.id === seasonId) || animeData.seasons[0];
        }
        
        setCurrentSeason(season);
        
        // Find current episode - only use first episode if episodeId not specified
        let episode;
        if (!episodeId) {
          // If no episodeId is provided, use the first episode
          episode = season.episodes[0];
        } else {
          // If episodeId is provided, try to find the matching episode
          episode = season.episodes.find(e => e.id === episodeId) || season.episodes[0];
        }
        
        setCurrentEpisode(episode);
        
        // Get saved watch time from local storage
        const savedWatchTime = localStorage.getItem(`watchTime-${animeId}-${season.id}-${episode.id}`);
        if (savedWatchTime) {
          setWatchTime(parseFloat(savedWatchTime));
        }
        
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [animeId, seasonId, episodeId]);
  
  // Fetch video sources when episode ID or server changes
  useEffect(() => {
    if (!currentEpisode) return;

    const fetchVideoSources = async () => {
      setLoading(true);
      try {
        // Get the correct episode ID - we need to use the currentEpisode.id rather than the URL param
        const currentEpisodeId = currentEpisode.id;
        
        const sources = await animeApi.getVideoSources(currentEpisodeId, selectedServer);
        
        if (sources) {
          setVideoSources(sources);
        } else {
          setError('Failed to load video sources. Please try another server.');
        }
      } catch (err) {
        setError('Failed to load video sources. Please try another server.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoSources();
  }, [currentEpisode, selectedServer]);
  
  // Save watch time to local storage periodically
  const handleTimeUpdate = (time: number) => {
    // Only update state if the time has changed significantly (more than 1 second)
    if (Math.abs(time - watchTime) > 1) {
      setWatchTime(time);
    }
    
    if (anime && currentSeason && currentEpisode) {
      // Store in localStorage without going through state
      localStorage.setItem(
        `watchTime-${anime.id}-${currentSeason.id}-${currentEpisode.id}`,
        time.toString()
      );
      
      // Only update watch history when significant progress is made (every 5%)
      const progress = Math.min(Math.round((time / currentEpisode.duration) * 100), 100);
      const lastSavedProgress = parseInt(localStorage.getItem(`lastSavedProgress-${anime.id}-${currentSeason.id}-${currentEpisode.id}`) || '0');
      
      if (Math.abs(progress - lastSavedProgress) >= 5 || progress === 100) {
        localStorage.setItem(`lastSavedProgress-${anime.id}-${currentSeason.id}-${currentEpisode.id}`, progress.toString());
        
        // Update watch history in local storage
        const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
        const historyEntry = {
          animeId: anime.id,
          seasonId: currentSeason.id,
          episodeId: currentEpisode.id,
          title: anime.title,
          episodeTitle: currentEpisode.title,
          episodeNumber: currentEpisode.number,
          seasonNumber: currentSeason.number,
          thumbnail: currentEpisode.thumbnail,
          timestamp: time,
          progress: progress,
          lastWatched: new Date().toISOString(),
        };
        
        // Remove if already exists and add to beginning
        const filteredHistory = watchHistory.filter(
          (entry: any) => !(
            entry.animeId === historyEntry.animeId && 
            entry.seasonId === historyEntry.seasonId && 
            entry.episodeId === historyEntry.episodeId
          )
        );
        
        localStorage.setItem('watchHistory', JSON.stringify([historyEntry, ...filteredHistory].slice(0, 20)));
      }
    }
  };
  
  // Handle video end - navigate to next episode if available
  const handleVideoEnded = () => {
    if (!anime || !currentSeason || !currentEpisode) return;
    
    // Find index of current episode in the season
    const episodeIndex = currentSeason.episodes.findIndex(e => e.id === currentEpisode.id);
    
    // If there's a next episode in the current season
    if (episodeIndex < currentSeason.episodes.length - 1) {
      const nextEpisode = currentSeason.episodes[episodeIndex + 1];
      navigate(`/watch/${anime.id}/${currentSeason.id}/${nextEpisode.id}`);
      return;
    }
    
    // If there's a next season
    const seasonIndex = anime.seasons.findIndex(s => s.id === currentSeason.id);
    if (seasonIndex < anime.seasons.length - 1) {
      const nextSeason = anime.seasons[seasonIndex + 1];
      if (nextSeason.episodes.length > 0) {
        navigate(`/watch/${anime.id}/${nextSeason.id}/${nextSeason.episodes[0].id}`);
        return;
      }
    }
    
    // If no next episode or season, redirect to anime detail page
    navigate(`/anime/${anime.id}`);
  };
  
  // Navigate to previous episode
  const goToPreviousEpisode = () => {
    if (!anime || !currentSeason || !currentEpisode) return;
    
    // Find index of current episode in the season
    const episodeIndex = currentSeason.episodes.findIndex(e => e.id === currentEpisode.id);
    
    // If there's a previous episode in the current season
    if (episodeIndex > 0) {
      const prevEpisode = currentSeason.episodes[episodeIndex - 1];
      navigate(`/watch/${anime.id}/${currentSeason.id}/${prevEpisode.id}`);
      return;
    }
    
    // If there's a previous season
    const seasonIndex = anime.seasons.findIndex(s => s.id === currentSeason.id);
    if (seasonIndex > 0) {
      const prevSeason = anime.seasons[seasonIndex - 1];
      if (prevSeason.episodes.length > 0) {
        const lastEpisode = prevSeason.episodes[prevSeason.episodes.length - 1];
        navigate(`/watch/${anime.id}/${prevSeason.id}/${lastEpisode.id}`);
        return;
      }
    }
  };
  
  // Navigate to next episode
  const goToNextEpisode = () => {
    if (!anime || !currentSeason || !currentEpisode) return;
    
    // Find index of current episode in the season
    const episodeIndex = currentSeason.episodes.findIndex(e => e.id === currentEpisode.id);
    
    // If there's a next episode in the current season
    if (episodeIndex < currentSeason.episodes.length - 1) {
      const nextEpisode = currentSeason.episodes[episodeIndex + 1];
      navigate(`/watch/${anime.id}/${currentSeason.id}/${nextEpisode.id}`);
      return;
    }
    
    // If there's a next season
    const seasonIndex = anime.seasons.findIndex(s => s.id === currentSeason.id);
    if (seasonIndex < anime.seasons.length - 1) {
      const nextSeason = anime.seasons[seasonIndex + 1];
      if (nextSeason.episodes.length > 0) {
        navigate(`/watch/${anime.id}/${nextSeason.id}/${nextSeason.episodes[0].id}`);
        return;
      }
    }
  };
  
  // Get the appropriate video URL from sources
  const getMainVideoUrl = () => {
    if (!videoSources || !videoSources.sources) return '';
    
    // Find the highest quality source
    const sources = videoSources.sources;
    
    if (sources.length === 0) return '';
    
    // Sort by quality if multiple sources
    if (sources.length > 1) {
      // Try to find 1080p first
      const hd = sources.find((s: any) => s.quality === '1080p' || s.quality === '1080');
      if (hd) return hd.url;
      
      // Try to find 720p next
      const md = sources.find((s: any) => s.quality === '720p' || s.quality === '720');
      if (md) return md.url;
    }
    
    // Default to the first source
    return sources[0].url;
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
  
  if (!anime || !currentSeason || !currentEpisode) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Episode Not Found</h1>
          <p className="text-gray-300 mb-8">The episode you are looking for doesn't exist or has been removed.</p>
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
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Player Section */}
        <div className="bg-gray-900">
          {loading ? (
            <div className="w-full aspect-video flex items-center justify-center bg-slate-800">
              <div className="loader"></div>
            </div>
          ) : error ? (
            <div className="w-full aspect-video flex items-center justify-center bg-slate-800 text-white">
              <div className="text-center p-4">
                <h3 className="text-xl font-bold mb-2">Error</h3>
                <p>{error}</p>
                <button 
                  onClick={() => navigate(-1)} 
                  className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded"
                >
                  Go Back
                </button>
              </div>
            </div>
          ) : videoSources ? (
            <VideoPlayer
              key={`${anime?.id}-${currentSeason?.id}-${currentEpisode?.id}`}
              videoUrl={getMainVideoUrl()}
              posterUrl={currentEpisode?.thumbnail || anime?.coverImage}
              title={`${anime?.title} - ${currentEpisode?.title}`}
              className="w-full aspect-video"
              savedTime={watchTime}
              onTimeUpdate={handleTimeUpdate}
              onVideoEnded={handleVideoEnded}
              referer={videoSources?.headers?.Referer}
              subtitles={videoSources?.subtitles}
              intro={videoSources?.intro}
              outro={videoSources?.outro}
            />
          ) : null}
          <div className="bg-jet-card p-4">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
              {anime?.title} - {currentSeason?.title} Episode {currentEpisode?.number}
            </h1>
            <h2 className="text-lg text-gray-300 mb-4">{currentEpisode?.title}</h2>
            
            {/* Episode navigation */}
            <div className="flex flex-wrap justify-between items-center">
              {/* Left navigation */}
              <div className="flex space-x-3">
                <button
                  onClick={goToPreviousEpisode}
                  className="flex items-center bg-jet-hover hover:bg-gray-600 text-white px-4 py-2 rounded-full transition-colors"
                  disabled={
                    !currentSeason || !currentEpisode || !anime ||
                    (currentSeason.episodes.findIndex(e => e.id === currentEpisode.id) === 0 &&
                    anime.seasons.findIndex(s => s.id === currentSeason.id) === 0)
                  }
                >
                  <FaArrowLeft className="mr-2" /> Previous
                </button>
                <button
                  onClick={goToNextEpisode}
                  className="flex items-center bg-jet-hover hover:bg-gray-600 text-white px-4 py-2 rounded-full transition-colors"
                  disabled={
                    !currentSeason || !currentEpisode || !anime ||
                    (currentSeason.episodes.findIndex(e => e.id === currentEpisode.id) === currentSeason.episodes.length - 1 &&
                    anime.seasons.findIndex(s => s.id === currentSeason.id) === anime.seasons.length - 1)
                  }
                >
                  Next <FaArrowRight className="ml-2" />
                </button>
              </div>
              
              {/* Details & Info */}
              <div className="mt-3 md:mt-0">
                <Link
                  to={`/anime/${anime?.id}`}
                  className="flex items-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full transition-colors"
                >
                  <FaListUl className="mr-2" /> All Episodes
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Server selection */}
        {videoSources && (
          <div className="mt-6 bg-jet-card p-4 rounded-lg">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white text-sm">Servers:</span>
              {videoServers.map(server => (
                <button
                  key={server}
                  onClick={() => setSelectedServer(server)}
                  className={`px-3 py-1 text-sm rounded ${
                    selectedServer === server
                      ? 'bg-primary-600 text-white'
                      : 'bg-jet-card text-white hover:bg-jet-hover'
                  }`}
                >
                  {server.charAt(0).toUpperCase() + server.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Episode List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">More Episodes from {currentSeason?.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentSeason?.episodes.map((episode) => (
              <Link
                key={episode.id}
                to={`/watch/${anime?.id}/${currentSeason?.id}/${episode.id}`}
                className={`block bg-jet-card rounded-lg overflow-hidden hover:bg-jet-hover transition-colors ${
                  episode.id === currentEpisode?.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="relative">
                  <img
                    src={episode.thumbnail}
                    alt={episode.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(episode.duration)}
                  </div>
                  {/* Show progress bar if watched */}
                  {anime && currentSeason && localStorage.getItem(`watchTime-${anime.id}-${currentSeason.id}-${episode.id}`) && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div 
                        className="h-full bg-primary-500" 
                        style={{ 
                          width: `${Math.min(
                            Math.round(
                              (parseFloat(
                                localStorage.getItem(`watchTime-${anime.id}-${currentSeason.id}-${episode.id}`) || '0'
                              ) / episode.duration) * 100
                            ), 
                            100
                          )}%` 
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-gray-400 text-sm">Episode {episode.number}</p>
                      <h3 className="font-medium text-white line-clamp-1">{episode.title}</h3>
                    </div>
                    {episode.id === currentEpisode?.id && (
                      <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
                        Now Playing
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default WatchPage; 