import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, writeBatch, getDocs } from '../lib/firebase';
import { getDb, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Emotion, Insight } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  Brain, 
  ShieldCheck,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { OperationType, handleFirestoreError } from '../lib/error-handler';
import { DataService } from '../services/DataService';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function Insights() {
  const { profile } = useAuth();
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'mood' | 'stress'>('mood');

  useEffect(() => {
    if (!profile) return;
    const _db = getDb();
    if (!_db) return;

    const qE = query(
      collection(_db, 'emotions'), 
      where('userId', '==', profile.id), 
      orderBy('createdAt', 'asc'), 
      limit(20)
    );
    const unsubE = onSnapshot(qE, (snap) => {
      setEmotions(snap.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          ...data,
          date: data.createdAt?.toDate?.().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || 'Unknown'
        } as any;
      }));
    });

    const qI = query(
      collection(_db, 'insights'), 
      where('userId', '==', profile.id), 
      orderBy('createdAt', 'desc'), 
      limit(1)
    );
    const unsubI = onSnapshot(qI, (snap) => {
      setInsights(snap.docs.map(d => ({ id: d.id, ...d.data() } as Insight)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'insights');
    });

    return () => {
      unsubE();
      unsubI();
    };
  }, [profile]);

  const generateNewInsight = async () => {
    if (!profile || emotions.length < 3) return;
    setGenerating(true);
    
    try {
      const moodData = emotions.map(e => `Mood: ${e.score}/10`).join(', ');
      const prompt = `Analyze this mood history: [${moodData}]. 
      Provide a highly professional and empathetic mental health summary.
      Return JSON: { "summary": "...", "trend": "improving" | "declining" | "stable", "recommendations": ["...", "..."] }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text);

      await addDoc(collection(getDb(), 'insights'), {
        userId: profile.id,
        summary: result.summary,
        trend: result.trend,
        recommendations: result.recommendations,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to generate insight:", error);
    } finally {
      setGenerating(false);
    }
  };

  const currentInsight = insights[0];

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-[#34D399]" size={20} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Analytics & Biofeedback</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif-italic text-white">Trend <span className="text-[#34D399]">Intelligence</span>.</h1>
          <p className="text-white/40 text-sm max-w-xl">
            Synthesizing raw emotional bandwidth into actionable psychological clarity.
          </p>
        </div>
        <button 
          onClick={generateNewInsight}
          disabled={generating || emotions.length < 3}
          className="btn-primary flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] shadow-[#10B981]/10"
        >
          {generating ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
          {generating ? 'Processing Neural Data...' : 'Sync AI Insight'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart Container */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 bg-[#0A0A1F]/40 border-white/5 h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('mood')}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all",
                    activeTab === 'mood' ? "bg-[#818CF8]/20 text-[#818CF8] border border-[#818CF8]/30" : "text-white/20 hover:text-white"
                  )}
                >
                  Neural Mood
                </button>
                <button 
                  onClick={() => setActiveTab('stress')}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all",
                    activeTab === 'stress' ? "bg-[#F472B6]/20 text-[#F472B6] border border-[#F472B6]/30" : "text-white/20 hover:text-white"
                  )}
                >
                  System Stress
                </button>
              </div>
              <div className="text-[10px] text-white/20 font-bold uppercase">Last 20 Data Points</div>
            </div>

            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'mood' ? (
                  <AreaChart data={emotions}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818CF8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#818CF8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#ffffff20" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#ffffff20" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      domain={[0, 10]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0A0A1F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#818CF8" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorMood)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={emotions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#ffffff20" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#ffffff20" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      domain={[0, 10]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0A0A1F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
<Line 
                      type="stepAfter" 
                      dataKey="stressLevel" 
                      stroke="#F472B6" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#F472B6', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#fff' }}
                      animationDuration={1500}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-8 flex items-center justify-between group cursor-help">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Coherence Rate</p>
                <h4 className="text-2xl font-bold text-white">94%</h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Brain size={20} />
              </div>
            </div>
            <div className="glass-card p-8 flex items-center justify-between group">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Stability Node</p>
                <h4 className="text-2xl font-bold text-white">Advanced</h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <ShieldCheck size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <aside className="space-y-6">
          <section className="glass-card p-8 bg-gradient-to-br from-[#818CF8]/10 to-transparent border-[#818CF8]/20 relative overflow-hidden h-[500px] flex flex-col">
            <div className="absolute -top-10 -right-10 opacity-5">
              <Sparkles size={150} />
            </div>
            
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="text-yellow-400" size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#818CF8]">AI Narrative Analysis</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
              {currentInsight ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <TrendingUp size={14} className={cn(
                         currentInsight.trend === 'improving' ? "text-[#34D399]" : "text-[#F472B6]"
                       )} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Direction: {currentInsight.trend}</span>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed italic font-medium border-l-2 border-[#818CF8]/30 pl-4">
                      "{currentInsight.summary}"
                    </p>
                  </div>

                  <div className="space-y-4">
                     <h5 className="text-[10px] font-black uppercase tracking-widest text-[#818CF8]">Core Protocols</h5>
                     <div className="space-y-3">
                        {currentInsight.recommendations?.map((rec, i) => (
                          <div key={i} className="flex gap-3 p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors">
                             <div className="w-5 h-5 rounded-full bg-[#818CF8]/20 flex items-center justify-center text-[#818CF8] shrink-0 text-[10px] font-bold">{i+1}</div>
                             <p className="text-[11px] text-white/60 leading-normal">{rec}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <RefreshCw size={40} className="mb-2" />
                  <p className="text-xs font-bold leading-relaxed px-4">
                    Neural history insufficient. Log at least 3 emotional states to generate AI trend intelligence.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/20">STATUS: CALIBRATED</span>
              <div className="flex gap-1">
                {[1,2,3,4].map(i => <div key={i} className="w-1 h-3 rounded-full bg-[#818CF8]" style={{ opacity: 0.2 * i }} />)}
              </div>
            </div>
          </section>
        </aside>

      </div>
    </div>
  );
}
