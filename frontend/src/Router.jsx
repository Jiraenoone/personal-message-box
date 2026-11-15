import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BoxesPage from './pages/BoxesPage';
import BoxDetailPage from './pages/BoxDetailPage';
import InboxPage from './pages/InboxPage';
import MessageDetailPage from './pages/MessageDetailPage';
import GoogleDrivePage from './pages/GoogleDrivePage';
import SettingsPage from './pages/SettingsPage';
import PublicSubmitPage from './pages/PublicSubmitPage';
import NotFoundPage from './pages/NotFoundPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/m/:slug" element={<PublicSubmitPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boxes"
          element={
            <ProtectedRoute>
              <BoxesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boxes/:id"
          element={
            <ProtectedRoute>
              <BoxDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boxes/:id/inbox"
          element={
            <ProtectedRoute>
              <InboxPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boxes/:id/messages/:messageId"
          element={
            <ProtectedRoute>
              <MessageDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/google-drive"
          element={
            <ProtectedRoute>
              <GoogleDrivePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
