import { motion } from 'framer-motion';
import { LayoutDashboard, Wand2, Search, History, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
  const { logout } = useAuth();
  const currentPath = window.location.pathname;

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/generate', icon: Wand2, label: 'Generate' },
    { to: '/analyse', icon: Search, label: 'Analyse' },
    { to: '/history', icon: History, label: 'History' },
  ];

  return (
    <div className="w-64 h-screen glass-panel fixed left-0 top-0 border-r border-slate-700/50 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
          <Wand2 className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">CloudyAI</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {links.map((link) => {
          const isActive = currentPath === link.to || currentPath.startsWith(link.to + '.html') || (currentPath === '/' && link.to === '/dashboard');
          return (
            <a
              key={link.to}
              href={window.location.pathname.includes('.html') ? `${link.to}.html` : link.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden group ${
                isActive ? 'text-white bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-indigo-500/20 border-l-2 border-indigo-500"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <link.icon className="w-5 h-5 relative z-10" />
              <span className="font-medium relative z-10">{link.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
