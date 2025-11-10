'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/app/components/ui/Button';

export interface HeaderProps {
  /**
   * Show back button on the left instead of logo
   */
  showBackButton?: boolean;
  /**
   * Callback when back button is clicked
   */
  onBackClick?: () => void;
  /**
   * Content to display on the right side of the header
   */
  rightContent?: React.ReactNode;
  /**
   * Custom logo content (defaults to "MMSTR")
   */
  logo?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  showBackButton = false,
  onBackClick,
  rightContent,
  logo = 'MMSTR',
}) => {
  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo or Back button */}
          <div className="flex items-center">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackClick}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <span className="text-xl">←</span>
                <span>Back</span>
              </Button>
            ) : (
              <Link 
                href="/"
                className="text-xl font-bold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                {logo}
              </Link>
            )}
          </div>

          {/* Right side - Optional content */}
          {rightContent && (
            <div className="flex items-center">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
