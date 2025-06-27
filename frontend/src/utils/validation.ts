export interface QuizFormData {
  topic: string;
  questionCount: number;
}

export interface ValidationErrors {
  topic?: string;
  questionCount?: string;
}

export const validateQuizForm = (data: QuizFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Topic validation
  if (!data.topic.trim()) {
    errors.topic = 'Topic is required';
  } else if (data.topic.length < 3) {
    errors.topic = 'Topic must be at least 3 characters long';
  } else if (data.topic.length > 100) {
    errors.topic = 'Topic must be less than 100 characters';
  }

  // Question count validation
  if (!data.questionCount) {
    errors.questionCount = 'Number of questions is required';
  } else if (isNaN(data.questionCount)) {
    errors.questionCount = 'Must be a valid number';
  } else if (data.questionCount < 1) {
    errors.questionCount = 'Must have at least 1 question';
  } else if (data.questionCount > 20) {
    errors.questionCount = 'Cannot have more than 20 questions';
  }

  return errors;
}; 