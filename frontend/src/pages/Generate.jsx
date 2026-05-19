import { useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import ChatInterface from '../components/cloudy/ChatInterface';
import FlowDiagram from '../components/architecture/FlowDiagram';
import { motion, AnimatePresence } from 'framer-motion';

const Generate = () => {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState('diagram');

  const handleGenerate = (prompt) => {
    // In a real app, send prompt to backend
    setHasGenerated(true);
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
        {hasGenerated && (
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
              >
                Diagram View
              </button>
              <button 
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'
                }`}
              >
                JSON View
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-hidden relative">
              {activeTab === 'diagram' ? (
                <FlowDiagram />
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full bg-slate-900 rounded-xl p-4 overflow-auto text-sm text-green-400 font-mono border border-slate-700/50"
                >
                  <pre>
{`{
  "name": "Generated Architecture",
  "platform": "AWS",
  "components": [
    {
      "id": "client",
      "type": "WebClient",
      "framework": "React"
    },
    {
      "id": "api",
      "type": "APIGateway"
    },
    {
      "id": "lambda",
      "type": "Compute",
      "service": "AWS Lambda"
    },
    {
      "id": "db",
      "type": "Database",
      "service": "DynamoDB"
    },
    {
      "id": "s3",
      "type": "Storage",
      "service": "S3"
    }
  ],
  "connections": [
    { "source": "client", "target": "api" },
    { "source": "api", "target": "lambda" },
    { "source": "lambda", "target": "db" },
    { "source": "lambda", "target": "s3" }
  ]
}`}
                  </pre>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default Generate;
