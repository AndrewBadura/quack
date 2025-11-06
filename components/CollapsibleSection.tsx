

import React from 'react';

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform transition-transform text-text-secondary group-hover/section:text-primary ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, isOpen, onToggle, children, headerContent }) => {
  return (
    <div className="bg-surface rounded-xl shadow-lg">
      <button onClick={onToggle} className="w-full flex justify-between items-center text-left p-4 focus:outline-none group/section" aria-expanded={isOpen}>
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <div className="flex items-center space-x-2">
            {headerContent}
            <ChevronIcon isOpen={isOpen} />
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
            <div className="border-t border-border-color pt-4">
                {children}
            </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;