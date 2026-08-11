import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { User, STORAGE_KEYS } from './src/types'; 
import { PublicPage } from './src/pages/PublicPage';
import { ResultsPage } from './src/pages/ResultsPage';
import { SchedulePage } from './src/pages/SchedulePage';
import { GalleryPage } from './src/pages/GalleryPage';
import { MaintenancePage } from './src/pages/MaintenancePage';
import { LoginPage } from './src/pages/LoginPage';
import { FestSetupPage } from './src/pages/FestSetupPage';
import { DashboardLayout } from './src/layouts/DashboardLayout';
import { usePrograms } from './src/hooks/usePrograms';
import { authService } from './src/services/authService';
import { auth } from './src/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useStaffs } from './src/hooks/useStaffs';
import { useSettings } from './src/hooks/useSettings';

// ---> NEW IMPORT: Marketing Page <---
import { MarketingPage } from './src/pages/MarketingPage';
import { SuperAdminPage } from './src/pages/SuperAdminPage';

// Wrapper for Public Fest Pages
const PublicFestRoute = ({ component: Component }: { component: any }) => {
  const { festId } = useParams<{ festId: string }>();
  const { programs, loading } = usePrograms(festId || null);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Fest Data...</div>;
  }

  return <Component programs={programs} festId={festId} />;
};

// Wrapper for Staff Login
const StaffLoginRoute = ({ onLogin, isMaintenanceMode, currentUser }: { onLogin: any, isMaintenanceMode: boolean, currentUser: any }) => {
  const { festId } = useParams<{ festId: string }>();

  if (currentUser) {
    if (currentUser.festId) {
      return <Navigate to={`/fests/${currentUser.festId}/dashboard`} replace />;
    }
    return <Navigate to="/setup-fest" replace />;
  }

  const handleStaffLogin = (username: string, pass: string) => {
    return onLogin(username, pass, festId);
  };

  return <LoginPage onLogin={handleStaffLogin} isMaintenanceMode={isMaintenanceMode} adminOnly={false} />;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.USER);
      return null;
    }
  });

  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  
  const { programs, setPrograms, loading: programsLoading, error, addProgram, updateProgram, deleteProgram } = usePrograms(currentUser?.festId || null);
  const { staffs, addStaff, updateStaff, deleteStaff } = useStaffs(currentUser?.festId || null);
  const { settings, updateSettings, loading: settingsLoading } = useSettings(currentUser?.festId || null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (!user && (!savedUser || JSON.parse(savedUser).role === 'admin')) {
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  const handleLogin = async (username: string, password: string, specificFestId?: string): Promise<{ success: boolean; error?: string }> => {
    if (username === 'admin' && password === 'admin') {
      const mockAdmin: User = { uid: 'admin-1', username: 'admin', role: 'admin', festId: specificFestId || 'default-fest', displayName: 'System Admin' };
      setCurrentUser(mockAdmin);
      return { success: true };
    }

    const res = await authService.loginStaff(username.trim(), password.trim(), specificFestId);
    if (!res.success || !res.user) {
      return { success: false, error: res.error || `Invalid credentials for ${username}` };
    }

    setCurrentUser(res.user);
    return { success: true };
  };

  const handleGoogleLogin = async (): Promise<{ success: boolean; error?: string }> => {
    const res = await authService.loginWithGoogle();
    if (!res.success) {
      return { success: false, error: res.error || 'Google login failed' };
    }

    const user: User = {
      uid: auth.currentUser?.uid || 'google-admin',
      username: auth.currentUser?.email || 'admin',
      role: 'admin',
      festId: res.festId || '',
      displayName: auth.currentUser?.displayName || 'Fest Convenor'
    };

    setCurrentUser(user);
    return { success: true };
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/maintenance" element={<MaintenancePage />} />
        
        {/* Supreme Admin Route */}
        <Route path="/supreme-admin" element={<SuperAdminPage />} />
        
        {/* Base URL: Now mapped to our new Marketing Page */}
        <Route path="/" element={<MarketingPage />} />

        {/* Public Fest URLs */}
        <Route path="/fests/:festId" element={<PublicFestRoute component={PublicPage} />} />
        <Route path="/fests/:festId/results" element={<PublicFestRoute component={ResultsPage} />} />
        <Route path="/fests/:festId/schedule" element={<PublicFestRoute component={SchedulePage} />} />
        <Route path="/fests/:festId/gallery" element={<GalleryPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={
          !currentUser ? (
            <LoginPage onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} isMaintenanceMode={isMaintenanceMode} adminOnly={true} />
          ) : currentUser.festId ? (
            <Navigate to={`/fests/${currentUser.festId}/dashboard`} replace />
          ) : (
            <Navigate to="/setup-fest" replace />
          )
        } />
        
        {/* Staff Specific Login URL */}
        <Route path="/fests/:festId/login" element={
          <StaffLoginRoute onLogin={handleLogin} isMaintenanceMode={isMaintenanceMode} currentUser={currentUser} />
        } />

        <Route path="/setup-fest" element={
          currentUser && !currentUser.festId ? (
            <FestSetupPage onFestCreated={(festId) => {
              setCurrentUser(prev => prev ? { ...prev, festId } : null);
            }} />
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Admin Dashboard */}
        <Route path="/fests/:festId/dashboard" element={
          currentUser ? (
            <DashboardLayout
              currentUser={currentUser}
              programs={programs}
              setPrograms={setPrograms}
              loading={programsLoading || settingsLoading}
              error={error}
              addProgram={addProgram}
              updateProgram={updateProgram}
              deleteProgram={deleteProgram}
              staffs={staffs}
              addStaff={addStaff}
              updateStaff={updateStaff}
              deleteStaff={deleteStaff}
              settings={settings}
              updateSettings={updateSettings}
              handleLogout={handleLogout}
              isMaintenanceMode={isMaintenanceMode}
              setIsMaintenanceMode={setIsMaintenanceMode}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}