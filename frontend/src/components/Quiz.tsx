import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';
import ProgressBar from './ProgressBar';

interface Question {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string;
  explanation: string;
}

interface QuizData {
  id: string;
  title: string;
  questions: Question[];
}

const Quiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/quiz/${id}`);
        setQuiz(response.data);
      } catch (err) {
        setError('Failed to load quiz. Please try again.');
        console.error('Error loading quiz:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0 && !selectedAnswer) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !selectedAnswer) {
      handleTimeUp();
    }
    return () => clearInterval(timer);
  }, [timeLeft, timerActive, selectedAnswer]);

  const handleTimeUp = () => {
    setSelectedAnswer('time-up');
    setShowExplanation(true);
    setTimerActive(false);
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setShowExplanation(true);
    setTimerActive(false);
    if (answer === quiz?.questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(30);
      setTimerActive(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-red-600">{error || 'Quiz not found'}</div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{quiz.title}</h1>
        
        <div className="mb-4">
          <ProgressBar
            current={currentQuestion + 1}
            total={quiz.questions.length}
          />
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Questão {currentQuestion + 1} de {quiz.questions.length}
            </span>
            <span className="text-sm text-gray-600">
              Pontuação: {score} / {currentQuestion + 1}
            </span>
            <span className={`text-sm font-medium ${
              timeLeft <= 10 ? 'text-red-600' : 'text-gray-600'
            }`}>
              Tempo Restante: {timeLeft}s
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            {question.question}
          </h2>

          <div className="space-y-3">
            {Object.entries(question.options).map(([key, value]) => (
              <button
                key={key}
                onClick={() => !selectedAnswer && handleAnswerSelect(key)}
                disabled={!!selectedAnswer}
                className={`w-full text-left p-4 rounded-lg border ${
                  selectedAnswer === key
                    ? key === question.correctAnswer
                      ? 'bg-green-100 border-green-500'
                      : 'bg-red-100 border-red-500'
                    : 'border-gray-300 hover:border-indigo-500'
                }`}
              >
                <span className="font-medium">{key}.</span> {value}
              </button>
            ))}
          </div>
        </div>

        {showExplanation && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Explicação:</h3>
            <p className="text-gray-600">{question.explanation}</p>
          </div>
        )}

        {selectedAnswer && !isLastQuestion && (
          <button
            onClick={handleNextQuestion}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Próxima Questão
          </button>
        )}

        {selectedAnswer && isLastQuestion && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Quiz Concluído!
            </h2>
            <p className="text-gray-600 mb-4">
              Sua pontuação final: {score} de {quiz.questions.length}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Criar Novo Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz; 