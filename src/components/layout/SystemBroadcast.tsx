import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, Cpu, Globe } from 'lucide-react';

export default function SystemBroadcast() {
  const [status, setStatus] = useState<'CONNECTING' | 'SYNCED' | 'MAINTENANCE'>('CONNECTING');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const resp = await fetch('/api/health');
        if (resp.ok) setStatus('SYNCED');
      } catch (e) {
        setStatus('CONNECTING');
      }
    };
    const timer = setInterval(checkHealth, 5000);
    checkHealth();
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 px-3 py-1 rounded-full bg-white/5 border border-white/10">
      <div className="flex items-center gap-1.5">
          <motion.div 
            animate={{ scale: status === 'SYNCED' ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-1.5 h-1.5 rounded-full ${status === 'SYNCED' ? 'bg-[#34D399]' : 'bg-yellow-500'}`} 
          />
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
            {status}
          </span>
      </div>
      <div className="w-[1px] h-3 bg-white/10" />
      <div className="flex items-center gap-1.5">
          <Globe size={10} className="text-white/20" />
          <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">EU-WEST-2</span>
      </div>
    </div>
  );
}
