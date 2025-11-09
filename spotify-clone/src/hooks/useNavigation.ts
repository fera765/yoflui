import { useState, useEffect } from 'react';

interface NavigationHistory {
  push: (path: string) => void;
  replace: (path: string) => void;
  goBack: () => void;
  goForward: () => void;
  currentPath: string;
  history: string[];
}

export const useNavigation = (): NavigationHistory => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [history, setHistory] = useState<string[]>([window.location.pathname]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const push = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setHistory(prev => [...prev, path]);
  };

  const replace = (path: string) => {
    window.history.replaceState({}, '', path);
    setCurrentPath(path);
    setHistory(prev => [...prev.slice(0, -1), path]);
  };

  const goBack = () => {
    if (history.length > 1) {
      window.history.back();
    }
  };

  const goForward = () => {
    window.history.forward();
  };

  return {
    push,
    replace,
    goBack,
    goForward,
    currentPath,
    history
  };
};