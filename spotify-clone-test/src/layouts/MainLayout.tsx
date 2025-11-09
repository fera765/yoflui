import React from 'react';
import Sidebar from '../components/Sidebar';
import Player from '../components/Player';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
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

export default MainLayout;