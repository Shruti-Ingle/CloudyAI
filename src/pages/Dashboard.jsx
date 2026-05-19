import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Database, Search, Wand2, Activity, Sparkles, Pencil, Check, X } from 'lucide-react';
import { getHistoryItems } from '../utils/history';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="glass-card p-6 rounded-2xl flex items-center gap-4 border border-slate-700/50"
  >
    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-slate-400 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { user, updateProfile } = useAuth();
  const [history, setHistory] = useState([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');

  useEffect(() => {
    // Dynamic history metrics derived directly from local storage histories
    setHistory(getHistoryItems());
  }, []);

  const handleSaveName = (e) => {
    e.preventDefault();
    if (!newNameInput.trim()) return;
    updateProfile(newNameInput.trim());
    setIsEditingName(false);
  };

  const generatedCount = history.filter(h => h.type === 'generated').length;
  const analysedCount = history.filter(h => h.type === 'analysed').length;
  const servicesCount = history.reduce((sum, h) => sum + (h.services || 0), 0);

  return (
    <PageWrapper>
      <div className="mb-8">
        {isEditingName ? (
          <form onSubmit={handleSaveName} className="flex items-center gap-2 max-w-lg mb-2">
            <input
              type="text"
              value={newNameInput}
              onChange={(e) => setNewNameInput(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-2xl font-bold focus:outline-none focus:border-indigo-500 shadow-inner flex-1"
              autoFocus
              maxLength={40}
              placeholder="User or Company Name"
            />
            <button 
              type="submit" 
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center"
              title="Save Name"
            >
              <Check className="w-5 h-5" />
            </button>
            <button 
              type="button" 
              onClick={() => setIsEditingName(false)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all flex items-center justify-center"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2.5 group">
            <h1 className="text-3xl font-bold text-white mb-1">
              Welcome back, {user?.name || 'Cloud Architect'}
            </h1>
            <button 
              onClick={() => {
                setNewNameInput(user?.name || '');
                setIsEditingName(true);
              }}
              className="p-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700/50 mb-1 opacity-60 group-hover:opacity-100"
              title="Edit User / Company Name"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <p className="text-slate-400">Here's what's happening with your cloud architectures.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Generated Architectures" value={generatedCount} icon={Wand2} delay={0.1} />
        <StatCard title="Analysed Diagrams" value={analysedCount} icon={Search} delay={0.2} />
        <StatCard title="Cloud Services Used" value={servicesCount} icon={Database} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            <Link to="/history" className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold">View All</Link>
          </div>
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-indigo-400/50 animate-pulse" />
                <p className="text-slate-400 text-sm">No recent architectures or analyses yet.</p>
                <Link 
                  to="/generate" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  Generate First Architecture
                </Link>
              </div>
            ) : (
              history.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{item.title}</h4>
                    <p className="text-sm text-slate-400">
                      Generated on {item.platform} • {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-indigo-400 font-bold uppercase tracking-wider">
                      {item.platform}
                    </span>
                    <Link 
                      to="/history"
                      className="px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg text-sm font-semibold transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
