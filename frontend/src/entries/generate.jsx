import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '../hooks/useAuth';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import Generate from '../pages/Generate';
import '../index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout>
          <Generate />
        </DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  </StrictMode>
);
