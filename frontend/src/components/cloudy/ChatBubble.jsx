import { motion } from 'framer-motion';
import CloudyAvatar from './CloudyAvatar';

const ChatBubble = ({ message, isBot }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-4 mb-4 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {isBot && (
        <div className="flex-shrink-0 mt-1">
          <CloudyAvatar />
        </div>
      )}
      
      <div 
        className={`max-w-[80%] p-4 rounded-2xl ${
          isBot 
            ? 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm' 
            : 'bg-indigo-600 text-white rounded-tr-sm shadow-lg'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
};

export default ChatBubble;
