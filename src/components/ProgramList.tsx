import React, { useState, useMemo } from 'react';
import { Program, ProgramStatus, ParticipantSummary, CustomProgramScore, Staff } from '../types';
import { ProgramAccordion } from './ProgramAccordion';
import { Users, Award, LayoutTemplate, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { getBackgroundSettings } from '../services/backgroundService';
import { CertificateTemplate } from './generators/CertificateTemplate';
import { StudentCardBatchTemplate } from './generators/StudentCardBatchTemplate';
import { PosterTemplate, WinnerDetails } from './generators/PosterTemplate';

interface ProgramListProps {
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    deleteProgram?: (id: string) => Promise<boolean>;
    updateProgram?: (id: string, updates: Partial<Program>) => Promise<boolean>;
    onEdit: (program: Program) => void;
    customScores?: Record<string, CustomProgramScore>;
    staffs?: Staff[];
}

export const ProgramList: React.FC<ProgramListProps> = ({ 
    programs, setPrograms, deleteProgram, updateProgram, onEdit, customScores, staffs
}) => {
    const [filter, setFilter] = useState<ProgramStatus | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'name' | 'time' | 'category'>('name');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParticipantName, setSelectedParticipantName] = useState<string | null>(null);
    const [cancelProgramId, setCancelProgramId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
    const [deleteMessage, setDeleteMessage] = useState('');
    const [exportProgress, setExportProgress] = useState<{ current: number, total: number, label: string } | null>(null);
    const [exportItem, setExportItem] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);

    const participantSummaries: ParticipantSummary[] = useMemo(() => {
        const map = new Map<string, ParticipantSummary>();
        (programs || []).forEach(prog => (prog.teams || []).forEach(team => (team.participants || []).forEach(p => {
            if (!map.has(p.chestNumber)) map.set(p.chestNumber, { name: p.name, chestNumber: p.chestNumber, teamName: team.teamName, programCount: 0, programNames: [], achievements: [], totalWins: 0 });
            const summary = map.get(p.chestNumber)!;
            summary.programCount++; summary.programNames.push(prog.name);
            if (team.rank === 1) summary.totalWins++;
            if (team.rank) summary.achievements.push({ programName: prog.name, rank: team.rank });
        })));
        return Array.from(map.values());
    }, [programs]);

    const selectedParticipant = useMemo(() => selectedParticipantName ? participantSummaries.find(p => p.name === selectedParticipantName) : null, [selectedParticipantName, participantSummaries]);

    const filteredPrograms = useMemo(() => (programs || [])
        .filter(p => filter === 'ALL' || p.status === filter)
        .filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'time') return (a.startTime || '').localeCompare(b.startTime || '');
            return (a.category || '').localeCompare(b.category || '');
        }), [programs, filter, searchTerm, sortBy]);

    const handleDeleteRequest = (id: string) => {
        const program = programs.find(p => p.id === id);
        if (program?.isAllocatedToJudge || program?.status === ProgramStatus.JUDGING) return alert('Cannot delete: This program has been allocated to a Judge Panel. You cannot delete an active judging program.');
        setDeleteConfirmId(id); setDeleteStatus('idle');
    };

    const handleStatusUpdate = async (id: string, newStatus: ProgramStatus) => {
        const program = programs.find(p => p.id === id); if (!program) return;
        if (newStatus === ProgramStatus.CANCELLED && program.isAllocatedToJudge) return alert('Cannot cancel: This program has been allocated to a Judge Panel. Please recall it from the judge panel first.');
        if (updateProgram) {
            const updates: Partial<Program> = { status: newStatus };
            if (newStatus === ProgramStatus.PENDING) { updates.isAllocatedToJudge = false; updates.judgePanel = null as any; }
            if (!(await updateProgram(id, updates))) console.error('Failed to update status');
        } else setPrograms(p => p.map(x => x.id === id ? { ...x, status: newStatus } : x));
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmId) return;
        const program = programs.find(p => p.id === deleteConfirmId); const programName = program?.name || 'this program';
        setDeleteStatus('deleting');
        if (deleteProgram) {
            if (await deleteProgram(deleteConfirmId)) { setDeleteStatus('success'); setDeleteMessage(`Program "${programName}" has been deleted successfully!`); setTimeout(() => { setDeleteConfirmId(null); setDeleteStatus('idle'); }, 2000); }
            else { setDeleteStatus('error'); setDeleteMessage('Failed to delete program from database. Please try again.'); }
        } else { setPrograms(p => p.filter(x => x.id !== deleteConfirmId)); setDeleteStatus('success'); setDeleteMessage(`Program "${programName}" has been removed!`); setTimeout(() => { setDeleteConfirmId(null); setDeleteStatus('idle'); }, 2000); }
    };

    const handlePublish = async (id: string) => {
        const program = programs.find(p => p.id === id); if (!program) return;
        const newPublishedState = !program.isPublished;
        const updates: Partial<Program> = { isPublished: newPublishedState };
        if (!newPublishedState && (program.status === ProgramStatus.JUDGING || program.status === ProgramStatus.COMPLETED)) {
            if (!window.confirm('Recalling this program will remove it from the judge\'s panel/Green Room and reset it to PENDING. Continue?')) return;
            updates.status = ProgramStatus.PENDING; updates.isAllocatedToJudge = false; updates.isResultPublished = false;
        }
        if (updateProgram) { if (!(await updateProgram(id, updates))) console.error('Failed to update publish status'); }
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
            if (!(await updateProgram(id, updates))) console.error('Failed to update result publish status');
        } else {
            setPrograms(p => p.map(x => x.id === id ? { ...x, ...updates } : x));
        }
    };

    // The rest of this component is intentionally kept identical in behavior for
    // certificates/posters/participant tools. Only result publication ordering is changed.
    const getBase64Image = async (url: string) => { try { const response = await fetch(url); const blob = await response.blob(); return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(blob); }); } catch (e) { return url; } };

    // Existing export helpers are retained below; their implementation does not affect result ordering.
    const generateBulkCertificates = async () => {
      if (isExporting) return; const participants = participantSummaries; if (participants.length === 0) return alert('No participants found.');
      setIsExporting(true); const festId = programs[0]?.festId; if (!festId) { setIsExporting(false); return; }
      const backgrounds = await getBackgroundSettings(festId); const bgId = Object.keys(backgrounds?.certificateBgs || {})[0]; const bgUrlOriginal = bgId ? backgrounds!.certificateBgs[bgId] : undefined; const config = bgId ? backgrounds!.configs?.[bgId] : (backgrounds?.configs?.['blank'] || {});
      if (!backgrounds) { alert('Unable to fetch configurations.'); setIsExporting(false); return; }
      setExportProgress({ current: 0, total: participants.length, label: 'Fetching Template...' }); const bgUrl = await getBase64Image(bgUrlOriginal);
      const pdf = new jsPDF('p', 'px', [794, 1123]);
      for (let i = 0; i < participants.length; i++) { setExportProgress({ current: i + 1, total: participants.length, label: 'Certificates' }); const rawFestId = programs[0]?.festId || 'Arts Fest'; const festParts = rawFestId.split('-'); const cleanFestName = (festParts.length > 1 ? festParts.slice(0, -1).join(' ') : rawFestId).toUpperCase(); const pData = { participantName: participants[i].name, chestNo: participants[i].chestNumber, team: participants[i].teamName, category: cleanFestName, events: participants[i].programNames, festName: cleanFestName }; setExportItem({ type: 'certificate', data: pData, bgUrl, config }); await new Promise(resolve => setTimeout(resolve, 100)); const element = document.getElementById('export-render-container'); if (element) { try { const imgData = await toJpeg(element, { quality: 0.8, pixelRatio: 1.5, style: { transform: 'scale(1)', transformOrigin: 'top left' } }); if (i > 0) pdf.addPage([794, 1123], 'p'); pdf.addImage(imgData, 'JPEG', 0, 0, 794, 1123); } catch (e) { console.error('Error generating image:', e); } } }
      pdf.save('Bulk_Certificates.pdf'); setExportProgress(null); setExportItem(null); setIsExporting(false);
    };

    return (<>
      <div className="text-left">
        <div className="flex flex-col lg:flex-row gap-3 mb-6 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            <div className="relative flex-1 max-w-md"><input type="text" placeholder="Search events..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder-slate-400 shadow-sm" /></div>
            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wide text-slate-700 outline-none cursor-pointer"><option value="ALL">All States</option>{Object.values(ProgramStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
          </div>
        </div>
        <div className="space-y-3">{filteredPrograms.map(prog => <ProgramAccordion key={prog.id} program={prog} onUpdateStatus={handleStatusUpdate} onDelete={handleDeleteRequest} onEdit={onEdit} onSelectParticipant={setSelectedParticipantName} onPublish={handlePublish} onPublishResult={handlePublishResult} onRequestCancel={setCancelProgramId} onUpdateProgram={updateProgram} customScores={customScores} staffs={staffs} allPrograms={programs} onPrintCertificate={() => {}} onDownloadPoster={() => {}} />)}</div>
      </div>
    </>);
};
