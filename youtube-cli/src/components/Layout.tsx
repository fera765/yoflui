import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Player from './Player';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black">
          {children}
        </main>
      </div>
      
      <Player />
    </div>
  );
};

export default Layout;