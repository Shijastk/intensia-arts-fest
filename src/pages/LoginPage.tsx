import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onGoogleLogin?: () => Promise<{ success: boolean; error?: string }>;
  isMaintenanceMode: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGoogleLogin, isMaintenanceMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // സാധാരണ ലോഗിൻ (Judges, Team Leaders, Greenroom)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await onLogin(username, password);
      if (!result.success) {
        setError(result.error || (isMaintenanceMode ? 'Maintenance Mode Active: Only Admins can login' : `Invalid credentials for ${username}`));
        setPassword('');
      }
    } finally {
      setLoading(false);
    }
  };

  // അഡ്മിൻമാർക്കുള്ള ഗൂഗിൾ ലോഗിൻ
  const handleGoogleSignIn = async () => {
    if (!onGoogleLogin) return;
    setError('');
    setGoogleLoading(true);
    try {
      const result = await onGoogleLogin();
      if (!result.success) {
        setError(result.error || 'Google Sign-In failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900 overflow-hidden">
      
      {/* LEFT COLUMN: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 md:p-16 lg:p-20 relative z-10">
        
        {/* Top Brand Logo */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-black text-lg">
              I
            </div>
            <span className="text-xl font-black tracking-tight uppercase">Intensia Arts Fest</span>
          </div>
        </div>

        {/* Center Form */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          
          {/* Maintenance Notice */}
          {isMaintenanceMode && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div>
                <h3 className="text-xs font-black text-amber-800 uppercase">System Maintenance</h3>
                <p className="text-[11px] text-amber-700 font-medium">Only Administrators can access the portal.</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">Welcome back</h1>
            <p className="text-sm text-slate-500 font-medium">Sign in to manage your fest portal</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-bold text-red-800">{error}</p>
            </div>
          )}

          {/* 1. ADMIN GOOGLE SIGN-IN SECTION */}
          {onGoogleLogin && (
            <div className="mb-6">
              <div className="text-[11px] font-black text-purple-600 uppercase tracking-wider mb-2">For Convenors & Admins</div>
              <Button
                type="button"
                variant="google"
                isLoading={googleLoading}
                onClick={handleGoogleSignIn}
                className="py-4 border-2 border-purple-100 hover:border-purple-300 font-bold"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign in with Google (Admin Access)
              </Button>
            </div>
          )}

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="px-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Or staff login</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* 2. STANDARD LOGIN FORM (Judges, Greenroom, Team Leaders) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Username / ID</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-600 transition-all font-medium"
                placeholder="Enter assigned username"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-600 transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" variant="primary" isLoading={loading} className="mt-2">
              Sign in as Staff / Judge
            </Button>
          </form>

        </div>

        {/* Footer Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Public Portal
          </Link>
        </div>

      </div>

      {/* RIGHT COLUMN: Single Vector Image Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#A070D6] items-center justify-center p-12 overflow-hidden relative">
        <img 
          src="https://illustrations.pouch.services/purple-illustration.svg" 
          alt="Illustration" 
          className="max-w-full max-h-[85vh] object-contain select-none"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>

    </div>
  );
};