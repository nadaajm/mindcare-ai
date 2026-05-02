import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, getDocs } from '../lib/firebase';
import { getDb, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile, Alert, Recommendation } from '../types';
import { OperationType, handleFirestoreError } from '../lib/error-handler';
import { Shield, Users, Bell, Star, AlertTriangle, Plus, Loader2, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Admin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Rec form
  const [recTitle, setRecTitle] = useState('');
  const [recContent, setRecContent] = useState('');
  const [isSavingRec, setIsSavingRec] = useState(false);

  useEffect(() => {
    const _db = getDb();
    if (!_db) { setLoading(false); return; }

    // Fetch all users
    const unsubU = onSnapshot(collection(_db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Fetch alerts (ordered by crisis first)
    const unsubA = onSnapshot(collection(_db, 'alerts'), (snap) => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Alert)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'alerts');
      setLoading(false);
    });

    return () => {
      unsubU();
      unsubA();
    };
  }, []);

  const changeRole = async (userId: string, newRole: string) => {
    try {
      const _db = getDb();
      if (!_db) throw new Error('Firebase not available');
      await updateDoc(doc(_db, 'users', userId), { role: newRole });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const handleAddRec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim() || !recContent.trim()) return;

    setIsSavingRec(true);
    try {
      const _db = getDb();
      if (!_db) throw new Error('Firebase not available');
      await addDoc(collection(_db, 'recommendations'), {
        title: recTitle,
        content: recContent,
        type: 'system',
        createdAt: serverTimestamp()
      });
      setRecTitle('');
      setRecContent('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'recommendations');
    } finally {
      setIsSavingRec(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="page-title text-white">Admin Command Center 🛡️</h1>
        <p className="page-subtitle text-[#9B9BB0]">Global system oversight and management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Management */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-[#6C63FF]" /> User Management
          </h2>
          <div className="stat-card p-0 overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.displayName}</span>
                        <span className="text-[10px] text-white/30">{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={cn(
                        "badge",
                        u.role === 'patient' ? "badge-user" : 
                        u.role === 'therapist' ? "badge-psychologist" : "badge-admin"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <select 
                        value={u.role} 
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="bg-white/5 border border-white/10 text-[11px] rounded p-1"
                      >
                        <option value="patient" className="bg-[#1A1A2E]">Patient</option>
                        <option value="therapist" className="bg-[#1A1A2E]">Therapist</option>
                        <option value="admin" className="bg-[#1A1A2E]">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-8">
          {/* Firestore Explorer */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-[#6C63FF]" /> Firestore Explorer
            </h2>
            <div className="stat-card">
              <p className="text-[10px] text-white/40 mb-2 font-mono">SELECT * FROM journals WHERE isCrisis = true</p>
              <textarea 
                className="form-field font-mono text-xs mb-3" 
                placeholder="Enter query... (e.g. journals where userId == '...')"
              />
              <button className="btn-secondary w-full text-xs">Execute Query (Read Only)</button>
              <div className="mt-4 p-3 bg-black/30 rounded border border-white/5 font-mono text-[10px] text-[#4ECDC4]">
                // Results will appear here
              </div>
            </div>
          </section>

          {/* System Alerts */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell size={20} className="text-[#FF6B9D]" /> Crisis Alerts
            </h2>
            <div className="space-y-3">
              {alerts.length === 0 && (
                <div className="stat-card text-center py-8 text-white/20 text-sm italic">
                  No active system alerts.
                </div>
              )}
              {alerts.map(a => (
                <div key={a.id} className="stat-card bg-[#E74C3C]/5 border-[#E74C3C]/20 flex gap-4">
                  <div className="shrink-0 text-[#E74C3C]"><AlertTriangle /></div>
                  <div>
                    <div className="font-bold text-sm text-white">{a.type || 'Alert'}</div>
                    <p className="text-xs text-white/60">{a.message}</p>
                    <time className="text-[10px] text-white/20 mt-2 block">{a.createdAt?.toDate?.().toLocaleString()}</time>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* New Recommendation */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star size={20} className="text-[#4ECDC4]" /> Post Recommendation
            </h2>
            <div className="stat-card">
              <form onSubmit={handleAddRec} className="space-y-4">
                <input 
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  placeholder="Recommendation Title" 
                  className="form-field"
                  required
                />
                <textarea 
                  value={recContent}
                  onChange={(e) => setRecContent(e.target.value)}
                  placeholder="Tip content..."
                  className="form-field min-h-[100px] resize-none"
                  required
                />
                <button 
                  disabled={isSavingRec}
                  type="submit" 
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSavingRec ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Publish for Everyone
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}