export interface Anime {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  bannerImage?: string;
  genres: string[];
  seasons: Season[];
  releaseYear: number;
  status: 'ongoing' | 'completed';
  rating: number;
}

export interface Season {
  id: string;
  number: number;
  title: string;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  thumbnail: string;
  duration: number; // in seconds
  videoUrl: string;
  releaseDate: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  watchlist: string[]; // Anime IDs
  watchHistory: {
    animeId: string;
    episodeId: string;
    timestamp: number;
    lastWatched: string;
  }[];
} 