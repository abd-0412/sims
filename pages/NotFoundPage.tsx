import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8 text-center relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-rose-500/5 rounded-full blur-[140px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl relative z-10"
      >
        <h1 className="text-[180px] font-black text-slate-900/5 leading-none mb-4 select-none italic">404</h1>
        
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 bg-rose-50 text-rose-600 px-6 py-2 rounded-full border border-rose-100 mb-4">
             <i className="fa-solid fa-triangle-exclamation text-xs"></i>
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Protocol Violation</span>
          </div>
          
          <h2 className="text-5xl font-black text-slate-950 uppercase tracking-tighter italic">Sector Not Found</h2>
          <p className="text-slate-500 font-bold text-lg max-w-md mx-auto leading-relaxed">
            The logical sector you are attempting to access does not exist in the current terminal map or your clearance has been revoked.
          </p>

          <div className="pt-10">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-4 bg-slate-950 hover:bg-indigo-600 text-white font-black py-6 px-12 rounded-[32px] shadow-2xl transition-all active:scale-95 uppercase tracking-widest text-[11px]"
            >
              <i className="fa-solid fa-microchip text-lg"></i>
              Return to Intelligence Hub
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
