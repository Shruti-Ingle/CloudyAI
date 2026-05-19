import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, Cpu, Database, Cloud, Globe, Shield, HardDrive, Trash2, Plus, GripVertical, ChevronLeft, ChevronRight
} from 'lucide-react';

const FlowDiagramInner = ({ nodes: propNodes = [], edges: propEdges = [], onDiagramChange }) => {
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);

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

  // Convert raw nodes to beautifully styled neon-glass components
  const styleRawNodes = useCallback((rawNodes) => {
    return rawNodes.map((node) => {
      const labelText = node.label || node.data?.label || 'Cloud Resource';
      const l = labelText.toLowerCase();

      let bg = 'rgba(15, 23, 42, 0.95)';
      let border = '2px solid rgba(71, 85, 105, 0.8)';
      let shadowColor = 'rgba(0, 0, 0, 0.4)';

      if (l.includes('client') || l.includes('frontend') || l.includes('user')) {
        bg = 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%)'; 
        border = '2px solid #a78bfa';
        shadowColor = 'rgba(167, 139, 250, 0.25)';
      } else if (l.includes('api') || l.includes('gateway') || l.includes('cdn') || l.includes('cloudfront')) {
        bg = 'linear-gradient(135deg, #0c4a6e 0%, #082f49 100%)'; 
        border = '2px solid #38bdf8';
        shadowColor = 'rgba(56, 189, 248, 0.25)';
      } else if (l.includes('lambda') || l.includes('compute') || l.includes('function') || l.includes('logic')) {
        bg = 'linear-gradient(135deg, #431407 0%, #2a0800 100%)'; 
        border = '2px solid #fb923c';
        shadowColor = 'rgba(251, 146, 60, 0.25)';
      } else if (l.includes('db') || l.includes('database') || l.includes('dynamodb') || l.includes('table') || l.includes('sql')) {
        bg = 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'; 
        border = '2px solid #34d399';
        shadowColor = 'rgba(52, 211, 153, 0.25)';
      } else if (l.includes('s3') || l.includes('bucket') || l.includes('storage')) {
        bg = 'linear-gradient(135deg, #4c0519 0%, #31040f 100%)'; 
        border = '2px solid #fb7185';
        shadowColor = 'rgba(251, 113, 133, 0.25)';
      } else if (l.includes('auth') || l.includes('cognito') || l.includes('security')) {
        bg = 'linear-gradient(135deg, #422006 0%, #201004 100%)'; 
        border = '2px solid #facc15';
        shadowColor = 'rgba(250, 204, 21, 0.25)';
      }

      return {
        id: node.id,
        type: 'default',
        position: node.position,
        label: labelText,
        data: {
          label: (
            <div className="flex items-center gap-3 py-1.5 px-1 select-none">
              <div className="flex-shrink-0 p-1.5 rounded-lg bg-slate-950/40 border border-slate-700/50">
                {getServiceIcon(labelText)}
              </div>
              <div className="text-left">
                <p className="font-bold text-white text-xs tracking-wide">{labelText}</p>
                <p className="text-[10px] text-slate-400 font-medium capitalize">
                  {node.type || 'Resource'}
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
          backdropFilter: 'blur(12px)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }
      };
    });
  }, []);

  // Update component states on initial generation
  useEffect(() => {
    if (!propNodes || propNodes.length === 0) return;
    
    // Scale coordinate spacing multiplier only once on primary load
    const scaledNodes = propNodes.map(n => ({
      ...n,
      position: {
        x: n.position?.x !== undefined ? n.position.x * 1.5 : Math.random() * 400 + 100,
        y: n.position?.y !== undefined ? n.position.y * 1.4 : Math.random() * 300 + 100,
      }
    }));

    const styledNodes = styleRawNodes(scaledNodes);
    const styledEdges = propEdges.map((edge) => {
      const strokeColor = '#38bdf8';
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
        }
      };
    });

    setNodes(styledNodes);
    setEdges(styledEdges);
  }, [propNodes, propEdges, styleRawNodes, setNodes, setEdges]);

  // Handle Drag Events
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const serviceType = event.dataTransfer.getData('application/reactflow');
      if (!serviceType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let labelText = 'Cloud Resource';
      if (serviceType === 'api') labelText = 'CloudFront / API Gateway';
      if (serviceType === 'compute') labelText = 'Lambda Logic Compute';
      if (serviceType === 'db') labelText = 'DynamoDB / SQL Store';
      if (serviceType === 's3') labelText = 'S3 Assets Storage';
      if (serviceType === 'auth') labelText = 'Cognito IAM Authority';

      const rawNewNode = {
        id: `node_${Date.now()}`,
        type: 'default',
        position,
        label: labelText,
      };

      const styledNewNode = styleRawNodes([rawNewNode])[0];

      setNodes((nds) => {
        const nextNodes = nds.concat(styledNewNode);
        if (onDiagramChange) {
          onDiagramChange(
            nextNodes.map(n => ({ id: n.id, position: n.position, label: n.label })),
            edges
          );
        }
        return nextNodes;
      });
    },
    [screenToFlowPosition, styleRawNodes, edges, onDiagramChange, setNodes]
  );

  // Connection added manually
  const onConnect = useCallback(
    (params) => {
      const strokeColor = '#38bdf8';
      const newEdge = {
        ...params,
        id: `edge_${Date.now()}`,
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
        }
      };

      setEdges((eds) => {
        const nextEdges = addEdge(newEdge, eds);
        if (onDiagramChange) {
          onDiagramChange(
            nodes.map(n => ({ id: n.id, position: n.position, label: n.label })),
            nextEdges
          );
        }
        return nextEdges;
      });
    },
    [nodes, setEdges, onDiagramChange]
  );

  // Notify parent on manual node drag stop (sync positions!)
  const onNodeDragStop = useCallback(
    (event, node) => {
      if (onDiagramChange) {
        onDiagramChange(
          nodes.map(n => n.id === node.id ? { ...n, position: node.position } : { id: n.id, position: n.position, label: n.label }),
          edges
        );
      }
    },
    [nodes, edges, onDiagramChange]
  );

  // Node and Edge clicking selectors
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Handle deletions of selected resource
  const handleDeleteSelected = useCallback(() => {
    if (!selectedNodeId) return;

    const nextNodes = nodes.filter((n) => n.id !== selectedNodeId);
    const nextEdges = edges.filter(
      (e) => e.source !== selectedNodeId && e.target !== selectedNodeId
    );

    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeId(null);

    if (onDiagramChange) {
      onDiagramChange(
        nextNodes.map(n => ({ id: n.id, position: n.position, label: n.label })),
        nextEdges
      );
    }
  }, [selectedNodeId, nodes, edges, onDiagramChange, setNodes, setEdges]);

  // Sidebar Palette item
  const DragItem = ({ type, label, icon: Icon, color }) => (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      className="flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700/80 rounded-xl cursor-grab active:cursor-grabbing transition-all select-none group"
    >
      <div className={`p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-${color}-400 group-hover:scale-105 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-bold text-white">{label}</p>
        <p className="text-[10px] text-slate-500 font-medium">Drag to Canvas</p>
      </div>
      <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
    </div>
  );

  return (
    <div className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative flex shadow-inner">
      {/* Draggable Cloud Resource Sidebar Palette */}
      <AnimatePresence initial={false}>
        {isPaletteOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '250px', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full border-r border-slate-800 bg-slate-950/90 backdrop-blur-md p-4 flex flex-col gap-3 relative z-30 select-none overflow-y-auto shrink-0"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Resource Palette</h4>
              <button 
                onClick={() => setIsPaletteOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                title="Collapse Palette"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            
            <DragItem type="api" label="API Gateway / CDN" icon={Cloud} color="sky" />
            <DragItem type="compute" label="Lambda Compute" icon={Cpu} color="orange" />
            <DragItem type="db" label="RDS / NoSQL DB" icon={Database} color="emerald" />
            <DragItem type="s3" label="S3 Asset Bucket" icon={HardDrive} color="rose" />
            <DragItem type="auth" label="Cognito IAM Security" icon={Shield} color="yellow" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand Palette Button when collapsed */}
      {!isPaletteOpen && (
        <button
          onClick={() => setIsPaletteOpen(true)}
          className="absolute top-4 left-4 z-30 p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl shadow-lg backdrop-blur-md transition-all flex items-center justify-center"
          title="Expand Resource Palette"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Main Canvas Workspace */}
      <div 
        className="flex-1 h-full relative"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Floating Toolbars */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {selectedNodeId && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-right-3 duration-200"
              title="Delete Selected Cloud Resource"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
          )}

          <div className="bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur-md shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Interactive Cloud Canvas
            </p>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          colorMode="dark"
          minZoom={0.2}
          maxZoom={1.5}
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
          <Background variant="dots" gap={18} size={1.2} color="#1e293b" />
        </ReactFlow>
      </div>
    </div>
  );
};

const FlowDiagram = (props) => (
  <ReactFlowProvider>
    <FlowDiagramInner {...props} />
  </ReactFlowProvider>
);

export default FlowDiagram;
