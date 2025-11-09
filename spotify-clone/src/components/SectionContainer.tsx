import React, { ReactNode } from 'react';

interface SectionContainerProps {
  children: ReactNode;
  currentSection: string;
  sectionId: string;
}

const SectionContainer: React.FC<SectionContainerProps> = ({ 
  children, 
  currentSection, 
  sectionId 
}) => {
  if (currentSection !== sectionId) {
    return null;
  }

  return (
    <div className="section-container" style={{ display: 'block' }}>
      {children}
    </div>
  );
};

export default SectionContainer;