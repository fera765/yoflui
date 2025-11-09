import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, className = '', onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={`
        ${isActive 
          ? 'text-white bg-gray-700' 
          : 'text-gray-300 hover:text-white hover:bg-gray-700'
        } 
        px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${className}
      `}
    >
      {children}
    </Link>
  );
};

export default NavLink;