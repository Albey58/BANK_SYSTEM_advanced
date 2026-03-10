import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';

import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import ServicesPage from './pages/ServicesPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import Toast from './components/layout/Toast';
import LoginModal from './modals/LoginModal';
import RegisterModal from './modals/RegisterModal';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import AuthProvider
import styles from './App.module.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <div className={styles.appContainer}>
            <Navbar 
              onOpenLogin={() => setIsLoginOpen(true)} 
              onOpenRegister={() => setIsRegisterOpen(true)}
            />
            <main className="main-container">
              <Routes>
                <Route path="/" element={<HomePage onOpenRegister={() => setIsRegisterOpen(true)} />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/transactions" element={
                  <ProtectedRoute>
                    <TransactionsPage />
                  </ProtectedRoute>
                } />
                <Route path="/services" element={
                  <ProtectedRoute>
                    <ServicesPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Toast />
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
            <RegisterModal 
              isOpen={isRegisterOpen} 
              onClose={() => setIsRegisterOpen(false)} 
              onSwitchToLogin={() => {
                setIsRegisterOpen(false);
                setIsLoginOpen(true);
              }}
            />
          </div>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
