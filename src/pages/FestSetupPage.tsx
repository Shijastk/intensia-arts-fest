import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { authService } from '../services/authService';
import { auth } from '../config/firebase';

interface FestSetupPageProps {
  onFestCreated: (festId: string) => void;
}

export const FestSetupPage: React.FC<FestSetupPageProps> = ({ onFestCreated }) => {
  const [festName, setFestName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateFest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!festName.trim()) {
      setError('Please enter a festival name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = auth.currentUser?.uid || 'admin';
      const result = await authService.createFestForAdmin(userId, festName.trim());

      if (result.success && result.festId) {
        onFestCreated(result.festId);
      } else {
        setError(result.error || 'Failed to create festival.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-slate-900 border border-slate-200">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black">
          🎉
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-center mb-2">Create Your Fest</h2>
        <p className="text-xs text-slate-500 font-medium text-center mb-6">
          Give your arts fest a name to generate your dedicated management workspace and dashboard link.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateFest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Festival Name</label>
            <input
              type="text"
              value={festName}
              onChange={(e) => setFestName(e.target.value)}
              placeholder="e.g. Intensia Arts Fest 2026"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-600 font-medium"
              required
              autoFocus
            />
          </div>

          <Button type="submit" variant="primary" isLoading={loading}>
            Initialize Festival Database
          </Button>
        </form>
      </div>
    </div>
  );
};