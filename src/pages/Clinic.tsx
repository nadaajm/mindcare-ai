import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from '../lib/firebase';
import { getDb } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { UserProfile, Appointment, Journal } from '../types';
import { OperationType, handleFirestoreError } from '../lib/error-handler';
import { Users, Calendar, DollarSign, Activity, ChevronRight, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Clinic() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendSync, setBackendSync] = useState(false);

  useEffect(() => {
    if (!profile) return;

    // Check Symfony API Sync
    fetch('/api/v1/clinic/stats')
      .then(r => r.ok && setBackendSync(true))
      .catch(() => setBackendSync(false));

    // Fetch patients (for simplicity, just fetch all users with role 'patient')
    const _db = getDb();
    if (!_db) { setLoading(false); return; }

    const pQ = query(collection(_db, 'users'), where('role', '==', 'patient'));
    const unsubP = onSnapshot(pQ, (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Fetch upcoming appointments
    const aQ = query(
      collection(_db, 'appointments'),
      where('therapistId', '==', profile.id),
      where('status', '==', 'scheduled'),
      orderBy('startTime', 'asc'),
      limit(10)
    );
    const unsubA = onSnapshot(aQ, (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
      setLoading(false);
    });

    return () => {
      unsubP();
      unsubA();
    };
  }, [profile]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="page-title text-white">Clinic Overview 🏥</h1>
          {backendSync && (
            <div className="px-2 py-0.5 rounded bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-[9px] font-black uppercase tracking-widest animate-pulse">
              Symfony-MVC Synced
            </div>
          )}
        </div>
        <p className="page-subtitle text-[#9B9BB0]">Managing your practice and patients</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card card-purple flex items-center justify-between">
          <div>
            <label className="stat-label uppercase tracking-wider text-[10px] font-bold">Total Patients</label>
            <div className="stat-number">{patients.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#6C63FF]/20 flex items-center justify-center text-[#6C63FF]">
            <Users size={24} />
          </div>
        </div>
        <div className="stat-card card-teal flex items-center justify-between">
          <div>
            <label className="stat-label uppercase tracking-wider text-[10px] font-bold">Sessions This Week</label>
            <div className="stat-number">{appointments.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#4ECDC4]/20 flex items-center justify-center text-[#4ECDC4]">
            <Calendar size={24} />
          </div>
        </div>
        <div className="stat-card card-rose flex items-center justify-between">
          <div>
            <label className="stat-label uppercase tracking-wider text-[10px] font-bold">New This Month</label>
            <div className="stat-number">{patients.filter(p => {
              const created = p.createdAt?.toDate?.();
              return created && created.getMonth() === new Date().getMonth();
            }).length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F472B6]/20 flex items-center justify-center text-[#F472B6]">
            <User size={24} />
          </div>
        </div>
      </div>

      {/* Patient List */}
      <section className="glass-card p-8 border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#818CF8]"></span>
            Patient Registry
          </h3>
          <span className="text-[10px] text-white/20">{patients.length} records</span>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {patients.length === 0 ? (
            <div className="text-center py-8 text-white/20 italic text-sm">No patient records found</div>
          ) : (
            patients.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#818CF8]/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1E1E3F] to-[#2D2D5F] border border-[#818CF8]/20 flex items-center justify-center text-[#818CF8] font-bold">
                    {p.displayName?.[0] || '?'} 
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{p.displayName}</div>
                    <div className="text-[10px] text-white/40">{p.email}</div>
                  </div>
                </div>
                <span className={cn(
                  "text-[9px] font-black px-3 py-1 rounded-full uppercase",
                  p.role === 'patient' ? "bg-blue-500/20 text-blue-400" :
                  p.role === 'therapist' ? "bg-emerald-500/20 text-emerald-400" :
                  "bg-purple-500/20 text-purple-400"
                )}>
                  {p.role ?? 'patient'}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Appointments */}
      <section className="glass-card p-8 border-white/5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-6 flex items-center gap-2">
          <Calendar size={12} />
          Upcoming Sessions
        </h3>
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-white/20 italic text-sm">No scheduled appointments</div>
          ) : (
            appointments.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#818CF8]/30 transition-all">
              <div className="flex items-center gap-4">
                    <Calendar size={16} className="text-[#818CF8]" />
                    <div>
                      <div className="text-sm text-white">
                        Session with {appt.patientId?.slice(0, 8) || 'Patient'}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">
                        {appt.startTime?.toDate?.().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) || '...'}
                      </div>
                      <div className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-0.5">
                        {appt.startTime?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...'} · 60min
                      </div>
                    </div>
                  </div>
                 <span className={cn(
                  "text-[9px] font-black px-3 py-1 rounded-full uppercase",
                  appt.status === 'scheduled' ? "bg-amber-500/20 text-amber-400" : 
                  appt.status === 'completed' ? "bg-emerald-500/20 text-emerald-400" :
                  "bg-rose-500/20 text-rose-400"
                )}>
                  {appt.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}