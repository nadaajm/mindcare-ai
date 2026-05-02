import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, doc, getDoc } from '../lib/firebase';
import { getDb, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Journal, Emotion } from '../types';
import { NeuralService } from '../services/NeuralService';
import { DataService } from '../services/DataService';
import { analyzeJournal } from '../lib/ai';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { 
  BookOpen, 
  Send, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  Calendar,
  CloudLightning,
  Sun,
  Cloud,
  Moon,
  ChevronRight,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

const MOODS = [
  { score: 10, label: 'Radiant', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { score: 8, label: 'Balanced', icon: Cloud, color: 'text-[#34D399]', bg: 'bg-[#34D399]/10' },
  { score: 5, label: 'Oscillating', icon: CloudLightning, color: 'text-[#818CF8]', bg: 'bg-[#818CF8]/10' },
  { score: 2, label: 'Shadowed', icon: Moon, color: 'text-[#F472B6]', bg: 'bg-[#F472B6]/10' },
];

export default function JournalPage() {
  const { profile } = useAuth();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // New entry state
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [aiPrompt, setAiPrompt] = useState('Transcribe your current mental state...');
  
  // Stats
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!profile) return;
    fetchData();
    generateAiPrompt();
  }, [profile]);

  const generateAiPrompt = async () => {
    if (!profile) return;
    const prompt = await NeuralService.generateJournalPrompt(profile.role);
    setAiPrompt(prompt);
  };

  const fetchData = async () => {
    if (!profile) return;
    const _db = getDb();
    if (!_db) { setLoading(false); return; }
    try {
      const q = query(
        collection(_db, 'journals'),
        where('userId', '==', profile.id),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setJournals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Journal)));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'journals');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !profile || selectedMood === null) {
      console.log("Save blocked:", { content: content.trim(), hasProfile: !!profile, selectedMood });
      return;
    }

    setIsSaving(true);
    try {
      console.log("Starting journal save...");
      // 1. Analyze with AI first for metrics
      const analysis = await analyzeJournal(content);
      console.log("Analysis result:", analysis);

      // 2. Save Journal
      const _db = getDb();
      console.log("DB handle:", _db);
      if (!_db) throw new Error('Firebase not available');
      const journalRef = await addDoc(collection(_db, 'journals'), {
        userId: profile.id,
        content,
        sentiment: analysis.sentiment,
        stressLevel: analysis.stressLevel,
        happinessLevel: analysis.happinessLevel,
        anxietyLevel: analysis.anxietyLevel,
        aiAdvice: analysis.advice,
        isCrisis: analysis.isCrisis,
        createdAt: serverTimestamp(),
        moodScore: selectedMood
      });
      console.log("Journal saved with ID:", journalRef.id);

      // 3. Save Emotion DataPoint for charts
      await addDoc(collection(_db, 'emotions'), {
        userId: profile.id,
        score: selectedMood,
        stressLevel: analysis.stressLevel,
        happinessLevel: analysis.happinessLevel,
        anxietyLevel: analysis.anxietyLevel,
        journalId: journalRef.id,
        createdAt: serverTimestamp()
      });
      console.log("Emotion saved");

      setContent('');
      setSelectedMood(null);
      await fetchData();
      console.log("Fetch complete");
    } catch (err: any) {
      console.error("Journal save error:", err);
      handleFirestoreError(err, OperationType.CREATE, 'journals');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="text-[#818CF8]" size={24} />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Archives & Reflections</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif-italic text-white">Mind <span className="text-[#818CF8]">Logs</span>.</h1>
        <p className="text-white/40 text-sm max-w-xl leading-relaxed">
          The blank page is a mirror for the soul. Externalize your internal narrative to gain clarity and structural balance.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* Entry Interface */}
        <section className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 space-y-8 border-indigo-500/10">
            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4 block">Mood Calibration</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {MOODS.map((mood) => (
                  <button
                    key={mood.score}
                    type="button"
                    onClick={() => setSelectedMood(mood.score)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-300 border",
                      selectedMood === mood.score 
                        ? `${mood.bg} border-${mood.color.split('-')[1]}-500/50 scale-[1.02] shadow-lg` 
                        : "bg-white/3 border-white/5 hover:bg-white/5"
                    )}
                  >
                    <mood.icon className={cn(mood.color, selectedMood === mood.score ? "text-glow-primary" : "")} size={28} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 block">Internal Narrative</label>
                 <div className="flex items-center gap-1">
                   <Sparkles size={10} className="text-yellow-400" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-white/20">AI Prompt Active</span>
                 </div>
               </div>
               <textarea
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                     e.preventDefault();
                     handleSave(e as any);
                   }
                 }}
                 placeholder={aiPrompt}
                 className="form-field min-h-[220px] resize-none text-base leading-relaxed p-6 placeholder:italic placeholder:text-white/20"
               />
             </div>

            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim() || selectedMood === null}
              className="btn-primary w-full py-5 flex items-center justify-center gap-3 text-sm"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <Send size={18} />
                  <span>Archive Reflection</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Timeline & Feedback */}
        <aside className="space-y-8">
          {/* AI Insights (Mock suggestion UI) */}
          <section className="glass-card p-8 bg-[#818CF8]/5 border-[#818CF8]/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Brain size={80} className="text-white" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-yellow-400" size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">Lumina Insight</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-2">Reflective Consistency</h4>
            <p className="text-xs text-white/50 leading-relaxed mb-4 italic">
              "Archiving thoughts during different emotional states creates a high-res mapping of your mental landscape."
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-[10px] text-[#34D399] font-bold">STREAK: 4 DAYS</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i <= 4 ? "bg-[#34D399]" : "bg-white/10")} />
                ))}
              </div>
            </div>
          </section>

          {/* Timeline List */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-2">Recent Archives</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-24 w-full glass-card animate-pulse" />)
              ) : journals.length === 0 ? (
                <div className="text-center py-12 glass-card opacity-30 italic text-xs">No records found.</div>
              ) : (
                journals.map((j) => (
                  <div key={j.id} className="glass-card p-5 hover:border-[#818CF8]/30 group transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {j.moodScore >= 7 ? <Sun size={14} className="text-yellow-400" /> : <Cloud size={14} className="text-[#818CF8]" />}
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                          {j.createdAt?.toDate?.().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <ChevronRight size={12} className="text-white/10 group-hover:text-[#818CF8] transition-colors" />
                    </div>
                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                      {j.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
