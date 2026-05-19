import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

const BreakdownList = ({ issues = [] }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  const getIcon = (severity) => {
    switch (severity) {
      case 'Critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'Warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'Info': return <Info className="w-5 h-5 text-blue-400" />;
      case 'Good': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getBg = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/10 border-red-500/20';
      case 'Warning': return 'bg-amber-500/10 border-amber-500/20';
      case 'Info': return 'bg-blue-500/10 border-blue-500/20';
      case 'Good': return 'bg-emerald-500/10 border-emerald-500/20';
      default: return 'bg-slate-800 border-slate-700';
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <h3 className="text-xl font-bold text-white mb-4">Architecture Breakdown</h3>
      
      {issues.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-center">
          No issues found in this architecture. Looks solid!
        </div>
      ) : (
        issues.map((issue, idx) => (
          <motion.div 
            key={idx}
            variants={item}
            className={`p-4 rounded-xl border flex items-start gap-4 ${getBg(issue.severity)}`}
          >
            <div className="mt-0.5">{getIcon(issue.severity)}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white">{issue.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  issue.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                  issue.severity === 'Warning' ? 'bg-amber-500/20 text-amber-400' :
                  issue.severity === 'Info' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {issue.severity}
                </span>
              </div>
              <p className="text-slate-300 text-sm">{issue.description}</p>
              {issue.suggestion && (
                <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-indigo-300 font-medium mb-1">Suggestion</p>
                  <p className="text-sm text-slate-300">{issue.suggestion}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );
};

export default BreakdownList;
