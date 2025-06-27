import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';
import ProgressBar from './ProgressBar';

interface Question {
  question: string;
  options: { [key: string]: string } | string[];
  answer?: string;
  correctAnswer?: string;
  explanation?: string;
  text: string;
  correctIndex?: number;
  image_url?: string;
}

interface QuizData {
  id: string;
  title: string;
  topic: string;
  category_name: string;
  questions: Question[];
}

const optionColors = {
  A: 'bg-red-500 hover:bg-red-600',
  B: 'bg-blue-500 hover:bg-blue-600',
  C: 'bg-yellow-500 hover:bg-yellow-600',
  D: 'bg-green-500 hover:bg-green-600',
};

const kahootShapes = [
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><polygon points="16,4 28,28 4,28" fill="white"/></svg>, // Triangle
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="8" y="8" width="16" height="16" rx="4" fill="white"/></svg>, // Diamond
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" fill="white"/></svg>, // Circle
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="6" y="6" width="20" height="20" fill="white"/></svg> // Square
];
const kahootColors = [
  'bg-red-500 hover:bg-red-600',
  'bg-blue-500 hover:bg-blue-600',
  'bg-yellow-400 hover:bg-yellow-500',
  'bg-green-500 hover:bg-green-600'
];

const Quiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/quiz/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setQuiz(response.data);
      } catch (err) {
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (showCountdown) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowCountdown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showCountdown]);

  useEffect(() => {
    if (!showCountdown && quiz) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            clearInterval(timer);
            handleNextQuestion();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showCountdown, quiz]);

  const handleAnswerSelect = (selected: string) => {
    if (selectedAnswer) return;
    const question = quiz?.questions[currentQuestion];
    if (!question) return;
    setSelectedAnswer(selected);
    const correct = question.correctAnswer ?? question.answer;

    let isCorrect = false;

    if (Array.isArray(question.options)) {
      if (question.correctIndex !== undefined) {
        isCorrect = parseInt(selected, 10) === question.correctIndex;
      } else {
        const selectedValue = question.options[parseInt(selected, 10)];
        isCorrect = selectedValue === correct;
      }
    } else if (question.options && typeof question.options === 'object') {
      if (typeof correct === 'string' && Object.keys(question.options).includes(correct)) {
        isCorrect = selected === correct;
      } else {
        isCorrect = question.options[selected] === correct;
      }
    }

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(30);
      setShowCountdown(true);
      setCountdown(3);
    }
  };

  const markQuizCompleted = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/quizzes/${quiz?.id}/complete`,
        { score },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      // Optionally handle error
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!quiz) return null;

  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const questionsAnswered = currentQuestion + (selectedAnswer ? 1 : 0);
  const percentage = quiz.questions.length > 0 ? Math.round((score / quiz.questions.length) * 100) : 0;

  if (showCountdown) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-9xl font-bold text-white animate-bounce">
          {countdown}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {quiz.title}
            </h1>
            <p className="text-gray-600">{quiz.topic}</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 mt-2">
              {quiz.category_name}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Score: {score} / {quiz.questions.length} ({percentage}%)
              </span>
            </div>
            <div className={`flex items-center ${timeLeft <= 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{timeLeft}s</span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <ProgressBar
            current={currentQuestion}
            total={quiz.questions.length}
          />
        </div>

        <div className="mb-8">
          {question.image_url && (
            <div className="flex justify-center mb-4">
              <img src={question.image_url} alt="Question" className="max-h-64 rounded shadow" />
            </div>
          )}
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-8 text-center">
            {question.text}
          </h2>
          <div className="flex justify-center mb-6">
            <div className="w-full max-w-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-indigo-700">Time Left: {timeLeft}s</span>
                <span className="text-lg font-semibold text-indigo-700">Progress: {currentQuestion + 1}/{quiz.questions.length}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
            {Array.isArray(question.options)
              ? question.options.map((value, idx) => {
                  const cleanValue = typeof value === 'string' ? value.replace(/^([A-D][)．.\-]?\s+)(?=[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ])/, '') : value;
                  const isCorrect = question.correctIndex !== undefined
                    ? idx === question.correctIndex
                    : value === (question.correctAnswer ?? question.answer);
                  const isSelected = String(idx) === selectedAnswer;
                  const isWrong = isSelected && !isCorrect;
                  let btnClass = kahootColors[idx] + ' shadow-lg';
                  if (selectedAnswer) {
                    if (isCorrect) {
                      btnClass = 'bg-green-500';
                    } else if (isWrong) {
                      btnClass = 'bg-red-500';
                    } else {
                      btnClass += ' opacity-60';
                    }
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => !selectedAnswer && handleAnswerSelect(String(idx))}
                      disabled={!!selectedAnswer}
                      className={`relative w-full h-32 rounded-2xl text-white font-extrabold text-2xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 ${btnClass} ${selectedAnswer ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="absolute left-4 top-4">{kahootShapes[idx]}</span>
                      <span className="ml-12">{cleanValue}</span>
                    </button>
                  );
                })
              : Object.entries(question.options).map(([key, value], idx) => {
                  const cleanValue = typeof value === 'string' ? value.replace(/^([A-D][)．.\-]?\s+)(?=[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ])/, '') : value;
                  const isCorrect = question.correctIndex !== undefined
                    ? parseInt(key, 10) === question.correctIndex
                    : value === (question.correctAnswer ?? question.answer);
                  const isSelected = key === selectedAnswer;
                  const isWrong = isSelected && !isCorrect;
                  let btnClass = kahootColors[idx] + ' shadow-lg';
                  if (selectedAnswer) {
                    if (isCorrect) {
                      btnClass = 'bg-green-500';
                    } else if (isWrong) {
                      btnClass = 'bg-red-500';
                    } else {
                      btnClass += ' opacity-60';
                    }
                  }
                  return (
                    <button
                      key={key}
                      onClick={() => !selectedAnswer && handleAnswerSelect(key)}
                      disabled={!!selectedAnswer}
                      className={`relative w-full h-32 rounded-2xl text-white font-extrabold text-2xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 ${btnClass} ${selectedAnswer ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="absolute left-4 top-4">{kahootShapes[idx]}</span>
                      <span className="ml-12">{cleanValue}</span>
                    </button>
                  );
                })}
          </div>
        </div>

        {showExplanation && (
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Explanation
            </h3>
            <p className="text-gray-600 dark:text-gray-300">{question.explanation || 'No explanation available.'}</p>
          </div>
        )}

        {selectedAnswer && !isLastQuestion && (
          <button
            onClick={handleNextQuestion}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Next Question
          </button>
        )}

        {selectedAnswer && isLastQuestion && (
          <div className="text-center">
            <div className="mb-8">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Quiz Completed!
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                Your final score: {score} out of {quiz.questions.length}
              </p>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => { markQuizCompleted(); navigate('/'); }}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-200 hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Quiz
              </button>
              <button
                onClick={() => { markQuizCompleted(); navigate('/profile'); }}
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-200 hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz; 