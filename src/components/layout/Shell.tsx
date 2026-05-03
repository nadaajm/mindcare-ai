import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Book, 
  MessageSquare, 
  Calendar, 
  Stethoscope, 
  Shield, 
  User, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  Wind,
  Bell,
  Search,
  Activity,
  Headphones,
  Users,
  Cpu,
  Target,
  Database,
  ArrowRight
} from 'lucide-react';

import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { getGlobalSearchAnalysis } from '../../lib/ai';

import SystemBroadcast from './SystemBroadcast';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void | Promise<void> | any;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "nav-item",
      active && "nav-item-active"
    )}
  >
    <Icon size={18} className={cn("transition-colors", active ? "text-[#818CF8]" : "text-white/40")} />
    <span>{label}</span>
    {active && (
      <motion.div 
        layoutId="active-indicator"
        className="absolute right-0 top-[20%] h-[60%] w-[3px] bg-[#818CF8] rounded-l-full shadow-[-2px_0_10px_rgba(129,140,248,0.8)]"
      />
    )}
  </button>
);

export function Shell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [breathState, setBreathState] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  // Command palette shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsPaletteOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 3) return;
    setIsSearching(true);
    // In a real app, you'd fetch data here. For demo, we search menu items + mock content
    const analysis = await getGlobalSearchAnalysis(val, filteredMenu);
    setSearchResults(analysis);
    setIsSearching(false);
  };

  // Simple Breathing logic loop
  useEffect(() => {
    const timer = setInterval(() => {
      setBreathState(prev => {
        if (prev === 'inhale') return 'hold';
        if (prev === 'hold') return 'exhale';
        return 'inhale';
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { icon: Home, label: 'Omni Deck', path: '/dashboard', roles: ['patient'] },
    { icon: Cpu, label: 'Neural Map', path: '/constellation', roles: ['patient'] },
    { icon: Target, label: 'Focus Lab', path: '/focus', roles: ['patient'] },
    { icon: Headphones, label: 'Sound Waves', path: '/soundscapes', roles: ['patient'] },
    { icon: Database, label: 'Neural Kernel', path: '/kernel', roles: ['patient'] },
    { icon: Activity, label: 'Bio Trends', path: '/insights', roles: ['patient'] },
    { icon: Stethoscope, label: 'Clinic Hub', path: '/clinic', roles: ['therapist'] },
    { icon: Book, label: 'Mind Logs', path: '/journal', roles: ['patient', 'therapist'] },
    { icon: Users, label: 'The Circle', path: '/community', roles: ['patient', 'therapist'] },
    { icon: MessageSquare, label: 'Lumina AI', path: '/chat', roles: ['patient'] },
    { icon: Calendar, label: 'Sync Ops', path: '/appointments', roles: ['patient', 'therapist'] },
    { icon: Shield, label: 'Nexus Admin', path: '/admin', roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => 
    !item.roles || (profile && item.roles.includes(profile.role))
  );

  return (
    <div className="main-bg flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="sidebar w-72 fixed left-0 top-0 h-full z-30 bg-[#0A0A1F]/90 backdrop-blur-xl border-r border-white/5 lg:flex md:block">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#818CF8] to-[#6366F1] flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-serif-italic text-white">Mind</span>
              <span className="text-xl font-serif-italic text-[#818CF8]">Care+</span>
            </div>
          </div>

          <nav className="space-y-1">
            {filteredMenu.map((item) => (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-6">
          {/* Breath of Peace Widget */}
          <div className="glass-card p-4 bg-indigo-500/5 border-indigo-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Wind size={14} className="text-[#818CF8]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#818CF8]">Breath of Peace</span>
            </div>
            <div className="flex flex-col items-center justify-center py-2">
              <motion.div 
                animate={{ 
                  scale: breathState === 'inhale' ? 1.2 : breathState === 'hold' ? 1.2 : 0.8,
                  opacity: breathState === 'hold' ? 0.8 : 1
                }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className="w-12 h-12 rounded-full bg-[#818CF8]/20 border border-[#818CF8]/40 flex items-center justify-center"
              >
                <div className="w-4 h-4 rounded-full bg-[#818CF8] shadow-[0_0_20px_rgba(129,140,248,0.8)]" />
              </motion.div>
              <span className="text-[10px] mt-3 font-medium text-white/40 uppercase tracking-widest">
                {breathState}...
              </span>
            </div>
          </div>

          <div className="p-6 my-4 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#818CF8]">Neural Pulse</span>
              </div>
              <span className="text-[8px] text-white/20 font-bold tracking-tighter">CALIBRATED</span>
            </div>
            <p className="text-[9px] text-white/40 leading-relaxed italic">
              "Collective resonance is stabilizing at 84% coherence. Synchronized clarity protocols active."
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-1">

            <SidebarItem
              icon={User}
              label="Account"
              active={location.pathname === '/accounts'}
              onClick={() => navigate('/accounts')}
            />
            <SidebarItem
              icon={User}
              label="Account Sync"
              active={location.pathname === '/profile'}
              onClick={() => navigate('/profile')}
            />
            <button
              onClick={logout}
              className="nav-item text-red-500/60 hover:text-red-500 hover:bg-red-500/5"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Quick Action FAB */}
      <div className="fixed bottom-10 right-10 z-[100]">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/chat')}
          className="w-16 h-16 rounded-full bg-[#818CF8] text-white flex items-center justify-center shadow-[0_20px_50px_rgba(129,140,248,0.4)] group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageSquare className="relative z-10" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#F472B6] rounded-full border-4 border-[#0A0A1F] flex items-center justify-center animate-bounce">
              <Sparkles size={8} className="text-white" />
          </div>
        </motion.button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Command Palette Overlay */}
        <AnimatePresence>
          {isPaletteOpen && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[1000] bg-[#0A0A1F]/90 backdrop-blur-md flex items-start justify-center pt-[15vh] px-4"
               onClick={() => setIsPaletteOpen(false)}
            >
               <motion.div 
                 initial={{ scale: 0.95, y: 20 }}
                 animate={{ scale: 1, y: 0 }}
                 exit={{ scale: 0.95, y: 20 }}
                 className="w-full max-w-2xl glass-panel border-white/5 bg-[#0A0A1F] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
                 onClick={e => e.stopPropagation()}
               >
                  <div className="flex items-center gap-4 p-6 border-b border-white/5 bg-white/5">
                     <Search className="text-white/20" size={20} />
                     <input 
                       autoFocus
                       placeholder="Access neural archives... (search for anything)"
                       className="flex-1 bg-transparent border-none outline-none text-white font-mono text-lg placeholder:text-white/10"
                       value={searchQuery}
                       onChange={e => handleSearch(e.target.value)}
                     />
                     <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-white/30 font-mono">
                        ESC
                     </div>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                     {!searchQuery ? (
                        <div className="space-y-4 p-4">
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/20">System Commands</span>
                           <div className="grid grid-cols-2 gap-3">
                              {filteredMenu.slice(0, 6).map(item => (
                                 <button 
                                   key={item.path}
                                   onClick={() => { navigate(item.path); setIsPaletteOpen(false); }}
                                   className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all text-left group"
                                 >
                                    <item.icon size={16} className="text-white/20 group-hover:text-[#818CF8]" />
                                    <span className="text-xs font-bold text-white/60">{item.label}</span>
                                 </button>
                              ))}
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-6 p-4">
                           {isSearching ? (
                              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                 <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8] animate-pulse" />
                                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Querying AI Oracle...</span>
                              </div>
                           ) : searchResults ? (
                              <div className="space-y-6">
                                 <div className="p-6 rounded-2xl bg-[#818CF8]/5 border border-[#818CF8]/20">
                                    <div className="flex items-center gap-2 mb-2 text-[#818CF8]">
                                       <Sparkles size={14} />
                                       <span className="text-[10px] font-black uppercase tracking-widest">AI Synthesis</span>
                                    </div>
                                    <p className="text-sm text-white/70 leading-relaxed italic">"{searchResults.summary}"</p>
                                 </div>
                                 <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Context Matches</span>
                                    {filteredMenu.filter(m => m.label.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                                        <button 
                                          key={item.path} 
                                          onClick={() => { navigate(item.path); setIsPaletteOpen(false); }}
                                          className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5"
                                        >
                                           <div className="flex items-center gap-4">
                                              <item.icon size={16} className="text-[#818CF8]" />
                                              <span className="text-sm font-medium text-white">{item.label}</span>
                                           </div>
                                           <ArrowRight size={14} className="text-white/20" />
                                        </button>
                                    ))}
                                 </div>
                              </div>
                           ) : null}
                        </div>
                     )}
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-[#0A0A1F]/80 backdrop-blur-md z-40">
          <div className="lg:hidden flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="text-white" />
            </button>
            <span className="text-xl font-serif-italic text-white">MindCare+</span>
          </div>

          <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 w-96 gap-3 focus-within:border-[#818CF8]/50 transition-colors">
            <Search size={16} className="text-white/30" />
            <input 
              placeholder="Search journals, insights, sessions..." 
              className="bg-transparent text-xs text-white outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:block">
              <SystemBroadcast />
            </div>
            <button className="relative text-white/40 hover:text-white transition-colors">
              <Bell size={20} />
              <div className="absolute top-0 right-0 w-2 h-2 bg-[#F472B6] rounded-full border-2 border-[#0A0A1F]" />
            </button>
            
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white group-hover:text-[#818CF8] transition-colors">{profile?.displayName}</p>
                <p className="text-[10px] text-white/30 capitalize">{profile?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1E1E3F] to-[#2D2D5F] border border-white/10 flex items-center justify-center text-white/40 group-hover:border-[#818CF8]/50 overflow-hidden transition-all">
                {profile?.photoUrl ? (
                  <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
            </button>
          </div>
        </header>

        <section className="p-8 lg:p-12 custom-scrollbar overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0A0A1F] z-[101] p-8 border-r border-white/5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-2">
                  <Sparkles size={24} className="text-[#818CF8]" />
                  <span className="text-xl font-serif-italic text-white">MindCare+</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X />
                </button>
              </div>
              <nav className="space-y-1">
                {filteredMenu.map((item) => (
                  <SidebarItem
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    active={location.pathname === item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                  />
                ))}
              </nav>
              
              <div className="mt-auto pt-6 border-t border-white/5 space-y-1">
                 <SidebarItem
                  icon={User}
                  label="Account"
                  active={location.pathname === '/accounts'}
                  onClick={() => {
                    navigate('/accounts');
                    setIsMobileMenuOpen(false);
                  }}
                />
                <SidebarItem
                  icon={User}
                  label="Account Sync"
                  active={location.pathname === '/profile'}
                  onClick={() => {
                    navigate('/profile');
                    setIsMobileMenuOpen(false);
                  }}
                />
                <button
                  onClick={logout}
                  className="nav-item text-red-500/60 hover:text-red-500 hover:bg-red-500/5"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
