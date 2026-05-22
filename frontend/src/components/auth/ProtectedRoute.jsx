import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    // Perform standard browser redirect in Multi-Page setup to prevent auth lockout
    window.location.href = window.location.pathname.includes('.html') ? '/login.html' : '/login';
    return null;
  }

  return children;
};

export default ProtectedRoute;
