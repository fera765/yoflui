import React from 'react';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 bg-gradient-to-b from-gray-900 to-black overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Good afternoon</h1>
            <div className="grid grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800 bg-opacity-50 rounded flex items-center p-4 hover:bg-opacity-70 transition-all cursor-pointer">
                  <div className="bg-gray-600 rounded w-16 h-16 mr-4"></div>
                  <div>
                    <h3 className="font-semibold">Daily Mix {i + 1}</h3>
                    <p className="text-gray-400 text-sm">Made for you</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;