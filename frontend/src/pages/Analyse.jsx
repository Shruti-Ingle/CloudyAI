import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import UploadInput from '../components/analyser/UploadInput';
import BreakdownList from '../components/analyser/BreakdownList';
import ComparisonDiagram from '../components/analyser/ComparisonDiagram';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { saveHistoryItem, getHistoryItems } from '../utils/history';

const Analyse = () => {
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [hasAnalysed, setHasAnalysed] = useState(false);
  const [issues, setIssues] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [beforeNodes, setBeforeNodes] = useState(null);
  const [beforeEdges, setBeforeEdges] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Read history item ID from URL query param (avoids sessionStorage + React StrictMode issues)
    const params = new URLSearchParams(window.location.search);
    const loadId = params.get('load');

    if (loadId) {
      const loadItem = async () => {
        try {
          // Fetch from DynamoDB backend
          const response = await api.get('/generate/history');
          const allHistory = response.data || [];
          let item = allHistory.find(h => String(h.id) === String(loadId));

          if (!item) {
            // Fallback to local storage
            const localHistory = getHistoryItems();
            item = localHistory.find(h => String(h.id) === String(loadId));
          }

          if (item) {
            setBeforeNodes(item.beforeNodes || null);
            setBeforeEdges(item.beforeEdges || null);
            setAnalysisData(item.rawAnalysis || null);
            setIssues(item.issues_list || item.rawAnalysis?.issues || []);
            setHasAnalysed(true);
          }
        } catch (err) {
          console.error("Error loading analysis history item from backend:", err);
          // Ultimate local storage fallback
          const localHistory = getHistoryItems();
          const item = localHistory.find(h => String(h.id) === String(loadId));
          if (item) {
            setBeforeNodes(item.beforeNodes || null);
            setBeforeEdges(item.beforeEdges || null);
            setAnalysisData(item.rawAnalysis || null);
            setIssues(item.issues_list || item.rawAnalysis?.issues || []);
            setHasAnalysed(true);
          }
        }
      };
      loadItem();
    }
  }, []);


  const handleUpload = async (data) => {
    setIsAnalysing(true);
    setError(null);
    setBeforeNodes(null);
    setBeforeEdges(null);
    
    try {
      let parsedNodes = null;
      let parsedEdges = null;
      let payload = data;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.nodes && parsed.edges) {
            parsedNodes = parsed.nodes;
            parsedEdges = parsed.edges;
            setBeforeNodes(parsed.nodes);
            setBeforeEdges(parsed.edges);
          }
        } catch (e) {
          // Paste was plain text or not standard flow JSON
        }
      } else {
        payload = JSON.stringify({ name: "Legacy System", platform: "AWS", components: [] });
      }

      const response = await api.post('/analyse/architecture', { architecture_data: payload });
      if (response.data && response.data.status === 'success') {
        setAnalysisData(response.data);
        setIssues(response.data.issues || []);
        setHasAnalysed(true);

        // Dynamically save user analysis to local storage history
        saveHistoryItem({
          type: 'analysed',
          title: "Custom Architecture Analysis",
          platform: "AWS",
          issues: response.data.issues?.length || 0,
          issues_list: response.data.issues || [],
          beforeNodes: parsedNodes,
          beforeEdges: parsedEdges,
          rawAnalysis: response.data
        });
      } else {
        setError(response.data?.message || 'Failed to analyse architecture');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Connection error to the backend');
    } finally {
      setIsAnalysing(false);
    }
  };

  return (
    <PageWrapper className="flex flex-col h-full">
      {!hasAnalysed && !isAnalysing && !error && (
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

      {error && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
          <h3 className="text-2xl font-bold text-white mb-2">Analysis Failed</h3>
          <p className="text-slate-400 text-sm max-w-md mb-6">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {hasAnalysed && !isAnalysing && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-6 h-full"
        >
          {/* Left Column: Breakdown */}
          <div className="w-1/3 overflow-y-auto pr-2 custom-scrollbar">
            <BreakdownList issues={issues} />
            <button 
              onClick={() => setHasAnalysed(false)}
              className="mt-8 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-colors w-full"
            >
              Analyse Another
            </button>
          </div>

          {/* Right Column: Comparison */}
          <div className="flex-1 glass-card rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
            <ComparisonDiagram 
              beforeNodes={beforeNodes}
              beforeEdges={beforeEdges}
              suggestedNodes={analysisData?.suggested_nodes}
              suggestedEdges={analysisData?.suggested_edges}
            />
          </div>
        </motion.div>
      )}
    </PageWrapper>
  );
};

export default Analyse;

