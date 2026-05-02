import React, { useState, useEffect } from 'react';
import { collection, query, where, limit, onSnapshot, orderBy } from '../lib/firebase';
import { getDb, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Emotion, Journal } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, Zap, Info, ChevronRight, Activity, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';
import { getNeuralMapSummary } from '../lib/ai';
import { OperationType, handleFirestoreError } from '../lib/error-handler';

interface Node {
  id: string;
  x: number;
  y: number;
  score: number;
  type: 'emotion' | 'journal';
  label: string;
  date: string;
}

export default function Constellation() {
  const { profile } = useAuth();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const _db = getDb();
    if (!_db) { setLoading(false); return; }

    const q = query(
      collection(_db, 'emotions'),
      where('userId', '==', profile.id),
      orderBy('createdAt', 'desc'),
      limit(15)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => d.data());
      if (data.length > 3) {
        getNeuralMapSummary(data).then(setAnalysis);
      }

      const newNodes: Node[] = snap.docs.map((d, index) => {
        const data = d.data();
        const angle = (index / snap.docs.length) * Math.PI * 2;
        const radius = 100 + (data.score * 15);
        
        return {
          id: d.id,
          x: 400 + Math.cos(angle) * radius,
          y: 400 + Math.sin(angle) * radius,
          score: data.score,
          type: 'emotion',
          label: `Score ${data.score}/10`,
          date: data.createdAt?.toDate?.().toLocaleDateString() || 'N/A'
        };
      });
      setNodes(newNodes);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'emotions');
      setLoading(false);
    });

    return () => unsub();
  }, [profile]);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 min-h-[800px] flex flex-col">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="text-[#A78BFA]" size={20} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Cognitive Mapping</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif-italic text-white">Neural <span className="text-[#A78BFA]">Map</span>.</h1>
          <p className="text-white/40 text-sm max-w-xl">
            Visualizing the gravitational centers of your psyche. Each node represents a synaptic capture of your emotional state.
          </p>
        </div>

        <AnimatePresence>
          {analysis && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 bg-[#A78BFA]/5 border-[#A78BFA]/20 max-w-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={14} className="text-[#A78BFA]" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50">{analysis.title}</h4>
              </div>
              <p className="text-xs text-white/70 leading-relaxed italic">"{analysis.analysis}"</p>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="flex-1 relative glass-panel bg-[#0A0A1F]/40 border-white/5 overflow-hidden cursor-crosshair min-h-[500px]">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
        />

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="text-[#818CF8] animate-pulse" size={48} />
          </div>
        ) : (
          <svg viewBox="0 0 800 800" className="w-full h-full">
            <circle cx="400" cy="400" r="4" fill="#818CF8" className="animate-pulse shadow-[0_0_20px_rgba(129,140,248,0.8)]" />
            <circle cx="400" cy="400" r="150" fill="none" stroke="rgba(129, 140, 248, 0.05)" strokeDasharray="5,5" />
            <circle cx="400" cy="400" r="250" fill="none" stroke="rgba(129, 140, 248, 0.05)" strokeDasharray="5,5" />

            {nodes.map((node, i) => (
              <motion.line 
                key={`line-${node.id}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: i * 0.1 }}
                x1="400" y1="400" x2={node.x} y2={node.y}
                stroke="rgba(129, 140, 248, 0.1)"
                strokeWidth="1"
              />
            ))}

            {nodes.map((node, i) => (
              <motion.g 
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.1 }}
                className="cursor-pointer group/node"
                onClick={() => setSelectedNode(node)}
              >
                <circle 
                  cx={node.x} cy={node.y} 
                  r={8 + (node.score * 0.5)} 
                  fill={node.score >= 7 ? "rgba(52, 211, 153, 0.2)" : "rgba(129, 140, 248, 0.2)"}
                  className="transition-all group-hover/node:fill-white/20"
                />
                <circle 
                  cx={node.x} cy={node.y} 
                  r={3} 
                  fill={node.score >= 7 ? "#34D399" : "#818CF8"} 
                  className={cn(
                    "shadow-lg",
                    selectedNode?.id === node.id && "ring-4 ring-white/20"
                  )}
                />
                <motion.text 
                  x={node.x + 15} y={node.y + 5} 
                  className="text-[10px] font-bold text-white/20 uppercase tracking-widest hidden group-hover/node:block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {node.date}
                </motion.text>
              </motion.g>
            ))}
          </svg>
        )}

        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="absolute top-10 right-10 w-72 glass-panel p-8 bg-[#0A0A1F]/80 backdrop-blur-xl border-[#818CF8]/20 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Zap className={cn("w-4 h-4", selectedNode.score >= 7 ? "text-[#34D399]" : "text-[#818CF8]")} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Capture Node</span>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-white/20 hover:text-white transition-colors text-xs">Close</button>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-3xl font-bold text-white tracking-tighter">{selectedNode.score}/10</h3>
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#818CF8]" style={{ width: `${selectedNode.score * 10}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">Status: {selectedNode.score >= 7 ? 'RESONANT' : 'BASELINE'}</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed italic border-l border-white/10 pl-4 py-1">
                  "A periodic snapshot of neural oscillation captured during a reflective session."
                </p>
              </div>

              <button className="btn-primary w-full py-3 text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2">
                Deep Dive <ChevronRight size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-10 left-10 flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Resonant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#818CF8] shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Baseline</span>
          </div>
        </div>
      </div>
    </div>
  );
}