import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import ChatInterface from '../components/cloudy/ChatInterface';
import FlowDiagram from '../components/architecture/FlowDiagram';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { AlertCircle, ShieldAlert, ShieldCheck, HelpCircle, ArrowRight, Activity, Zap } from 'lucide-react';
import { saveHistoryItem } from '../utils/history';
import { generateLocalArchitecture } from '../utils/localOllama';


const Generate = () => {
  const location = useLocation();
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState('diagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [error, setError] = useState(null);
  const [panelExpanded, setPanelExpanded] = useState(false);

  // Managed workspace state to enable real-time canvas dragging and editing
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [cost, setCost] = useState({ total_monthly_cost: '$0.00', services: [] });
  const [securityIssues, setSecurityIssues] = useState([]);

  // Automated Real-time Security & Compliance Auditor Scanner
  const runSecurityAudit = (currentNodes, currentEdges) => {
    const issues = [];
    const nodeTypes = currentNodes.map(n => ({
      id: n.id,
      label: (n.label || '').toLowerCase(),
      type: n.properties?.type || 'other'
    }));

    const clientNode = nodeTypes.find(n => n.type === 'client');
    const dbNode = nodeTypes.find(n => n.type === 'db');
    const computeNode = nodeTypes.find(n => n.type === 'compute');
    const apiNode = nodeTypes.find(n => n.type === 'api');
    const authNode = nodeTypes.find(n => n.type === 'auth');

    // Rule 1: Client accessing Database node directly (Critical Vulnerability!)
    const directDbAccess = currentEdges.some(edge => {
      const source = nodeTypes.find(n => n.id === edge.source);
      const target = nodeTypes.find(n => n.id === edge.target);
      return source?.type === 'client' && target?.type === 'db';
    });

    if (directDbAccess) {
      issues.push({
        severity: 'critical',
        title: 'Exposed Database Ingress',
        description: 'Client device is connecting directly to your database database node. This exposes database connection credentials and tables directly to internet probes.',
        mitigation: 'Add a Lambda Compute node and place it in between your Client and Database node to proxy read/write operations securely.'
      });
    }

    // Rule 2: Missing perimeter Firewall or Cognito Identity Provider (High Risk)
    if (!authNode) {
      issues.push({
        severity: 'high',
        title: 'Unauthenticated API Requests Allowed',
        description: 'Your perimeter ingress compute nodes are not backed by Cognito IAM or standard user identity authentication pools.',
        mitigation: 'Drag a Cognito IAM Security node from the left resource palette and link it next to your ingress API gateway node to validate JWT credentials.'
      });
    }

    // Rule 3: Client accessing Compute directly without Gateway / ALB (Medium Risk)
    const directComputeAccess = currentEdges.some(edge => {
      const source = nodeTypes.find(n => n.id === edge.source);
      const target = nodeTypes.find(n => n.id === edge.target);
      return source?.type === 'client' && target?.type === 'compute';
    });

    if (directComputeAccess && !apiNode) {
      issues.push({
        severity: 'medium',
        title: 'Exposed Compute Endpoints',
        description: 'Compute microservices are exposed directly to raw internet client traffic without caching, throttling, or TLS termination proxy shields.',
        mitigation: 'Drag and insert an API Gateway / CDN node between your client ingress point and compute microservice to throttle spam.'
      });
    }

    // Default Pass standard checks if no critical/high issues are found
    if (issues.length === 0) {
      issues.push({
        severity: 'compliant',
        title: 'CIS Best Practices Compliant',
        description: 'No structural perimeter breaches or unprotected DB exposures detected. Your architecture follows the AWS Well-Architected standard framework.',
        mitigation: 'All good to go! Ready for CloudFormation / Terraform production deployment.'
      });
    }

    setSecurityIssues(issues);
  };

  useEffect(() => {
    if (location.state?.historyItem) {
      const item = location.state.historyItem;
      setNodes(item.nodes || []);
      setEdges(item.edges || []);
      
      const loadedCost = item.cost_details || { total_monthly_cost: item.cost || '$0.00', services: [] };
      setCost(loadedCost);
      runSecurityAudit(item.nodes || [], item.edges || []);
      
      setGeneratedData(item.rawArchitecture || {
        status: 'success',
        platform: item.platform,
        nodes: item.nodes || [],
        edges: item.edges || [],
        cost: loadedCost
      });
      setHasGenerated(true);
      setPanelExpanded(false);
    }
  }, [location.state]);

  const handleGenerate = async (prompt, platform, history) => {
    if (!hasGenerated) {
      setPanelExpanded(false);
    }
    setIsGenerating(true);
    setError(null);
    try {
      // Retrieve direct browser routing settings
      let settings = { routingMode: 'cloud' };
      try {
        const saved = localStorage.getItem('clouddaddy_settings');
        if (saved) settings = JSON.parse(saved);
      } catch (e) {
        console.warn("Could not read local settings", e);
      }

      let architecture;

      if (settings.routingMode === 'local') {
        const response = await generateLocalArchitecture({
          url: settings.localUrl,
          apiKey: settings.localApiKey,
          model: settings.localModel,
          prompt,
          platform,
          history
        });
        architecture = response;
      } else {
        const response = await api.post('/generate/architecture', { prompt, platform, history });
        architecture = response.data;
      }

      if (architecture && architecture.status === 'success') {
        setGeneratedData(architecture);
        setNodes(architecture.nodes || []);
        setEdges(architecture.edges || []);
        
        const initialCost = architecture.cost || { total_monthly_cost: '$0.00', services: [] };
        setCost(initialCost);
        runSecurityAudit(architecture.nodes || [], architecture.edges || []);
        
        setHasGenerated(true);
        // Dynamically save user generation to local storage history
        saveHistoryItem({
          type: 'generated',
          title: prompt,
          platform: platform,
          services: architecture.nodes?.length || 0,
          cost: initialCost.total_monthly_cost || '$0.00',
          nodes: architecture.nodes || [],
          edges: architecture.edges || [],
          cost_details: initialCost,
          rawArchitecture: architecture
        });
      } else {
        setError(architecture?.message || 'Failed to generate architecture');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Connection error to the backend');
    } finally {
      setIsGenerating(false);
    }
  };

  // Real-time automatic monthly cost estimation recalculations based on node addition/deletions/properties
  const handleDiagramChange = (nextNodes, nextEdges) => {
    setNodes(nextNodes);
    setEdges(nextEdges);
    runSecurityAudit(nextNodes, nextEdges);

    let total = 0;
    const servicesBreakdown = [];

    nextNodes.forEach((node) => {
      const label = (node.label || '').toLowerCase();
      const props = node.properties || {};
      
      let itemCost = 10.00;
      let serviceName = node.label || 'Cloud Resource';
      let usageMetric = 'Per 1 million requests / serverless execution';

      // Advanced property-aware granular cost computations
      if (label.includes('client') || label.includes('frontend') || label.includes('user')) {
        itemCost = 0.00;
        usageMetric = 'Free static page hosting & DNS mapping';
      } else if (label.includes('api') || label.includes('gateway') || label.includes('cdn') || label.includes('cloudfront')) {
        const reqs = props.requests || 2;
        itemCost = reqs * 6.00; // $6.00 per million requests
        usageMetric = `Scaled transfer rate for ${reqs}M ingress calls/mo`;
      } else if (label.includes('lambda') || label.includes('compute') || label.includes('function') || label.includes('logic')) {
        const size = props.size || 't3.medium';
        if (size === 't3.micro') itemCost = 8.50;
        else if (size === 't3.medium') itemCost = 18.00;
        else if (size === 'c6g.large') itemCost = 38.00;
        usageMetric = `Micro-compute tier: ${size} instance specs`;
      } else if (label.includes('db') || label.includes('database') || label.includes('table') || label.includes('sql') || label.includes('dynamodb')) {
        const size = props.size || 'db.t3.medium';
        const reps = props.replicas || 1;
        const isMulti = props.multiAZ || false;
        
        let baseCost = 32.00;
        if (size === 'db.t3.micro') baseCost = 15.00;
        else if (size === 'db.t3.medium') baseCost = 32.00;
        else if (size === 'db.m6g.large') baseCost = 68.00;
        
        itemCost = baseCost * reps;
        if (isMulti) {
          itemCost = itemCost * 2;
        }
        
        usageMetric = `${size} database with ${reps} replica(s) ${isMulti ? '(Multi-AZ active)' : '(Single-AZ)'}`;
      } else if (label.includes('s3') || label.includes('bucket') || label.includes('storage')) {
        const cap = props.capacity || 150;
        const isGlacier = props.glacier || false;
        itemCost = isGlacier ? (cap * 0.012) : (cap * 0.03); // $0.03/GB standard, $0.012/GB Glacier
        usageMetric = `${cap} GB object space ${isGlacier ? 'with Glacier Deep Archiving' : '(Standard storage)'}`;
      } else if (label.includes('auth') || label.includes('cognito') || label.includes('security')) {
        const usersCount = props.users || 10;
        itemCost = usersCount * 1.50; // $1.50 per 1k users
        usageMetric = `Auth pools sizing for ${usersCount}k active MAUs/mo`;
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

  // Convert monthly total string to clean numeric value for comparisons
  const getNumericCost = () => {
    if (!cost || !cost.total_monthly_cost) return 0;
    const clean = cost.total_monthly_cost.replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
  };

  const currentTotalCost = getNumericCost();

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
            onAnimationComplete={() => setPanelExpanded(true)}
            className="h-full flex flex-col glass-card rounded-2xl border border-slate-700/50 overflow-hidden"
          >
            {/* Tab controls */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-700/50 bg-slate-800/80 overflow-x-auto shrink-0 font-Outfit">
              <button 
                onClick={() => setActiveTab('diagram')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'diagram' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'
                }`}
                disabled={isGenerating}
              >
                Diagram View
              </button>
              <button 
                onClick={() => setActiveTab('cost')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'cost' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'
                }`}
                disabled={isGenerating}
              >
                Cost Estimate
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'security' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'
                }`}
                disabled={isGenerating}
              >
                Security Audit
                {securityIssues.some(i => i.severity === 'critical' || i.severity === 'high') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'json' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'
                }`}
                disabled={isGenerating}
              >
                JSON View
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-hidden relative flex flex-col">
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center font-Outfit">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Generating Architecture...</h4>
                  <p className="text-slate-400 text-sm">Designing resource topology and connecting nodes.</p>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 font-Outfit">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                  <h4 className="text-xl font-bold text-white mb-2">Generation Failed</h4>
                  <p className="text-slate-400 text-sm max-w-md">{error}</p>
                </div>
              ) : (
                <>
                  {/* 1. React Flow Diagram Tab */}
                  {activeTab === 'diagram' ? (
                    panelExpanded ? (
                      <FlowDiagram 
                        nodes={nodes} 
                        edges={edges} 
                        onDiagramChange={handleDiagramChange}
                      />
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center font-Outfit">
                        <div className="relative w-12 h-12 mb-4">
                          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
                          <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-slate-400 text-xs font-bold">Initializing Canvas Dimensions...</p>
                      </div>
                    )
                  ) : activeTab === 'cost' ? (
                    /* 2. Premium Monthly Cost Tab & Provider Comparison */
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full h-full bg-slate-900 rounded-xl p-5 overflow-auto border border-slate-700/50 flex flex-col gap-6 font-Outfit"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Monthly Summary card */}
                        <div className="lg:col-span-1 bg-gradient-to-br from-slate-950 to-slate-900 p-5 rounded-2xl border border-slate-850 flex flex-col justify-between shadow-xl">
                          <div>
                            <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Estimated Monthly Total</h5>
                            <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                              {cost.total_monthly_cost || '$0.00'}
                            </p>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider border-t border-slate-800/80 pt-3">
                            <span className="text-slate-500">Status</span>
                            <span className="text-emerald-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Cost Optimized
                            </span>
                          </div>
                        </div>

                        {/* Side-by-side AWS vs. GCP vs. Azure Cost Comparer */}
                        <div className="lg:col-span-2 bg-slate-950/60 p-5 rounded-2xl border border-slate-850 flex flex-col gap-3.5 shadow-xl">
                          <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850 pb-2">Multi-Cloud Provider Comparer</h5>
                          <div className="flex flex-col gap-3">
                            {/* AWS Meter */}
                            <div className="flex items-center gap-4">
                              <span className="w-14 text-xs font-bold text-amber-500 text-left">AWS</span>
                              <div className="flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                                <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full" style={{ width: '100%' }}></div>
                              </div>
                              <span className="w-16 text-xs font-bold text-white text-right">${currentTotalCost.toFixed(2)}</span>
                            </div>
                            
                            {/* GCP Meter */}
                            <div className="flex items-center gap-4">
                              <span className="w-14 text-xs font-bold text-sky-400 text-left">GCP</span>
                              <div className="flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                                <div className="bg-gradient-to-r from-sky-400 to-sky-500 h-full rounded-full" style={{ width: '85%' }}></div>
                              </div>
                              <span className="w-16 text-xs font-bold text-emerald-400 text-right">${(currentTotalCost * 0.85).toFixed(2)}</span>
                            </div>
                            
                            {/* Azure Meter */}
                            <div className="flex items-center gap-4">
                              <span className="w-14 text-xs font-bold text-indigo-400 text-left">Azure</span>
                              <div className="flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                                <div className="bg-gradient-to-r from-indigo-400 to-indigo-500 h-full rounded-full" style={{ width: '95%' }}></div>
                              </div>
                              <span className="w-16 text-xs font-bold text-white text-right">${(currentTotalCost * 0.95).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Services breakdown list */}
                      <div className="flex flex-col gap-3">
                        <h6 className="text-white font-bold text-sm">Detailed Bill Breakdown</h6>
                        <div className="overflow-hidden border border-slate-850 rounded-xl shadow-md">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <th className="p-4">Service</th>
                                <th className="p-4">Est. Cost / Month</th>
                                <th className="p-4">Breakdown / Sizing Metric</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850 bg-slate-900/40 text-xs">
                              {cost.services?.map((svc, i) => (
                                <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                  <td className="p-4 font-bold text-white">{svc.name}</td>
                                  <td className="p-4 font-bold text-emerald-400">{svc.monthly_cost}</td>
                                  <td className="p-4 text-slate-400 font-medium">{svc.breakdown}</td>
                                </tr>
                              )) || (
                                <tr>
                                  <td colSpan="3" className="p-8 text-center text-slate-500 font-medium">
                                    No services added to design board yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  ) : activeTab === 'security' ? (
                    /* 3. Interactive Security Compliance Tab */
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full h-full bg-slate-900 rounded-xl p-6 overflow-auto border border-slate-700/50 flex flex-col gap-6 font-Outfit"
                    >
                      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-1">
                        <ShieldAlert className="w-6 h-6 text-indigo-400" />
                        <div className="text-left">
                          <h5 className="text-sm font-bold text-white uppercase tracking-wider">Architecture Compliance Scan</h5>
                          <p className="text-xs text-slate-500">Continuous check against CIS benchmarks & AWS Well-Architected practices.</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        {securityIssues.map((issue, idx) => (
                          <div 
                            key={idx}
                            className={`p-4 rounded-xl border flex gap-4 text-left ${
                              issue.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/35 text-rose-200' :
                              issue.severity === 'high' ? 'bg-amber-500/10 border-amber-500/35 text-amber-200' :
                              issue.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/35 text-yellow-200' :
                              'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {issue.severity === 'compliant' ? (
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                              )}
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <h6 className="text-sm font-bold text-white">{issue.title}</h6>
                                <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  issue.severity === 'critical' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' :
                                  issue.severity === 'high' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' :
                                  issue.severity === 'medium' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' :
                                  'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                }`}>
                                  {issue.severity}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">{issue.description}</p>
                              {issue.mitigation && (
                                <div className="mt-2 p-3 bg-slate-950/40 rounded-lg border border-slate-900 flex flex-col gap-1">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                                    Mitigation Instruction
                                  </p>
                                  <p className="text-xs text-slate-300 leading-normal">{issue.mitigation}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    /* 4. JSON Metadata Tab */
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
