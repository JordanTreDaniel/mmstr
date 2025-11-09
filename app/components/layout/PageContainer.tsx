import React from 'react';

export interface PageContainerProps {
  /**
   * Content to render inside the container
   */
  children: React.ReactNode;
  /**
   * Maximum width of the container
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  /**
   * Padding size
   */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = '5xl',
  padding = 'md',
  className = '',
}) => {
  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingStyles = {
    none: '',
    sm: 'px-4 py-6',
    md: 'px-4 sm:px-6 lg:px-8 py-12',
    lg: 'px-4 sm:px-6 lg:px-8 py-16',
    xl: 'px-4 sm:px-6 lg:px-8 py-20',
  };

  return (
    <div className={`${maxWidthStyles[maxWidth]} mx-auto ${paddingStyles[padding]} ${className}`.trim()}>
      {children}
    </div>
  );
};

export default PageContainer;
