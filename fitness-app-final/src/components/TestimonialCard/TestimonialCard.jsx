import React from 'react';

const TestimonialCard = ({ name, role, content, avatar }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <div className="flex items-center mb-4">
        <img 
          src={avatar} 
          alt={name} 
          className="w-12 h-12 rounded-full mr-4"
        />
        <div>
          <h4 className="font-bold text-gray-800 dark:text-white">{name}</h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{role}</p>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-300 italic">"{content}"</p>
    </div>
  );
};

export default TestimonialCard;