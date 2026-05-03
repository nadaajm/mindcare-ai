import React, { useState, useEffect } from 'react';
import { getDb, collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/error-handler';
import { useAuth } from '../context/AuthContext';
import { CommunityPost } from '../types';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Sparkles, 
  AlertCircle,
  Globe,
  MoreVertical,
  Send,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Community() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    const _db = getDb();
    const q = query(
      collection(_db, 'community_posts'),
      where('userId', '==', profile.id),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      console.log('Community posts snap:', snap.docs.length);
      setPosts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as CommunityPost)));
      setLoading(false);
    }, (error) => {
      console.error('Community onSnapshot error:', error);
      handleFirestoreError(error, OperationType.LIST, 'community_posts');
      handleFirestoreError(error, OperationType.LIST, 'community_posts');
      setPosts([]);
      setLoading(false);
    });
    return unsub;
  }, [profile]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !profile || isPosting) return;

    setIsPosting(true);
    try {
      const _db = getDb();
      await addDoc(collection(_db, 'community_posts'), {
        userId: profile.id,
        authorName: profile.displayName || 'Anonymous User',
        content: newPost,
        likes: 0,
        isPublic: true,
        createdAt: serverTimestamp()
      });
      setNewPost('');
    } catch (error) {
      console.error('Post error:', error);
      handleFirestoreError(error as Error, OperationType.CREATE, 'community_posts');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const _db = getDb();
      await updateDoc(doc(_db, 'community_posts', postId), { 
        likes: increment(1) 
      });
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-[#A78BFA]" size={20} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">The Collective Mindset</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif-italic text-white">The <span className="text-[#A78BFA]">Circle</span>.</h1>
          <p className="text-white/40 text-sm max-w-xl">
            A sanctuary for shared clarity. Project your reflections into the collective to cultivate mutual resilience.
          </p>
        </div>
        <div className="flex items-center gap-3 glass-card px-4 py-2 bg-indigo-500/5 border-indigo-500/10">
          <Globe size={14} className="text-[#818CF8]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Global Sync Active</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* Main Feed */}
        <section className="lg:col-span-2 space-y-8 min-h-[600px]">
          {/* Create Post */}
          <div className="glass-panel p-6 border-white/5 bg-white/[0.02] space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1E1E3F] to-[#2D2D5F] border border-white/10 flex items-center justify-center text-white/20 shrink-0">
                {profile?.displayName?.[0]}
              </div>
              <textarea 
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                maxLength={500}
                placeholder="Share a moment of clarity or a reflective question..."
                className="bg-transparent text-white text-sm w-full outline-none resize-none pt-2 min-h-[80px]"
              />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex gap-4">
                <button className="text-white/20 hover:text-white transition-colors" title="AI Enhance">
                  <Sparkles size={18} />
                </button>
                <button className="text-white/20 hover:text-white transition-colors" title="Add Media">
                  <Plus size={18} />
                </button>
              </div>
              <button 
                onClick={handlePost}
                disabled={!newPost.trim() || isPosting}
                className="btn-primary py-2 px-6 text-xs flex items-center gap-2"
              >
                {isPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Cast into Circle
              </button>
            </div>
          </div>

          {/* Feed List */}
          <div className="space-y-6">
            <AnimatePresence>
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-40 glass-card animate-pulse" />)
              ) : posts.length === 0 ? (
                <div className="text-center py-20 opacity-20 italic">The Circle is waiting for its first projection.</div>
              ) : (
                posts.map((post) => (
                  <motion.div 
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card p-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#818CF8]/10 border border-[#818CF8]/20 flex items-center justify-center text-[#818CF8] font-bold">
                          {post.authorName[0]}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-[#818CF8] transition-colors">{post.authorName}</h4>
                          <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Synced {post.createdAt?.toDate?.().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <button className="text-white/10 hover:text-white transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    
                    <p className="text-base text-white/70 leading-relaxed mb-6 font-medium">
                      {post.content}
                    </p>

                    <div className="flex items-center gap-8 pt-4 border-t border-white/5">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-2 text-white/20 hover:text-[#F472B6] transition-colors group/like"
                      >
                        <Heart size={18} className={cn(post.likes > 0 && "text-[#F472B6] fill-[#F472B6]/20")} />
                        <span className="text-xs font-bold">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-2 text-white/20 hover:text-[#818CF8] transition-colors">
                        <MessageCircle size={18} />
                        <span className="text-xs font-bold">Resonate</span>
                      </button>
                      <button className="flex items-center gap-2 text-white/20 hover:text-white transition-colors ml-auto">
                        <Share2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Community Context */}
        <aside className="space-y-8">
          <section className="glass-card p-8 border-yellow-500/10 bg-yellow-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={60} className="text-yellow-400" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">Focus Frequency</h3>
            <p className="text-xs text-white/50 leading-relaxed mb-6">
              Current collective mood is elevated. 84% of participants reported increased clarity after sharing today.
            </p>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '84%' }}
                className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
              />
            </div>
          </section>

          <section className="glass-card p-8 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Top Resonators</h3>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-xs font-bold text-white/40">#{i}</div>
                  <div className="flex-1">
                    <div className="h-2 w-20 bg-white/10 rounded-full mb-2" />
                    <div className="h-1.5 w-12 bg-white/5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card p-6 bg-red-500/5 border-red-500/10 flex items-start gap-4">
            <AlertCircle size={20} className="text-red-400 shrink-0" />
            <p className="text-[10px] text-red-300/60 leading-normal font-medium">
              The Circle is a collaborative support node. Personal data remains obfuscated. If you require immediate clinical help, use the 'Sync Ops' to book a professional session.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}