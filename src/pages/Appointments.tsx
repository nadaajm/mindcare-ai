import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, doc, onSnapshot } from '../lib/firebase';
import { getDb } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Appointment, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { Calendar, Clock, User, CheckCircle, XCircle, Plus, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Appointments() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [therapists, setTherapists] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  // Form state
  const [therapistId, setTherapistId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');



  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !therapistId || !date || !time) return;

    const start = new Date(`${date}T${time}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    try {
      const _db = getDb();
      if (!_db) throw new Error('Firebase not available');
      await addDoc(collection(_db, 'appointments'), {
        patientId: profile.id,
        therapistId,
        startTime: start,
        endTime: end,
        status: 'scheduled',
        type: 'Online Session',
        createdAt: serverTimestamp()
      });
      setShowAdd(false);
      setTherapistId('');
      setDate('');
      setTime('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'appointments');
    }
  };

  const updateStatus = async (id: string, status: 'completed' | 'cancelled') => {
    try {
      const _db = getDb();
      if (!_db) throw new Error('Firebase not available');
      await updateDoc(doc(_db, 'appointments', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'appointments');
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-[#818CF8]" size={20} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Liaison & Availability</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif-italic text-white">Sync <span className="text-[#818CF8]">Ops</span>.</h1>
          <p className="text-white/40 text-sm max-w-xl">
            Coordinating professional clinical resources for neural alignment and focused intervention.
          </p>
        </div>
        {profile?.role === 'patient' && (
          <button 
            onClick={() => setShowAdd(!showAdd)} 
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Book Check-in
          </button>
        )}
      </header>

      {showAdd && (
        <div className="glass-panel p-8 border-[#818CF8]/30 bg-[#818CF8]/5 animate-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Practitioner</label>
              <select 
                value={therapistId} 
                onChange={(e) => setTherapistId(e.target.value)}
                className="form-field text-sm"
                required
              >
                <option value="" className="bg-[#0A0A1F]">Select Professional</option>
                {therapists.map(t => (
                  <option key={t.id} value={t.id} className="bg-[#0A0A1F]">{t.displayName} — {t.specialty || 'General'}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Target Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="form-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Window</label>
              <input 
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)}
                className="form-field"
                required
              />
            </div>
            <button type="submit" className="btn-primary py-4 text-xs uppercase tracking-widest font-black">Verify Session</button>
          </form>
        </div>
      )}

      <div className="glass-panel p-0 overflow-hidden border-white/5 bg-white/[0.01]">
        <table className="data-table">
          <thead>
            <tr>
              <th className="pl-10 text-[10px]">Registry Node</th>
              <th className="text-[10px]">Temporal window</th>
              <th className="text-[10px]">Protocol</th>
              <th className="text-[10px]">State</th>
              <th className="text-[10px]">Authorization</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="pl-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:border-[#818CF8]/30 transition-colors">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">ID-{appt.id.slice(0, 5).toUpperCase()}</p>
                      <p className="text-[10px] text-white/20 uppercase tracking-tighter">Clinical Participant</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Calendar size={12} className="text-[#818CF8]" /> 
                      {appt.startTime?.toDate?.().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) || '...'}
                    </span>
                    <span className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1 flex items-center gap-2">
                      <Clock size={12} /> 
                      {appt.startTime?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...'}
                    </span>
                  </div>
                </td>
                <td><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#818CF8] bg-[#818CF8]/5 px-3 py-1 rounded-full border border-[#818CF8]/10">{appt.type}</span></td>
                <td>
                  <span className={cn(
                    "badge py-1.5 px-4 text-[9px] font-black",
                    appt.status === 'scheduled' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
                    appt.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                    "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  )}>
                    {appt.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className="flex gap-4">
                    {appt.status === 'scheduled' && (
                      <>
                        <button 
                          onClick={() => updateStatus(appt.id, 'completed')}
                          className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5 group/check" title="Authorize Completion">
                          <CheckCircle size={16} />
                        </button>
                        <button 
                          onClick={() => updateStatus(appt.id, 'cancelled')}
                          className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5" title="Terminate">
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 && !loading && (
          <div className="py-32 text-center">
            <Calendar size={60} className="mx-auto mb-6 text-white/5" />
            <p className="text-white/20 text-xs font-bold uppercase tracking-[0.3em]">No active operational sessions archived.</p>
          </div>
        )}
      </div>
    </div>
  );
}
