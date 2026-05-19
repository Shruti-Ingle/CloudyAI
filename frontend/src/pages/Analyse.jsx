import { useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import UploadInput from '../components/analyser/UploadInput';
import BreakdownList from '../components/analyser/BreakdownList';
import ComparisonDiagram from '../components/analyser/ComparisonDiagram';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const mockIssues = [
  { severity: 'Critical', title: 'Single Point of Failure', description: 'The EC2 monolith handles all API requests. If it goes down, the entire application fails.', suggestion: 'Migrate to a Serverless approach using API Gateway and AWS Lambda for high availability.' },
  { severity: 'Warning', title: 'High Compute Costs', description: 'Running an EC2 instance 24/7 for variable traffic is not cost-effective.', suggestion: 'Serverless compute scales to zero when not in use.' },
  { severity: 'Info', title: 'No Caching Layer', description: 'Database queries go directly to RDS on every request.', suggestion: 'Consider adding Amazon ElastiCache (Redis) or DynamoDB DAX to reduce DB load.' }
];

const Analyse = () => {
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [hasAnalysed, setHasAnalysed] = useState(false);

  const handleUpload = (data) => {
    setIsAnalysing(true);
    // Mock analysis delay
    setTimeout(() => {
      setIsAnalysing(false);
      setHasAnalysed(true);
    }, 2500);
  };

  return (
    <PageWrapper className="flex flex-col h-[calc(100vh-8rem)]">
      {!hasAnalysed && !isAnalysing && (
        <div className="max-w-3xl mx-auto w-full mt-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Architecture Analyser</h1>
            <p className="text-lg text-slate-400">Upload an existing diagram or paste your JSON to get an AI-powered breakdown of security, cost, and availability improvements.</p>
          </div>
          <UploadInput onUpload={handleUpload} />
        </div>
      )}

      {isAnalysing && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Analysing Architecture...</h3>
          <p className="text-slate-400">CloudyAI is scanning for bottlenecks and cost inefficiencies.</p>
        </div>
      )}

      {hasAnalysed && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-6 h-full"
        >
          {/* Left Column: Breakdown */}
          <div className="w-1/3 overflow-y-auto pr-2 custom-scrollbar">
            <BreakdownList issues={mockIssues} />
            <button 
              onClick={() => setHasAnalysed(false)}
              className="mt-8 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-colors w-full"
            >
              Analyse Another
            </button>
          </div>

          {/* Right Column: Comparison */}
          <div className="flex-1 glass-card rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
            <ComparisonDiagram />
          </div>
        </motion.div>
      )}
    </PageWrapper>
  );
};

export default Analyse;
