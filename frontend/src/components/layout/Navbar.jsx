import { useAuth } from '../../hooks/useAuth';
import { User, Bell } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user } = useAuth();

  return (
    <div className="h-20 glass-panel border-b border-slate-700/50 flex items-center justify-between px-8 sticky top-0 z-40 w-full backdrop-blur-md">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-slate-400">Pro Plan</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
