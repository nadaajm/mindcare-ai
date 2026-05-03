import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Wind, 
  Waves, 
  TreePine, 
  Zap, 
  CloudRain,
  Activity,
  Headphones,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { getSoundscapeRecommendation } from '../lib/ai';

const SOUNDSCAPES = [
  { id: '1', title: 'Solaris Ambient', category: 'Focus', color: '#FCD34D', icon: Zap },
  { id: '2', title: 'Deep Forest Sync', category: 'Relax', color: '#34D399', icon: TreePine },
  { id: '3', title: 'Midnight Rain', category: 'Sleep', color: '#818CF8', icon: CloudRain },
  { id: '4', title: 'Oceanic Frequencies', category: 'Calm', color: '#60A5FA', icon: Waves },
  { id: '5', title: 'Void Meditation', category: 'Zen', color: '#A78BFA', icon: Wind }
];

export default function Soundscapes() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(60);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loadingRec, setLoadingRec] = useState(false);

  useEffect(() => {
    fetchRecommedation();
  }, []);

  const fetchRecommedation = async () => {
    setLoadingRec(true);
    try {
      const res = await getSoundscapeRecommendation(7); // Hardcoded mood for demo
      setRecommendation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRec(false);
    }
  };

  const currentSound = SOUNDSCAPES.find(s => s.id === playing) || SOUNDSCAPES[0];

  const frequencies = {
    '1': 432,  // Solaris
    '2': 528,  // Forest
    '3': 396,  // Rain
    '4': 741,  // Ocean
    '5': 369   // Zen
  };

  useEffect(() => {
    if (playing) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(frequencies[playing as keyof typeof frequencies] || 432, audioContext.currentTime);
      gainNode.gain.setValueAtTime(volume / 100 * 0.1, audioContext.currentTime);
      oscillator.start();
      return () => oscillator.stop();
    }
  }, [playing, volume]);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Headphones className="text-[#FCD34D]" size={20} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Auditory Biofeedback</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif-italic text-white">Neural <span className="text-[#FCD34D]">Soundscapes</span>.</h1>
          <p className="text-white/40 text-sm max-w-xl">
            Tuning your cognitive environment via algorithmic frequency modulation and somatic audio textures.
          </p>
        </div>
        <div className="flex items-center gap-3 glass-card px-6 py-3 border-[#FCD34D]/10 bg-[#FCD34D]/5">
           <Activity size={14} className="text-[#FCD34D] animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-white">Oscillation: 432Hz Mode</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* Featured Player */}
        <section className="lg:col-span-3 space-y-8">
           <div className="relative h-[450px] w-full rounded-[40px] overflow-hidden glass-panel border-white/5 bg-[#0A0A1F]/60 flex flex-col items-center justify-center group">
              {/* Visualizer Background */}
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-none opacity-20">
                {[...Array(30)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: playing ? [20, 100, 40, 120, 20] : 10 }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                    className="w-1 rounded-full"
                    style={{ backgroundColor: currentSound.color }}
                  />
                ))}
              </div>

              <div className="relative z-10 flex flex-col items-center space-y-8">
                 <div 
                   className="w-48 h-48 rounded-full flex items-center justify-center relative group/inner"
                   style={{ background: `radial-gradient(circle, ${currentSound.color}20 0%, transparent 70%)` }}
                 >
                    <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_10s_linear_infinite]" />
                    <currentSound.icon size={80} style={{ color: currentSound.color }} className="drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform group-hover/inner:scale-110" />
                 </div>

                 <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{currentSound.title}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[.4em] text-white/30">{currentSound.category} Protocol Active</p>
                 </div>

                 <div className="flex items-center gap-8">
                    <button className="text-white/20 hover:text-white transition-colors"><SkipBack size={24} /></button>
                    <button 
                      onClick={() => setPlaying(playing === currentSound.id ? null : currentSound.id)}
                      className="w-20 h-20 rounded-full bg-white text-[#0A0A1F] flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                    >
                      {playing ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                    </button>
                    <button className="text-white/20 hover:text-white transition-colors"><SkipForward size={24} /></button>
                 </div>
              </div>

              <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between">
                 <div className="flex items-center gap-4 group/vol">
                    <Volume2 size={16} className="text-white/20 group-hover/vol:text-white transition-colors" />
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume} 
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-32 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white" 
                    />
                 </div>
                 <button className="text-white/20 hover:text-white transition-colors"><Maximize2 size={16} /></button>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {SOUNDSCAPES.map((sound) => (
                <button 
                  key={sound.id}
                  onClick={() => setPlaying(sound.id)}
                  className={cn(
                    "glass-card p-6 border-white/5 bg-white/[0.02] flex flex-col items-center gap-4 transition-all hover:translate-y-[-4px]",
                    playing === sound.id ? "border-white/20 bg-white/5" : "hover:bg-white/[0.05]"
                  )}
                >
                  <sound.icon size={24} style={{ color: sound.color }} />
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{sound.title.split(' ')[0]}</span>
                </button>
              ))}
           </div>
        </section>

        {/* Sidebar recommendations */}
        <aside className="space-y-8">
           <section className="glass-panel p-8 bg-gradient-to-br from-[#FCD34D]/10 to-transparent border-[#FCD34D]/20 space-y-6">
              <div className="flex items-center gap-2">
                 <Zap size={16} className="text-[#FCD34D]" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FCD34D]">AI Recommendation</h3>
              </div>
              
              {loadingRec ? (
                <div className="space-y-4 animate-pulse">
                   <div className="h-4 w-3/4 bg-white/10 rounded" />
                   <div className="h-10 w-full bg-white/10 rounded" />
                </div>
              ) : recommendation ? (
                <div className="space-y-4 animate-in fade-in duration-700">
                   <h4 className="text-xl font-bold text-white">{recommendation.title}</h4>
                   <p className="text-xs text-white/50 leading-relaxed italic">{recommendation.description}</p>
                   <div className="pt-4 flex items-center justify-between border-t border-white/5">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Base: {recommendation.frequency}</span>
                      <button className="text-[10px] font-black text-[#FCD34D] uppercase tracking-widest hover:underline">Apply Sync</button>
                   </div>
                </div>
              ) : null}
           </section>

           <section className="glass-card p-8 border-white/5 bg-white/[0.01]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6">Neural Insights</h3>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-white/40 mb-1">
                       <span>Beta Flux</span>
                       <span>42%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 w-[42%] shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-white/40 mb-1">
                       <span>Alpha Resonance</span>
                       <span>78%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[78%] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                 </div>
                 <p className="text-[10px] text-white/20 leading-relaxed pt-4 italic">
                    Auditory stimuli detected. Theta waves stabilizing. Maintain audio focus for 12 more minutes for optimal neural plasticity.
                 </p>
              </div>
           </section>
        </aside>

      </div>
    </div>
  );
}
