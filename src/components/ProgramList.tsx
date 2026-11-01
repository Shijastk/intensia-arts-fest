import React, { useState, useMemo } from 'react';
import { Program, ProgramStatus, ParticipantSummary, CustomProgramScore, Staff } from '../types';
import type { FestDefaultScores } from '../utils/pointsCalculator';
import { ProgramAccordion } from './ProgramAccordion';
import { aggregateParticipants, buildCertificateData, cleanFestName, safeFileName, toParticipantSummary } from '../services/exportService';
import { exportCertificatesPdf, exportPosterJpeg } from './generators/OffscreenRenderer';
import { appDialog } from './ui/AppDialog';
import { compareScheduleTimes } from '../utils/timeUtils';

interface ProgramListProps {
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    deleteProgram?: (id: string) => Promise<boolean>;
    updateProgram?: (id: string, updates: Partial<Program>) => Promise<boolean>;
    onEdit: (program: Program) => void;
    customScores?: Record<string, CustomProgramScore>;
    defaultScores?: FestDefaultScores;
    staffs?: Staff[];
}

export const ProgramList: React.FC<ProgramListProps> = ({ 
    programs, setPrograms, deleteProgram, updateProgram, onEdit, customScores, defaultScores, staffs
}) => {
    const [filter, setFilter] = useState<ProgramStatus | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'name' | 'time' | 'category'>('name');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParticipantName, setSelectedParticipantName] = useState<string | null>(null);
    const [exportProgress, setExportProgress] = useState<{ current: number, total: number, label: string } | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const participantSummaries: ParticipantSummary[] = useMemo(() => aggregateParticipants(programs || []).map(toParticipantSummary), [programs]);

    const selectedParticipant = useMemo(() => selectedParticipantName ? participantSummaries.find(p => p.name === selectedParticipantName) : null, [selectedParticipantName, participantSummaries]);

    const filteredPrograms = useMemo(() => (programs || [])
        .filter(p => filter === 'ALL' || p.status === filter)
        .filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'time') return compareScheduleTimes(a.startTime, b.startTime);
            return (a.category || '').localeCompare(b.category || '');
        }), [programs, filter, searchTerm, sortBy]);

    // The user has already confirmed in ProgramAccordion's "Delete Program" dialog, so delete
    // straight away. (The second confirmation modal this used to open was lost in 39e28ff,
    // which left the delete button doing nothing.)
    const handleDeleteRequest = async (id: string) => {
        const program = programs.find(p => p.id === id);
        if (program?.isAllocatedToJudge || program?.status === ProgramStatus.JUDGING) return appDialog.alert('This program has been allocated to a Judge Panel. You cannot delete an active judging program.', { variant: 'warning', title: 'Cannot delete program' });
        // A failed delete/update is reported to the user by usePrograms.
        if (deleteProgram) {
            await deleteProgram(id);
        } else setPrograms(p => p.filter(x => x.id !== id));
    };

    const handleStatusUpdate = async (id: string, newStatus: ProgramStatus) => {
        const program = programs.find(p => p.id === id); if (!program) return;
        if (newStatus === ProgramStatus.CANCELLED && program.isAllocatedToJudge) return appDialog.alert('This program has been allocated to a Judge Panel. Please recall it from the judge panel first.', { variant: 'warning', title: 'Cannot cancel program' });
        if (updateProgram) {
            const updates: Partial<Program> = { status: newStatus };
            if (newStatus === ProgramStatus.PENDING) { updates.isAllocatedToJudge = false; updates.judgePanel = null as any; }
            await updateProgram(id, updates);
        } else setPrograms(p => p.map(x => x.id === id ? { ...x, status: newStatus } : x));
    };


    const handlePublish = async (id: string) => {
        const program = programs.find(p => p.id === id); if (!program) return;
        const newPublishedState = !program.isPublished;
        const updates: Partial<Program> = { isPublished: newPublishedState };
        if (!newPublishedState && (program.status === ProgramStatus.JUDGING || program.status === ProgramStatus.COMPLETED)) {
            if (!await appDialog.confirm('Recalling this program will remove it from the judge\'s panel/Green Room and reset it to PENDING. Continue?', { variant: 'warning', title: 'Recall program', confirmText: 'Recall' })) return;
            updates.status = ProgramStatus.PENDING; updates.isAllocatedToJudge = false; updates.isResultPublished = false;
        }
        // A pending program is never with a judge; clear a leftover allocation from an earlier
        // round, otherwise the Green Room hides it even though it was sent.
        if (newPublishedState && program.status === ProgramStatus.PENDING && (program.isAllocatedToJudge || program.judgePanel)) {
            updates.isAllocatedToJudge = false; updates.judgePanel = null as any;
        }
        if (updateProgram) { await updateProgram(id, updates); }
        else setPrograms(p => p.map(x => x.id === id ? { ...x, ...updates } : x));
    };

    const handlePublishResult = async (id: string) => {
        const program = programs.find(p => p.id === id); if (!program) return;
        const newResultState = !program.isResultPublished;
        const updates: Partial<Program> = { isResultPublished: newResultState };

        // Assign the order only the first time a result is published. This makes the
        // publication order persistent and prevents UI/database array order from changing it.
        if (newResultState && !program.resultPublishedOrder) {
            const maxOrder = (programs || []).reduce((max, p) => Math.max(max, p.resultPublishedOrder || 0), 0);
            updates.resultPublishedOrder = maxOrder + 1;
        }

        if (updateProgram) {
            await updateProgram(id, updates);
        } else {
            setPrograms(p => p.map(x => x.id === id ? { ...x, ...updates } : x));
        }
    };

    // Program-level exports (ProgramAccordion "Print Certificates" / "Download Poster").
    // Both reuse the shared exportService/OffscreenRenderer pipeline used everywhere else.
    const handlePrintProgramCertificates = async (programId: string) => {
      if (isExporting) return;
      const program = programs.find(p => p.id === programId);
      if (!program) return;
      const festId = program.festId || programs[0]?.festId;
      if (!festId) return;
      const inProgram = new Set((program.teams || []).flatMap(t => (t.participants || []).map(pt => pt.chestNumber)));
      const items = aggregateParticipants([program])
        .filter(a => inProgram.has(a.chestNumber))
        .map(a => buildCertificateData(a, cleanFestName(festId), program.id));
      if (items.length === 0) return appDialog.alert('This program has no participants to print certificates for.', { variant: 'warning', title: 'No participants' });
      setIsExporting(true);
      setExportProgress({ current: 0, total: items.length, label: 'Preparing template...' });
      try {
        await exportCertificatesPdf({
          festId,
          items,
          fileName: `${safeFileName(program.name)}_Certificates.pdf`,
          onProgress: (current, total) => setExportProgress({ current, total, label: 'Certificates' }),
        });
      } catch (e: any) {
        console.error('Certificate export failed:', e);
        appDialog.alert(`Could not generate certificates: ${e?.message || 'Unknown error'}`, { variant: 'danger', title: 'Export failed' });
      } finally {
        setExportProgress(null);
        setIsExporting(false);
      }
    };

    const handleDownloadProgramPoster = async (programId: string) => {
      if (isExporting) return;
      const program = programs.find(p => p.id === programId);
      if (!program) return;
      const festId = program.festId || programs[0]?.festId;
      if (!festId) return;
      setIsExporting(true);
      setExportProgress({ current: 0, total: 1, label: 'Poster' });
      try {
        await exportPosterJpeg({ festId, program });
      } catch (e: any) {
        console.error('Poster export failed:', e);
        appDialog.alert(`Could not generate the poster: ${e?.message || 'Unknown error'}`, { variant: 'danger', title: 'Export failed' });
      } finally {
        setExportProgress(null);
        setIsExporting(false);
      }
    };

    return (<>
      <div className="text-left">
        <div className="flex flex-col lg:flex-row gap-3 mb-6 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            <div className="relative flex-1 max-w-md"><input type="text" placeholder="Search events..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder-slate-400 shadow-sm" /></div>
            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wide text-slate-700 outline-none cursor-pointer"><option value="ALL">All States</option>{Object.values(ProgramStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
          </div>
        </div>
        <div className="space-y-3">{filteredPrograms.map(prog => <ProgramAccordion key={prog.id} program={prog} onUpdateStatus={handleStatusUpdate} onDelete={handleDeleteRequest} onEdit={onEdit} onSelectParticipant={setSelectedParticipantName} onPublish={handlePublish} onPublishResult={handlePublishResult} onRequestCancel={(id) => handleStatusUpdate(id, ProgramStatus.CANCELLED)} onUpdateProgram={updateProgram} customScores={customScores} defaultScores={defaultScores} staffs={staffs} allPrograms={programs} onPrintCertificate={handlePrintProgramCertificates} onDownloadPoster={handleDownloadProgramPoster} />)}</div>
      </div>
      {exportProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 min-w-[260px]">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-black text-slate-900 uppercase tracking-widest text-sm">Generating {exportProgress.label}...</span>
            {exportProgress.total > 1 && (
              <>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all" style={{ width: `${Math.round((exportProgress.current / exportProgress.total) * 100)}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-500">{exportProgress.current} / {exportProgress.total}</span>
              </>
            )}
          </div>
        </div>
      )}
    </>);
};
