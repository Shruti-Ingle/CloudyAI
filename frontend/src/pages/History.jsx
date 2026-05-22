import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { Database, Wand2, Search, ExternalLink, Calendar, Cloud, Sparkles } from 'lucide-react';
import { getHistoryItems } from '../utils/history';

const History = () => {
  const [filter, setFilter] = useState('all');
  const [history, setHistory] = useState([]);

  const handleCardClick = (item) => {
    const hasHtml = window.location.pathname.includes('.html');
    if (item.type === 'generated') {
      window.location.href = `/generate${hasHtml ? '.html' : ''}?load=${item.id}`;
    } else {
      window.location.href = `/analyse${hasHtml ? '.html' : ''}?load=${item.id}`;
    }
  };

  useEffect(() => {
    setHistory(getHistoryItems());
  }, []);

  const filteredHistory = history.filter(item => filter === 'all' || item.type === filter);

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Generation History</h1>
          <p className="text-slate-400">Your past architectures and analysis reports.</p>
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('generated')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'generated' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Generated
          </button>
          <button 
            onClick={() => setFilter('analysed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'analysed' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Analysed
          </button>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center gap-3">
          <Sparkles className="w-10 h-10 text-indigo-400/50 animate-pulse" />
          <p className="text-slate-400 text-lg">No architectures in your history database.</p>
          <p className="text-slate-500 text-sm max-w-sm">Every time you generate a cloud layout using Cloudy AI, it will dynamically save here without arbitrary mocks!</p>
          <a 
            href="/generate" 
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-900/30 border border-indigo-500/20 mt-2"
          >
            Create Your First Architecture
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredHistory.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleCardClick(item)}
              className="glass-card rounded-2xl p-6 border border-slate-700/50 hover:border-indigo-500/50 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.type === 'generated' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.type === 'generated' ? <Wand2 className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{item.title}</h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider inline-block mt-1">
                      {item.type}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>

              <div className="space-y-2 mt-6 border-t border-slate-700/50 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-2"><Cloud className="w-4 h-4" /> Platform</span>
                  <span className="text-white font-medium">{item.platform}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</span>
                  <span className="text-white font-medium">{new Date(item.date).toLocaleDateString()}</span>
                </div>
                {item.type === 'generated' ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2"><Database className="w-4 h-4" /> Services</span>
                      <span className="text-white font-medium">{item.services}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Est. Cost</span>
                      <span className="text-emerald-400 font-semibold">{item.cost}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2"><Search className="w-4 h-4" /> Issues Found</span>
                    <span className="text-amber-400 font-medium">{item.issues}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
};

export default History;
