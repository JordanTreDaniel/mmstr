import React from 'react';

interface BrainIconProps {
  className?: string;
  size?: number;
}

export const BrainIcon: React.FC<BrainIconProps> = ({ 
  className = '', 
  size = 24 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Interpretation needed"
    >
      <path
        d="M12 2C8.5 2 5 4.5 5 8C5 9 5.5 10 6 11C5.5 11.5 5 12.5 5 13.5C5 15 6 16 7 16.5C7 18.5 8.5 20 10.5 20.5C11 21.5 11.5 22 12 22C12.5 22 13 21.5 13.5 20.5C15.5 20 17 18.5 17 16.5C18 16 19 15 19 13.5C19 12.5 18.5 11.5 18 11C18.5 10 19 9 19 8C19 4.5 15.5 2 12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 9C9 9 9.5 10 10.5 10C11.5 10 12 9 12 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 9C12 9 12.5 10 13.5 10C14.5 10 15 9 15 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
