import React, { createContext, useContext, useState } from 'react';

interface NavigationContextType {
  currentPath: string;
  navigateTo: (path: string) => void;
  goBack: () => void;
  history: string[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [history, setHistory] = useState<string[]>([window.location.pathname]);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setHistory(prev => [...prev, path]);
    window.history.pushState({}, '', path);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current path
      const previousPath = newHistory[newHistory.length - 1];
      
      setCurrentPath(previousPath);
      setHistory(newHistory);
      window.history.back();
    }
  };

  return (
    <NavigationContext.Provider value={{ currentPath, navigateTo, goBack, history }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};