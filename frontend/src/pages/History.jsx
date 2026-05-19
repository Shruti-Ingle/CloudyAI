import { useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { Database, Wand2, Search, ExternalLink, Calendar, Cloud } from 'lucide-react';

const mockHistory = [
  { id: 1, type: 'generated', title: 'E-commerce Backend', platform: 'AWS', date: '2026-05-18T10:30:00Z', services: 6, cost: '$45/mo' },
  { id: 2, type: 'analysed', title: 'Legacy Monolith API', platform: 'AWS', date: '2026-05-17T14:15:00Z', issues: 3, cost: 'N/A' },
  { id: 3, type: 'generated', title: 'Real-time Chat App', platform: 'GCP', date: '2026-05-15T09:20:00Z', services: 4, cost: '$20/mo' },
  { id: 4, type: 'generated', title: 'IoT Data Pipeline', platform: 'Azure', date: '2026-05-10T16:45:00Z', services: 5, cost: '$120/mo' },
];

const History = () => {
  const [filter, setFilter] = useState('all');

  const filteredHistory = mockHistory.filter(item => filter === 'all' || item.type === filter);

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredHistory.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-2"><Database className="w-4 h-4" /> Services</span>
                  <span className="text-white font-medium">{item.services}</span>
                </div>
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
    </PageWrapper>
  );
};

export default History;
