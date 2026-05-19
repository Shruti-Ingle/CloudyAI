import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { 
  Server, Cpu, Database, Cloud, Layout, Globe, ArrowRight, Shield, HardDrive
} from 'lucide-react';

const FlowDiagram = ({ nodes: propNodes = [], edges: propEdges = [] }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const getServiceIcon = (label = '') => {
    const l = label.toLowerCase();
    if (l.includes('client') || l.includes('frontend') || l.includes('user') || l.includes('dns') || l.includes('53') || l.includes('domain')) {
      return <Globe className="w-5 h-5 text-indigo-400" />;
    }
    if (l.includes('api') || l.includes('gateway') || l.includes('cdn') || l.includes('cloudfront') || l.includes('balancer') || l.includes('alb')) {
      return <Cloud className="w-5 h-5 text-sky-400" />;
    }
    if (l.includes('lambda') || l.includes('compute') || l.includes('function') || l.includes('run') || l.includes('logic')) {
      return <Cpu className="w-5 h-5 text-orange-400" />;
    }
    if (l.includes('db') || l.includes('database') || l.includes('dynamodb') || l.includes('sql') || l.includes('table') || l.includes('postgres') || l.includes('nosql')) {
      return <Database className="w-5 h-5 text-emerald-400" />;
    }
    if (l.includes('s3') || l.includes('bucket') || l.includes('storage') || l.includes('blob')) {
      return <HardDrive className="w-5 h-5 text-rose-400" />;
    }
    if (l.includes('auth') || l.includes('cognito') || l.includes('iam') || l.includes('security')) {
      return <Shield className="w-5 h-5 text-yellow-400" />;
    }
    return <Server className="w-5 h-5 text-indigo-400" />;
  };

  useEffect(() => {
    if (!propNodes || propNodes.length === 0) return;

    // Apply premium styling and spacing multiplier to prevent overlap
    const styledNodes = propNodes.map((node) => {
      const labelText = node.data?.label || node.label || 'Cloud Resource';
      const l = labelText.toLowerCase();

      let bg = 'rgba(15, 23, 42, 0.95)'; // dark slate
      let border = '2px solid rgba(71, 85, 105, 0.8)'; // slate-600
      let shadowColor = 'rgba(0, 0, 0, 0.4)';

      if (l.includes('client') || l.includes('frontend') || l.includes('user')) {
        bg = 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%)'; 
        border = '2px solid #a78bfa'; // light purple
        shadowColor = 'rgba(167, 139, 250, 0.25)';
      } else if (l.includes('api') || l.includes('gateway') || l.includes('cdn') || l.includes('cloudfront')) {
        bg = 'linear-gradient(135deg, #0c4a6e 0%, #082f49 100%)'; 
        border = '2px solid #38bdf8'; // light sky
        shadowColor = 'rgba(56, 189, 248, 0.25)';
      } else if (l.includes('lambda') || l.includes('compute') || l.includes('function') || l.includes('logic')) {
        bg = 'linear-gradient(135deg, #431407 0%, #2a0800 100%)'; 
        border = '2px solid #fb923c'; // light orange
        shadowColor = 'rgba(251, 146, 60, 0.25)';
      } else if (l.includes('db') || l.includes('database') || l.includes('dynamodb') || l.includes('table') || l.includes('sql')) {
        bg = 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'; 
        border = '2px solid #34d399'; // light emerald
        shadowColor = 'rgba(52, 211, 153, 0.25)';
      } else if (l.includes('s3') || l.includes('bucket') || l.includes('storage')) {
        bg = 'linear-gradient(135deg, #4c0519 0%, #31040f 100%)'; 
        border = '2px solid #fb7185'; // light rose
        shadowColor = 'rgba(251, 113, 133, 0.25)';
      } else if (l.includes('auth') || l.includes('cognito') || l.includes('security')) {
        bg = 'linear-gradient(135deg, #422006 0%, #201004 100%)'; 
        border = '2px solid #facc15'; // light yellow
        shadowColor = 'rgba(250, 204, 21, 0.25)';
      }

      // Generously space out positions: Multiply coordinates to scale up visual layout
      const posX = (node.position?.x !== undefined ? node.position.x : 200) * 1.5;
      const posY = (node.position?.y !== undefined ? node.position.y : 100) * 1.4;

      return {
        ...node,
        position: { x: posX, y: posY },
        data: {
          ...node.data,
          label: (
            <div className="flex items-center gap-3 py-1.5 px-1">
              <div className="flex-shrink-0 p-1.5 rounded-lg bg-slate-950/40 border border-slate-700/50">
                {getServiceIcon(labelText)}
              </div>
              <div className="text-left">
                <p className="font-bold text-white text-xs tracking-wide">{labelText}</p>
                <p className="text-[10px] text-slate-400 font-medium capitalize">
                  {node.type || 'Service'}
                </p>
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
          backdropBlur: '12px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }
      };
    });

    const styledEdges = propEdges.map((edge) => {
      // Pick a beautiful color line (default to indigo/sky neon blend)
      const strokeColor = '#38bdf8'; // Clean Sky Cyan
      
      return {
        ...edge,
        animated: true,
        type: 'smoothstep',
        style: {
          stroke: strokeColor,
          strokeWidth: 3,
          strokeDasharray: '6',
          animationDuration: '25s',
          filter: 'drop-shadow(0px 0px 4px rgba(56, 189, 248, 0.4))'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: strokeColor,
        },
        labelStyle: { fill: '#94a3b8', fontWeight: 600, fontSize: '10px' },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#0f172a', color: '#fff', fillOpacity: 0.85 }
      };
    });

    setNodes(styledNodes);
    setEdges(styledEdges);
  }, [propNodes, propEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative flex-1 shadow-inner"
    >
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full backdrop-blur-md">
        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          Live Visualizer Active
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        colorMode="dark"
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Controls className="!bg-slate-900 !border-slate-800 !text-white rounded-lg overflow-hidden animate-fade-in" />
        <MiniMap 
          className="!bg-slate-900 !border-slate-800 rounded-lg overflow-hidden"
          nodeColor={(n) => {
            if (n.style?.background) return n.style.background;
            return '#0f172a';
          }} 
          maskColor="rgba(0, 0, 0, 0.6)"
        />
        <Background variant="dots" gap={18} size={1.2} color="#1e293b" />
      </ReactFlow>
    </motion.div>
  );
};

export default FlowDiagram;
