import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '../hooks/useAuth';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import Analyse from '../pages/Analyse';
import '../index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout>
          <Analyse />
        </DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  </StrictMode>
);
