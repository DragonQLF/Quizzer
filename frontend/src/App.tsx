import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Home from './components/Home';
import Quiz from './components/Quiz';
import Profile from './components/Profile';
import Auth from './components/Auth';
import PublicQuizzes from './components/PublicQuizzes';
import CreateQuizModal from './components/CreateQuizModal';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { AppProvider, useApp } from './context/AppContext';
import QuizCreatorPage from './components/QuizCreatorPage';
import './App.css';

const AppContent: React.FC = () => {
  const { isLoading, error, darkMode, toggleDarkMode, setError } = useApp();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshQuizzes, setRefreshQuizzes] = useState(false);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAuthSuccess = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="min-h-screen">
        <nav className={`sticky top-0 z-50 backdrop-blur-lg ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-all duration-300`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link 
                  to="/" 
                  className={`text-2xl font-bold bg-gradient-to-r ${darkMode ? 'from-blue-400 to-purple-500' : 'from-blue-600 to-purple-600'} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
                >
                  QuizCraft
                </Link>
                <Link 
                  to="/public-quizzes" 
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                    darkMode 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Explore Quizzes
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                {isAuthenticated && (
                  <>
                    <Link
                      to="/profile"
                      className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                        darkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      My Quizzes
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                        darkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      Logout
                    </button>
                  </>
                )}
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 ${
                    darkMode
                      ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {darkMode ? '🌞' : '🌙'}
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {isLoading && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
              <LoadingSpinner size="large" text="Generating your quiz..." />
            </div>
          )}

          {error && (
            <div className={`rounded-lg p-4 mb-6 transition-all duration-300 transform ${
              darkMode 
                ? 'bg-red-900/50 border border-red-700 text-red-200' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="block sm:inline">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className={`ml-4 p-1 rounded-full transition-colors duration-200 ${
                    darkMode 
                      ? 'hover:bg-red-800/50' 
                      : 'hover:bg-red-100'
                  }`}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="transition-all duration-300">
            <Routes>
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <Home showCreateModal={showCreateModal} setShowCreateModal={setShowCreateModal} refreshQuizzes={refreshQuizzes} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/create-quiz"
                element={
                  isAuthenticated ? (
                    <QuizCreatorPage />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/quiz/:id"
                element={
                  isAuthenticated ? (
                    <Quiz />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/profile"
                element={
                  isAuthenticated ? (
                    <Profile />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/public-quizzes"
                element={<PublicQuizzes />}
              />
              <Route
                path="/login"
                element={
                  !isAuthenticated ? (
                    <Auth onAuthSuccess={handleAuthSuccess} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App; 