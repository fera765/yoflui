import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/browse', label: 'Browse' },
    { path: '/search', label: 'Search' },
    { path: '/library', label: 'Your Library' },
    { path: '/liked', label: 'Liked Songs' },
  ];

  return (
    <nav className={`flex flex-col space-y-4 ${className}`}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`text-gray-300 hover:text-white transition-colors duration-200 ${
            location.pathname === item.path ? 'text-white font-semibold' : ''
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default Navigation;