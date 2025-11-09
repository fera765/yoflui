import React from 'react';
import { Bars3Icon, MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ isOpen, onToggle }) => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Botão de menu para mobile */}
          <button
            onClick={onToggle}
            className="md:hidden mr-4 p-2 rounded-md bg-gray-700 text-white"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          
          <button className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600">
            <BellIcon className="h-6 w-6" />
          </button>
          
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;