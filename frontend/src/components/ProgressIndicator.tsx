import React from 'react';

interface ProgressStep {
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex justify-between mb-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex flex-col items-center ${
              index <= currentStep ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                index < currentStep
                  ? 'bg-blue-600 dark:bg-blue-400'
                  : index === currentStep
                  ? 'bg-blue-600 dark:bg-blue-400 animate-pulse'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {index < currentStep ? (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-medium text-white">{index + 1}</span>
              )}
            </div>
            <span className="text-sm font-medium">{step.label}</span>
          </div>
        ))}
      </div>
      <div className="relative">
        <div className="absolute top-0 left-0 h-1 bg-gray-200 dark:bg-gray-700 w-full"></div>
        <div
          className="absolute top-0 left-0 h-1 bg-blue-600 dark:bg-blue-400 transition-all duration-300"
          style={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressIndicator; 