import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Player from './components/Player';
import PlaylistCards from './components/PlaylistCards';
import './index.css';

function App() {
  return (
    <Router>
      <div className="main-layout bg-black text-white min-h-screen">
        <div className="flex h-screen max-h-screen overflow-hidden">
          {/* Sidebar */}
          <div className="sidebar-container bg-black w-64 flex-shrink-0 h-full overflow-y-auto">
            <Sidebar />
          </div>

          {/* Conteúdo principal */}
          <div className="main-content flex-1 flex flex-col h-full overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Routes>
                <Route path="/" element={<PlaylistCards />} />
                <Route path="/search" element={<div>Search Page</div>} />
                <Route path="/library" element={<div>Your Library</div>} />
              </Routes>
            </main>
          </div>

          {/* Player - sempre visível */}
          <div className="player-container bg-gray-900 border-t border-gray-800 w-full flex-shrink-0">
            <Player />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;