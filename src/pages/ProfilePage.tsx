import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaHistory, FaBookmark, FaCog, FaSignOutAlt } from 'react-icons/fa';
import MainLayout from '../components/layout/MainLayout';

type WatchHistoryItem = {
  animeId: string;
  seasonId: string;
  episodeId: string;
  title: string;
  episodeTitle: string;
  episodeNumber: number;
  seasonNumber: number;
  thumbnail: string;
  progress: number;
  lastWatched: string;
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'history' | 'watchlist' | 'settings'>('history');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status and load user data
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    
    if (!loggedIn) {
      navigate('/login');
      return;
    }
    
    // Load user data from localStorage (in a real app, this would come from an API)
    setUsername(localStorage.getItem('username') || 'User');
    setEmail(localStorage.getItem('userEmail') || 'user@example.com');
    
    // Load watch history
    try {
      const historyJson = localStorage.getItem('watchHistory');
      if (historyJson) {
        setWatchHistory(JSON.parse(historyJson));
      }
    } catch (e) {
      console.error('Error loading watch history:', e);
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('isLoggedIn');
    // Don't remove watch history and other data, just log out
    
    // Redirect to login
    navigate('/login');
  };

  const clearWatchHistory = () => {
    if (window.confirm('Are you sure you want to clear your watch history?')) {
      localStorage.removeItem('watchHistory');
      setWatchHistory([]);
    }
  };

  // Format date to human-readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isLoggedIn) {
    return null; // Will redirect in useEffect
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-jet-card rounded-xl p-6 shadow-lg border border-jetblack-800">
              <div className="flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-4xl mb-4">
                  <FaUser />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{username}</h2>
                <p className="text-gray-400 text-sm mb-4">{email}</p>
                
                <div className="w-full mt-4 space-y-2">
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`w-full flex items-center px-4 py-2 rounded-md ${
                      activeTab === 'history'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-jet-hover'
                    }`}
                  >
                    <FaHistory className="mr-3" /> Watch History
                  </button>
                  <button
                    onClick={() => setActiveTab('watchlist')}
                    className={`w-full flex items-center px-4 py-2 rounded-md ${
                      activeTab === 'watchlist'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-jet-hover'
                    }`}
                  >
                    <FaBookmark className="mr-3" /> Watchlist
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center px-4 py-2 rounded-md ${
                      activeTab === 'settings'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-jet-hover'
                    }`}
                  >
                    <FaCog className="mr-3" /> Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 rounded-md text-gray-300 hover:bg-red-900/30 hover:text-red-200"
                  >
                    <FaSignOutAlt className="mr-3" /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-jet-card rounded-xl p-6 shadow-lg border border-jetblack-800 min-h-[600px]">
              {activeTab === 'history' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Watch History</h2>
                    {watchHistory.length > 0 && (
                      <button
                        onClick={clearWatchHistory}
                        className="text-sm text-gray-400 hover:text-red-400"
                      >
                        Clear History
                      </button>
                    )}
                  </div>
                  
                  {watchHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <FaHistory className="text-gray-700 w-16 h-16 mx-auto mb-4" />
                      <h3 className="text-xl text-gray-400 mb-2">No Watch History</h3>
                      <p className="text-gray-500 mb-6">You haven't watched any anime yet.</p>
                      <Link
                        to="/browse"
                        className="inline-block bg-primary-600 hover:bg-primary-700 text-white py-2 px-6 rounded-full transition-colors"
                      >
                        Browse Anime
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {watchHistory.map((item, index) => (
                        <Link
                          key={index}
                          to={`/watch/${item.animeId}/${item.seasonId}/${item.episodeId}`}
                          className="flex flex-col sm:flex-row p-3 bg-jet-hover rounded-lg hover:bg-jetblack-800 transition-colors"
                        >
                          <div className="relative sm:w-48 h-24 flex-shrink-0 mb-3 sm:mb-0">
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover rounded-md"
                            />
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                              <div
                                className="h-full bg-primary-500"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 sm:ml-4">
                            <h3 className="text-white font-medium">{item.title}</h3>
                            <p className="text-gray-400 text-sm">
                              S{item.seasonNumber} E{item.episodeNumber}: {item.episodeTitle}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {formatDate(item.lastWatched)}
                            </p>
                            <div className="flex items-center mt-2">
                              <span className="text-primary-500 text-xs">
                                {item.progress}% watched
                              </span>
                              <span className="mx-2 text-gray-600">•</span>
                              <span className="text-gray-400 text-xs hover:text-primary-400">
                                Continue watching
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'watchlist' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">My Watchlist</h2>
                  
                  {/* Watchlist coming soon message */}
                  <div className="text-center py-12">
                    <FaBookmark className="text-gray-700 w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl text-gray-400 mb-2">Watchlist Coming Soon</h3>
                    <p className="text-gray-500 mb-6">
                      The ability to save anime to your watchlist will be available soon.
                    </p>
                    <Link
                      to="/browse"
                      className="inline-block bg-primary-600 hover:bg-primary-700 text-white py-2 px-6 rounded-full transition-colors"
                    >
                      Browse Anime
                    </Link>
                  </div>
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Profile Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="update-username" className="block text-sm font-medium text-gray-300 mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            id="update-username"
                            className="w-full bg-jetblack-900 border border-jetblack-700 rounded-md px-4 py-2 text-white"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="update-email" className="block text-sm font-medium text-gray-300 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            id="update-email"
                            className="w-full bg-jetblack-900 border border-jetblack-700 rounded-md px-4 py-2 text-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <button className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-6 rounded-full transition-colors">
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-jetblack-700 pt-6">
                      <h3 className="text-lg font-medium text-white mb-4">Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="current-password" className="block text-sm font-medium text-gray-300 mb-1">
                            Current Password
                          </label>
                          <input
                            type="password"
                            id="current-password"
                            className="w-full bg-jetblack-900 border border-jetblack-700 rounded-md px-4 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            id="new-password"
                            className="w-full bg-jetblack-900 border border-jetblack-700 rounded-md px-4 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            id="confirm-password"
                            className="w-full bg-jetblack-900 border border-jetblack-700 rounded-md px-4 py-2 text-white"
                          />
                        </div>
                        <div>
                          <button className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-6 rounded-full transition-colors">
                            Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-jetblack-700 pt-6">
                      <h3 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h3>
                      <button className="bg-red-900/30 hover:bg-red-900/50 text-red-200 py-2 px-6 rounded-md transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage; 