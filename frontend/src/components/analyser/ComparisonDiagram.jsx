import { useState, useCallback } from 'react';
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

// Mock Before Data
const initialNodesBefore = [
  { id: 'client', position: { x: 250, y: 50 }, data: { label: 'Web Client' }, style: { background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
  { id: 'ec2', position: { x: 250, y: 150 }, data: { label: 'EC2 Server (Monolith)' }, style: { background: '#EF4444', color: '#fff', border: '2px solid #991B1B', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
  { id: 'rds', position: { x: 250, y: 250 }, data: { label: 'RDS Database' }, style: { background: '#10B981', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
];

const initialEdgesBefore = [
  { id: 'e1-2', source: 'client', target: 'ec2', style: { stroke: '#EF4444', strokeWidth: 2 } },
  { id: 'e2-3', source: 'ec2', target: 'rds', style: { stroke: '#475569' } },
];

// Mock After Data
const initialNodesAfter = [
  { id: 'client', position: { x: 250, y: 50 }, data: { label: 'Web Client' }, style: { background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
  { id: 'api', position: { x: 250, y: 150 }, data: { label: 'API Gateway' }, style: { background: '#06B6D4', color: '#fff', border: '2px solid #164E63', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
  { id: 'lambda', position: { x: 250, y: 250 }, data: { label: 'Lambda (Serverless)' }, style: { background: '#10B981', color: '#fff', border: '2px solid #065F46', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
  { id: 'rds', position: { x: 250, y: 350 }, data: { label: 'RDS Database' }, style: { background: '#10B981', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
];

const initialEdgesAfter = [
  { id: 'e1-2', source: 'client', target: 'api', animated: true, style: { stroke: '#06B6D4' } },
  { id: 'e2-3', source: 'api', target: 'lambda', animated: true, style: { stroke: '#10B981' } },
  { id: 'e3-4', source: 'lambda', target: 'rds', style: { stroke: '#475569' } },
];

const ComparisonDiagram = () => {
  const [view, setView] = useState('after');
  
  const nodes = view === 'after' ? initialNodesAfter : initialNodesBefore;
  const edges = view === 'after' ? initialEdgesAfter : initialEdgesBefore;

  return (
    <div className="w-full h-full flex flex-col">
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
      
      <div className="flex-1 bg-slate-900 relative">
        <ReactFlow
          key={view} // force re-render on view change to reset viewport
          nodes={nodes}
          edges={edges}
          fitView
          colorMode="dark"
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} color="#334155" />
        </ReactFlow>
        
        {view === 'before' && (
          <div className="absolute top-4 right-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-md">
            Showing issues (Red = Bottleneck/Costly)
          </div>
        )}
        {view === 'after' && (
          <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-md">
            Showing improvements (Green = Added/Optimised)
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonDiagram;
