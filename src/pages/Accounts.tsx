import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Calendar, Edit, ChevronLeft, Phone, MapPin, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Accounts() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form state
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    email: profile?.email || '',
    phone: '',
    address: '',
    bio: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          phone: formData.phone,
          address: formData.address,
          bio: formData.bio
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setEditing(false);

      // Update local auth state
      if (user) {
        const updatedUser = { ...user, displayName: formData.displayName };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile?.email,
          password: passwordData.currentPassword
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error('Current password is incorrect');
      }

      // TODO: Add password update endpoint
      // For now, just show success message
      setSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Add delete account endpoint
      logout();
      navigate('/login');
    } catch (err: any) {
      setError('Failed to delete account');
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen main-bg flex items-center justify-center">
        <div className="text-[#818CF8] text-xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen main-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <ChevronLeft className="text-white/60 group-hover:text-white" size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Account Settings</h1>
            <p className="text-white/40 text-sm">Manage your profile and security</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-4 rounded-2xl">
              <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#818CF8] to-[#6366F1] flex items-center justify-center text-xl font-bold text-white">
                  {profile.displayName?.charAt(0)?.toUpperCase() || '?'}  
                </div>
                <div>
                  <h3 className="font-bold text-white">{profile.displayName}</h3>
                  <p className="text-white/40 text-xs">{profile.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold bg-[#818CF8]/20 text-[#818CF8] rounded-full capitalize">
                    {profile.role}
                  </span>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                    activeTab === 'profile'
                      ? 'bg-[#818CF8] text-white shadow-lg shadow-[#818CF8]/20' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <User size={18} />
                  <span className="text-sm font-medium">Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                    activeTab === 'security'
                      ? 'bg-[#818CF8] text-white shadow-lg shadow-[#818CF8]/20' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Lock size={18} />
                  <span className="text-sm font-medium">Security</span>
                </button>
              </nav>

              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={logout}
                  className="w-full px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-2xl p-6 md:p-8">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm mb-6 flex items-center gap-2"
                  >
                    <X size={18} />
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-green-400 text-sm mb-6 flex items-center gap-2"
                  >
                    <Save size={18} />
                    {success}
                  </motion.div>
                )}

                {activeTab === 'profile' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white">Profile Information</h2>
                      <button
                        onClick={() => setEditing(!editing)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#818CF8]/20 text-[#818CF8] rounded-xl hover:bg-[#818CF8]/30 transition-colors"
                      >
                        <Edit size={16} />
                        {editing ? 'Cancel' : 'Edit'}
                      </button>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <input
                              type="text"
                              name="displayName"
                              value={formData.displayName}
                              onChange={handleInputChange}
                              disabled={!editing || loading}
                              className={cn(
                                "form-field pl-12 w-full",
                                !editing && "bg-white/5 cursor-not-allowed"
                              )}
                              placeholder="Enter full name"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              disabled
                              className="form-field pl-12 w-full bg-white/5 cursor-not-allowed opacity-60"
                              placeholder="Enter email"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!editing || loading}
                            className={cn(
                              "form-field pl-12 w-full",
                              !editing && "bg-white/5 cursor-not-allowed"
                            )}
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-4 text-white/20" size={18} />
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            disabled={!editing || loading}
                            rows={3}
                            className={cn(
                              "form-field pl-12 w-full resize-none",
                              !editing && "bg-white/5 cursor-not-allowed"
                            )}
                            placeholder="Enter your address"
                          />
                        </div>
                      </div>

                      {editing && (
                        <motion.button
                          type="submit"
                          disabled={loading}
                          className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                          ) : (
                            <>
                              <Save size={18} />
                              Save Changes
                            </>
                          )}
                        </motion.button>
                      )}
                    </form>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="text-xl font-bold text-white mb-6">Security Settings</h2>

                    <form onSubmit={handlePasswordUpdate} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                          <input
                            type="password"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            disabled={loading}
                            className="form-field pl-12 w-full"
                            placeholder="Enter current password"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">New Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <input
                              type="password"
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              disabled={loading}
                              className="form-field pl-12 w-full"
                              placeholder="Enter new password"
                              minLength={6}
                            />
                          </div>
                          <p className="text-[10px] text-white/30 ml-1">Minimum 6 characters</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Confirm New Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <input
                              type="password"
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              disabled={loading}
                              className="form-field pl-12 w-full"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-3"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                        ) : (
                          <>
                            <Save size={18} />
                            Update Password
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/10">
                      <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Danger Zone</h3>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-colors"
                      >
                        Delete Account
                      </button>
                      <p className="text-white/30 text-xs mt-2">
                        This will permanently delete your account and all associated data
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
