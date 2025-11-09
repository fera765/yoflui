import React from 'react';
import Sidebar from './Sidebar';
import Player from './Player';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black p-6">
          {children}
        </main>
      </div>
      <Player />
    </div>
  );
};

export default Layout;