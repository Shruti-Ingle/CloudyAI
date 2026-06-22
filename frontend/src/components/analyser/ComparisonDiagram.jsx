import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';

import { Server, Cpu, Database, Cloud, Globe, Shield, HardDrive, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MarkerType } from '@xyflow/react';

// Mock Before Data
const initialNodesBefore = [
  { id: 'client', position: { x: 250, y: 50 }, data: { label: 'Web Client' } },
  { id: 'ec2', position: { x: 250, y: 150 }, data: { label: 'EC2 Server (Monolith)' } },
  { id: 'rds', position: { x: 250, y: 250 }, data: { label: 'RDS Database' } },
];

const initialEdgesBefore = [
  { id: 'e1-2', source: 'client', target: 'ec2' },
  { id: 'e2-3', source: 'ec2', target: 'rds' },
];

// Mock After Data
const initialNodesAfter = [
  { id: 'client', position: { x: 250, y: 50 }, data: { label: 'Web Client' } },
  { id: 'api', position: { x: 250, y: 150 }, data: { label: 'API Gateway' } },
  { id: 'lambda', position: { x: 250, y: 250 }, data: { label: 'Lambda (Serverless)' } },
  { id: 'rds', position: { x: 250, y: 350 }, data: { label: 'RDS Database' } },
];

const initialEdgesAfter = [
  { id: 'e1-2', source: 'client', target: 'api' },
  { id: 'e2-3', source: 'api', target: 'lambda' },
  { id: 'e3-4', source: 'lambda', target: 'rds' },
];

const ComparisonDiagram = ({ beforeNodes, beforeEdges, suggestedNodes, suggestedEdges, issues = [] }) => {
  const hasBefore = beforeNodes && beforeNodes.length > 0;
  const [view, setView] = useState('after');

  useEffect(() => {
    if (!hasBefore) {
      setView('after');
    }
  }, [hasBefore]);
  
  const referenceBeforeNodes = beforeNodes || [];
  const referenceBeforeEdges = beforeEdges || [];

  const rawNodes = view === 'after' 
    ? (suggestedNodes || initialNodesAfter) 
    : referenceBeforeNodes;
    
  const rawEdges = view === 'after' 
    ? (suggestedEdges || initialEdgesAfter) 
    : referenceBeforeEdges;

  const getServiceIcon = (label = '') => {
    const l = label.toLowerCase();
    if (l.includes('client') || l.includes('frontend') || l.includes('user') || l.includes('dns') || l.includes('53') || l.includes('domain')) {
      return <Globe className="w-5 h-5 text-indigo-400" />;
    }
    if (l.includes('api') || l.includes('gateway') || l.includes('cdn') || l.includes('cloudfront') || l.includes('balancer') || l.includes('alb') || l.includes('waf') || l.includes('firewall')) {
      return <Cloud className="w-5 h-5 text-sky-400" />;
    }
    if (l.includes('lambda') || l.includes('compute') || l.includes('function') || l.includes('run') || l.includes('logic') || l.includes('ecs') || l.includes('eks') || l.includes('cluster') || l.includes('server') || l.includes('ec2')) {
      return <Cpu className="w-5 h-5 text-orange-400" />;
    }
    if (l.includes('db') || l.includes('database') || l.includes('dynamodb') || l.includes('sql') || l.includes('table') || l.includes('postgres') || l.includes('nosql') || l.includes('redis') || l.includes('cache')) {
      return <Database className="w-5 h-5 text-emerald-400" />;
    }
    if (l.includes('s3') || l.includes('bucket') || l.includes('storage') || l.includes('blob') || l.includes('backup')) {
      return <HardDrive className="w-5 h-5 text-rose-400" />;
    }
    if (l.includes('auth') || l.includes('cognito') || l.includes('iam') || l.includes('security') || l.includes('kms') || l.includes('key')) {
      return <Shield className="w-5 h-5 text-yellow-400" />;
    }
    return <Server className="w-5 h-5 text-indigo-400" />;
  };

  const styleRawNodes = (nodesToStyle, isSuggested) => {
    return nodesToStyle.map((node) => {
      const labelText = node.label || node.data?.label || 'Cloud Resource';
      const l = labelText.toLowerCase();

      let bg = 'rgba(15, 23, 42, 0.95)';
      let border = '2px solid rgba(71, 85, 105, 0.8)';
      let shadowColor = 'rgba(0, 0, 0, 0.4)';
      let badge = null;

      // Service color code
      if (l.includes('client') || l.includes('frontend') || l.includes('user')) {
        bg = 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%)'; 
        border = '2px solid #a78bfa';
        shadowColor = 'rgba(167, 139, 250, 0.25)';
      } else if (l.includes('api') || l.includes('gateway') || l.includes('cdn') || l.includes('cloudfront')) {
        bg = 'linear-gradient(135deg, #0c4a6e 0%, #082f49 100%)'; 
        border = '2px solid #38bdf8';
        shadowColor = 'rgba(56, 189, 248, 0.25)';
      } else if (l.includes('lambda') || l.includes('compute') || l.includes('function') || l.includes('logic') || l.includes('ecs') || l.includes('eks') || l.includes('cluster') || l.includes('server') || l.includes('ec2')) {
        bg = 'linear-gradient(135deg, #431407 0%, #2a0800 100%)'; 
        border = '2px solid #fb923c';
        shadowColor = 'rgba(251, 146, 60, 0.25)';
      } else if (l.includes('db') || l.includes('database') || l.includes('dynamodb') || l.includes('table') || l.includes('sql') || l.includes('redis') || l.includes('cache')) {
        bg = 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'; 
        border = '2px solid #34d399';
        shadowColor = 'rgba(52, 211, 153, 0.25)';
      } else if (l.includes('s3') || l.includes('bucket') || l.includes('storage') || l.includes('blob') || l.includes('backup')) {
        bg = 'linear-gradient(135deg, #4c0519 0%, #31040f 100%)'; 
        border = '2px solid #fb7185';
        shadowColor = 'rgba(251, 113, 133, 0.25)';
      } else if (l.includes('auth') || l.includes('cognito') || l.includes('security') || l.includes('kms') || l.includes('key')) {
        bg = 'linear-gradient(135deg, #422006 0%, #201004 100%)'; 
        border = '2px solid #facc15';
        shadowColor = 'rgba(250, 204, 21, 0.25)';
      }

      if (!isSuggested) {
        // Red glow warning indicator for issue nodes
        const hasIssue = issues.some(issue => {
          const title = (issue.title || '').toLowerCase();
          const desc = (issue.description || '').toLowerCase();

          // Check direct affected_nodes list from LLM output if available
          if (issue.affected_nodes && Array.isArray(issue.affected_nodes)) {
            return issue.affected_nodes.some(an => 
              String(an).toLowerCase() === String(node.id).toLowerCase() ||
              l.includes(String(an).toLowerCase()) ||
              String(an).toLowerCase().includes(l)
            );
          }

          // Strict substring keyword matching (filtering out generic names)
          const cleanLabel = l.replace(/[^a-z0-9\s]/g, ' ');
          const words = cleanLabel.split(/\s+/).filter(w => w.length > 2);
          const genericWords = ['server', 'client', 'logic', 'node', 'resource', 'device', 'cloud', 'aws', 'azure', 'gcp'];
          const filteredWords = words.filter(w => !genericWords.includes(w));
          if (filteredWords.length === 0) return false;

          const matchesKeyword = filteredWords.some(word => title.includes(word) || desc.includes(word));
          
          const isDbIssue = (l.includes('db') || l.includes('database') || l.includes('rds') || l.includes('sql') || l.includes('dynamo')) &&
                            (title.includes('db') || title.includes('database') || desc.includes('db') || desc.includes('database')) &&
                            (title.includes('backup') || desc.includes('backup') || title.includes('failover') || desc.includes('failover') || title.includes('replication') || desc.includes('replication'));
          
          const isSecurityIssue = (l.includes('waf') || l.includes('firewall') || l.includes('security') || l.includes('shield')) &&
                                  (title.includes('waf') || title.includes('firewall') || title.includes('security') || desc.includes('waf') || desc.includes('firewall') || desc.includes('security'));
                                  
          const isCostIssue = (l.includes('instance') || l.includes('ec2') || l.includes('monolith')) &&
                              (title.includes('cost') || desc.includes('cost') || title.includes('resize') || desc.includes('resize') || title.includes('overprovisioned') || desc.includes('overprovisioned'));

          return matchesKeyword || isDbIssue || isSecurityIssue || isCostIssue;
        });

        if (hasIssue) {
          border = '2.5px solid #ef4444';
          shadowColor = 'rgba(239, 68, 68, 0.6)';
          badge = (
            <div className="absolute -top-2.5 -right-2.5 bg-red-600 border border-red-500 text-white rounded-full p-1 shadow-lg flex items-center justify-center animate-pulse z-10">
              <AlertTriangle className="w-3 h-3" />
            </div>
          );
        }
      } else {
        // Green glow check indicator for newly suggested/optimized nodes
        if (hasBefore) {
          const isNewNode = !referenceBeforeNodes.some(beforeNode => {
            const beforeLabel = (beforeNode.label || beforeNode.data?.label || '').toLowerCase();
            return beforeNode.id === node.id || beforeLabel === l;
          });

          if (isNewNode) {
            border = '2.5px solid #10b981';
            shadowColor = 'rgba(16, 185, 129, 0.6)';
            badge = (
              <div className="absolute -top-2.5 -right-2.5 bg-emerald-600 border border-emerald-500 text-white rounded-full p-1 shadow-lg flex items-center justify-center z-10">
                <CheckCircle2 className="w-3 h-3" />
              </div>
            );
          }
        }
      }

      return {
        id: node.id,
        type: 'default',
        position: node.position,
        label: labelText,
        data: {
          label: (
            <div className="flex flex-col gap-1 py-1 px-0.5 select-none relative">
              {badge}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 p-1.5 rounded-lg bg-slate-950/40 border border-slate-700/50">
                  {getServiceIcon(labelText)}
                </div>
                <div className="text-left">
                  <p className="font-bold text-white text-xs tracking-wide truncate max-w-[130px]">{labelText}</p>
                  <p className="text-[10px] text-slate-400 font-medium capitalize">
                    {node.type || 'Resource'}
                  </p>
                </div>
              </div>
            </div>
          )
        },
        style: {
          background: bg,
          border: border,
          borderRadius: '16px',
          boxShadow: `0 12px 24px -10px ${shadowColor}, inset 0 1px 1px rgba(255,255,255,0.1)`,
          color: '#fff',
          padding: '8px 12px',
          width: '210px',
          fontFamily: 'Outfit, sans-serif',
          backdropFilter: 'blur(12px)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }
      };
    });
  };

  const styledNodes = styleRawNodes(rawNodes, view === 'after');

  const styledEdges = rawEdges.map((edge) => {
    let strokeColor = '#38bdf8';
    let animated = true;
    let strokeDasharray = '6';
    let filter = 'drop-shadow(0px 0px 4px rgba(56, 189, 248, 0.4))';
    let strokeWidth = 3;

    if (view === 'before') {
      const sourceNode = referenceBeforeNodes.find(n => n.id === edge.source);
      const targetNode = referenceBeforeNodes.find(n => n.id === edge.target);

      const hasIssue = (node) => {
        if (!node) return false;
        const l = (node.label || node.data?.label || '').toLowerCase();
        return issues.some(issue => {
          const title = (issue.title || '').toLowerCase();
          const desc = (issue.description || '').toLowerCase();
          
          if (issue.affected_nodes && Array.isArray(issue.affected_nodes)) {
            return issue.affected_nodes.some(an => 
              String(an).toLowerCase() === String(node.id).toLowerCase() ||
              l.includes(String(an).toLowerCase()) ||
              String(an).toLowerCase().includes(l)
            );
          }

          const cleanLabel = l.replace(/[^a-z0-9\s]/g, ' ');
          const words = cleanLabel.split(/\s+/).filter(w => w.length > 2);
          const genericWords = ['server', 'client', 'logic', 'node', 'resource', 'device', 'cloud', 'aws', 'azure', 'gcp'];
          const filteredWords = words.filter(w => !genericWords.includes(w));
          if (filteredWords.length === 0) return false;

          const matchesKeyword = filteredWords.some(word => title.includes(word) || desc.includes(word));
          
          const isDbIssue = (l.includes('db') || l.includes('database') || l.includes('rds') || l.includes('sql') || l.includes('dynamo')) &&
                            (title.includes('db') || title.includes('database') || desc.includes('db') || desc.includes('database')) &&
                            (title.includes('backup') || desc.includes('backup') || title.includes('failover') || desc.includes('failover') || title.includes('replication') || desc.includes('replication'));
          
          const isSecurityIssue = (l.includes('waf') || l.includes('firewall') || l.includes('security') || l.includes('shield')) &&
                                  (title.includes('waf') || title.includes('firewall') || title.includes('security') || desc.includes('waf') || desc.includes('firewall') || desc.includes('security'));
                                  
          const isCostIssue = (l.includes('instance') || l.includes('ec2') || l.includes('monolith')) &&
                              (title.includes('cost') || desc.includes('cost') || title.includes('resize') || desc.includes('resize') || title.includes('overprovisioned') || desc.includes('overprovisioned'));

          return matchesKeyword || isDbIssue || isSecurityIssue || isCostIssue;
        });
      };

      if (hasIssue(sourceNode) || hasIssue(targetNode)) {
        strokeColor = '#ef4444'; 
        filter = 'drop-shadow(0px 0px 4px rgba(239, 68, 68, 0.4))';
      } else {
        strokeColor = '#475569'; 
        animated = false;
        strokeDasharray = undefined;
        filter = undefined;
        strokeWidth = 2;
      }
    } else {
      const isNewEdge = hasBefore && !referenceBeforeEdges.some(beforeEdge => 
        beforeEdge.id === edge.id || 
        (beforeEdge.source === edge.source && beforeEdge.target === edge.target)
      );

      if (isNewEdge) {
        strokeColor = '#10b981'; 
        filter = 'drop-shadow(0px 0px 4px rgba(16, 185, 129, 0.4))';
      } else {
        strokeColor = '#38bdf8'; 
        animated = true;
        strokeDasharray = '6';
        filter = 'drop-shadow(0px 0px 4px rgba(56, 189, 248, 0.2))';
        strokeWidth = 2.5;
      }
    }

    return {
      ...edge,
      animated,
      type: 'smoothstep',
      style: {
        stroke: strokeColor,
        strokeWidth,
        strokeDasharray,
        animationDuration: '25s',
        filter
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: strokeColor,
      }
    };
  });

  return (
    <div className="w-full h-full flex flex-col">
      {hasBefore && (
        <div className="flex items-center gap-4 p-4 border-b border-slate-700/50 bg-slate-800/80">
          <button 
            onClick={() => setView('before')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'before' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'
            }`}
          >
            Current Architecture
          </button>
          <button 
            onClick={() => setView('after')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'after' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'
            }`}
          >
            Suggested Architecture
          </button>
        </div>
      )}
      
      <div className="flex-1 bg-slate-900 relative">
        <ReactFlow
          key={`${view}-${styledNodes.length}-${styledEdges.length}`} 
          nodes={styledNodes}
          edges={styledEdges}
          fitView
          colorMode="dark"
        >
          <Controls className="!bg-slate-900 !border-slate-800 !text-white rounded-lg overflow-hidden" />
          <MiniMap 
            className="!bg-slate-900 !border-slate-800 rounded-lg overflow-hidden"
            nodeColor={(n) => {
              if (n.style?.background) return n.style.background;
              return '#0f172a';
            }} 
            maskColor="rgba(0, 0, 0, 0.6)"
          />
          <Background variant="dots" gap={12} size={1} color="#334155" />
        </ReactFlow>
        
        {view === 'before' && (
          <div className="absolute top-4 right-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-md">
            Showing issues (Red = Bottleneck/Costly)
          </div>
        )}
        {view === 'after' && hasBefore && (
          <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-md">
            Showing improvements (Green = Added/Optimised)
          </div>
        )}
        {view === 'after' && !hasBefore && (
          <div className="absolute top-4 right-4 bg-slate-850/80 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-md">
            Suggested Architecture Design
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonDiagram;
