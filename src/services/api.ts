import axios from 'axios';
import { Anime, Season } from '../types';

// Use the environment variable with a fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// New API result type from the backend
interface ApiResponse {
  currentPage: number;
  hasNextPage: boolean;
  totalPages: number;
  results: ApiAnime[];
}

// The anime structure from the API
interface ApiAnime {
  id: string;
  title: string;
  url: string;
  image: string;
  duration: string;
  watchList: string;
  japaneseTitle: string;
  type: string;
  nsfw: boolean;
  sub: number;
  dub: number;
  episodes: number;
}

// API response for anime info
interface ApiAnimeInfo {
  id: string;
  title: string;
  malID?: number;
  alID?: number;
  japaneseTitle: string;
  image: string;
  description: string;
  type: string;
  url: string;
  recommendations: ApiAnime[];
  relatedAnime: {
    id: string;
    title: string;
    url: string;
    image: string;
    japaneseTitle: string;
    type: string;
    sub: number;
    dub: number;
    episodes: number;
  }[];
  subOrDub: string;
  hasSub: boolean;
  genres: string[];
  status: string;
  season: string;
  totalEpisodes: number;
  episodes: {
    id: string;
    number: number;
    title: string;
    isFiller: boolean;
    isSubbed: boolean;
    isDubbed: boolean;
    url: string;
  }[];
}

// Video stream response type
interface VideoStreamResponse {
  headers: {
    Referer: string;
  };
  intro?: {
    start: number;
    end: number;
  };
  outro?: {
    start: number;
    end: number;
  };
  sources: {
    url: string;
    isM3U8: boolean;
    type: string;
  }[];
  subtitles?: {
    url: string;
    lang: string;
  }[];
}

// Helper function to extract year from a string like "FALL 2022" or "2022"
const extractYearFromString = (dateString?: string): number | undefined => {
  if (!dateString) return undefined;
  
  // Match any 4-digit number that could be a year
  const yearMatch = dateString.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0]) : undefined;
};

// Function to convert API anime to our app's Anime type
const convertApiAnimeToAppAnime = (apiAnime: ApiAnime): Anime => {
  return {
    id: apiAnime.id,
    title: apiAnime.title,
    description: apiAnime.japaneseTitle || '', // Using japaneseTitle as fallback description
    coverImage: apiAnime.image,
    genres: apiAnime.type ? [apiAnime.type] : [], // Ensuring type is available before adding to genres
    releaseYear: new Date().getFullYear(), // Default to current year since API doesn't provide
    status: apiAnime.episodes === 0 ? 'ongoing' : 'completed',
    rating: 0, // Default since API doesn't provide
    seasons: [], // Default since API doesn't provide
  };
};

// Function to convert API anime info to our app's Anime type
const convertApiInfoToAppAnime = (animeInfo: ApiAnimeInfo): Anime => {
  // Determine status in a type-safe way
  let status: 'ongoing' | 'completed' = 'ongoing';
  if (animeInfo.status?.toLowerCase() === 'completed') {
    status = 'completed';
  }

  // Create a default season with all episodes
  const defaultSeason: Season = {
    id: 'season-1',
    number: 1,
    title: 'Season 1',
    episodes: animeInfo.episodes?.map(ep => {
      // Use the anime cover image as the thumbnail for all episodes
      // In a real app, you'd generate unique thumbnails per episode
      const thumbnail = animeInfo.image;
      
      return {
        id: ep.id,
        number: ep.number,
        title: ep.title || `Episode ${ep.number}`,
        thumbnail: thumbnail,
        duration: 1440, // Default to 24min (in seconds)
        videoUrl: ep.url,
        releaseDate: new Date().toISOString() // Default to today since API doesn't provide
      };
    }) || []
  };

  return {
    id: animeInfo.id,
    title: animeInfo.title,
    description: animeInfo.description || '',
    coverImage: animeInfo.image,
    genres: animeInfo.genres || [],
    releaseYear: extractYearFromString(animeInfo.season) || new Date().getFullYear(),
    status: status,
    rating: 0, // Default since API doesn't provide a score property
    seasons: [defaultSeason] // Add the default season with all episodes
  };
};

export const animeApi = {
  getTopAiring: async (page = 1): Promise<Anime[]> => {
    try {
      const response = await api.get<ApiResponse>(`/anime/zoro/top-airing?page=${page}`);
      return response.data.results.map(convertApiAnimeToAppAnime);
    } catch (error) {
      console.error('Error fetching top airing anime:', error);
      return [];
    }
  },

  getMostPopular: async (page = 1): Promise<Anime[]> => {
    try {
      const response = await api.get<ApiResponse>(`/anime/zoro/most-popular?page=${page}`);
      return response.data.results.map(convertApiAnimeToAppAnime).slice(0, 8);
    } catch (error) {
      console.error('Error fetching most popular anime:', error);
      return [];
    }
  },

  getRecentlyAdded: async (page = 1): Promise<Anime[]> => {
    try {
      const response = await api.get<ApiResponse>(`/anime/zoro/recent-added?page=${page}`);
      return response.data.results.map(convertApiAnimeToAppAnime);
    } catch (error) {
      console.error('Error fetching recently added anime:', error);
      return [];
    }
  },
  
  // Add search method
  searchAnime: async (query: string, page = 1): Promise<Anime[]> => {
    if (!query) return [];
    
    try {
      const response = await api.get<ApiResponse>(`/anime/zoro/${query}?page=${page}`);
      return response.data.results.map(convertApiAnimeToAppAnime);
    } catch (error) {
      console.error('Error searching anime:', error);
      return [];
    }
  },
  
  // Get detailed info for a specific anime
  getAnimeInfo: async (id: string): Promise<Anime | null> => {
    try {
      const response = await api.get<ApiAnimeInfo>(`/anime/zoro/info?id=${id}`);
      return convertApiInfoToAppAnime(response.data);
    } catch (error) {
      console.error(`Error fetching anime info for ID ${id}:`, error);
      return null;
    }
  },
  
  // Get list of all available genres
  getGenres: async (): Promise<string[]> => {
    try {
      const response = await api.get<string[]>('/anime/zoro/genre/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching genre list:', error);
      return [];
    }
  },
  
  // Get anime by genre
  getAnimeByGenre: async (genre: string, page = 1): Promise<Anime[]> => {
    try {
      const response = await api.get<ApiResponse>(`/anime/zoro/genre/${genre}?page=${page}`);
      return response.data.results.map(convertApiAnimeToAppAnime);
    } catch (error) {
      console.error(`Error fetching anime for genre ${genre}:`, error);
      return [];
    }
  },
  
  // Method to get anime for browse page with filtering
  getBrowseAnime: async (params: {
    page?: number;
    query?: string;
    sort?: string;
    genre?: string;
  } = {}): Promise<Anime[]> => {
    const { page = 1, query, sort, genre } = params;
    
    try {
      // If there's a genre, prioritize genre search
      if (genre) {
        return await animeApi.getAnimeByGenre(genre, page);
      }
      
      // If there's a search query, prioritize search
      if (query) {
        return await animeApi.searchAnime(query, page);
      }
      
      // Otherwise use sorting parameter to determine which endpoint to call
      if (sort === 'trending') {
        return await animeApi.getMostPopular(page);
      } else if (sort === 'recent') {
        return await animeApi.getRecentlyAdded(page);
      }
      
      // Default to top airing
      return await animeApi.getTopAiring(page);
    } catch (error) {
      console.error('Error fetching browse anime:', error);
      return [];
    }
  },
  
  // Get video stream sources for an episode
  getVideoSources: async (episodeId: string, server: string = 'vidcloud'): Promise<VideoStreamResponse | null> => {
    try {
      const response = await api.get<VideoStreamResponse>(
        `/anime/zoro/watch?episodeId=${episodeId}&server=${server}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching video sources for episode ${episodeId}:`, error);
      return null;
    }
  }
};

export default api; 