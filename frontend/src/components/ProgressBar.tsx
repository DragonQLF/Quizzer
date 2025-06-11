import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  showPercentage = true
}) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">
          Progress
        </span>
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {percentage}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar; 