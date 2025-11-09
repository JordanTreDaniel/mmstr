import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  showCharacterCount?: boolean;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    showCharacterCount = false, 
    helperText, 
    size = 'md',
    className = '', 
    maxLength,
    value,
    ...props 
  }, ref) => {
    const baseStyles = 'w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
    };
    
    const stateStyles = error 
      ? 'border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:ring-blue-500 dark:border-gray-600';
    
    const classes = `${baseStyles} ${sizeStyles[size]} ${stateStyles} ${className}`.trim();
    
    const currentLength = value ? String(value).length : 0;
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        
        <input 
          ref={ref} 
          className={classes}
          maxLength={maxLength}
          value={value}
          {...props} 
        />
        
        <div className="mt-1.5 flex justify-between items-start">
          <div className="flex-1">
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {!error && helperText && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
            )}
          </div>
          
          {showCharacterCount && maxLength && (
            <p className={`text-sm ml-2 ${currentLength > maxLength ? 'text-red-600' : 'text-gray-500'}`}>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
