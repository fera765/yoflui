import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Player from './Player';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 bg-gradient-to-b from-gray-900 to-black overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <Player />
    </div>
  );
};

export default Layout;