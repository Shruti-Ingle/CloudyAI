import { motion } from 'framer-motion';

const CloudyAvatar = ({ isThinking = false, isTyping = false }) => {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <motion.div
        className="absolute w-full h-full bg-white rounded-full shadow-lg border-2 border-indigo-100 flex items-center justify-center overflow-hidden"
        animate={
          isThinking 
            ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] } 
            : { scale: [1, 1.05, 1] }
        }
        transition={{
          duration: isThinking ? 1 : 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Simple Cloud Face */}
        <div className="relative w-full h-full">
          {/* Eyes */}
          <div className="absolute top-4 left-3 w-1.5 h-2 bg-slate-800 rounded-full"></div>
          <div className="absolute top-4 right-3 w-1.5 h-2 bg-slate-800 rounded-full"></div>
          
          {/* Mouth */}
          <motion.div 
            className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3 h-1.5 border-b-2 border-slate-800 rounded-full"
            animate={isTyping ? { height: [1.5, 3, 1.5] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </div>
      </motion.div>
      
      {/* Decorative Cloud Bumps */}
      <div className="absolute -top-1 -left-1 w-6 h-6 bg-white rounded-full border-t-2 border-l-2 border-indigo-100 z-[-1]"></div>
      <div className="absolute -top-2 right-1 w-7 h-7 bg-white rounded-full border-t-2 border-r-2 border-indigo-100 z-[-1]"></div>
    </div>
  );
};

export default CloudyAvatar;
