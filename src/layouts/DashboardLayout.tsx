import React, { useState, useEffect, useMemo } from 'react';
import { Program, User, ViewType, STORAGE_KEYS, Staff } from '../types';
import { AdminPage } from '../pages/AdminPage';
import { GreenRoomPage } from '../pages/GreenRoomPage';
import { TeamLeaderPage } from '../pages/TeamLeaderPage';
import { JudgesPage } from '../pages/JudgesPage';
import { SettingsPage } from '../pages/SettingsPage';
import { Toast } from '../components/ui/Toast';
import { Logo } from '../components/Logo';

interface DashboardLayoutProps {
  currentUser: User;
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  loading: boolean;
  error: string | null;
  addProgram: any;
  updateProgram: any;
  deleteProgram: any;
  handleLogout: () => void;
  isMaintenanceMode: boolean;
  setIsMaintenanceMode: (mode: boolean) => void;
  staffs?: Staff[];
  addStaff?: (data: Omit<Staff, 'id'>) => Promise<boolean>;
  updateStaff?: (id: string, updates: Partial<Staff>) => Promise<boolean>;
  deleteStaff?: (id: string) => Promise<boolean>;
  settings?: any;
  updateSettings?: any;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentUser,
  programs,
  setPrograms,
  loading,
  error,
  addProgram,
  updateProgram,
  deleteProgram,
  handleLogout,
  isMaintenanceMode,
  setIsMaintenanceMode,
  staffs = [],
  addStaff,
  updateStaff,
  deleteStaff,
  settings,
  updateSettings
}) => {
  const [view, setView] = useState<ViewType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIEW);
      return (saved as ViewType) || 'ADMIN';
    } catch {
      return 'ADMIN';
    }
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminActiveTeam, setAdminActiveTeam] = useState<string>('');
  const [adminActiveJudgePanel, setAdminActiveJudgePanel] = useState<string>('GLOBAL');

  const allPanels = useMemo(() => {
    const panels = new Set<string>();
    panels.add('GLOBAL');
    staffs.forEach(s => {
      if (s.role === 'JUDGE' && s.judgePanel) panels.add(s.judgePanel);
    });
    programs.forEach(p => {
      if (p.judgePanel) panels.add(p.judgePanel);
    });
    return Array.from(panels).sort();
  }, [programs, staffs]);

  const allTeams = useMemo(() => {
    const teams = new Set<string>();
    staffs.forEach(s => {
      if (s.role === 'TEAM_LEADER' && s.teamName) teams.add(s.teamName);
    });
    programs.forEach(p => {
      (p.teams || []).forEach(t => {
        if (t.teamName) teams.add(t.teamName);
      });
    });
    const teamsList = Array.from(teams).sort();
    if (!adminActiveTeam && teamsList.length > 0) {
      setAdminActiveTeam(teamsList[0]);
    }
    return teamsList;
  }, [programs, staffs, adminActiveTeam]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW, view);
  }, [view]);

  // FIX: Converted role to lowercase and removed underscores for proper checking
  useEffect(() => {
    if (currentUser) {
      const userRole = String(currentUser.role).toLowerCase().replace('_', '');
      switch (userRole) {
        case 'admin':
          if (view !== 'ADMIN' && view !== 'GREEN_ROOM' && view !== 'TEAM_LEADER' && view !== 'JUDGES' && view !== 'SETTINGS') setView('ADMIN');
          break;
        case 'greenroom': setView('GREEN_ROOM'); break;
        case 'teamleader': setView('TEAM_LEADER'); break;
        case 'judge': setView('JUDGES'); break;
      }
    }
  }, [currentUser, view]);

  // FIX: Converted role to lowercase and removed underscores for proper permission matching
  const canAccessView = (viewType: ViewType): boolean => {
    if (!currentUser) return false;
    const userRole = String(currentUser.role).toLowerCase().replace('_', '');
    switch (userRole) {
      case 'admin': return viewType === 'ADMIN' || viewType === 'GREEN_ROOM' || viewType === 'TEAM_LEADER' || viewType === 'JUDGES' || viewType === 'SETTINGS';
      case 'greenroom': return viewType === 'GREEN_ROOM';
      case 'judge': return viewType === 'JUDGES';
      case 'teamleader': return viewType === 'TEAM_LEADER';
      default: return false;
    }
  };

  const handleCopyLink = () => {
    const festId = currentUser.festId || 'default-fest';
    const link = `${window.location.origin}${window.location.pathname}#/fests/${festId}`;
    navigator.clipboard.writeText(link);
    setToast({ message: 'Copied to clipboard', type: 'success' });
  };

  const renderContent = () => {
    if (!canAccessView(view)) return null;
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-slate-600">Loading programs...</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'ADMIN':
        return (
          <AdminPage 
            programs={programs} 
            setPrograms={setPrograms} 
            addProgram={addProgram} 
            updateProgram={updateProgram} 
            deleteProgram={deleteProgram}
            staffs={staffs}
            addStaff={addStaff!}
            updateStaff={updateStaff!}
            deleteStaff={deleteStaff!}
            settings={settings}
            updateSettings={updateSettings}
          />
        );
      case 'GREEN_ROOM':
        return <GreenRoomPage programs={programs} setPrograms={setPrograms} updateProgram={updateProgram} />;
      case 'JUDGES': {
        const isAdmin = String(currentUser.role).toLowerCase() === 'admin';
        const mockJudgeUser = isAdmin 
            ? { ...currentUser, judgePanel: adminActiveJudgePanel === 'GLOBAL' ? undefined : adminActiveJudgePanel } 
            : currentUser;
        return (
          <JudgesPage 
            programs={programs} 
            setPrograms={setPrograms} 
            currentUser={mockJudgeUser} 
            updateProgram={updateProgram} 
            isAdminView={isAdmin}
            availablePanels={allPanels}
            onPanelChange={setAdminActiveJudgePanel}
            activePanel={adminActiveJudgePanel}
            settings={settings}
          />
        );
      }
      case 'TEAM_LEADER': {
        const isAdmin = String(currentUser.role).toLowerCase() === 'admin';
        const teamNameToUse = isAdmin ? adminActiveTeam : currentUser.teamName;
        return teamNameToUse ? (
          <TeamLeaderPage 
            teamName={teamNameToUse} 
            programs={programs} 
            setPrograms={setPrograms} 
            updateProgram={updateProgram} 
            onLogout={handleLogout} 
            isAdminView={isAdmin}
            availableTeams={allTeams}
            onTeamChange={setAdminActiveTeam}
            settings={settings}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center p-8 text-slate-500 font-bold uppercase tracking-widest">No teams available in the system yet.</div>
          </div>
        );
      }
      case 'SETTINGS':
        return <SettingsPage settings={settings} updateSettings={updateSettings} programs={programs} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans overflow-x-hidden">
      
      {/* LEFT SIDEBAR (Premium Blue Style) */}
      <aside className={`w-[280px] bg-[#3B3BFA] text-white flex flex-col fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 shadow-2xl lg:shadow-none`}>
        <div className="p-6 relative">
          <button className="absolute top-6 right-6 lg:hidden w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="flex items-center gap-3 mb-8">
            <Logo className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase leading-none mt-1">Artflow</h1>
              <h1 className="text-xl font-black tracking-tight uppercase text-white/70 leading-none">Arts Fest</h1>
            </div>
          </div>

          {/* User Profile Box */}
          <div className="bg-white text-black p-3 rounded-xl flex items-center justify-between mb-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-900 rounded-full flex items-center justify-center text-white font-black text-xs">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase leading-tight truncate w-24">
                  {currentUser.displayName || currentUser.username}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2 px-3">Portals</div>
            
            {canAccessView('ADMIN') && (
              <button 
                onClick={() => { setView('ADMIN'); setIsSidebarOpen(false); }} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'ADMIN' ? 'bg-white text-[#3B3BFA] shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Dashboard
              </button>
            )}
            
            {canAccessView('GREEN_ROOM') && (
              <button 
                onClick={() => { setView('GREEN_ROOM'); setIsSidebarOpen(false); }} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'GREEN_ROOM' ? 'bg-white text-[#3B3BFA] shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                Green Room
              </button>
            )}

            {canAccessView('JUDGES') && (
              <button 
                onClick={() => { setView('JUDGES'); setIsSidebarOpen(false); }} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'JUDGES' ? 'bg-white text-[#3B3BFA] shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Judges
              </button>
            )}

            {canAccessView('TEAM_LEADER') && (
              <button 
                onClick={() => { setView('TEAM_LEADER'); setIsSidebarOpen(false); }} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'TEAM_LEADER' ? 'bg-white text-[#3B3BFA] shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Team Leader
              </button>
            )}

            {canAccessView('SETTINGS') && (
              <button 
                onClick={() => { setView('SETTINGS'); setIsSidebarOpen(false); }} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-4 ${view === 'SETTINGS' ? 'bg-white text-[#3B3BFA] shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Settings
              </button>
            )}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto p-6 space-y-4">
          <div className="bg-white/10 rounded-2xl p-4">
             <div className="w-8 h-8 bg-[#06D6A0] rounded-xl flex items-center justify-center mb-3 shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
             </div>
             <p className="text-[10px] font-black uppercase mb-1">Manage. Track. Celebrate.</p>
             <p className="text-[9px] text-white/60">All in one place.</p>
          </div>

          <div className="flex gap-2">
            {String(currentUser.role).toLowerCase() === 'admin' && (
              <button 
                onClick={handleCopyLink} 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase transition-all"
                title="Copy public fest link"
              >
                Copy Link
              </button>
            )}
            <button 
              onClick={handleLogout} 
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* RIGHT MAIN CONTENT */}
      <main className="flex-1 lg:ml-[280px] min-h-screen relative bg-slate-50 flex flex-col min-w-0">
        
        {/* MOBILE HEADER */}
        <div className="lg:hidden bg-[#3B3BFA] text-white p-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
          <div className="flex items-center gap-3">
             <Logo className="w-8 h-8" />
             <span className="font-black uppercase tracking-tight text-lg mt-1">Artflow</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overflow-x-auto">
          {renderContent()}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};