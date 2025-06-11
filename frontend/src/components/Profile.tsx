import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

interface Quiz {
  id: string;
  topic: string;
  question_count: number;
  created_at: string;
  score?: number;
  completed?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface QuizStats {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  totalQuestions: number;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<QuizStats>({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalQuestions: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [userResponse, quizzesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/user', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/quizzes', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setUser(userResponse.data);
        setQuizzes(quizzesResponse.data);
        calculateStats(quizzesResponse.data);
      } catch (err) {
        setError('Failed to load profile data');
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const calculateStats = (quizData: Quiz[]) => {
    const completedQuizzes = quizData.filter(q => q.completed);
    const totalScore = completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0);
    
    setStats({
      totalQuizzes: quizData.length,
      completedQuizzes: completedQuizzes.length,
      averageScore: completedQuizzes.length ? totalScore / completedQuizzes.length : 0,
      totalQuestions: quizData.reduce((sum, q) => sum + q.question_count, 0)
    });
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(quizzes.filter(q => q.id !== quizId));
      calculateStats(quizzes.filter(q => q.id !== quizId));
    } catch (err) {
      setError('Failed to delete quiz');
    }
  };

  const handleShareQuiz = async (quizId: string) => {
    setSelectedQuiz(quizzes.find(q => q.id === quizId) || null);
    setShareModalOpen(true);
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/quizzes/${selectedQuiz.id}/share`,
        { email: shareEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShareModalOpen(false);
      setShareEmail('');
      setShareError(null);
    } catch (err) {
      setShareError('Failed to share quiz');
    }
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* User Profile Section */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Profile</h2>
        <div className="space-y-2">
          <p className="text-gray-600 dark:text-gray-300">Name: {user.name}</p>
          <p className="text-gray-600 dark:text-gray-300">Email: {user.email}</p>
        </div>
      </div>

      {/* Quiz Statistics */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Quizzes</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalQuizzes}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.completedQuizzes}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.averageScore.toFixed(1)}%</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Questions</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalQuestions}</p>
          </div>
        </div>
      </div>

      {/* Quiz History */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quiz History</h2>
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Topic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Questions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {filteredQuizzes.map((quiz) => (
                <tr key={quiz.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{quiz.topic}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{quiz.question_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {quiz.score ? `${quiz.score}%` : 'Not completed'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleShareQuiz(quiz.id)}
                      className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-4"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share Modal */}
      {shareModalOpen && selectedQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-dark-card p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Share Quiz</h3>
            <form onSubmit={handleShareSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Share with (email)</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
              {shareError && <p className="text-red-500 mb-4">{shareError}</p>}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 