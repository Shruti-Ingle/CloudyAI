import { motion } from 'framer-motion';

const PageWrapper = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`min-h-screen w-full bg-[#0f172a] text-slate-100 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
