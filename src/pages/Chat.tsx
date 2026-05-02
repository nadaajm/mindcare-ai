import React, { useState, useRef, useEffect } from 'react';
import { collection, query, where, orderBy, limit, addDoc, serverTimestamp, onSnapshot, getDocs, deleteDoc, doc, writeBatch } from '../lib/firebase';
import { getDb, isFirebaseConfigured } from '../lib/firebase';
import { DataService } from '../services/DataService';
import { NeuralService } from '../services/NeuralService';
import { getChatResponse } from '../lib/ai';
import { useAuth } from '../context/AuthContext';
import { OperationType, handleFirestoreError } from '../lib/error-handler';
import { MessageSquare, Send, Loader2, User, Bot, Trash2, Sparkles, Zap, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: any;
}

export default function ChatPage() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    const unsub = DataService.subscribeToCollection('chats', profile.id, (data) => {
      setMessages(data as ChatMessage[]);
      setLoading(false);
    }, 50);
    return () => unsub();
  }, [profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !profile) return;

    const userText = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      // 1. Save User Message
      await DataService.createDocument('chats', {
        userId: profile.id,
        role: 'user',
        content: userText,
      });

      // 2. Get AI Response
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await getChatResponse(userText, history);

      // 3. Save AI Message
      await DataService.createDocument('chats', {
        userId: profile.id,
        role: 'assistant',
        content: response,
      });

    } catch (error) {
      console.error("Neural link failure:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    if (!profile) return;
    if (window.confirm("Are you sure you want to purge the neural history? This action is irreversible.")) {
      try {
        const _db = getDb();
        if (!_db) throw new Error('Firebase not available');
        const q = query(collection(_db, 'chats'), where('userId', '==', profile.id));
        const snap = await getDocs(q);
        const batch = writeBatch(_db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'chats');
      }
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-[#818CF8]" size={20} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Neural Empathy Node</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif-italic text-white">Lumina <span className="text-[#818CF8]">AI</span>.</h1>
          <p className="text-white/40 text-sm max-w-xl">
            A 24/7 autonomous cognitive companion tuned for emotional resonance and clinical validation.
          </p>
        </div>
        <button 
          onClick={clearChat}
          className="flex items-center gap-2 text-white/20 hover:text-rose-400 transition-colors text-[10px] font-black uppercase tracking-widest px-4 py-2 glass-card bg-rose-500/5 border-rose-500/10"
        >
          <Trash2 size={14} /> Purge Sync
        </button>
      </header>

      <div className="flex-1 glass-panel flex flex-col min-h-0 bg-white/[0.01] border-white/5 overflow-hidden">
        {/* Messages area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar scroll-smooth"
        >
          {loading ? (
             <div className="h-full flex items-center justify-center opacity-20">
                <Loader2 className="animate-spin" size={40} />
             </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
              <div className="w-20 h-20 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/20 flex items-center justify-center text-[#818CF8] shadow-[0_0_40px_rgba(129,140,248,0.2)]">
                <Zap size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-widest text-white">Neural Link Established</p>
                <p className="text-xs max-w-xs mx-auto leading-relaxed">Lumina is waiting for your emotional projection. All transmissions are end-to-end synchronized.</p>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-6 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                    msg.role === 'user' 
                      ? "bg-[#34D399]/5 text-[#34D399] border-[#34D399]/10" 
                      : "bg-[#818CF8]/5 text-[#818CF8] border-[#818CF8]/10 shadow-[0_0_20px_rgba(129,140,248,0.1)]"
                  )}>
                    {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
                  </div>
                  <div className={cn(
                    "p-6 rounded-3xl text-sm leading-relaxed relative",
                    msg.role === 'user' 
                      ? "bg-white/[0.03] text-white rounded-tr-none border border-white/10" 
                      : "bg-[#818CF8]/5 text-white/90 rounded-tl-none border border-[#818CF8]/10 shadow-lg"
                  )}>
                    {msg.content}
                    <span className="absolute bottom-[-1.5rem] right-0 text-[8px] font-black tracking-widest text-white/10 uppercase italic">
                      {msg.role === 'user' ? 'Reflected' : 'Synthesized'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-6 max-w-[85%] mr-auto"
            >
              <div className="w-10 h-10 rounded-xl bg-[#818CF8]/5 border border-[#818CF8]/10 flex items-center justify-center text-[#818CF8]">
                <Loader2 className="animate-spin" size={20} />
              </div>
              <div className="p-6 rounded-3xl bg-[#818CF8]/5 border border-[#818CF8]/10 flex gap-2">
                <span className="w-2 h-2 bg-[#818CF8]/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-[#818CF8]/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-[#818CF8]/40 rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input area */}
        <div className="p-8 border-t border-white/5 bg-white/[0.01]">
          <form onSubmit={handleSend} className="flex gap-4">
            <div className="flex-1 relative group">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="form-field pr-12 bg-white/5 border-white/10 group-focus-within:border-[#818CF8]/50"
                placeholder="Initialize neural transmission..."
                disabled={isTyping}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-20">
                <span className="text-[10px] font-bold">READY</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="btn-primary w-14 flex items-center justify-center disabled:opacity-20 group"
            >
              <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </form>
          <div className="mt-4 flex items-center justify-center gap-2 text-white/10 uppercase tracking-widest text-[9px] font-black">
            <ShieldAlert size={12} />
            Lumina is a neural model. For crises, initiate clinical Sync Ops.
          </div>
        </div>
      </div>
    </div>
  );
}
