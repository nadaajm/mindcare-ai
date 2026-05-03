import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { profile, logout } = useAuth();

  return (
    <div className="min-h-screen main-bg p-8">
      <div className="glass-panel p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Welcome, {profile?.displayName}!</h1>
        <p className="text-white/60 mb-8">MindCare AI Dashboard</p>
        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/insights" className="glass-card p-6 text-center hover:scale-105">
            <h3 className="text-xl font-bold text-white mb-2">Insights</h3>
            <p className="text-white/60">View AI analysis</p>
          </Link>
          <Link to="/chat" className="glass-card p-6 text-center hover:scale-105">
            <h3 className="text-xl font-bold text-white mb-2">AI Chat</h3>
            <p className="text-white/60">Talk to your AI therapist</p>
          </Link>
          <button onClick={logout} className="btn-primary py-4">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

