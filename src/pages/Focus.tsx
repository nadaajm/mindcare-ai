import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RefreshCw, Sparkles, ChevronLeft, ShieldCheck, Activity, Clock, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getDb, collection, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/error-handler';

const PATTERNS = [
  { id: 'box', name: 'Neural Box', description: '4s In • 4s Hold • 4s Out • 4s Hold', duration: 16 },
  { id: '478', name: 'Deep Release', description: '4s In • 7s Hold • 8s Out', duration: 19 },
  { id: 'calm', name: 'Coherence', description: '5s In • 5s Out', duration: 10 },
];

interface FocusSession {
  id: string;
  userId: string;
  patternId: string;
  patternName: string;
  duration: number; // seconds
  startTime: number;
  endTime: number;
  createdAt: any;
}

export default function Focus() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [stats, setStats] = useState({ count: 0, avgDuration: 0, patternUsage: {} as Record<string, number> });
  const [isActive, setIsActive] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(PATTERNS[0]);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Rest');
  const [timer, setTimer] = useState(0);
  const [sessionStart, setSessionStart] = useState(0);
  const startTimeRef = useRef(0);

  // Load focus sessions stats
  useEffect(() => {
    if (!profile) return;
    const _db = getDb();
    const q = query(
      collection(_db, 'focus_sessions'),
      where('userId', '==', profile.id),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as FocusSession));
      setSessions(data);
      const count = data.length;
      const totalDur = data.reduce((sum, s) => sum + s.duration, 0);
      const avgDur = count > 0 ? Math.round(totalDur / count / 60) : 0; // minutes
      const usage = data.reduce((acc, s) => {
        acc[s.patternId] = (acc[s.patternId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      setStats({ count, avgDuration: avgDur, patternUsage: usage });
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'focus_sessions'));
    return unsub;
  }, [profile]);

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else {
      setTimer(0);
      setPhase('Rest');
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Session tracking
  useEffect(() => {
    // Save session when stopping
    if (!isActive && startTimeRef.current > 0) {
      const dur = Date.now() - startTimeRef.current;
      if (dur > 30 && profile?.id) { // min 30s session
        const _db = getDb();
        addDoc(collection(_db, 'focus_sessions'), {
          userId: profile.id,
          patternId: selectedPattern.id,
          patternName: selectedPattern.name,
          duration: dur / 1000,
          startTime: startTimeRef.current,
          endTime: Date.now(),
          createdAt: serverTimestamp()
        }).catch(err => console.error('Save session error:', err));
      }
      setSessionStart(0);
      startTimeRef.current = 0;
    } else if (isActive && startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }
  }, [isActive]);

  // Pattern Logic for Neural Box (Example)
  useEffect(() => {
    if (!isActive) return;

    if (selectedPattern.id === 'box') {
      const cycleTime = timer % 16;
      if (cycleTime < 4) setPhase('Inhale');
      else if (cycleTime < 8) setPhase('Hold');
      else if (cycleTime < 12) setPhase('Exhale');
      else setPhase('Rest');
    } else if (selectedPattern.id === '478') {
        const cycleTime = timer % 19;
        if (cycleTime < 4) setPhase('Inhale');
        else if (cycleTime < 11) setPhase('Hold');
        else setPhase('Exhale');
    } else {
        const cycleTime = timer % 10;
        if (cycleTime < 5) setPhase('Inhale');
        else setPhase('Exhale');
    }
  }, [timer, isActive, selectedPattern]);

  return (
    <div className="fixed inset-0 z-[200] main-bg flex flex-col items-center justify-center p-8 lg:p-24 overflow-hidden">
      {/* Immersive background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
                scale: isActive && phase === 'Inhale' ? 1.5 : isActive && phase === 'Exhale' ? 0.8 : 1,
                opacity: isActive ? 0.2 : 0.05
            }}
            transition={{ duration: phase === 'Hold' ? 7 : 4, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#818CF8]/20 to-[#34D399]/20 blur-[150px]"
          />
      </div>

      <header className="absolute top-10 left-10 lg:left-24 flex items-center gap-6 z-10 w-full pr-48">
         <button 
           onClick={() => navigate('/dashboard')}
           className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-white/40 hover:text-white transition-colors border-white/5"
         >
            <ChevronLeft size={20} />
         </button>
         <div>
            <h2 className="text-xl font-serif-italic text-white">Focus <span className="text-[#818CF8]">Lab</span>.</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Protocol S-4 Neural Entrainment</p>
         </div>
         <div className="ml-auto hidden md:flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-2 rounded-full">
            <ShieldCheck size={14} className="text-[#34D399]" />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Environment Secured</span>
         </div>
      </header>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 items-center gap-24 relative z-10">
         
         <div className="flex flex-col items-center justify-center order-2 lg:order-1">
            <div className="relative">
                {/* Outer Ring */}
                <motion.div 
                  animate={{ 
                    rotate: 360,
                    scale: isActive && phase === 'Inhale' ? 1.1 : 1
                  }}
                  transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, scale: { duration: 4 } }}
                  className="w-80 h-80 rounded-full border border-white/5 flex items-center justify-center p-8 relative"
                >
                   <div className="absolute inset-0 rounded-full border-t-2 border-[#818CF8]/40 animate-pulse" />
                </motion.div>

                {/* The Core */}
                <motion.div 
                  animate={{ 
                    scale: isActive && phase === 'Inhale' ? 1.8 : isActive && phase === 'Exhale' ? 0.9 : phase === 'Hold' ? 1.85 : 1,
                    backgroundColor: phase === 'Inhale' ? 'rgba(129, 140, 248, 0.4)' : phase === 'Exhale' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)'
                  }}
                  transition={{ duration: isActive && phase === 'Hold' ? 7 : 4, ease: "easeInOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full backdrop-blur-2xl border border-white/20 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(129,140,248,0.2)]"
                >
                   <AnimatePresence mode="wait">
                      <motion.span 
                        key={phase}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-xs font-black uppercase tracking-[0.2em] text-white"
                      >
                         {phase}
                      </motion.span>
                   </AnimatePresence>
                </motion.div>
            </div>

            <div className="mt-12 text-center">
               <span className="text-4xl font-bold text-white font-mono tabular-nums opacity-60">
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
               </span>
               <div className="mt-8 flex gap-4">
                  <button 
                    onClick={() => setIsActive(!isActive)}
                    className={cn(
                      "btn-primary px-12 py-5 flex items-center gap-3 text-sm",
                      isActive && "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                    )}
                  >
                     {isActive ? <Pause size={20} /> : <Play size={20} />}
                     <span>{isActive ? 'HALT INTERVENTION' : 'INITIATE FOCUS'}</span>
                  </button>
                  <button 
                    onClick={() => setIsActive(false)}
                    className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                     <RefreshCw size={20} />
                  </button>
               </div>
            </div>
         </div>

         <div className="space-y-12 order-1 lg:order-2">
            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#818CF8]">Clinical Patterns</h3>
               <div className="grid grid-cols-1 gap-4">
                  {PATTERNS.map((p) => (
                    <button 
                       key={p.id}
                       onClick={() => {
                           setSelectedPattern(p);
                           setIsActive(false);
                       }}
                       className={cn(
                        "text-left p-6 rounded-[24px] transition-all duration-500 border group",
                        selectedPattern.id === p.id 
                            ? "glass-panel bg-white/5 border-[#818CF8]/30" 
                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                       )}
                    >
                       <div className="flex justify-between items-center mb-2">
                           <h4 className="font-bold text-white group-hover:text-[#818CF8] transition-colors">{p.name}</h4>
                           {selectedPattern.id === p.id && <div className="w-2 h-2 rounded-full bg-[#818CF8] shadow-[0_0_10px_#818CF8]" />}
                       </div>
                       <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest leading-relaxed">
                          {p.description}
                       </p>
                    </button>
                  ))}
               </div>
            </div>

            <div className="p-8 glass-card border-indigo-500/10 bg-indigo-500/5 space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" />
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-white/60">Focus Statistiques</h5>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-[#34D399]">{stats.count}</div>
                    <div className="text-white/60 uppercase tracking-wider text-[9px]">Sessions</div>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-[#818CF8]">{stats.avgDuration}'</div>
                    <div className="text-white/60 uppercase tracking-wider text-[9px]">Avg Duration</div>
                  </div>
                </div>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={Object.entries(stats.patternUsage).map(([id, value]) => ({ name: id, value }))} 
                           cx="50%" cy="50%" outerRadius={40} dataKey="value"
                           fill="#818CF8">
                        {Object.entries(stats.patternUsage).map((entry, i) => (
                          <Cell key={i} fill={`hsl(${i * 100}, 70%, 60%)`} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-white/40 text-center">
                  {stats.count === 0 ? 'Start your first session' : `${stats.count} entrainment cycles analyzed`}
                </div>
            </div>
         </div>

      </div>
    </div>
  );
}
