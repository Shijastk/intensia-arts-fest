import React, { useState, useEffect } from 'react';
import { Program } from './src/types';
import { AdminPage } from './src/pages/AdminPage';
import { GreenRoomPage } from './src/pages/GreenRoomPage';
import { TeamLeaderPage } from './src/pages/TeamLeaderPage';
import { JudgesPage } from './src/pages/JudgesPage';
import { usePrograms } from './src/hooks/usePrograms';
import './src/utils/clearFirebase'; // Make clearFirebase available in console

type UserRole = 'admin' | 'greenroom' | 'judge' | 'teamleader';
type ViewType = 'ADMIN' | 'GREEN_ROOM' | 'TEAM_LEADER' | 'JUDGES';

interface User {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  teamName?: string;
  judgePanel?: string; // NEW: Stage/Panel assignment for judges
}

// Predefined user credentials
const USERS: User[] = [
  { username: 'admin', password: 'admin123', role: 'admin', displayName: 'Administrator' },
  { username: 'greenroom', password: 'green123', role: 'greenroom', displayName: 'Green Room Clerk' },

  // Judges with different panels/stages
  { username: 'judge1', password: 'judge123', role: 'judge', displayName: 'Judge - Stage 1', judgePanel: 'Stage 1' },
  { username: 'judge2', password: 'judge123', role: 'judge', displayName: 'Judge - Stage 2', judgePanel: 'Stage 2' },
  { username: 'judge3', password: 'judge123', role: 'judge', displayName: 'Judge - Panel A', judgePanel: 'Panel A' },
  { username: 'judge4', password: 'judge123', role: 'judge', displayName: 'Judge - Panel B', judgePanel: 'Panel B' },

  // Team Leaders
  { username: 'team1', password: 'team1pass', role: 'teamleader', displayName: 'Team Leader', teamName: 'Team Alpha' },
  { username: 'team2', password: 'team2pass', role: 'teamleader', displayName: 'Team Leader', teamName: 'Team Beta' }
];

const STORAGE_KEYS = {
  USER: 'artsfest_current_user',
  VIEW: 'artsfest_current_view'
};

const App: React.FC = () => {
  // 🔥 USE FIREBASE INSTEAD OF LOCAL STATE
  const { programs, loading, error, updateProgram: updateProgramInFirebase } = usePrograms();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('ADMIN');

  // Load saved session
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const savedView = localStorage.getItem(STORAGE_KEYS.VIEW);

      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser) as User);
      }
      if (savedView) {
        setView(savedView as ViewType);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.VIEW);
    }
  }, []);

  const handleLogin = (username: string, password: string): boolean => {
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      let defaultView: ViewType;
      if (user.role === 'admin') defaultView = 'ADMIN';
      else if (user.role === 'greenroom') defaultView = 'GREEN_ROOM';
      else if (user.role === 'judge') defaultView = 'JUDGES';
      else defaultView = 'TEAM_LEADER';

      setView(defaultView);
      localStorage.setItem(STORAGE_KEYS.VIEW, defaultView);

      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('ADMIN');
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.VIEW);
  };

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

  // Create a wrapper setPrograms function that updates Firebase
  const setPrograms = React.useCallback((updater: React.SetStateAction<Program[]>) => {
    if (typeof updater === 'function') {
      const newPrograms = updater(programs);
      // Find what changed and update Firebase
      newPrograms.forEach((newProg, index) => {
        const oldProg = programs[index];
        if (oldProg && JSON.stringify(oldProg) !== JSON.stringify(newProg)) {
          updateProgramInFirebase(newProg.id, newProg);
        }
      });
    }
  }, [programs, updateProgramInFirebase]);

  const renderContent = () => {
    if (!canAccessView(view)) return null;

    // Show loading state
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

    // Show error state
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
        return <AdminPage programs={programs} setPrograms={setPrograms} />;
      case 'GREEN_ROOM':
        return <GreenRoomPage programs={programs} setPrograms={setPrograms} />;
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

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg">A</div>
              <h1 className="text-sm font-black tracking-tight hidden sm:block">ARTSFEST PRO</h1>
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
            ArtsFest Pro V4.0 Firebase Edition &bull; Real-time Sync  &bull; Cloud Powered
          </p>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

// Login Page Component
const LoginPage: React.FC<{ onLogin: (username: string, password: string) => boolean }> = ({ onLogin }) => {
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
        setError('Invalid username or password');
        setPassword('');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <span className="text-4xl font-black text-white">A</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">ArtsFest Pro</h1>
          <p className="text-sm text-slate-500 font-medium">🔥 Firebase Edition - Real-time Sync</p>
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
        </div>

        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 text-center">
            Demo Credentials
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="font-black text-indigo-900 mb-1">Admin</p>
              <p className="font-mono text-indigo-600 text-[10px]">admin / admin123</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="font-black text-emerald-900 mb-1">Green Room</p>
              <p className="font-mono text-emerald-600 text-[10px]">greenroom / green123</p>
            </div>
            <div className="bg-violet-50 rounded-lg p-3">
              <p className="font-black text-violet-900 mb-1">Judge Stage 1</p>
              <p className="font-mono text-violet-600 text-[10px]">judge1 / judge123</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="font-black text-purple-900 mb-1">Judge Stage 2</p>
              <p className="font-mono text-purple-600 text-[10px]">judge2 / judge123</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-3">
              <p className="font-black text-pink-900 mb-1">Judge Panel A</p>
              <p className="font-mono text-pink-600 text-[10px]">judge3 / judge123</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-3">
              <p className="font-black text-rose-900 mb-1">Judge Panel B</p>
              <p className="font-mono text-rose-600 text-[10px]">judge4 / judge123</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="font-black text-amber-900 mb-1">Team Alpha</p>
              <p className="font-mono text-amber-600 text-[10px]">team1 / team1pass</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="font-black text-orange-900 mb-1">Team Beta</p>
              <p className="font-mono text-orange-600 text-[10px]">team2 / team2pass</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          🔥 Powered by Firebase &bull; Real-time Database
        </p>
      </div>
    </div>
  );
};

export default App;
