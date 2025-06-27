import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text = 'Loading...' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin`}
      />
      {text && (
        <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 