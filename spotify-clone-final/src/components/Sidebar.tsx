import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <Link to="/" className="sidebar-link">
          <span className="sidebar-icon">🏠</span>
          <span className="sidebar-text">Home</span>
        </Link>
        <Link to="/search" className="sidebar-link">
          <span className="sidebar-icon">🔍</span>
          <span className="sidebar-text">Search</span>
        </Link>
        <Link to="/library" className="sidebar-link">
          <span className="sidebar-icon">📚</span>
          <span className="sidebar-text">Library</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;