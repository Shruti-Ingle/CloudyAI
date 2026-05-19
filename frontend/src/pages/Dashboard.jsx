import PageWrapper from '../components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Database, Search, Wand2, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="glass-card p-6 rounded-2xl flex items-center gap-4"
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
  const { user } = useAuth();

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name}</h1>
        <p className="text-slate-400">Here's what's happening with your cloud architectures.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Generated Architectures" value="12" icon={Wand2} delay={0.1} />
        <StatCard title="Analysed Diagrams" value="5" icon={Search} delay={0.2} />
        <StatCard title="Cloud Services Used" value="28" icon={Database} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            <button className="text-sm text-indigo-400 hover:text-indigo-300">View All</button>
          </div>
          <div className="space-y-4">
            {/* Placeholder activity items */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">E-commerce Backend Architecture</h4>
                  <p className="text-sm text-slate-400">Generated on AWS • 2 days ago</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg text-sm font-medium transition-colors">
                  View
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
