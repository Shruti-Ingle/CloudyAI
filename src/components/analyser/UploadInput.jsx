import { useState } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

const UploadInput = ({ onUpload }) => {
  const [activeTab, setActiveTab] = useState('paste');
  const [jsonText, setJsonText] = useState('');

  const handlePasteSubmit = (e) => {
    e.preventDefault();
    if (jsonText.trim()) {
      onUpload(jsonText);
    }
  };

  return (
    <div className="w-full glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="flex border-b border-slate-700/50 bg-slate-800/50">
        <button 
          onClick={() => setActiveTab('paste')}
          className={`flex-1 py-4 font-medium transition-colors ${activeTab === 'paste' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" /> Paste JSON
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-4 font-medium transition-colors ${activeTab === 'upload' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <UploadCloud className="w-4 h-4" /> Upload Diagram
          </div>
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'paste' ? (
          <form onSubmit={handlePasteSubmit}>
            <textarea 
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste your architecture JSON here..."
              className="w-full h-48 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all mb-4 resize-none"
            />
            <button 
              type="submit" 
              disabled={!jsonText.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-semibold transition-all"
            >
              Analyse Architecture
            </button>
          </form>
        ) : (
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8 text-indigo-400" />
            </div>
            <h4 className="text-white font-medium text-lg mb-2">Click or drag file to upload</h4>
            <p className="text-slate-400 text-sm max-w-sm mb-6">Supports PDF, PNG, or JPEG diagrams. CloudyAI will extract the components automatically.</p>
            <button 
              onClick={() => onUpload('mock_upload_trigger')}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-colors"
            >
              Select File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadInput;
