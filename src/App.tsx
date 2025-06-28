import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import QuestionSolver from './pages/QuestionSolver';
import CoachGenerator from './pages/CoachGenerator';
import LoadingSpinner from './components/Common/LoadingSpinner';
import AdminPage from './pages/AdminPage';
import ChatPage from './pages/ChatPage';
import LessonsPage from './pages/LessonsPage';
import LessonDetailPage from './pages/LessonDetailPage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import TopicExplainerPage from './pages/TopicExplainerPage';
import CoachListPage from './pages/CoachListPage';
import LeaderboardPage from './pages/LeaderboardPage';

// Placeholder for upcoming features
const ComingSoon = ({ title }: { title: string }) => (
  <div className="p-8 text-center">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
    <p className="text-lg text-gray-500 mt-2">Bu özellik yakında sizlerle olacak!</p>
  </div>
);

// Wraps all routes that require authentication.
// Redirects to /login if not authenticated.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }
  
  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
};

// Wraps all routes that are for unauthenticated users (e.g., login, register).
// Redirects to /dashboard if authenticated.
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }
  
  return !currentUser ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// Wraps routes that are only for admin users.
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { userData, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return userData?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                },
              }}
            />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterForm /></PublicRoute>} />

              {/* Protected routes with Layout */}
              <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Home />} />
                <Route path="question-solver" element={<ProtectedRoute><QuestionSolver /></ProtectedRoute>} />
                <Route path="coach-generator" element={<ProtectedRoute><CoachGenerator /></ProtectedRoute>} />
                <Route path="chat/:coachId" element={<ChatPage />} />
                <Route path="lessons" element={<ProtectedRoute><LessonsPage /></ProtectedRoute>} />
                <Route path="lessons/:lessonId" element={<ProtectedRoute><LessonDetailPage /></ProtectedRoute>} />
                <Route path="topic-explainer" element={<ProtectedRoute><TopicExplainerPage /></ProtectedRoute>} />
                <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="quiz" element={<ComingSoon title="Test Çöz" />} />
                <Route path="flashcards" element={<ComingSoon title="Kartlar" />} />
                <Route path="coaches" element={<ProtectedRoute><CoachListPage /></ProtectedRoute>} />
                <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              </Route>
              
              {/* Catch-all route to redirect to the main dashboard or landing page */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;