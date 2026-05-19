import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import ChatBubble from './ChatBubble';

const ChatInterface = ({ onGenerate }) => {
  const [messages, setMessages] = useState([
    { text: "Hi! I'm Cloudy. What kind of app are you building today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setInput('');
    setIsTyping(true);

    // Mock Cloudy AI Logic
    setTimeout(() => {
      if (messages.length === 1) {
        setMessages(prev => [...prev, { text: "Sounds interesting! How many users do you expect initially, and what is your target region?", isBot: true }]);
        setIsTyping(false);
      } else {
        setMessages(prev => [...prev, { text: "Got it. I have enough information. I'll generate the architecture for you now.", isBot: true }]);
        setIsTyping(false);
        onGenerate(userMessage);
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full glass-card rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl bg-slate-900/40">
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-sm flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Cloudy AI
        </h3>
      </div>
      
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

      <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your app..."
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
      </div>
    </div>
  );
};

export default ChatInterface;
