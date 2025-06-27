import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { validateQuizForm, QuizFormData, ValidationErrors } from '../utils/validation';
import ProgressIndicator from './ProgressIndicator';
import PageTransition from './PageTransition';

const QuizGenerator: React.FC = () => {
  const { setLoading, setError } = useApp();
  const [formData, setFormData] = useState<QuizFormData>({
    topic: '',
    questionCount: 5,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Input', status: 'pending' as const },
    { label: 'Generating', status: 'pending' as const },
    { label: 'Processing', status: 'pending' as const },
    { label: 'Complete', status: 'pending' as const },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'questionCount' ? parseInt(value) || 0 : value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateQuizForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setCurrentStep(1);

      // Simulate API call with progress updates
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentStep(2);
      
      // Your actual API call here
      // const response = await generateQuiz(formData);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentStep(3);
      
      // Handle successful quiz generation
      // navigate to quiz page or show success message
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate quiz');
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Generate a New Quiz
        </h2>

        <ProgressIndicator steps={steps} currentStep={currentStep} />

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Quiz Topic
            </label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                errors.topic
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              } dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
            />
            {errors.topic && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.topic}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="questionCount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Number of Questions
            </label>
            <input
              type="number"
              id="questionCount"
              name="questionCount"
              min="1"
              max="20"
              value={formData.questionCount}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                errors.questionCount
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              } dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
            />
            {errors.questionCount && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.questionCount}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            Generate Quiz
          </button>
        </form>
      </div>
    </PageTransition>
  );
};

export default QuizGenerator; 