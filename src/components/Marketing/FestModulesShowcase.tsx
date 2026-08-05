import React, { useState } from 'react';
import { Icon } from '@iconify/react';

export const FestModulesShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'greenroom' | 'judges' | 'results'>('leaderboard');

  return (
    <section className="py-20 bg-gradient-to-b from-white via-slate-50 to-blue-50/30 relative overflow-hidden" id="how-it-works">
      <div className="container mx-auto px-4">

        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="skeuo-chip-indigo text-xs font-bold uppercase tracking-wider px-4 py-1.5 inline-block mb-3 shadow-sm">
            Inside the App
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-midnight_text tracking-tight leading-tight">
            How Intensia Powers Your Entire Arts Fest.
          </h2>
          <p className="text-black/70 text-lg mt-4 leading-relaxed">
            Everything convenience committees, greenroom convenors, judges, and audience members need — built into one seamless live system.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-5 py-3 rounded-full font-bold text-sm sm:text-base transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'leaderboard'
                ? 'skeuo-button-primary'
                : 'skeuo-button-secondary'
              }`}
          >
            <Icon icon="tabler:trophy" className="text-lg" />
            <span>1. Live Zone Leaderboards</span>
          </button>

          <button
            onClick={() => setActiveTab('greenroom')}
            className={`px-5 py-3 rounded-full font-bold text-sm sm:text-base transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'greenroom'
                ? 'skeuo-button-primary'
                : 'skeuo-button-secondary'
              }`}
          >
            <Icon icon="tabler:shield-lock" className="text-lg" />
            <span>2. Anonymous Greenroom</span>
          </button>

          <button
            onClick={() => setActiveTab('judges')}
            className={`px-5 py-3 rounded-full font-bold text-sm sm:text-base transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'judges'
                ? 'skeuo-button-primary'
                : 'skeuo-button-secondary'
              }`}
          >
            <Icon icon="tabler:device-tablet" className="text-lg" />
            <span>3. Digital Judge Tablet</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`px-5 py-3 rounded-full font-bold text-sm sm:text-base transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'results'
                ? 'skeuo-button-primary'
                : 'skeuo-button-secondary'
              }`}
          >
            <Icon icon="tabler:bell-ringing" className="text-lg" />
            <span>4. Public Stage Tracker</span>
          </button>
        </div>

        {/* Tab Content Cards */}
        <div className="max-w-5xl mx-auto">
          {activeTab === 'leaderboard' && (
            <div className="skeuo-card p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="skeuo-chip-emerald text-xs font-bold uppercase tracking-wider px-3.5 py-1">
                  Module #1 • Real-Time Standings
                </span>
                <h3 className="text-3xl font-black text-midnight_text">
                  Automated Zone Points &amp; Championship Tallies
                </h3>
                <p className="text-black/70 text-base leading-relaxed">
                  As soon as stage results are published by convenors, zone points update instantly across all screens. Kala Prathibha and Sarga Prathibha individual point calculations run in real-time.
                </p>
                <div className="pt-2 flex flex-col gap-2.5 text-sm font-semibold text-black/80">
                  <div className="flex items-center gap-2">
                    <Icon icon="tabler:circle-check" className="text-emerald-600 text-lg" />
                    <span>Automatic Grade Points (A = 5 pts, B = 3 pts, C = 1 pt)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="tabler:circle-check" className="text-emerald-600 text-lg" />
                    <span>Single &amp; Group item point multipliers</span>
                  </div>
                </div>
              </div>

              {/* Visual Mockup Card */}
              <div className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Live Zone Leaderboard</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded">Updating Live</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-amber-500/30">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🥇</span>
                      <span className="font-bold text-white">Zone A (Eastern Eagles)</span>
                    </div>
                    <span className="font-extrabold text-amber-400 text-lg">420 Pts</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🥈</span>
                      <span className="font-bold text-slate-200">Zone B (Northern Knights)</span>
                    </div>
                    <span className="font-extrabold text-slate-300 text-lg">395 Pts</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🥉</span>
                      <span className="font-bold text-slate-200">Zone C (Southern Royals)</span>
                    </div>
                    <span className="font-extrabold text-slate-400 text-lg">375 Pts</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'greenroom' && (
            <div className="skeuo-card p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="skeuo-chip-rose text-xs font-bold uppercase tracking-wider px-3.5 py-1">
                  Module #2 • Greenroom Operations
                </span>
                <h3 className="text-3xl font-black text-midnight_text">
                  100% Anonymous Candidate Code System
                </h3>
                <p className="text-black/70 text-base leading-relaxed">
                  Eliminate bias completely. In the greenroom, candidates present their token cards and receive random secret code letters (e.g. Code #A-104). Judges on stage evaluate code letters only — candidate names and zone identities remain completely hidden.
                </p>
                <div className="pt-2 flex flex-col gap-2.5 text-sm font-semibold text-black/80">
                  <div className="flex items-center gap-2">
                    <Icon icon="tabler:circle-check" className="text-emerald-600 text-lg" />
                    <span>Greenroom verification token check</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="tabler:circle-check" className="text-emerald-600 text-lg" />
                    <span>Automated secret code letter assignment</span>
                  </div>
                </div>
              </div>

              {/* Visual Mockup Card */}
              <div className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Greenroom Desk • Stage 1</span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded">🔒 Anonymous</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold">Stage Entry #04</p>
                      <p className="font-bold text-amber-400 text-lg">Chest No: #104</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Assigned Secret Code</p>
                      <p className="font-black text-emerald-400 text-xl tracking-wider">CODE #A-04</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 italic text-center">
                    &quot;Judges view Code #A-04 only. Candidate identity protected.&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'judges' && (
            <div className="skeuo-card p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="skeuo-chip-indigo text-xs font-bold uppercase tracking-wider px-3.5 py-1">
                  Module #3 • Judge Tablet Hub
                </span>
                <h3 className="text-3xl font-black text-midnight_text">
                  Direct Digital Scoring &amp; Instant Grade Compilation
                </h3>
                <p className="text-black/70 text-base leading-relaxed">
                  Judges evaluate candidates directly on digital tablets or smartphones. Scores for performance, rhythm, expression, and discipline are compiled automatically into A, B, C grades with zero manual paperwork or calculation errors.
                </p>
                <div className="pt-2 flex flex-col gap-2.5 text-sm font-semibold text-black/80">
                  <div className="flex items-center gap-2">
                    <Icon icon="tabler:circle-check" className="text-emerald-600 text-lg" />
                    <span>Instant mark summation &amp; tie-breaker checks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="tabler:circle-check" className="text-emerald-600 text-lg" />
                    <span>Convenor digital sign-off portal</span>
                  </div>
                </div>
              </div>

              {/* Visual Mockup Card */}
              <div className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Judge Tablet • Item #102 Oppana</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded">Scoring Live</span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Candidate Code #A-04</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">Marks: 92/100</span>
                      <span className="font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded text-sm">Grade A</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Candidate Code #A-05</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">Marks: 84/100</span>
                      <span className="font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded text-sm">Grade A</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="skeuo-card p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="skeuo-chip-emerald text-xs font-bold uppercase tracking-wider px-3.5 py-1">
                  Module #4 • Audience &amp; Stage Portal
                </span>
                <h3 className="text-3xl font-black text-midnight_text">
                  Live Stage Tracker &amp; Instant Public Declarations
                </h3>
                <p className="text-black/70 text-base leading-relaxed">
                  Keep students, parents, and festival visitors informed! View live stage progress (Live, Next Up, Completed), category results, and download official signed result PDF sheets directly on mobile.
                </p>
                <div className="pt-2 flex flex-col gap-2.5 text-sm font-semibold text-black/80">
                  <div className="flex items-center gap-2">
                    <Icon icon="tabler:circle-check" className="text-emerald-600 text-lg" />
                    <span>Public live scoreboard link for smartphones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="tabler:circle-check" className="text-emerald-600 text-lg" />
                    <span>Printable result sheets &amp; WhatsApp share</span>
                  </div>
                </div>
              </div>

              {/* Visual Mockup Card */}
              <div className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Public Fest Portal</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded">Live Stages</span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">Stage 1 • LIVE NOW</span>
                      <span className="font-bold text-white text-sm">Duffmuttu (Senior Boys)</span>
                    </div>
                    <span className="text-xs bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-full animate-pulse">ON STAGE</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Stage 2 • NEXT UP</span>
                      <span className="font-bold text-slate-200 text-sm">Moppilappattu (Junior Girls)</span>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">10:30 AM</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
