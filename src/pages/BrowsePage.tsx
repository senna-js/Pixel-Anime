import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Anime } from '../types';
import AnimeCard from '../components/ui/AnimeCard';
import MainLayout from '../components/layout/MainLayout';
import { FaFilter, FaSort, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { animeApi } from '../services/api';

const BrowsePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [filteredAnimes, setFilteredAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [allAvailableGenres, setAllAvailableGenres] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Filter states
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Get initial values from URL params
  useEffect(() => {
    const sort = searchParams.get('sort') || '';
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const genres = searchParams.getAll('genre');
    const page = parseInt(searchParams.get('page') || '1', 10);
    
    setSortOption(sort);
    setSearchQuery(query);
    setSelectedStatus(status);
    setSelectedGenres(genres);
    setCurrentPage(page);
  }, [searchParams]);
  
  // Fetch available genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genres = await animeApi.getGenres();
        setAllAvailableGenres(genres);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };
    
    fetchGenres();
  }, []);
  
  // Fetch data when params change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let animesData: Anime[] = [];
        
        if (selectedGenres.length > 0) {
          // If multiple genres are selected, fetch the first one and filter the rest client-side
          animesData = await animeApi.getAnimeByGenre(selectedGenres[0], currentPage);
        } else {
          // Use the regular browse function for other cases
          animesData = await animeApi.getBrowseAnime({
            page: currentPage,
            query: searchQuery,
            sort: sortOption
          });
        }
        
        setAnimes(animesData);
        // Estimate total pages based on whether we have a full page of results
        setTotalPages(prev => {
          if (animesData.length < 20) {
            return currentPage;
          } else {
            return Math.max(prev, currentPage + 1);
          }
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data for browse page:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentPage, searchQuery, sortOption, selectedGenres]);
  
  // Apply filters (for status and genres filtering)
  useEffect(() => {
    let result = [...animes];
    
    // Filter by status
    if (selectedStatus) {
      result = result.filter(anime => anime.status === selectedStatus);
    }
    
    // Filter by multiple genres (if more than one is selected)
    if (selectedGenres.length > 1) {
      result = result.filter(anime => 
        selectedGenres.every(genre => anime.genres.includes(genre))
      );
    }
    
    setFilteredAnimes(result);
  }, [animes, selectedStatus, selectedGenres]);
  
  // Update URL when filters change
  const updateFilters = () => {
    const params = new URLSearchParams();
    
    if (sortOption) params.set('sort', sortOption);
    if (searchQuery) params.set('q', searchQuery);
    if (selectedStatus) params.set('status', selectedStatus);
    if (currentPage > 1) params.set('page', currentPage.toString());
    selectedGenres.forEach(genre => params.append('genre', genre));
    
    setSearchParams(params);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedGenres([]);
    setSelectedStatus('');
    setSortOption('');
    setSearchQuery('');
    setCurrentPage(1);
    setSearchParams({});
  };
  
  // Toggle genre selection
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };
  
  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateFilters();
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
    
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than or equal to max pages to show
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page
      pageNumbers.push(1);
      
      // Calculate start and end page numbers to show
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the beginning or end
      if (currentPage <= 2) {
        endPage = maxPagesToShow - 1;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - (maxPagesToShow - 1) + 1;
      }
      
      // Add ellipsis if needed before middle pages
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if needed after middle pages
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Show last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  if (loading && animes.length === 0) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </MainLayout>
    );
  }
  
  // Combine API genres with local genres
  const displayGenres = allAvailableGenres.length > 0 
    ? allAvailableGenres 
    : Array.from(new Set(animes.flatMap(anime => anime.genres))).sort();
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">Browse Anime</h1>
          
          {/* Search Bar */}
          <div className="w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                placeholder="Search anime..."
                className="bg-jet-card text-white px-4 py-2 rounded-l-md w-full focus:outline-none focus:ring-2 focus:ring-primary-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-r-md"
              >
                <FaSearch />
              </button>
            </form>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 bg-jet-card p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-white flex items-center">
                <FaFilter className="mr-2" /> Filters
              </h2>
              <button 
                className="text-xs text-primary-400 hover:text-primary-300"
                onClick={resetFilters}
              >
                Reset All
              </button>
            </div>
            
            {/* Mobile Toggle */}
            <button 
              className="w-full py-2 bg-gray-700 rounded-md text-white text-sm font-medium mb-4 md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            <div className={`${!showFilters ? 'hidden md:block' : ''}`}>
              {/* Sort Options */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-2 flex items-center">
                  <FaSort className="mr-2" /> Sort By
                </h3>
                <select
                  className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value);
                    setCurrentPage(1);
                    updateFilters();
                  }}
                >
                  <option value="">Default</option>
                  <option value="trending">Trending</option>
                  <option value="recent">Recently Added</option>
                </select>
              </div>
              
              {/* Status Filter */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-2">Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="status-all"
                      name="status"
                      className="mr-2"
                      checked={selectedStatus === ''}
                      onChange={() => {
                        setSelectedStatus('');
                        updateFilters();
                      }}
                    />
                    <label htmlFor="status-all" className="text-gray-300">All</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="status-ongoing"
                      name="status"
                      className="mr-2"
                      checked={selectedStatus === 'ongoing'}
                      onChange={() => {
                        setSelectedStatus('ongoing');
                        updateFilters();
                      }}
                    />
                    <label htmlFor="status-ongoing" className="text-gray-300">Ongoing</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="status-completed"
                      name="status"
                      className="mr-2"
                      checked={selectedStatus === 'completed'}
                      onChange={() => {
                        setSelectedStatus('completed');
                        updateFilters();
                      }}
                    />
                    <label htmlFor="status-completed" className="text-gray-300">Completed</label>
                  </div>
                </div>
              </div>
              
              {/* Genres Filter */}
              {displayGenres.length > 0 && (
                <div>
                  <h3 className="text-white font-medium mb-2">Genres</h3>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                    {displayGenres.map((genre) => (
                      <div key={genre} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`genre-${genre}`}
                          className="mr-2"
                          checked={selectedGenres.includes(genre)}
                          onChange={() => {
                            toggleGenre(genre);
                            updateFilters();
                          }}
                        />
                        <label htmlFor={`genre-${genre}`} className="text-gray-300">{genre}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Anime Grid */}
          <div className="flex-1">
            <div className="mb-4">
              <p className="text-gray-400">
                {filteredAnimes.length} {filteredAnimes.length === 1 ? 'result' : 'results'} found
              </p>
            </div>
            
            {filteredAnimes.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {filteredAnimes.map((anime) => (
                    <AnimeCard key={anime.id} anime={anime} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center bg-jet-card rounded-lg overflow-hidden shadow-lg">
                      {/* Previous Page Button */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className={`flex items-center justify-center w-10 h-10 ${
                          currentPage === 1 || loading
                            ? 'text-gray-500 cursor-not-allowed'
                            : 'text-white hover:bg-primary-700 hover:text-white'
                        }`}
                        aria-label="Previous Page"
                      >
                        <FaChevronLeft size={14} />
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="hidden sm:flex">
                        {getPageNumbers().map((page, index) => (
                          <React.Fragment key={index}>
                            {typeof page === 'number' ? (
                              <button
                                onClick={() => handlePageChange(page)}
                                className={`w-10 h-10 flex items-center justify-center ${
                                  currentPage === page
                                    ? 'bg-primary-600 text-white'
                                    : 'text-white hover:bg-gray-700'
                                }`}
                              >
                                {page}
                              </button>
                            ) : (
                              <span className="w-10 h-10 flex items-center justify-center text-gray-400">
                                {page}
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      
                      {/* Mobile Page Indicator */}
                      <div className="sm:hidden px-4 h-10 flex items-center justify-center text-white">
                        Page {currentPage} of {totalPages}
                      </div>
                      
                      {/* Next Page Button */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className={`flex items-center justify-center w-10 h-10 ${
                          currentPage === totalPages || loading
                            ? 'text-gray-500 cursor-not-allowed'
                            : 'text-white hover:bg-primary-700 hover:text-white'
                        }`}
                        aria-label="Next Page"
                      >
                        <FaChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-gray-300 text-lg mb-4">No anime found matching your criteria</p>
                <button 
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
                  onClick={resetFilters}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BrowsePage; 