import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '../hooks/useAuth';
import Register from '../pages/Register';
import '../index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Register />
    </AuthProvider>
  </StrictMode>
);
