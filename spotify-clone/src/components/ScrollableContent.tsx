import React, { ReactNode } from 'react';

interface ScrollableContentProps {
  children: ReactNode;
  className?: string;
}

const ScrollableContent: React.FC<ScrollableContentProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div 
      className={`overflow-y-auto overflow-x-hidden h-full w-full ${className}`}
      style={{ 
        height: 'calc(100vh - 120px)', // Subtrai altura do header e player
        scrollbarWidth: 'thin',
        scrollbarColor: '#4a5568 transparent'
      }}
    >
      <div className="pb-20">
        {children}
      </div>
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background-color: #4a5568;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background-color: #718096;
        }
      `}</style>
    </div>
  );
};

export default ScrollableContent;