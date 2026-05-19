import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Cloud, Layers, Cpu, Sparkles } from 'lucide-react';
import ChatBubble from './ChatBubble';
import api from '../../utils/api';

const ChatInterface = ({ onGenerate }) => {
  const [messages, setMessages] = useState([
    { text: "Hi! I'm Cloudy. Select your preferred Cloud Platform above, tell me what kind of app you want to build, and I will guide you with architecture recommendations!", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('AWS');
  const endOfMessagesRef = useRef(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { text: userMessage, isBot: false }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      // Call backend chat API to get high-fidelity dynamic suggestions & relevant questions from Gemini!
      const response = await api.post('/generate/chat', {
        message: userMessage,
        history: messages,
        platform: selectedPlatform
      });

      if (response.data && response.data.reply) {
        setMessages(prev => [...prev, { text: response.data.reply, isBot: true }]);
      } else {
        setMessages(prev => [...prev, { text: "I received an unexpected response. Feel free to explain your application topology or click Generate Architecture!", isBot: true }]);
      }
    } catch (err) {
      console.error("Chat API error:", err);
      // Clean fallback response
      setMessages(prev => [...prev, { 
        text: `Got it! Let's focus on designing this on ${selectedPlatform}. Tell me more details or click 'Generate Architecture' whenever you are ready!`, 
        isBot: true 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateClick = () => {
    const userPrompts = messages.filter(m => !m.isBot).map(m => m.text);
    const finalPrompt = userPrompts[userPrompts.length - 1] || "Web Application Architecture";
    // Invoke standard generation with full message context!
    onGenerate(finalPrompt, selectedPlatform, messages);
  };

  return (
    <div className="flex flex-col h-full glass-card rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl bg-slate-900/40">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-sm flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Cloudy AI Architect
        </h3>
        
        {messages.length > 1 && (
          <button
            onClick={handleGenerateClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-900/40 border border-indigo-400/30 transition-all transform hover:scale-105 active:scale-95 animate-pulse"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Diagram
          </button>
        )}
      </div>

      {/* Premium Platform Selector */}
      <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex flex-col gap-1.5">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select Cloud Provider:</p>
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {['AWS', 'GCP', 'Azure'].map((plat) => (
            <button
              key={plat}
              type="button"
              onClick={() => setSelectedPlatform(plat)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                selectedPlatform === plat
                  ? plat === 'AWS' 
                    ? 'bg-amber-600/90 text-white shadow-lg shadow-amber-900/20 border border-amber-500/30'
                    : plat === 'GCP'
                    ? 'bg-emerald-600/90 text-white shadow-lg shadow-emerald-900/20 border border-emerald-500/30'
                    : 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-900/20 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              {plat === 'AWS' && <Cloud className="w-3.5 h-3.5" />}
              {plat === 'GCP' && <Layers className="w-3.5 h-3.5" />}
              {plat === 'Azure' && <Cpu className="w-3.5 h-3.5" />}
              {plat}
            </button>
          ))}
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} message={msg.text} isBot={msg.isBot} />
        ))}
        {isTyping && (
          <div className="flex gap-4 mb-4">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-tl-sm w-16 flex items-center justify-center">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Form & Instant Actions */}
      <div className="p-4 bg-slate-800/50 border-t border-slate-700/50 flex flex-col gap-3">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask Cloudy about your ${selectedPlatform} system...`}
            className="w-full bg-slate-900 border border-slate-700 rounded-full pl-5 pr-12 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
            disabled={isTyping}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-full transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {messages.length > 1 && (
          <button
            onClick={handleGenerateClick}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 border border-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Sparkles className="w-4 h-4" />
            Generate Architecture & Cost Estimate Now
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
