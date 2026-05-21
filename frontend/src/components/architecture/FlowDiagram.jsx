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
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, Cpu, Database, Cloud, Globe, Shield, HardDrive, Trash2, Plus, GripVertical, ChevronLeft, ChevronRight, Settings, Info, Sliders, Check
} from 'lucide-react';

const FlowDiagramInner = ({ nodes: propNodes = [], edges: propEdges = [], onDiagramChange }) => {
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [inspectorNode, setInspectorNode] = useState(null);

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

  // Helper to initialize properties for a node
  const getNodeProperties = useCallback((node) => {
    if (node.properties) return node.properties;
    
    const label = (node.label || '').toLowerCase();
    if (label.includes('client') || label.includes('frontend') || label.includes('user')) {
      return { type: 'client' };
    }
    if (label.includes('api') || label.includes('gateway') || label.includes('cdn') || label.includes('cloudfront')) {
      return { type: 'api', requests: 2 }; // default 2 million requests
    }
    if (label.includes('lambda') || label.includes('compute') || label.includes('function') || label.includes('logic')) {
      return { type: 'compute', size: 't3.medium' }; // default size
    }
    if (label.includes('db') || label.includes('database') || label.includes('dynamodb') || label.includes('table') || label.includes('sql')) {
      return { type: 'db', size: 'db.t3.medium', replicas: 1, multiAZ: false };
    }
    if (label.includes('s3') || label.includes('bucket') || label.includes('storage')) {
      return { type: 's3', capacity: 150, glacier: false }; // default 150GB
    }
    if (label.includes('auth') || label.includes('cognito') || label.includes('security')) {
      return { type: 'auth', users: 10 }; // default 10k users
    }
    return { type: 'other' };
  }, []);

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

      const nodeProps = getNodeProperties(node);

      return {
        id: node.id,
        type: 'default',
        position: node.position,
        label: labelText,
        properties: nodeProps,
        data: {
          label: (
            <div className="flex flex-col gap-1 py-1 px-0.5 select-none">
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
              
              {/* Micro specs indicator */}
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/40 text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                <span>Specs</span>
                <span className="text-indigo-400">
                  {nodeProps.type === 'compute' && nodeProps.size}
                  {nodeProps.type === 'db' && `${nodeProps.size} (x${nodeProps.replicas})`}
                  {nodeProps.type === 's3' && `${nodeProps.capacity} GB`}
                  {nodeProps.type === 'api' && `${nodeProps.requests}M reqs`}
                  {nodeProps.type === 'auth' && `${nodeProps.users}k users`}
                  {nodeProps.type === 'client' && 'Web app'}
                  {nodeProps.type === 'other' && 'Standard'}
                </span>
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
  }, [getNodeProperties]);

  // Update component states on initial generation
  useEffect(() => {
    if (!propNodes || propNodes.length === 0) return;

    // Check if these nodes are already the ones currently displayed in state
    // to avoid infinite re-render loops and repeated scaling.
    const currentIds = nodes.map(n => n.id).sort().join(',');
    const incomingIds = propNodes.map(n => n.id).sort().join(',');
    
    if (currentIds === incomingIds && nodes.length > 0) {
      // If properties or label changed, update them without changing position coordinates
      let changed = false;
      const updatedNodes = nodes.map(localNode => {
        const matchingPropNode = propNodes.find(pn => pn.id === localNode.id);
        if (matchingPropNode) {
          const newProps = matchingPropNode.properties || localNode.properties;
          const newLabel = matchingPropNode.label || matchingPropNode.data?.label || localNode.label;
          if (JSON.stringify(localNode.properties) !== JSON.stringify(newProps) || localNode.label !== newLabel) {
            changed = true;
            return {
              ...localNode,
              label: newLabel,
              properties: newProps,
              data: {
                ...localNode.data,
                label: styleRawNodes([matchingPropNode])[0].data.label
              }
            };
          }
        }
        return localNode;
      });
      
      if (changed) {
        setNodes(updatedNodes);
      }
      return;
    }
    
    // Check if the incoming nodes are already styled/initialized (meaning they came from loaded history)
    const isFromSavedHistory = propNodes.some(n => n.properties !== undefined && n.properties.type !== undefined);
    
    // Scale coordinate spacing multiplier only once on primary load
    const scaledNodes = propNodes.map(n => {
      let x = n.position?.x;
      let y = n.position?.y;
      
      if (x === undefined) x = Math.random() * 400 + 100;
      if (y === undefined) y = Math.random() * 300 + 100;
      
      if (!isFromSavedHistory) {
        x = x * 1.5;
        y = y * 1.4;
      }
      
      return {
        ...n,
        position: { x, y }
      };
    });

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
  }, [propNodes, propEdges, styleRawNodes, setNodes, setEdges, nodes]);

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
            nextNodes.map(n => ({ id: n.id, position: n.position, label: n.label, properties: n.properties })),
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
            nodes.map(n => ({ id: n.id, position: n.position, label: n.label, properties: n.properties })),
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
          nodes.map(n => n.id === node.id ? { ...n, position: node.position } : { id: n.id, position: n.position, label: n.label, properties: n.properties }),
          edges
        );
      }
    },
    [nodes, edges, onDiagramChange]
  );

  // Node and Edge clicking selectors
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
    setInspectorNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setInspectorNode(null);
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
    setInspectorNode(null);

    if (onDiagramChange) {
      onDiagramChange(
        nextNodes.map(n => ({ id: n.id, position: n.position, label: n.label, properties: n.properties })),
        nextEdges
      );
    }
  }, [selectedNodeId, nodes, edges, onDiagramChange, setNodes, setEdges]);

  // Handle Inspector Property adjustments
  const handlePropertyChange = (key, value) => {
    if (!inspectorNode) return;

    const updatedProps = {
      ...inspectorNode.properties,
      [key]: value
    };

    const nextNodes = nodes.map((node) => {
      if (node.id === inspectorNode.id) {
        const rawNode = {
          ...node,
          properties: updatedProps
        };
        // Re-style updated node to reflect live specs changes
        return styleRawNodes([rawNode])[0];
      }
      return node;
    });

    setNodes(nextNodes);
    const updatedNode = nextNodes.find(n => n.id === inspectorNode.id);
    setInspectorNode(updatedNode);

    if (onDiagramChange) {
      onDiagramChange(
        nextNodes.map(n => ({ id: n.id, position: n.position, label: n.label, properties: n.properties })),
        edges
      );
    }
  };

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
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-Outfit">Resource Palette</h4>
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
            <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider font-Outfit">
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

      {/* Sliding Inspector Drawer on Right */}
      <AnimatePresence>
        {inspectorNode && inspectorNode.properties && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full w-80 border-l border-slate-800 bg-slate-950/95 backdrop-blur-md p-5 flex flex-col gap-4 relative z-35 select-none overflow-y-auto shrink-0 font-Outfit"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Specs Inspector
              </h4>
              <button 
                onClick={() => setInspectorNode(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* General Info Card */}
            <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex flex-col gap-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Resource</p>
              <h5 className="text-sm font-extrabold text-white">{inspectorNode.label}</h5>
              <p className="text-[10px] text-indigo-400 font-medium capitalize mt-0.5">
                ID: {inspectorNode.id}
              </p>
            </div>

            {/* Custom Interactive Inputs based on type */}
            <div className="flex-1 flex flex-col gap-5 pt-2">
              {/* 1. Compute Node Inspector */}
              {inspectorNode.properties.type === 'compute' && (
                <div className="flex flex-col gap-3">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Server Capacity Size</label>
                  <select
                    value={inspectorNode.properties.size}
                    onChange={(e) => handlePropertyChange('size', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                  >
                    <option value="t3.micro">t3.micro (Serverless Basic - $8.50)</option>
                    <option value="t3.medium">t3.medium (Standard Serverless - $18.00)</option>
                    <option value="c6g.large">c6g.large (High Compute - $38.00)</option>
                  </select>
                  <div className="p-3 bg-slate-900/30 rounded-xl flex items-start gap-2 border border-slate-850">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Standard micro-compute is optimized for low-latency triggers. Higher tiers are designed for multi-threading operations.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Database Node Inspector */}
              {inspectorNode.properties.type === 'db' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Database Size</label>
                    <select
                      value={inspectorNode.properties.size}
                      onChange={(e) => handlePropertyChange('size', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                    >
                      <option value="db.t3.micro">db.t3.micro (Basic DB - $15.00)</option>
                      <option value="db.t3.medium">db.t3.medium (Standard DB - $32.00)</option>
                      <option value="db.m6g.large">db.m6g.large (Enterprise DB - $68.00)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Replicas Capacity</label>
                      <span className="text-xs font-bold text-emerald-400">{inspectorNode.properties.replicas} Node(s)</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={inspectorNode.properties.replicas}
                      onChange={(e) => handlePropertyChange('replicas', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-850 rounded-xl">
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">Multi-AZ Clustering</p>
                      <p className="text-[10px] text-slate-500">Enable high-availability redundancy</p>
                    </div>
                    <button
                      onClick={() => handlePropertyChange('multiAZ', !inspectorNode.properties.multiAZ)}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 focus:outline-none ${
                        inspectorNode.properties.multiAZ ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                        inspectorNode.properties.multiAZ ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Storage Node Inspector */}
              {inspectorNode.properties.type === 's3' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Capacity Limit</label>
                      <span className="text-xs font-bold text-rose-400">{inspectorNode.properties.capacity} GB</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="1000"
                      step="50"
                      value={inspectorNode.properties.capacity}
                      onChange={(e) => handlePropertyChange('capacity', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-850 rounded-xl">
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">Glacier Deep Archiving</p>
                      <p className="text-[10px] text-slate-500">Auto-transition old object assets</p>
                    </div>
                    <button
                      onClick={() => handlePropertyChange('glacier', !inspectorNode.properties.glacier)}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 focus:outline-none ${
                        inspectorNode.properties.glacier ? 'bg-rose-500' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                        inspectorNode.properties.glacier ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* 4. API Gateway Node Inspector */}
              {inspectorNode.properties.type === 'api' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Request Volume</label>
                    <span className="text-xs font-bold text-sky-400">{inspectorNode.properties.requests}M / mo</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={inspectorNode.properties.requests}
                    onChange={(e) => handlePropertyChange('requests', parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Estimated bandwidth costs are scaled per million ingress trigger calls. CDNs feature auto-caching layers.
                  </p>
                </div>
              )}

              {/* 5. IAM Security/Auth Node Inspector */}
              {inspectorNode.properties.type === 'auth' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Users (MAU)</label>
                    <span className="text-xs font-bold text-yellow-400">{inspectorNode.properties.users}K / mo</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={inspectorNode.properties.users}
                    onChange={(e) => handlePropertyChange('users', parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                </div>
              )}

              {/* 6. Static Client */}
              {inspectorNode.properties.type === 'client' && (
                <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl flex flex-col gap-2 text-center items-center">
                  <Globe className="w-8 h-8 text-indigo-400 mb-1 animate-pulse" />
                  <p className="text-xs font-bold text-white">DNS Domain Edge Host</p>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    This represents your user's ingress device client. It features free static edge hosting on standard CDN proxies.
                  </p>
                </div>
              )}
            </div>

            {/* Save indicator footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Configuration Autosaved Live
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FlowDiagram = (props) => (
  <ReactFlowProvider>
    <FlowDiagramInner {...props} />
  </ReactFlowProvider>
);

export default FlowDiagram;
