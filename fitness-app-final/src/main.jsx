import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeTheme } from './contexts/ThemeContext';
import App from './App.jsx';
import './index.css';

// Initialize theme before rendering
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);