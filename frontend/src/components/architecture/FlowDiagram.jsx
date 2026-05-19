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

// Initial Mock Architecture Data
const initialNodes = [
  { id: 'client', position: { x: 250, y: 50 }, data: { label: 'Web Client (React)' }, style: { background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
  { id: 'api', position: { x: 250, y: 150 }, data: { label: 'API Gateway' }, style: { background: '#06B6D4', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
  { id: 'lambda', position: { x: 250, y: 250 }, data: { label: 'AWS Lambda (Backend)' }, style: { background: '#F59E0B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
  { id: 'db', position: { x: 150, y: 350 }, data: { label: 'DynamoDB' }, style: { background: '#10B981', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
  { id: 's3', position: { x: 350, y: 350 }, data: { label: 'S3 Bucket (Assets)' }, style: { background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
];

const initialEdges = [
  { id: 'e1-2', source: 'client', target: 'api', animated: true, style: { stroke: '#4F46E5' } },
  { id: 'e2-3', source: 'api', target: 'lambda', animated: true, style: { stroke: '#06B6D4' } },
  { id: 'e3-4', source: 'lambda', target: 'db', animated: true, style: { stroke: '#F59E0B' } },
  { id: 'e3-5', source: 'lambda', target: 's3', animated: true, style: { stroke: '#EF4444' } },
];

const FlowDiagram = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700/50"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        colorMode="dark"
      >
        <Controls />
        <MiniMap nodeStrokeColor={(n) => {
          if (n.style?.background) return n.style.background;
          return '#eee';
        }} nodeColor={(n) => {
          if (n.style?.background) return n.style.background;
          return '#fff';
        }} />
        <Background variant="dots" gap={12} size={1} color="#334155" />
      </ReactFlow>
    </motion.div>
  );
};

export default FlowDiagram;
