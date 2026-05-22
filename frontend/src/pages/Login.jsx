import PageWrapper from '../components/layout/PageWrapper';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { motion } from 'framer-motion';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      const hasHtml = window.location.pathname.includes('.html');
      window.location.href = hasHtml ? '/dashboard.html' : '/dashboard';
    } else {
      setError(result.error);
    }
  };

  return (
    <PageWrapper className="flex items-center justify-center p-6">
      <motion.div 
        className="w-full max-w-md glass-card rounded-2xl p-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400">Sign in to CloudyAI to continue</p>
        </div>
        
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 mb-6 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              required
            />
          </div>
          <div className="flex justify-end">
            <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300">Forgot Password?</a>
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-semibold transition-all shadow-lg hover:shadow-indigo-500/25">
            Sign In
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-400">
          Don't have an account? <a href={window.location.pathname.includes('.html') ? '/register.html' : '/register'} className="text-indigo-400 hover:text-indigo-300 font-medium">Register here</a>
        </div>
      </motion.div>
    </PageWrapper>
  );
};

export default Login;
