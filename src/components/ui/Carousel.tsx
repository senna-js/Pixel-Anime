import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Anime } from '../../types';

interface CarouselProps {
  items: Anime[];
  autoPlayInterval?: number;
}

const Carousel: React.FC<CarouselProps> = ({ 
  items, 
  autoPlayInterval = 5000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [isAnimating, setIsAnimating] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Record<number, boolean>>({});
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Preload all images when component mounts
  useEffect(() => {
    if (!items.length) return;
    
    // Create a copy to track loaded status
    const imageStatus: Record<number, boolean> = {};
    
    items.forEach((item, index) => {
      const img = new Image();
      img.onload = () => {
        imageStatus[index] = true;
        setPreloadedImages(prev => ({ ...prev, [index]: true }));
      };
      img.src = item.bannerImage || item.coverImage;
      imagesRef.current[index] = img;
    });
    
    // Preload at least the first image before allowing interactions
    setPreloadedImages({ 0: true });
    
    return () => {
      // Cleanup
      imagesRef.current.forEach(img => {
        if (img) {
          img.onload = null;
        }
      });
    };
  }, [items]);

  const isImageLoaded = (index: number) => {
    return preloadedImages[index] === true;
  };
  
  const nextSlide = () => {
    if (isAnimating) return;
    
    const nextIndex = (currentIndex + 1) % items.length;
    
    // Preload next image before transition
    if (!isImageLoaded(nextIndex)) {
      const nextImage = new Image();
      nextImage.onload = () => {
        setPreloadedImages(prev => ({ ...prev, [nextIndex]: true }));
        performSlideTransition('right', nextIndex);
      };
      nextImage.src = items[nextIndex].bannerImage || items[nextIndex].coverImage;
      return;
    }
    
    performSlideTransition('right', nextIndex);
  };
  
  const prevSlide = () => {
    if (isAnimating) return;
    
    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    
    // Preload previous image before transition
    if (!isImageLoaded(prevIndex)) {
      const prevImage = new Image();
      prevImage.onload = () => {
        setPreloadedImages(prev => ({ ...prev, [prevIndex]: true }));
        performSlideTransition('left', prevIndex);
      };
      prevImage.src = items[prevIndex].bannerImage || items[prevIndex].coverImage;
      return;
    }
    
    performSlideTransition('left', prevIndex);
  };
  
  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    
    // Preload target image before transition
    if (!isImageLoaded(index)) {
      const targetImage = new Image();
      targetImage.onload = () => {
        setPreloadedImages(prev => ({ ...prev, [index]: true }));
        performSlideTransition(index > currentIndex ? 'right' : 'left', index);
      };
      targetImage.src = items[index].bannerImage || items[index].coverImage;
      return;
    }
    
    performSlideTransition(index > currentIndex ? 'right' : 'left', index);
  };
  
  const performSlideTransition = (dir: 'right' | 'left', newIndex: number) => {
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsAnimating(false);
    }, 300); // Match this with the transition duration
  };
  
  // Auto-play functionality
  useEffect(() => {
    if (!autoPlayInterval || items.length <= 1) return;
    
    const nextIndex = (currentIndex + 1) % items.length;
    
    // Pre-load the next image in preparation for auto advance
    if (!isImageLoaded(nextIndex)) {
      const nextImage = new Image();
      nextImage.onload = () => {
        setPreloadedImages(prev => ({ ...prev, [nextIndex]: true }));
      };
      nextImage.src = items[nextIndex].bannerImage || items[nextIndex].coverImage;
    }
    
    const intervalId = setInterval(() => {
      if (!isAnimating && isImageLoaded(nextIndex)) {
        nextSlide();
      }
    }, autoPlayInterval);
    
    return () => clearInterval(intervalId);
  }, [currentIndex, autoPlayInterval, isAnimating, items]);
  
  if (!items.length) return null;
  
  const currentItem = items[currentIndex];
  const imageSrc = currentItem.bannerImage || currentItem.coverImage;
  
  return (
    <div className="relative overflow-hidden">
      {/* Hero Carousel */}
      <div className="relative h-[50vh] md:h-[70vh] w-full">
        {/* Loading spinner - displayed when image isn't preloaded */}
        {!isImageLoaded(currentIndex) && (
          <div className="absolute inset-0 bg-jet-black flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}
        
        {/* Background Image */}
        <div 
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            isAnimating 
              ? direction === 'right' 
                ? 'translate-x-full opacity-0' 
                : '-translate-x-full opacity-0'
              : 'translate-x-0 opacity-100'
          }`}
        >
          <img 
            src={imageSrc}
            alt={currentItem.title}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
        </div>
        
        {/* Content */}
        <div className={`container relative h-full flex items-center z-10 transition-all duration-300 ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}>
          <div className="max-w-2xl px-4 py-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{currentItem.title}</h1>
            <div className="flex flex-wrap mb-4">
              {currentItem.genres.map((genre, index) => (
                <span key={index} className="text-xs text-white bg-primary-700 rounded-full px-2 py-0.5 mr-2 mb-2">
                  {genre}
                </span>
              ))}
              <span className="text-xs text-white bg-gray-700 rounded-full px-2 py-0.5 mr-2 mb-2">
                {currentItem.releaseYear}
              </span>
              <span className={`text-xs text-white ${
                currentItem.status === 'ongoing' ? 'bg-green-700' : 'bg-blue-700'
              } rounded-full px-2 py-0.5 mb-2`}>
                {currentItem.status === 'ongoing' ? 'Ongoing' : 'Completed'}
              </span>
            </div>
            <p className="text-gray-300 mb-6 line-clamp-3">{currentItem.description}</p>
            <div className="flex space-x-4">
              <Link 
                to={`/anime/${currentItem.id}`}
                className="flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-full transition duration-300"
              >
                <FaPlay className="mr-2" /> Watch Now
              </Link>
              <Link 
                to={`/anime/${currentItem.id}`}
                className="flex items-center bg-jet-card hover:bg-jet-hover text-white px-6 py-3 rounded-full transition duration-300"
              >
                Details
              </Link>
            </div>
          </div>
        </div>
        
        {/* Navigation Arrows */}
        <button 
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 transition-transform duration-150 hover:scale-110"
          onClick={prevSlide}
          disabled={isAnimating}
        >
          <FaChevronLeft className="h-5 w-5" />
        </button>
        <button 
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 transition-transform duration-150 hover:scale-110"
          onClick={nextSlide}
          disabled={isAnimating}
        >
          <FaChevronRight className="h-5 w-5" />
        </button>
        
        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isAnimating}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-primary-600 scale-110' 
                  : 'bg-gray-400/50 hover:bg-gray-300/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Carousel; 