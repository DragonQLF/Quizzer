import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Quiz from './components/Quiz';
import Profile from './components/Profile';
import Auth from './components/Auth';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleAuthSuccess = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
        <nav className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <a href="/" className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  AI Quiz App
                </a>
              </div>
              <div className="flex items-center space-x-4">
                {isAuthenticated && (
                  <>
                    <a
                      href="/profile"
                      className={`text-sm font-medium ${
                        darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Profile
                    </a>
                    <button
                      onClick={handleLogout}
                      className={`text-sm font-medium ${
                        darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Logout
                    </button>
                  </>
                )}
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-lg ${
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

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Home />
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
        </main>
      </div>
    </Router>
  );
}

export default App; 