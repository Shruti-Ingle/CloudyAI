import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Bell, LogOut, Settings, Sparkles, Check, X } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user, logout, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const handleEditClick = () => {
    setNameInput(user?.name || '');
    setIsOpen(false);
    setIsEditing(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    updateProfile(nameInput.trim());
    setIsEditing(false);
  };

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
                
                <button 
                  onClick={handleEditClick}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-2 transition-colors focus:outline-none"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Edit Name / Account
                </button>
                
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition-colors border-t border-slate-800/80 mt-1.5 pt-2 focus:outline-none"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Premium Profile Editing Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsEditing(false)}
          />
          
          {/* Modal Container */}
          <div className="w-full max-w-md glass-card border border-slate-700/80 bg-slate-900 rounded-2xl shadow-2xl p-6 relative z-50 transform transition-all animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              Update Account Profile
            </h3>
            <p className="text-slate-400 text-sm mb-6">Enter your preferred display name or company name to personalize your Cloudy workspace.</p>
            
            <form onSubmit={handleSaveProfile}>
              <div className="flex flex-col gap-2 mb-6">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">User / Company Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner text-sm font-semibold"
                  autoFocus
                  maxLength={40}
                  placeholder="e.g. Maitry's Unicorn"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!nameInput.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/30 border border-indigo-400/20"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
