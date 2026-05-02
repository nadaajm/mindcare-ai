import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from '../lib/firebase';
import { getDb, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Emotion, Journal, Recommendation } from '../types';
import { 
  Plus, 
  Brain, 
  TrendingUp, 
  Sparkles, 
  ChevronRight, 
  Activity, 
  Calendar,
  CloudLightning,
  Sun,
  Cloud,
  Moon,
  MessageSquare,
  Zap,
  Cpu,
  Target
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { OperationType, handleFirestoreError } from '../lib/error-handler';
import { DataService } from '../services/DataService';
import { NeuralService } from '../services/NeuralService';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [latestJournal, setLatestJournal] = useState<Journal | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const unsubE = DataService.subscribeToCollection('emotions', profile.id, (data) => {
      setEmotions(data);
      if (data.length >= 2) {
        NeuralService.getDailyProtocols(profile, data.slice(0, 5)).then(setProtocols);
      }
    }, 10);

    const unsubJ = DataService.subscribeToCollection('journals', profile.id, (data) => {
      if (data.length > 0) setLatestJournal(data[0] as Journal);
    }, 1);

    const unsubR = onSnapshot(query(collection(getDb(), 'recommendations'), orderBy('createdAt', 'desc'), limit(3)), (snap) => {
      setRecs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Recommendation)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'recommendations');
    });

    return () => {
      unsubE();
      unsubJ();
      unsubR();
    };
  }, [profile]);

  const avgMood = emotions.length > 0 
    ? Math.round(emotions.reduce((acc, curr) => acc + curr.score, 0) / emotions.length) 
    : 0;

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Greeting */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8] shadow-[0_0_8px_#818CF8]" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">System Integrity: Nominal</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif-italic text-white leading-tight">
            Digital <span className="text-[#818CF8]">Serenity</span>.
          </h1>
          <p className="text-white/40 text-sm md:text-lg font-medium max-w-lg leading-relaxed">
            Welcome back, {profile?.displayName?.split(' ')[0]}. Your neural coherence is currently <b>{avgMood * 10}%</b> optimized.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => navigate('/focus')}
            className="btn-secondary flex items-center justify-center gap-3 px-8 bg-white/5 border-white/10 text-xs font-black uppercase tracking-widest"
          >
            <Target size={18} className="text-[#FCD34D]" /> Focus Dive
          </button>
          <button 
            onClick={() => navigate('/journal')}
            className="btn-primary flex items-center justify-center gap-3 px-8 text-xs font-black uppercase tracking-widest translate-y-[-2px]"
          >
            <Plus size={18} /> Archive Reflection
          </button>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        {/* BIG CARD: Current Mood State */}
        <section className="md:col-span-2 lg:col-span-2 glass-card p-8 lg:p-10 flex flex-col justify-between min-h-[320px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Brain size={120} className="text-[#818CF8]" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#34D399]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#34D399]">Neuro-Balance</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Emotional Flux</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold text-white text-glow-primary">
                {avgMood}/10
              </span>
              <span className="text-white/30 text-sm font-medium uppercase tracking-widest">Aggregate</span>
            </div>
          </div>

          <div className="h-24 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...emotions].reverse().map((e, idx) => ({ name: idx, score: e.score }))}>
                <defs>
                   <linearGradient id="dashboardMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#818CF8" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#dashboardMood)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 pt-4">
             <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Historical Trajectory</p>
          </div>
        </section>

        {/* Small Card: AI Support Status */}
        <section className="glass-card p-8 flex flex-col justify-between group cursor-pointer" onClick={() => navigate('/chat')}>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#818CF8]/10 flex items-center justify-center text-[#818CF8] group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <ChevronRight className="text-white/20 group-hover:text-white transition-colors" size={20} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Lumina AI</h3>
            <p className="text-xs text-white/40 leading-relaxed">AI Companion is active and ready to process your thoughts.</p>
          </div>
        </section>

        {/* Small Card: Next Session */}
        <section className="glass-card p-8 flex flex-col justify-between group cursor-pointer" onClick={() => navigate('/appointments')}>
          <div className="flex items-center justify-between">
             <div className="w-12 h-12 rounded-2xl bg-[#34D399]/10 flex items-center justify-center text-[#34D399] group-hover:scale-110 transition-transform">
              <Calendar size={24} />
            </div>
            <ChevronRight className="text-white/20 group-hover:text-white transition-colors" size={20} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Sync Ops</h3>
            <p className="text-xs text-white/40 leading-relaxed">No upcoming sessions. Schedule your check-in.</p>
          </div>
        </section>

        {/* Journal Highlight */}
        <section className="md:col-span-3 lg:col-span-2 glass-card p-8 space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F472B6]/10 flex items-center justify-center text-[#F472B6]">
                <TrendingUp size={16} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Latest Reflection</h3>
            </div>
            <span className="text-[10px] text-white/20 font-bold uppercase">
              {latestJournal?.createdAt?.toDate?.().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          <div className="relative">
            <p className="text-white/70 italic text-lg leading-relaxed line-clamp-3">
              "{latestJournal?.content || "Your thoughts are waiting to be captured. Start your first log today."}"
            </p>
          </div>
          
          <button className="text-[10px] font-bold uppercase tracking-widest text-[#818CF8] hover:text-white transition-colors flex items-center gap-2">
            Deep Dive Reflection <ChevronRight size={12} />
          </button>
        </section>

        {/* Daily Wellness Protocols */}
        <section className="md:col-span-3 lg:col-span-2 glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Zap size={16} className="text-[#FCD34D]" /> Daily Calibration
            </h3>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[.3em]">AI Sequence</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {protocols.length > 0 ? protocols.map((pt, i) => (
              <motion.div 
                key={pt.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#818CF8]/30 transition-all group flex flex-col justify-between h-[120px]"
              >
                <div>
                   <h4 className="text-xs font-bold text-white group-hover:text-[#818CF8] transition-colors">{pt.title}</h4>
                   <p className="text-[10px] text-white/40 mt-1 line-clamp-2">{pt.description}</p>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[8px] font-black uppercase tracking-widest text-[#818CF8]">{pt.type}</span>
                   <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#818CF8] group-hover:text-white transition-colors">
                      <Plus size={10} />
                   </div>
                </div>
              </motion.div>
            )) : (
               <div className="col-span-2 py-8 text-center border border-dashed border-white/5 rounded-2xl opacity-20 italic text-xs">
                 Initializing daily operational sequence...
               </div>
            )}
          </div>
        </section>

        {/* Neural Coherence Check */}
        <section className="md:col-span-3 lg:col-span-1 glass-card p-8 bg-[#818CF8]/5 border-[#818CF8]/20 flex flex-col justify-between">
           <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#818CF8]">Neural Coherence</h3>
              <p className="text-sm text-white/70 leading-relaxed font-medium italic">
                "{avgMood >= 7 ? "Optimal synchronization detected. Cognitive resonance is peaking." : "Baseline stability. Minor architectural shifts recommended for alignment."}"
              </p>
           </div>
           <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex gap-1">
                 {[1,2,3,4,5,6].map(i => <div key={i} className={cn("h-4 w-1 rounded-full", i <= Math.round(avgMood/1.5) ? "bg-[#818CF8]" : "bg-white/5")} />)}
              </div>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">Status: {avgMood >= 7 ? 'ELITE' : 'SYNCING'}</span>
           </div>
        </section>

      </div>
    </div>
  );
}
