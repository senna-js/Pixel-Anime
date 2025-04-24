import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaCompass, FaList, FaSearch, FaUser, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { RiMenuLine, RiCloseLine } from 'react-icons/ri';

const Navbar: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Check login status
  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        setUsername(localStorage.getItem('username') || 'User');
      }
    };
    
    checkLoginStatus();
    
    // Listen for storage changes (for when user logs in/out in another tab)
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, [location.pathname]); // Re-check when route changes

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to browse page with search query parameter
      navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-jet-black border-b border-jetblack-800 fixed w-full z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Left Section: Logo */}
          <div className="flex-shrink-0 flex items-center w-3/10 justify-start">
            <Link to="/" className="text-white font-bold text-xl flex items-center">
              <span className="text-primary-400 mr-2">Pixel</span>
              <span className="text-white">Anime</span>
            </Link>
          </div>

          {/* Center Section: Desktop Menu - Truly Centered */}
          <div className="flex-1 flex justify-center w-4/10">
            <div className="hidden md:flex space-x-8">
              <Link
                to="/"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') 
                    ? 'text-white bg-jet-card'
                    : 'text-gray-300 hover:bg-jet-hover hover:text-white'
                }`}
              >
                <FaHome className="mr-2" /> Home
              </Link>
              <Link
                to="/browse"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/browse')
                    ? 'text-white bg-jet-card'
                    : 'text-gray-300 hover:bg-jet-hover hover:text-white'
                }`}
              >
                <FaCompass className="mr-2" /> Browse
              </Link>
              <Link
                to="/categories"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/categories')
                    ? 'text-white bg-jet-card'
                    : 'text-gray-300 hover:bg-jet-hover hover:text-white'
                }`}
              >
                <FaList className="mr-2" /> Categories
              </Link>
            </div>
          </div>

          {/* Right Section: Search and User */}
          <div className="flex items-center justify-end w-3/10 space-x-4">
            {/* Search Bar */}
            <div className={`relative ${isSearchOpen ? 'w-48' : 'w-auto'}`}>
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-jet-card text-white px-3 py-1.5 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-primary-400 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-2 text-gray-400"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <RiCloseLine className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="text-gray-300 hover:text-white p-1.5 rounded-md hover:bg-jet-hover"
                >
                  <FaSearch className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* User Profile / Auth Links */}
            <div className="relative hidden md:block">
              {isLoggedIn ? (
                <Link
                  to="/profile"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/profile')
                      ? 'text-white bg-jet-card'
                      : 'text-gray-300 hover:bg-jet-hover hover:text-white'
                  }`}
                >
                  <FaUser className="mr-2" /> {username}
                </Link>
              ) : (
                <div className="flex space-x-2">
                  <Link
                    to="/login"
                    className="flex items-center px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-md text-sm font-medium text-white whitespace-nowrap"
                  >
                    <FaUserPlus className="mr-1.5" /> Login
                  </Link>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white p-1.5 rounded-md hover:bg-jet-hover"
              >
                {isMobileMenuOpen ? (
                  <RiCloseLine className="h-5 w-5" />
                ) : (
                  <RiMenuLine className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute w-full left-0 bg-jet-black border-b border-jetblack-800 z-50">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') 
                    ? 'text-white bg-jet-card'
                    : 'text-gray-300 hover:bg-jet-hover hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaHome className="mr-2" /> Home
              </Link>
              <Link
                to="/browse"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/browse')
                    ? 'text-white bg-jet-card'
                    : 'text-gray-300 hover:bg-jet-hover hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaCompass className="mr-2" /> Browse
              </Link>
              <Link
                to="/categories"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/categories')
                    ? 'text-white bg-jet-card'
                    : 'text-gray-300 hover:bg-jet-hover hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaList className="mr-2" /> Categories
              </Link>
              
              {isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/profile')
                        ? 'text-white bg-jet-card'
                        : 'text-gray-300 hover:bg-jet-hover hover:text-white'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaUser className="mr-2" /> Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-jet-hover hover:text-white"
                  >
                    <FaSignInAlt className="mr-2" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/login')
                        ? 'text-white bg-jet-card'
                        : 'text-gray-300 hover:bg-jet-hover hover:text-white'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaSignInAlt className="mr-2" /> Login
                  </Link>
                  <Link
                    to="/register"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/register')
                        ? 'text-white bg-jet-card'
                        : 'text-primary-400 hover:bg-jet-hover hover:text-primary-300'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaUserPlus className="mr-2" /> Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 