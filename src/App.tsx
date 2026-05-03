import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Shell } from './components/layout/Shell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Chat from './pages/Chat';
import Insights from './pages/Insights';
import Community from './pages/Community';
import Soundscapes from './pages/Soundscapes';
import Constellation from './pages/Constellation';
import Focus from './pages/Focus';
import Kernel from './pages/Kernel';
import Appointments from './pages/Appointments';
import Clinic from './pages/Clinic';
import Admin from './pages/Admin';
import Accounts from './pages/Accounts';
import Profile from './pages/Profile';
function PrivateRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { user, profile, loading } = useAuth();

  // Wait for auth to initialize
  if (loading) return (
    <div className="main-bg flex items-center justify-center min-h-screen">
      <div className="text-[#818CF8] text-xl font-bold animate-pulse">MindCare+ Loading...</div>
    </div>
  );
  
  // Must be logged in
  if (!user) return <Navigate to="/login" />;
  
  // Default role is patient if profile doesn't have role yet
  const userRole = profile?.role || 'patient';
  
  // Check role restrictions
  if (roles && !roles.includes(userRole)) {
    const redirectMap: Record<string, string> = {
      patient: '/dashboard',
      therapist: '/clinic',
      admin: '/admin'
    };
    return <Navigate to={redirectMap[userRole] || '/dashboard'} />;
  }

  return <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Patient Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute roles={['patient']}><Dashboard /></PrivateRoute>
          } />
          <Route path="/journal" element={
            <PrivateRoute roles={['patient', 'therapist']}><Journal /></PrivateRoute>
          } />
          <Route path="/chat" element={
            <PrivateRoute><Chat /></PrivateRoute>
          } />
          <Route path="/insights" element={
            <PrivateRoute roles={['patient']}><Insights /></PrivateRoute>
          } />
          <Route path="/soundscapes" element={
            <PrivateRoute roles={['patient']}><Soundscapes /></PrivateRoute>
          } />
          <Route path="/constellation" element={
            <PrivateRoute roles={['patient']}><Constellation /></PrivateRoute>
          } />
          <Route path="/focus" element={
            <PrivateRoute roles={['patient']}><Focus /></PrivateRoute>
          } />
          <Route path="/kernel" element={
            <PrivateRoute roles={['patient']}><Kernel /></PrivateRoute>
          } />
          <Route path="/community" element={
            <PrivateRoute roles={['patient', 'therapist']}><Community /></PrivateRoute>
          } />
          
          {/* Therapist Routes */}
          <Route path="/clinic" element={
            <PrivateRoute roles={['therapist']}><Clinic /></PrivateRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}><Admin /></PrivateRoute>
          } />
          
           {/* Shared Routes */}
          <Route path="/appointments" element={
            <PrivateRoute roles={['patient', 'therapist']}><Appointments /></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><Profile /></PrivateRoute>
          } />
          <Route path="/profile/edit" element={
            <PrivateRoute><Profile /></PrivateRoute>
          } />
          <Route path="/profile/password" element={
            <PrivateRoute><Profile /></PrivateRoute>
          } />
          <Route path="/accounts" element={
            <PrivateRoute><Accounts /></PrivateRoute>
          } />
           
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
