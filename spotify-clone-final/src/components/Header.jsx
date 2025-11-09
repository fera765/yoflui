import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <h1>Spotify Clone</h1>
        <nav>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#search">Search</a></li>
            <li><a href="#library">Your Library</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;