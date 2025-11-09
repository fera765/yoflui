import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'library', label: 'Your Library', icon: '📚' }
  ];

  const handleNavigation = (path) => {
    navigate(`/${path}`);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className="sidebar-button"
            onClick={() => handleNavigation(item.id)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;