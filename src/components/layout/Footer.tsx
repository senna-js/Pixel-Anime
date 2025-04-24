import React from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaDiscord, FaInstagram, FaGithub } from 'react-icons/fa';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-jet-black border-t border-jetblack-800 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div>
            <Link to="/" className="text-white font-bold text-xl flex items-center">
              <span className="text-primary-400 mr-2">Pixel</span>
              <span className="text-white">Anime</span>
            </Link>
            <p className="mt-2 text-gray-400 text-sm">
              Your ultimate destination for anime streaming. Watch your favorite anime series
              with high-quality video and a seamless experience on any device.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400 text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/browse" className="text-gray-400 hover:text-primary-400 text-sm">
                  Browse
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-gray-400 hover:text-primary-400 text-sm">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-primary-400 text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-primary-400 text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Social and Legal */}
          <div>
            <h3 className="text-white font-medium mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-gray-400 hover:text-primary-400">
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400">
                <FaDiscord className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400">
                <FaInstagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400">
                <FaGithub className="h-5 w-5" />
              </a>
            </div>
            <div className="space-y-2">
              <Link to="/terms" className="block text-gray-400 hover:text-primary-400 text-sm">
                Terms of Service
              </Link>
              <Link to="/privacy" className="block text-gray-400 hover:text-primary-400 text-sm">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-jetblack-800 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} PixelAnime. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 