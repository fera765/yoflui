import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface NavigationProps {
  items: NavigationItem[];
}

const Navigation: React.FC<NavigationProps> = ({ items }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-gray-800 text-white">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Link to="/" className="text-xl font-bold">Music App</Link>
        </div>
        <div className="flex space-x-1">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md flex items-center transition-colors ${
                location.pathname === item.path
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        <div>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors">
            Sign In
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center justify-between p-4">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold">Music App</Link>
        </div>
        <button 
          onClick={toggleMobileMenu}
          className="text-white focus:outline-none"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-700 p-4">
          <div className="flex flex-col space-y-2">
            {items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md flex items-center ${
                  location.pathname === item.path
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-2">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors">
              Sign In
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;