import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';

interface HomeProps {
  showCreateModal: boolean;
  setShowCreateModal: (open: boolean) => void;
  refreshQuizzes: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Quiz {
  id: string;
  title: string;
  topic: string;
  question_count: number;
  created_at: string;
  category_id: string;
  category_name: string;
  category_description: string;
  score?: number;
  completed?: boolean;
}

const Home: React.FC<HomeProps> = ({ showCreateModal, setShowCreateModal, refreshQuizzes }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchQuizzes = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const [quizzesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/quizzes?excludePublicAttempts=true`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setQuizzes(quizzesRes.data);
    } catch (err) {
      setError('Failed to load your quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [refreshQuizzes]);

  const filteredQuizzes = quizzes;

  const handleRemoveQuiz = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQuizzes();
    } catch (err) {
      alert('Failed to delete quiz.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            My Quizzes
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create and manage your custom quizzes
          </p>
        </div>
        <button
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-200 hover:scale-105 shadow-lg"
          onClick={() => navigate('/create-quiz')}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Quiz
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="large" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-200">
          {error}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No quizzes yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new quiz.
            </p>
            <div className="mt-6">
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => navigate('/create-quiz')}
              >
                Create your first quiz
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map(quiz => (
            <div
              key={quiz.id}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                    {quiz.topic || 'Untitled Quiz'}
                  </h3>
                  {quiz.completed && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Completed
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {quiz.question_count} questions
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <button
                    className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold shadow transition duration-200 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${quiz.completed ? '' : ''}`}
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                  >
                    {quiz.completed ? 'Review Quiz' : 'Start Quiz'}
                  </button>
                  <button
                    className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold shadow transition duration-200 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
                    onClick={() => navigate(`/create-quiz?id=${quiz.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold shadow transition duration-200 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                    onClick={() => handleRemoveQuiz(quiz.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home; 