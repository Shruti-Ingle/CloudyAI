import { useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import ChatInterface from '../components/cloudy/ChatInterface';
import FlowDiagram from '../components/architecture/FlowDiagram';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { AlertCircle } from 'lucide-react';

const Generate = () => {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState('diagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (prompt, platform, history) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await api.post('/generate/architecture', { prompt, platform, history });
      if (response.data && response.data.status === 'success') {
        setGeneratedData(response.data);
        setHasGenerated(true);
      } else {
        setError(response.data?.message || 'Failed to generate architecture');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Connection error to the backend');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <PageWrapper className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Cloudy Chat Column */}
      <motion.div 
        className={`${hasGenerated ? 'w-1/3' : 'w-full max-w-3xl mx-auto'} h-full transition-all duration-700 ease-in-out`}
        layout
      >
        <ChatInterface onGenerate={handleGenerate} />
      </motion.div>

      {/* Results Column */}
      <AnimatePresence>
        {(hasGenerated || isGenerating || error) && (
          <motion.div 
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: '66.666667%' }}
            className="h-full flex flex-col glass-card rounded-2xl border border-slate-700/50 overflow-hidden"
          >
            <div className="flex items-center gap-4 p-4 border-b border-slate-700/50 bg-slate-800/80">
              <button 
                onClick={() => setActiveTab('diagram')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'diagram' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'
                }`}
                disabled={isGenerating}
              >
                Diagram View
              </button>
              <button 
                onClick={() => setActiveTab('cost')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'cost' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'
                }`}
                disabled={isGenerating}
              >
                Cost Estimate
              </button>
              <button 
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'
                }`}
                disabled={isGenerating}
              >
                JSON View
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-hidden relative flex flex-col">
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Generating Architecture...</h4>
                  <p className="text-slate-400 text-sm">Designing resource topology and connecting nodes.</p>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                  <h4 className="text-xl font-bold text-white mb-2">Generation Failed</h4>
                  <p className="text-slate-400 text-sm max-w-md">{error}</p>
                </div>
              ) : (
                <>
                  {activeTab === 'diagram' ? (
                    <FlowDiagram nodes={generatedData?.nodes} edges={generatedData?.edges} />
                  ) : activeTab === 'cost' ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full h-full bg-slate-900 rounded-xl p-6 overflow-auto border border-slate-700/50 flex flex-col gap-6"
                    >
                      {/* Total Cost Summary Card */}
                      <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-6 rounded-2xl border border-slate-850 flex items-center justify-between shadow-xl">
                        <div>
                          <h5 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Estimated Monthly Total</h5>
                          <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                            {generatedData?.cost?.total_monthly_cost || '$0.00'}
                          </p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-emerald-400 font-bold text-xs uppercase tracking-widest">
                          Cost Optimized
                        </div>
                      </div>

                      {/* Services breakdown list */}
                      <div className="flex flex-col gap-4">
                        <h6 className="text-white font-bold text-sm">Resource Cost Breakdown</h6>
                        <div className="overflow-hidden border border-slate-800 rounded-xl">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <th className="p-4">Service</th>
                                <th className="p-4">Est. Cost / Month</th>
                                <th className="p-4">Breakdown / Usage Metric</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-xs">
                              {generatedData?.cost?.services?.map((svc, i) => (
                                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                  <td className="p-4 font-bold text-white">{svc.name}</td>
                                  <td className="p-4 font-bold text-emerald-400">{svc.monthly_cost}</td>
                                  <td className="p-4 text-slate-300">{svc.breakdown}</td>
                                </tr>
                              )) || (
                                <tr>
                                  <td colSpan="3" className="p-8 text-center text-slate-400 font-medium">
                                    No cost breakdown details returned.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full h-full bg-slate-900 rounded-xl p-4 overflow-auto text-sm text-green-400 font-mono border border-slate-700/50"
                    >
                      <pre className="whitespace-pre-wrap select-all">
                        {JSON.stringify(generatedData, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default Generate;

