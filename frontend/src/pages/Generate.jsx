import { useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import ChatInterface from '../components/cloudy/ChatInterface';
import FlowDiagram from '../components/architecture/FlowDiagram';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { AlertCircle } from 'lucide-react';

import { saveHistoryItem } from '../utils/history';

const Generate = () => {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState('diagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [error, setError] = useState(null);

  // Managed workspace state to enable real-time canvas dragging and editing
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [cost, setCost] = useState({ total_monthly_cost: '$0.00', services: [] });

  const handleGenerate = async (prompt, platform, history) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await api.post('/generate/architecture', { prompt, platform, history });
      if (response.data && response.data.status === 'success') {
        const architecture = response.data;
        setGeneratedData(architecture);
        setNodes(architecture.nodes || []);
        setEdges(architecture.edges || []);
        
        const initialCost = architecture.cost || { total_monthly_cost: '$0.00', services: [] };
        setCost(initialCost);
        
        setHasGenerated(true);
        // Dynamically save user generation to local storage history to avoid mocked static counts
        saveHistoryItem({
          type: 'generated',
          title: prompt,
          platform: platform,
          services: architecture.nodes?.length || 0,
          cost: initialCost.total_monthly_cost || '$0.00'
        });
      } else {
        setError(response.data?.message || 'Failed to generate architecture');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Connection error to the backend');
    } finally {
      setIsGenerating(false);
    }
  };

  // Real-time automatic monthly cost estimation recalculations based on node addition/deletions
  const handleDiagramChange = (nextNodes, nextEdges) => {
    setNodes(nextNodes);
    setEdges(nextEdges);

    let total = 0;
    const servicesBreakdown = [];

    nextNodes.forEach((node) => {
      const label = (node.label || '').toLowerCase();
      let itemCost = 10.00;
      let serviceName = node.label || 'Cloud Resource';
      let usageMetric = 'Per 1 million requests / serverless execution';

      if (label.includes('client') || label.includes('frontend') || label.includes('user')) {
        itemCost = 0.00;
        usageMetric = 'Free static page hosting & DNS mapping';
      } else if (label.includes('api') || label.includes('gateway') || label.includes('cdn') || label.includes('cloudfront')) {
        itemCost = 12.00;
        usageMetric = 'Gateway transfer per 100 GB traffic';
      } else if (label.includes('lambda') || label.includes('compute') || label.includes('function') || label.includes('logic')) {
        itemCost = 18.00;
        usageMetric = 'Serverless invocations per 1M triggers';
      } else if (label.includes('db') || label.includes('database') || label.includes('table') || label.includes('sql') || label.includes('dynamodb')) {
        itemCost = 28.00;
        usageMetric = 'Provisioned write capacity units per month';
      } else if (label.includes('s3') || label.includes('bucket') || label.includes('storage')) {
        itemCost = 4.50;
        usageMetric = 'Object asset space per 50 GB capacity';
      } else if (label.includes('auth') || label.includes('cognito') || label.includes('security')) {
        itemCost = 15.00;
        usageMetric = 'Active directories IAM validation cycles';
      }

      total += itemCost;
      servicesBreakdown.push({
        name: serviceName,
        monthly_cost: `$${itemCost.toFixed(2)}`,
        breakdown: usageMetric
      });
    });

    const updatedCost = {
      total_monthly_cost: `$${total.toFixed(2)}`,
      services: servicesBreakdown
    };

    setCost(updatedCost);

    // Keep active JSON tab synchronized in real-time
    setGeneratedData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        nodes: nextNodes,
        edges: nextEdges,
        cost: updatedCost
      };
    });
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
                    <FlowDiagram 
                      nodes={nodes} 
                      edges={edges} 
                      onDiagramChange={handleDiagramChange}
                    />
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
                            {cost.total_monthly_cost || '$0.00'}
                          </p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-emerald-400 font-bold text-xs uppercase tracking-widest animate-pulse">
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
                              {cost.services?.map((svc, i) => (
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
