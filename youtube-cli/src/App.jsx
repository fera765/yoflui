import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Player from './components/Player';
import Cards from './components/Cards';
import { mockPlaylists, mockSongs } from './data/mockData';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-spice-main-bg text-spice-text-primary">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Good afternoon</h2>
            <Cards title="Made for you" items={mockPlaylists} />
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Recently played</h2>
            <Cards title="Recently played" items={mockSongs} />
          </div>
        </main>
      </div>
      
      <Player />
    </div>
  );
}

export default App;