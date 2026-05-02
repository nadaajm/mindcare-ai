import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, Sparkles, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Error code to message mapping
const getErrorMessage = (code: string): string => {
  const errorMap: Record<string, string> = {
    'invalid-email': 'Please enter a valid email address',
    'user-not-found': 'No account found with this email',
    'wrong-password': 'Incorrect password. Please try again',
    'email-already-in-use': 'An account with this email already exists',
    'weak-password': 'Password must be at least 6 characters',
    'network-request-failed': 'Network error. Please check your connection',
    'too-many-requests': 'Too many attempts. Please wait and try again',
  };
  return errorMap[code] || 'An error occurred. Please try again.';
};

export default function Login() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Validation state
  const [emailValidation, setEmailValidation] = useState({ isValid: false, message: '' });
  const [passwordValidation, setPasswordValidation] = useState({ isValid: false, message: '' });

  // Validate email
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailValidation({ isValid: false, message: '' });
    } else if (!emailRegex.test(value)) {
      setEmailValidation({ isValid: false, message: 'Invalid email format' });
    } else {
      setEmailValidation({ isValid: true, message: '' });
    }
  };

  // Validate password
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordValidation({ isValid: false, message: '' });
    } else if (value.length < 6) {
      setPasswordValidation({ isValid: false, message: 'Password must be at least 6 characters' });
    } else {
      setPasswordValidation({ isValid: true, message: '' });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate email and password before sending
    validateEmail(email);
    validatePassword(password);
    
    if (!emailValidation.isValid || !passwordValidation.isValid) {
      setError("Please fix the validation errors before continuing.");
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        // Register new user via MySQL backend
        setProfileLoading(true);
        const response = await fetch('/api/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName })
        });
        
        const data = await response.json();
        
        if (!data.success) {
          setError(data.error || 'Registration failed. Please try again.');
          setLoading(false);
          setProfileLoading(false);
          return;
        }
        
         // Store user in localStorage for session
         localStorage.setItem('user', JSON.stringify(data.user));
         setLoading(false);
         setProfileLoading(false);
         navigate('/dashboard');
      } else {
        // Login with existing user via MySQL backend
        const response = await fetch('/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!data.success) {
          setError(data.error || 'Login failed. Please try again.');
          setLoading(false);
          return;
        }
        
         // Store user in localStorage for session
         localStorage.setItem('user', JSON.stringify(data.user));
         setLoading(false);
         navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
      setProfileLoading(false);
    }
  };

  return (
    <div className="main-bg flex items-center justify-center p-6 min-h-screen relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#818CF8]/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#34D399]/10 rounded-full blur-[100px] animate-pulse-slow ml-20" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] z-10"
      >
        <div className="glass-panel p-8 md:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
          <div className="text-center space-y-6 mb-10">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#818CF8] to-[#6366F1] flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles size={28} className="text-white" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-3xl font-serif-italic text-white">Mind</span>
                <span className="text-3xl font-serif-italic text-[#818CF8]">Care+</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {isRegistering ? "Initiate Journey" : "Return to Clarity"}
              </h1>
              <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em] mt-2">
                Professional Mental Wellness Ecosystem
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs font-medium text-center mb-6"
              >
                {error}
              </motion.div>
            )}
            {profileLoading && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-indigo-400 text-xs font-medium text-center mb-6 flex items-center justify-center gap-2"
              >
                <Loader2 className="animate-spin" size={16} />
                Setting up your account...
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Full Identity</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#818CF8] transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="form-field pl-12"
                    placeholder="Enter full name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Email Node</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#818CF8] transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className={cn(
                    "form-field pl-12",
                    emailValidation.isValid && "border-green-500/30",
                    emailValidation.message && "border-red-500/30"
                  )}
                  placeholder="name@nexus.com"
                />
                {emailValidation.isValid && email && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                )}
                {!emailValidation.isValid && emailValidation.message && (
                  <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" size={16} />
                )}
              </div>
              {emailValidation.message && (
                <p className="text-red-400 text-[10px] ml-1">{emailValidation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Security Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#818CF8] transition-colors" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  className={cn(
                    "form-field pl-12",
                    passwordValidation.isValid && "border-green-500/30",
                    passwordValidation.message && "border-red-500/30"
                  )}
                  placeholder="••••••••"
                />
                {passwordValidation.isValid && password && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                )}
                {!passwordValidation.isValid && passwordValidation.message && (
                  <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" size={16} />
                )}
              </div>
              {passwordValidation.message && (
                <p className="text-red-400 text-[10px] ml-1">{passwordValidation.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-3 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <span>{isRegistering ? "Deploy Account" : "Access Console"}</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-[#0A0A1F] px-4 text-white/20 text-glow-primary">Protocol</span>
            </div>
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs font-bold uppercase tracking-[0.2em] text-[#818CF8] hover:text-white transition-colors"
            >
              {isRegistering 
                ? "Switch to Existing Node" 
                : "Initialize New Node"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
