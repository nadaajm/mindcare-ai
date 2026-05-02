import React, { useState, useEffect } from 'react';
import { Cpu, Lock, Activity, Shield, RefreshCw, ChevronLeft, Search, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, limit, orderBy } from '../lib/firebase';
import { getDb, isFirebaseConfigured } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/error-handler';
import { analyzeSystemHealth } from '../lib/ai';

export default function Kernel() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'DATABASE' | 'MEMORY'>('CONSOLE');
  const [logs, setLogs] = useState<string[]>([]);
  const [integrity, setIntegrity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState<any>({ emotions: 0, journals: 0, appointments: 0 });

  useEffect(() => {
    initKernel();
  }, []);

  const initKernel = async () => {
    addLog("Initializing Neural Kernel v4.2.0...");
    addLog("Establishing cross-origin handshake...");
    
    try {
      if (!profile) return;
      const _db = getDb();
      if (!_db) { addLog("ERROR: Firebase kernel not initialized.", "error"); setLoading(false); return; }

      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();
      addLog(`Kernel Handshake: ${healthData.kernel} ${healthData.status}`);
      addLog(`Controller Layer: MVC Controller initialized [NeuralKernelController].`);

      const stats = { ...dbStats };
       const emotions = await getDocs(query(collection(_db, 'emotions'), where('userId', '==', profile.id), limit(50)));
       stats.emotions = emotions.docs.length;
      
       const journals = await getDocs(query(collection(_db, 'journals'), where('userId', '==', profile.id), limit(50)));
       stats.journals = journals.docs.length;

      setDbStats(stats);
      addLog(`Database indexed: ${stats.emotions} emotion nodes, ${stats.journals} reflection fragments found.`);

      const health = await analyzeSystemHealth({ stats, profile: { role: profile.role } });
      setIntegrity(health);
      addLog(`AI Integrity Scan: ${health.status} (${health.integrity}% coherence)`);
      
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'kernel_stats');
      addLog("ERROR: Data node synchronization failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const addLog = (msg: string, type: 'info' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs(prev => [`[${timestamp}] ${type === 'error' ? '!! ' : '>> '} ${msg}`, ...prev].slice(0, 50));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 min-h-screen pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="text-[#34D399]" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">System Shell</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tighter">Neural <span className="text-[#34D399]">Kernel</span>.</h1>
          <p className="text-white/40 text-xs font-mono max-w-xl">
            Low-level operational interface for psychological architectural management and data integrity.
          </p>
        </div>
        <div className="flex gap-2">
            {['CONSOLE', 'DATABASE', 'MEMORY'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "px-6 py-2 border font-mono text-[10px] font-bold tracking-widest transition-all",
                    activeTab === tab 
                        ? "bg-[#34D399] text-[#0A0A1F] border-[#34D399] shadow-[0_0_15px_rgba(52,211,153,0.3)]" 
                        : "text-white/40 border-white/5 hover:border-white/20"
                  )}
                >
                  {tab}
                </button>
            ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Terminal View */}
        <section className="lg:col-span-3 space-y-8">
           <div className="glass-panel border-white/5 bg-[#0A0A1F]/80 p-8 min-h-[500px] font-mono relative overflow-hidden flex flex-col">
              {/* Terminal Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                 <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                       <div className="w-2 h-2 rounded-full bg-red-500/50" />
                       <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                       <div className="w-2 h-2 rounded-full bg-green-500/50" />
                    </div>
                    <span className="text-[10px] text-white/20">root@serenity:~/psyche/{activeTab.toLowerCase()}</span>
                 </div>
                 <div className="flex items-center gap-4 text-[10px] text-white/30">
                    <span className="flex items-center gap-1"><Lock size={10} /> AES-256</span>
                    <span className="flex items-center gap-1"><Activity size={10} /> 4.2ms</span>
                 </div>
              </div>

              {/* Terminal Content */}
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                 <AnimatePresence mode="popLayout">
                    {activeTab === 'CONSOLE' ? (
                      logs.map((log, i) => (
                        <motion.div 
                          key={log + i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "text-xs leading-relaxed",
                            log.includes('!!') ? "text-red-400 font-bold" : 
                            log.includes('>>') ? "text-[#34D399]" : "text-white/60"
                          )}
                        >
                           <span className="opacity-40">{log.split(']')[0]}]</span>
                           <span className="ml-2">{log.split(']')[1]}</span>
                        </motion.div>
                      ))
                    ) : activeTab === 'DATABASE' ? (
                      <div className="space-y-8">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'EMOTION_NODES', val: dbStats.emotions, color: '#34D399' },
                                { label: 'REFL_FRAGMENTS', val: dbStats.journals, color: '#818CF8' },
                                { label: 'SYNC_EVENTS', val: dbStats.appointments, color: '#FCD34D' },
                                { label: 'KERN_UPTIME', val: '99.9%', color: '#A78BFA' }
                            ].map(s => (
                                <div key={s.label} className="p-4 bg-white/5 border border-white/5 rounded-sm">
                                   <div className="text-[9px] font-black text-white/20 mb-1">{s.label}</div>
                                   <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
                                </div>
                            ))}
                         </div>
                      </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
                                   <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} className="h-full bg-[#34D399] shadow-[0_0_10px_#34D399]" />
                                </div>
                                <span className="text-[10px] text-white/40">MEMORY_LOAD: 42%</span>
                            </div>
                        </div>
                    )}
                 </AnimatePresence>
              </div>
           </div>
        </section>

        {/* System Sidebar */}
        <aside className="space-y-8">
           <section className={cn(
              "glass-panel p-8 border-[#34D399]/20 transition-all",
              integrity?.status === 'STABLE' ? "bg-[#34D399]/5" : "bg-red-500/5 border-red-500/20"
           )}>
              <div className="flex items-center gap-2 mb-6">
                 <Shield size={16} className={integrity?.status === 'STABLE' ? "text-[#34D399]" : "text-red-500"} />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Integrity Core</h3>
              </div>
              
              {loading ? (
                 <div className="space-y-4 animate-pulse">
                    <div className="h-8 w-full bg-white/10 rounded" />
                    <div className="h-2 w-3/4 bg-white/10 rounded" />
                 </div>
              ) : integrity ? (
                 <div className="space-y-6">
                    <div>
                       <div className="text-4xl font-bold text-white mb-1">{integrity.integrity}%</div>
                       <div className="text-[10px] font-black text-[#34D399]">{integrity.status} PROTOCOL ACTIVE</div>
                    </div>
                    <div className="space-y-2 border-t border-white/5 pt-6">
                       <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">AI Diagnostics</div>
                       <p className="text-[10px] text-white/50 leading-relaxed italic">
                          "{integrity.recommendation}"
                       </p>
                    </div>
                 </div>
              ) : null}
           </section>
        </aside>
      </div>
    </div>
  );
}