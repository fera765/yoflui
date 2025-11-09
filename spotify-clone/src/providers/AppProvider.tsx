import React from 'react';
import { LikeProvider } from './contexts/LikeContext';

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LikeProvider>
      {children}
    </LikeProvider>
  );
};

export default AppProvider;