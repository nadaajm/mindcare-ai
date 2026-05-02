import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Edit2, Loader2, CheckCircle, Globe } from 'lucide-react';
import { doc, updateDoc } from '../lib/firebase';
import { getDb } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Profile() {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Edit state
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [specialty, setSpecialty] = useState(profile?.specialty || '');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setMessage(null);

    try {
      const _db = getDb();
      if (!_db) throw new Error('Firebase not available');
      await updateDoc(doc(_db, 'users', profile.id), {
        displayName,
        bio,
        specialty
      });

      setMessage({ type: 'success', text: 'Identity sync complete.' });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Identity synchronization failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="text-[#818CF8]" size={24} />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Registry & Core Settings</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif-italic text-white">Identity <span className="text-[#818CF8]">Profile</span>.</h1>
        <p className="text-white/40 text-sm max-w-xl">
          Secure and manage your personal wellness node and administrative credentials.
        </p>
      </header>

      {message && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "p-5 rounded-2xl flex items-center gap-4 text-sm font-bold border",
            message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          )}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-red-400 flex items-center justify-center text-[10px]">!</div>}
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#818CF8]/10 to-[#6366F1]/10 border-2 border-[#818CF8]/30 flex items-center justify-center text-[#818CF8] shadow-lg shadow-indigo-500/10 transition-all duration-500 group-hover:scale-105">
                    {profile?.photoUrl ? (
                      <img src={profile.photoUrl} alt="" className="w-full h-full object-cover rounded-[22px]" />
                    ) : (
                      <User size={48} />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-[#818CF8] border-4 border-[#0A0A1F] flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
                    <Edit2 size={12} />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">{profile?.displayName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield size={12} className="text-[#818CF8]" />
                    <p className="text-[#818CF8] text-[10px] font-black uppercase tracking-[0.2em]">{profile?.role} NODE</p>
                  </div>
                </div>
              </div>

              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                >
                  Edit Identity
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Visible Alias</label>
                    <input 
                      className="form-field" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  {profile?.role === 'therapist' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Clinical Designation</label>
                      <input 
                        className="form-field" 
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="e.g. Lead Neuro-Psychologist"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Self-Description</label>
                  <textarea 
                    className="form-field min-h-[120px] resize-none" 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading && <Loader2 className="animate-spin" size={16} />}
                    Commit Changes
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Dismiss</button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-10 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={12} /> Contact Node
                  </label>
                  <p className="text-base text-white/80 font-medium">{profile?.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> Initialization Date
                  </label>
                  <p className="text-base text-white/80 font-medium">
                    {profile?.createdAt?.toDate?.()?.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) || 'Primary Entry'}
                  </p>
                </div>
                {profile?.bio && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Descriptor</label>
                    <p className="text-sm text-white/50 leading-relaxed italic border-l-2 border-[#818CF8]/20 pl-6 py-1">
                      "{profile.bio}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-panel p-8 border-orange-500/10 opacity-50">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 mb-8">
              <div className="w-4 h-4 rounded-full bg-orange-500/30 border border-orange-500/30" />
              Security Layer
            </h3>
            
            <div className="space-y-6">
              <p className="text-xs text-white/30 leading-relaxed">
                Password change via Firebase Auth is not active. Local MySQL backend handles authentication.
              </p>
            </div>
          </div>

          <div className="glass-panel p-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 mb-6">
              <div className="w-4 h-4 rounded-full bg-[#34D399]/20 border border-[#34D399]/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>
              Sync Devices
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/3">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="text-[10px] font-bold text-white uppercase">Cloud Preview Node</span>
                </div>
                <span className="text-[10px] text-white/20">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}