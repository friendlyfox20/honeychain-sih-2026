import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Batches } from './pages/Batches';
import { BatchDetails } from './pages/BatchDetails';
import { ConsumerVerification } from './pages/ConsumerVerification';
import { Predictions } from './pages/Predictions';
import { Anomalies } from './pages/Anomalies';
import { VoiceAssistant } from './pages/VoiceAssistant';

import { AdminAnalytics } from './pages/admin/Analytics';
import { AdminUsers } from './pages/admin/Users';
import { AdminAuditLogs } from './pages/admin/AuditLogs';
import { AdminMonitoring } from './pages/admin/Monitoring';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Unauthenticated Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify/:token" element={<ConsumerVerification />} />

          {/* Authenticated Dashboard Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="batches" element={<Batches />} />
            <Route path="batches/:batchId" element={<BatchDetails />} />
            <Route path="anomalies" element={<Anomalies />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="voice" element={<VoiceAssistant />} />

            {/* Admin-Restricted Routes */}
            <Route
              path="admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/monitoring"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminMonitoring />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
