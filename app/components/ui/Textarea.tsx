import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCharacterCount?: boolean;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    label, 
    error, 
    showCharacterCount = false, 
    helperText, 
    resize = 'vertical',
    className = '', 
    maxLength,
    value,
    ...props 
  }, ref) => {
    const baseStyles = 'w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-base';
    
    const resizeStyles = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };
    
    const stateStyles = error 
      ? 'border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:ring-blue-500 dark:border-gray-600';
    
    const classes = `${baseStyles} ${resizeStyles[resize]} ${stateStyles} ${className}`.trim();
    
    const currentLength = value ? String(value).length : 0;
    const isOverLimit = maxLength ? currentLength > maxLength : false;
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        
        <textarea 
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
            <p className={`text-sm ml-2 ${isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
