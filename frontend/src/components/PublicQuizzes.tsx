import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

interface Quiz {
  id: string;
  topic: string;
  question_count: number;
  created_at: string;
  score?: number;
  completed?: boolean;
}

const PublicQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(''); // Clear any previous errors
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/public-quizzes`,
        { headers }
      );
      setQuizzes(response.data);
    } catch (err) {
      setError('Failed to load public quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Refresh quizzes when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      fetchQuizzes();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const getButtonText = (quiz: Quiz) => {
    if (quiz.completed) {
      return 'Review Quiz';
    }
    return 'Take Quiz';
  };

  const getButtonClass = (quiz: Quiz) => {
    if (quiz.completed) {
      return 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors';
    }
    return 'bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors';
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Explore Public Quizzes</h1>
        <button
          onClick={fetchQuizzes}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {quizzes.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No public quizzes available yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold">{quiz.topic}</h3>
                {quiz.completed && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-2">{quiz.question_count} questions</p>
              {quiz.completed && quiz.score !== undefined && (
                <p className="text-sm text-gray-600 mb-2">
                  Score: {Math.round((quiz.score / quiz.question_count) * 100)}%
                </p>
              )}
              <p className="text-sm text-gray-500 mb-4">
                Created: {new Date(quiz.created_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <button 
                  className={getButtonClass(quiz)}
                  onClick={() => navigate(`/quiz/${quiz.id}`)}
                >
                  {getButtonText(quiz)}
                </button>
                {quiz.completed && (
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                  >
                    Take Again
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicQuizzes; 