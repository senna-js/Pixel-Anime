import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import 'plyr-react/plyr.css';

interface VideoPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  title?: string;
  className?: string;
  savedTime?: number;
  onTimeUpdate?: (time: number) => void;
  onVideoEnded?: () => void;
  referer?: string;
  subtitles?: {
    url: string;
    lang: string;
  }[];
  intro?: {
    start: number;
    end: number;
  };
  outro?: {
    start: number;
    end: number;
  };
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  posterUrl,
  title,
  className = '',
  savedTime = 0,
  onTimeUpdate,
  onVideoEnded,
  referer,
  subtitles,
  intro,
  outro
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timeUpdateThrottleRef = useRef<number | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(savedTime || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const loadedUrlRef = useRef<string | null>(null);

  // Check if the video is an HLS stream
  const isHLS = videoUrl?.includes('.m3u8');

  // Check if browser has native HLS support (Safari/iOS)
  const hasNativeHLSSupport = useCallback(() => {
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '';
  }, []);

  // Get proxied video URL if it's an HLS stream
  const getProxiedUrl = useCallback((url: string, refererHeader?: string) => {
    // Only proxy m3u8 streams
    if (url?.includes('.m3u8')) {
      // Get the proxy URL from environment variables or use a fallback
      const proxyBaseUrl = import.meta.env.VITE_PROXY_BASE_URL;
      const encodedUrl = encodeURIComponent(url);
      const encodedReferer = refererHeader ? encodeURIComponent(refererHeader) : '';
      return `${proxyBaseUrl}?url=${encodedUrl}&referer=${encodedReferer}`;
    }
    return url;
  }, []);

  // Memoize the timeUpdate function to prevent recreating it on each render
  const handleTimeUpdate = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !onTimeUpdate) return;
    
    // Update our current time reference
    currentTimeRef.current = videoElement.currentTime;
    
    const now = Date.now();
    // Only send time updates if playing and enough time has passed (1 second)
    if (isPlaying && now - lastUpdateTimeRef.current >= 1000) {
      lastUpdateTimeRef.current = now;
      onTimeUpdate(videoElement.currentTime);
    }
    
    // Show skip intro button if within intro range
    if (intro && videoElement.currentTime >= intro.start && videoElement.currentTime < intro.end) {
      setShowSkipIntro(true);
    } else {
      setShowSkipIntro(false);
    }
    
    // Show skip outro button if within outro range
    if (outro && videoElement.currentTime >= outro.start && videoElement.currentTime < outro.end) {
      setShowSkipOutro(true);
    } else {
      setShowSkipOutro(false);
    }
  }, [onTimeUpdate, intro, outro, isPlaying]);

  // Handle ended event
  const handleEnded = useCallback(() => {
    if (onVideoEnded) {
      onVideoEnded();
    }
  }, [onVideoEnded]);
  
  // Handle play/pause detection
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);
  
  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
  // Skip intro handler
  const skipIntro = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !intro) return;
    
    videoElement.currentTime = intro.end;
    setShowSkipIntro(false);
  }, [intro]);
  
  // Skip outro handler
  const skipOutro = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !onVideoEnded) return;
    
    // Instead of skipping to the end, just trigger the video ended handler
    onVideoEnded();
  }, [onVideoEnded]);
  
  // Extract base URL for handling relative paths in m3u8 files
  const extractBaseUrl = useCallback((url: string) => {
    try {
      const parsedUrl = new URL(url);
      // Get base path up to the last directory containing the m3u8 file
      const pathParts = parsedUrl.pathname.split('/');
      pathParts.pop(); // Remove filename
      return `${parsedUrl.protocol}//${parsedUrl.host}${pathParts.join('/')}/`;
    } catch (e) {
      return '';
    }
  }, []);
  
  // Add subtitles to video element
  const attachSubtitles = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !subtitles || subtitles.length === 0) return;
    
    // Clear existing subtitles first
    while (videoElement.firstChild) {
      videoElement.removeChild(videoElement.firstChild);
    }
    
    // Add subtitle tracks
    subtitles.forEach((subtitle, index) => {
      if (subtitle.lang !== 'thumbnails') {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = subtitle.lang;
        track.src = subtitle.url;
        track.srclang = subtitle.lang.toLowerCase();
        
        // Make the first subtitle track default
        if (index === 0) {
          track.default = true;
        }
        
        videoElement.appendChild(track);
      }
    });
  }, [subtitles]);
  
  // Set up event listeners
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    // Add event listeners
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    
    // Safari-specific handling for fullscreen changes
    videoElement.addEventListener('webkitbeginfullscreen', () => {
      // In Safari, videos in fullscreen sometimes need a nudge to keep playing
      if (isPlaying) {
        setTimeout(() => {
          const playPromise = videoElement.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Ignore errors - just trying to ensure it plays
            });
          }
        }, 100);
      }
    });
    
    // Remove event listeners on cleanup
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('webkitbeginfullscreen', () => {});
      
      if (timeUpdateThrottleRef.current) {
        clearTimeout(timeUpdateThrottleRef.current);
      }
    };
  }, [handleTimeUpdate, handleEnded, handlePlay, handlePause, isPlaying]);
  
  // Initialize HLS.js for m3u8 streams
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoUrl) return;
    
    // Check if the URL changed - if not, avoid reloading to prevent HLS segment issues
    if (loadedUrlRef.current === videoUrl) {
      return;
    }
    
    // Update our loaded URL reference
    loadedUrlRef.current = videoUrl;
    
    // Reset error message
    setErrorMessage(null);
    
    // Use the proxied URL for HLS streams
    const proxiedVideoUrl = getProxiedUrl(videoUrl, referer);

    // For HLS streams
    if (isHLS) {
      const isNativeHLSSupported = hasNativeHLSSupport();
      
      // For Safari & iOS, use native HLS support
      if (isNativeHLSSupported) {
        // Clean up existing HLS instance if any
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        
        // Safari needs the direct source - try both normal and proxied URL
        videoElement.src = proxiedVideoUrl;
        videoElement.load();
        
        // Attach subtitles after loading
        attachSubtitles();
        
        // Set initial time if needed
        if (!isInitializedRef.current && savedTime > 0) {
          // Safari needs a small delay to set the time correctly
          setTimeout(() => {
            if (videoElement) {
              videoElement.currentTime = savedTime;
              isInitializedRef.current = true;
              
              // Also try to play after setting time
              const playPromise = videoElement.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => {
                  // Ignore autoplay errors on Safari
                });
              }
            }
          }, 300);
        } else if (currentTimeRef.current > 0) {
          // Restore the current position
          setTimeout(() => {
            if (videoElement) {
              videoElement.currentTime = currentTimeRef.current;
            }
          }, 300);
        }
      } 
      // For browsers that don't support HLS natively (Chrome, Firefox, etc.)
      else if (Hls.isSupported()) {
        // Destroy any existing hls instance
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        
        // Create a new HLS instance with better configuration
        const hls = new Hls({
          // Better fragment loading settings
          fragLoadingTimeOut: 60000,        // Fragment timeout - 60 seconds
          manifestLoadingTimeOut: 60000,    // Manifest timeout - 60 seconds
          levelLoadingTimeOut: 60000,       // Level timeout - 60 seconds
          fragLoadingRetryDelay: 1000,      // Initial delay before first retry - 1 second
          manifestLoadingMaxRetry: 4,       // Max number of attempts for manifest
          levelLoadingMaxRetry: 4,          // Max number of attempts for level loading
          fragLoadingMaxRetry: 6,           // Max number of attempts for fragments
          startFragPrefetch: true,          // Start prefetching fragments
          maxBufferLength: 60,              // Max buffer length in seconds
          maxMaxBufferLength: 600,          // Maximum buffer length in seconds
          autoStartLoad: true,              // Start loading immediately
          startLevel: -1,                   // Start at optimal level
          maxBufferHole: 0.5,               // Minimal buffer hole tolerance in seconds
          lowLatencyMode: false,            // Disable low latency mode for our case
        });
        
        // Handle errors
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            // Set an appropriate error message based on the type of error
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              setErrorMessage("Network error occurred. The video server might be restricting access.");
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              // Try to recover from media errors
              hls.recoverMediaError();
              return;
            } else {
              setErrorMessage("An error occurred while playing the video. Please try again later.");
            }
            
            hls.destroy();
            hlsRef.current = null;
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            // Try to recover from non-fatal media errors
            hls.recoverMediaError();
          }
        });
        
        try {
          // Use the proxied URL instead of the direct URL
          hls.loadSource(proxiedVideoUrl);
          hls.attachMedia(videoElement);
          
          // Attach subtitles after HLS is attached
          attachSubtitles();
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            // Only set the time if this is our first time loading the video
            if (!isInitializedRef.current && savedTime > 0) {
              videoElement.currentTime = savedTime;
              isInitializedRef.current = true;
            } else if (currentTimeRef.current > 0) {
              // If we have a current time position, maintain it
              videoElement.currentTime = currentTimeRef.current;
            }
            
            // Try to autoplay when source is loaded
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                // Autoplay prevented by browser - that's okay
              });
            }
          });
          
          // Handle level switching to maintain time position
          hls.on(Hls.Events.LEVEL_SWITCHED, () => {
            if (currentTimeRef.current > 0 && videoElement.currentTime !== currentTimeRef.current) {
              videoElement.currentTime = currentTimeRef.current;
            }
          });
          
          // Store the hls instance for cleanup
          hlsRef.current = hls;
        } catch (error) {
          setErrorMessage("Failed to load video. The stream might be restricted or unavailable.");
        }
      } else {
        // No HLS support - show error
        setErrorMessage("Your browser doesn't support HLS streaming and HLS.js is not available.");
      }
    } else {
      // For regular MP4 videos, no need to proxy
      videoElement.src = videoUrl;
      videoElement.load();
      
      // Attach subtitles after loading
      attachSubtitles();
      
      if (!isInitializedRef.current && savedTime > 0) {
        videoElement.currentTime = savedTime;
        isInitializedRef.current = true;
      } else if (currentTimeRef.current > 0) {
        videoElement.currentTime = currentTimeRef.current;
      }
      
      // Handle errors for direct video sources
      const handleError = () => {
        setErrorMessage("Failed to load video. Please try a different server.");
      };
      
      videoElement.addEventListener('error', handleError);
      
      // Try to autoplay when source changes
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay prevented by browser
        });
      }
      
      return () => {
        videoElement.removeEventListener('error', handleError);
      };
    }
  }, [videoUrl, isHLS, savedTime, referer, getProxiedUrl, hasNativeHLSSupport, attachSubtitles]);
  
  // Clean up HLS on component unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);
  
  return (
    <div className={`video-player-container relative ${className}`}>
      {errorMessage ? (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white p-4">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-center mb-4">{errorMessage}</p>
          <p className="text-center text-sm text-gray-400 mb-6">
            This might be due to CORS restrictions or region blocking.
            Try using a different server or watching a different anime.
          </p>
          <button
            onClick={() => setErrorMessage(null)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            playsInline
            webkit-playsinline="true"
            poster={posterUrl}
            title={title}
            preload="auto"
          >
            Your browser does not support the video tag.
          </video>
          
          {/* Skip Intro Button */}
          {showSkipIntro && (
            <button
              onClick={skipIntro}
              className="absolute bottom-20 right-4 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Skip Intro
            </button>
          )}
          
          {/* Skip Outro Button */}
          {showSkipOutro && (
            <button
              onClick={skipOutro}
              className="absolute bottom-20 right-4 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Next Episode
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(VideoPlayer); 