import React from 'react';
import './Card.css';

const Card = ({ item, onClick }) => {
  const { id, name, image, type, artist, description } = item;

  const handleCardClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <div className="card" onClick={handleCardClick}>
      <div className="card-image-container">
        <img 
          src={image} 
          alt={name} 
          className="card-image"
        />
        <div className="card-overlay">
          <div className="card-play-icon">▶</div>
        </div>
      </div>
      <div className="card-content">
        <h3 className="card-title">{name}</h3>
        {artist && <p className="card-artist">{artist}</p>}
        {type && <p className="card-type">{type}</p>}
        {description && <p className="card-description">{description}</p>}
      </div>
    </div>
  );
};

export default Card;