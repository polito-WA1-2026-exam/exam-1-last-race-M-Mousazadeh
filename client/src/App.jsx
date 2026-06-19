import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NavHeader from './components/NavHeader';
import LoadingSpinner from './components/LoadingSpinner';

// Import Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import GamePage from './pages/GamePage';
import RankingPage from './pages/RankingPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Route protector. Redirects unauthorized users to the login screen
 * and blocks component loading during active session check routines.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Validating user session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100 bg-light">
          {/* Main header navbar */}
          <NavHeader />

          {/* Core Page Container */}
          <main className="flex-grow-1">
            <Routes>
              {/* Public route: Instructions and home */}
              <Route path="/" element={<HomePage />} />

              {/* Login screen */}
              <Route path="/login" element={<LoginPage />} />

              {/* Authenticated route: Start game */}
              <Route
                path="/play"
                element={
                  <ProtectedRoute>
                    <GamePage />
                  </ProtectedRoute>
                }
              />

              {/* Authenticated route: Leaderboard list */}
              <Route
                path="/ranking"
                element={
                  <ProtectedRoute>
                    <RankingPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback route: 404 Page Not Found */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          {/* Minimal footer */}
          <footer className="bg-dark text-muted text-center py-3 mt-5 font-monospace small">
            <div className="container">
              &copy; {new Date().getFullYear()} Last Race. Web Applications I exam.
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
