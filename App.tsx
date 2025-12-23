import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Program } from './src/types';
import { AdminPage } from './src/pages/AdminPage';
import { GreenRoomPage } from './src/pages/GreenRoomPage';
import { TeamLeaderPage } from './src/pages/TeamLeaderPage';
import { JudgesPage } from './src/pages/JudgesPage';
import { PublicPage } from './src/pages/PublicPage';
import { MaintenancePage } from './src/pages/MaintenancePage';
import { usePrograms } from './src/hooks/usePrograms';
import './src/utils/clearFirebase';

type UserRole = 'admin' | 'greenroom' | 'judge' | 'teamleader';
type ViewType = 'ADMIN' | 'GREEN_ROOM' | 'TEAM_LEADER' | 'JUDGES';

interface User {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  teamName?: string;
  judgePanel?: string;
}

// Predefined user credentials
const USERS: User[] = [
  { username: 'admin', password: 'admin123', role: 'admin', displayName: 'Administrator' },
  { username: 'greenroom', password: 'green123', role: 'greenroom', displayName: 'Green Room Clerk' },
  { username: 'judge1', password: 'judge123', role: 'judge', displayName: 'Judge - Stage 1', judgePanel: 'Stage 1' },
  { username: 'ahsani', password: 'ahsani', role: 'judge', displayName: 'Ahsani Usthad', judgePanel: 'Ahsani Usthad' },
  { username: 'ajmal', password: 'ajmal', role: 'judge', displayName: 'Ajmal Usthad', judgePanel: 'Ajmal Usthad' },
  { username: 'suhail', password: 'suhail', role: 'judge', displayName: 'Suhail Usthad', judgePanel: 'Suhail Usthad' },
  { username: 'PRUDENTIA', password: 'team1pass', role: 'teamleader', displayName: 'Team Leader', teamName: 'PRUDENTIA' },
  { username: 'SAPIENTIA', password: 'team2pass', role: 'teamleader', displayName: 'Team Leader', teamName: 'SAPIENTIA' }
];

const STORAGE_KEYS = {
  USER: 'Intensia_current_user',
  VIEW: 'Intensia_current_view'
};

// Login Page Component
interface LoginPageProps {
  onLogin: (username: string, password: string) => boolean;
  isMaintenanceMode: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isMaintenanceMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const success = onLogin(username, password);
      if (!success) {
        setError(isMaintenanceMode ? 'Maintenance Mode Active: Only Admins can login' : 'Invalid username or password');
        setPassword('');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isMaintenanceMode && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <h3 className="text-sm font-black text-amber-800 uppercase">System Maintenance</h3>
              <p className="text-xs text-amber-700 font-medium">Only Administrators can access the portal now.</p>
            </div>
          </div>
        )}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <span className="text-4xl font-black text-white">A</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Intensia Arts fest</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 text-center">
            Sign In to Continue
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-bold text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <Link
              to="/"
              className="block w-full text-center px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all"
            >
              View Public Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Layout Component
const Dashboard = ({
  currentUser,
  programs,
  loading,
  error,
  addProgram,
  updateProgram,
  deleteProgram,
  handleLogout,
  isMaintenanceMode,
  setIsMaintenanceMode
}: {
  currentUser: User;
  programs: Program[];
  loading: boolean;
  error: string | null;
  addProgram: any;
  updateProgram: any;
  deleteProgram: any;
  handleLogout: () => void;
  isMaintenanceMode: boolean;
  setIsMaintenanceMode: (mode: boolean) => void;
}) => {
  const [view, setView] = useState<ViewType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIEW);
      // Ensure saved view is valid for dashboard, otherwise default to ADMIN (or appropriate role default)
      if (saved === 'PUBLIC') return 'ADMIN';
      return (saved as ViewType) || 'ADMIN';
    } catch (error) {
      localStorage.removeItem(STORAGE_KEYS.VIEW);
      return 'ADMIN';
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW, view);
  }, [view]);

  // Set initial view based on role when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      switch (currentUser.role) {
        case 'admin':
          // Don't force view if it's already set to something valid for admin
          if (view !== 'ADMIN' && view !== 'GREEN_ROOM') setView('ADMIN');
          break;
        case 'greenroom': setView('GREEN_ROOM'); break;
        case 'teamleader': setView('TEAM_LEADER'); break;
        case 'judge': setView('JUDGES'); break;
      }
    }
  }, [currentUser.role]);


  const canAccessView = (viewType: ViewType): boolean => {
    if (!currentUser) return false;
    switch (currentUser.role) {
      case 'admin':
        return viewType === 'ADMIN' || viewType === 'GREEN_ROOM';
      case 'greenroom':
        return viewType === 'GREEN_ROOM';
      case 'judge':
        return viewType === 'JUDGES';
      case 'teamleader':
        return viewType === 'TEAM_LEADER';
      default:
        return false;
    }
  };

  const setPrograms = React.useCallback((updater: React.SetStateAction<Program[]>) => {
    if (typeof updater === 'function') {
      const newPrograms = updater(programs);
      newPrograms.forEach((newProg, index) => {
        const oldProg = programs[index];
        if (oldProg && JSON.stringify(oldProg) !== JSON.stringify(newProg)) {
          updateProgram(newProg.id, newProg);
        }
      });
    }
  }, [programs, updateProgram]);

  const renderContent = () => {
    if (!canAccessView(view)) return null;

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-bold text-slate-600">Loading programs from Firebase...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
            <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Data</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'ADMIN':
        // NOTE: We pass setPrograms as prop, avoiding strict type check mismatch if any
        return <AdminPage programs={programs} setPrograms={setPrograms} addProgram={addProgram} updateProgram={updateProgram} deleteProgram={deleteProgram} />;
      case 'GREEN_ROOM':
        return <GreenRoomPage programs={programs} setPrograms={setPrograms} updateProgram={updateProgram} />;
      case 'JUDGES':
        return <JudgesPage programs={programs} setPrograms={setPrograms} currentUser={currentUser} />;
      case 'TEAM_LEADER':
        return currentUser?.teamName ? (
          <TeamLeaderPage
            teamName={currentUser.teamName}
            programs={programs}
            setPrograms={setPrograms}
            onLogout={handleLogout}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg">A</div>
              <h1 className="text-sm font-black tracking-tight hidden sm:block">Intensia Arts fest</h1>
            </div>

            <nav className="flex items-center bg-slate-100 p-1 rounded-xl">
              {canAccessView('ADMIN') && (
                <button
                  onClick={() => setView('ADMIN')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'ADMIN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Admin
                </button>
              )}
              {canAccessView('GREEN_ROOM') && (
                <button
                  onClick={() => setView('GREEN_ROOM')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'GREEN_ROOM' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Green Room
                </button>
              )}
              {canAccessView('TEAM_LEADER') && (
                <button
                  onClick={() => setView('TEAM_LEADER')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'TEAM_LEADER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Team Leader
                </button>
              )}
              {canAccessView('JUDGES') && (
                <button
                  onClick={() => setView('JUDGES')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'JUDGES' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Judges
                </button>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {currentUser.role === 'admin' && (
              <button
                onClick={() => {
                  const confirm = window.confirm(isMaintenanceMode ? 'Disable Maintenance Mode? Users will be able to access the system.' : 'Enable Maintenance Mode? Non-admin users will be blocked.');
                  if (confirm) setIsMaintenanceMode(!isMaintenanceMode);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isMaintenanceMode ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
              >
                {isMaintenanceMode ? '⚠ Maintenance ON' : 'Maintenance OFF'}
              </button>
            )}
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Logged in as</p>
              <p className="text-[11px] font-bold text-indigo-600 uppercase">{currentUser.displayName}</p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-blue-600">Syncing...</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.6em] leading-relaxed">
            Intensia Arts fest V4.0 Firebase Edition &bull; Real-time Sync  &bull; Cloud Powered
          </p>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default function App() {
  const { programs, loading, error, addProgram, updateProgram, deleteProgram } = usePrograms();

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error parsing saved user from localStorage:', error);
      localStorage.removeItem(STORAGE_KEYS.USER);
      return null;
    }
  });

  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('MAINTENANCE_MODE', String(isMaintenanceMode));
  }, [isMaintenanceMode]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  const handleLogin = (username: string, password: string): boolean => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    console.log('Login attempt:', { cleanUsername, cleanPassword }); // Debug log

    const user = USERS.find(u =>
      u.username.toLowerCase() === cleanUsername &&
      u.password === cleanPassword
    );

    if (user) {
      console.log('User found:', user.username, user.role);
      // Block non-admins during maintenance
      if (isMaintenanceMode && user.role !== 'admin') {
        console.warn('Login blocked by maintenance mode');
        return false;
      }
      setCurrentUser(user);
      return true;
    }
    console.error('User not found or password mismatch');
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/maintenance" element={<MaintenancePage />} />

        {/* Public Page is redirected to Maintenance if Mode is ON */}
        <Route path="/" element={
          isMaintenanceMode ? <Navigate to="/maintenance" replace /> : <PublicPage programs={programs} />
        } />

        <Route path="/login" element={!currentUser ? <LoginPage onLogin={handleLogin} isMaintenanceMode={isMaintenanceMode} /> : <Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          currentUser ? (
            isMaintenanceMode && currentUser.role !== 'admin' ? (
              <Navigate to="/maintenance" replace />
            ) : (
              <Dashboard
                currentUser={currentUser}
                programs={programs}
                loading={loading}
                error={error}
                addProgram={addProgram}
                updateProgram={updateProgram}
                deleteProgram={deleteProgram}
                handleLogout={handleLogout}
                isMaintenanceMode={isMaintenanceMode}
                setIsMaintenanceMode={setIsMaintenanceMode}
              />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        {/* Redirect unknown routes to Public Page or Maintenance */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
