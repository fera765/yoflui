import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="hidden md:flex md:w-64 bg-gray-800 flex-col">
        {/* Sidebar content will be rendered here by the parent component */}
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          {/* Header content will be rendered here by the parent component */}
        </header>
        
        <main className="flex-1 overflow-y-auto bg-gray-900 p-4">
          {children}
        </main>
        
        <footer className="bg-gray-800 border-t border-gray-700 p-4">
          {/* Player will be rendered here by the parent component */}
        </footer>
      </div>
    </div>
  );
};

export default Layout;