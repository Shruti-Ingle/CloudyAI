import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Bell, LogOut, Settings } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="h-20 glass-panel border-b border-slate-700/50 flex items-center justify-between px-8 sticky top-0 z-40 w-full backdrop-blur-md">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 hover:opacity-80 transition-all cursor-pointer focus:outline-none"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-white">{user?.name || 'Cloud Architect'}</p>
              <p className="text-xs text-slate-400">Pro Plan</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-indigo-500 transition-colors shadow-md">
              <User className="w-5 h-5 text-slate-300" />
            </div>
          </button>

          {isOpen && (
            <>
              {/* Invisible overlay click listener to dismiss the menu */}
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setIsOpen(false)}
              />
              
              {/* Premium profile dropdown card */}
              <div className="absolute right-0 mt-3 w-56 glass-card border border-slate-700/80 bg-slate-950/95 rounded-2xl shadow-2xl p-2 z-50 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2.5 border-b border-slate-800 mb-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-bold text-white truncate mt-0.5">{user?.name || 'Cloud Architect'}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || 'admin@cloudy.ai'}</p>
                </div>
                
                <LinkToDashboard onClick={() => setIsOpen(false)} />
                
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition-colors border-t border-slate-800/80 mt-1.5 pt-2"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper internal component to navigate to dashboard
const LinkToDashboard = ({ onClick }) => {
  return (
    <button 
      onClick={() => {
        onClick();
        // Redirect directly to dashboard to enable inline name editing!
        window.location.href = '/dashboard';
      }}
      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-2 transition-colors"
    >
      <Settings className="w-4 h-4 text-slate-400" />
      Edit Name / Account
    </button>
  );
};

export default Navbar;
