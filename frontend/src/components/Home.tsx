import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';

const Home: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/generate-quiz',
        {
          topic,
          questionCount
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      navigate(`/quiz/${response.data.id}`);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to generate quiz. Please try again.');
        console.error('Error generating quiz:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Gerar um Quiz
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tópico do Quiz
            </label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Digite um tópico (ex: História Mundial, Ciência, etc.)"
              required
            />
          </div>

          <div>
            <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Número de Questões
            </label>
            <input
              type="number"
              id="questionCount"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              min="1"
              max="20"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <LoadingSpinner size="small" />
                <span className="ml-2">Gerando Quiz...</span>
              </div>
            ) : (
              'Gerar Quiz'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home; 