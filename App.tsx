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
import { setSuperAdminUi } from './src/services/sessionFlags';
import { AppDialogHost } from './src/components/ui/AppDialog';

// ---> NEW IMPORT: Marketing Page <---
import { MarketingPage } from './src/pages/MarketingPage';
import { SuperAdminPage } from './src/pages/SuperAdminPage';

// Wrapper for Public Fest Pages
const PublicFestRoute = ({ component: Component }: { component: any }) => {
  const { festId } = useParams<{ festId: string }>();
  const { programs, loading } = usePrograms(festId || null, { access: 'public' });

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

// Only the fest the session is authorised for can be opened; a Super Admin switches fest.
const DashboardRoute = ({ currentUser, onSuperAdminFest, children }: { currentUser: User; onSuperAdminFest: (festId: string) => void; children: React.ReactNode }) => {
  const { festId } = useParams<{ festId: string }>();
  useEffect(() => {
    if (festId && currentUser.isSuperAdmin && festId !== currentUser.festId) onSuperAdminFest(festId);
  }, [festId, currentUser.isSuperAdmin, currentUser.festId, onSuperAdminFest]);

  if (festId && festId !== currentUser.festId && !currentUser.isSuperAdmin) {
    return currentUser.festId ? <Navigate to={`/fests/${currentUser.festId}/dashboard`} replace /> : <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  // The session is derived only from the verified Firebase session (see resolveSession).
  // Anything a browser stores is never trusted for authorisation.
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);

  const role = String(currentUser?.role || '').toLowerCase().replace('_', '');
  const programAccess = role === 'teamleader' ? 'public' : role === 'judge' ? 'judge' : 'private';
  const { programs, setPrograms, loading: programsLoading, error, addProgram, updateProgram, deleteProgram } = usePrograms(currentUser?.festId || null, { access: programAccess, judgePanel: currentUser?.judgePanel, teamName: currentUser?.teamName });
  const { staffs, addStaff, updateStaff, deleteStaff } = useStaffs(currentUser?.festId || null, currentUser);
  const { settings, updateSettings, loading: settingsLoading } = useSettings(currentUser?.festId || null);

  useEffect(() => {
    // Remove the old, trusted-by-the-client session record if a previous version stored one.
    try { localStorage.removeItem(STORAGE_KEYS.USER); } catch { /* storage unavailable */ }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setCurrentUser(await authService.resolveSession(firebaseUser));
      } catch (err) {
        console.error('Could not restore session:', err);
        setCurrentUser(null);
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { setSuperAdminUi(currentUser?.isSuperAdmin === true); }, [currentUser]);

  const selectSuperAdminFest = React.useCallback((festId: string) => {
    authService.setSuperAdminFest(festId);
    setCurrentUser(prev => (prev?.isSuperAdmin ? { ...prev, festId, displayName: 'Supreme Admin' } : prev));
  }, []);

  const handleLogin = async (username: string, password: string, specificFestId?: string): Promise<{ success: boolean; error?: string }> => {
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

    // Re-read the session after the profile write so festId / claims are current.
    setCurrentUser(await authService.resolveSession(auth.currentUser));
    return { success: true };
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  if (!authReady) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
    <AppDialogHost />
    <HashRouter>
      <Routes>
        <Route path="/maintenance" element={<MaintenancePage />} />

        {/* Supreme Admin Route */}
        <Route path="/supreme-admin" element={<SuperAdminPage onEnterFest={selectSuperAdminFest} />} />
        
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
            <DashboardRoute currentUser={currentUser} onSuperAdminFest={selectSuperAdminFest}>
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
            </DashboardRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
    </>
  );
}