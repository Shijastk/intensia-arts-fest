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
    programs, 
    setPrograms, 
    deleteProgram, 
    updateProgram, 
    onEdit,
    customScores,
    staffs
}) => {
    const [filter, setFilter] = useState<ProgramStatus | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'name' | 'time' | 'category'>('name');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParticipantName, setSelectedParticipantName] = useState<string | null>(null);
    
    const [cancelProgramId, setCancelProgramId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
    const [deleteMessage, setDeleteMessage] = useState('');
    
    // Bulk Export State
    const [exportProgress, setExportProgress] = useState<{ current: number, total: number, label: string } | null>(null);
    const [exportItem, setExportItem] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);

    const participantSummaries: ParticipantSummary[] = useMemo(() => {
        const map = new Map<string, ParticipantSummary>();
        
        (programs || []).forEach(prog => {
            (prog.teams || []).forEach(team => {
                (team.participants || []).forEach(p => {
                    if (!map.has(p.chestNumber)) {
                        map.set(p.chestNumber, {
                            name: p.name,
                            chestNumber: p.chestNumber,
                            teamName: team.teamName,
                            programCount: 0,
                            programNames: [],
                            achievements: [],
                            totalWins: 0
                        });
                    }
                    const summary = map.get(p.chestNumber)!;
                    summary.programCount++;
                    summary.programNames.push(prog.name);
                    
                    if (team.rank === 1) summary.totalWins++;
                    if (team.rank) summary.achievements.push({ programName: prog.name, rank: team.rank });
                });
            });
        });
        return Array.from(map.values());
    }, [programs]);

    const selectedParticipant = useMemo(() =>
        selectedParticipantName ? participantSummaries.find(p => p.name === selectedParticipantName) : null
    , [selectedParticipantName, participantSummaries]);

    const filteredPrograms = useMemo(() => {
        return (programs || [])
            .filter(p => filter === 'ALL' || p.status === filter)
            .filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
                if (sortBy === 'time') return (a.startTime || '').localeCompare(b.startTime || '');
                return (a.category || '').localeCompare(b.category || '');
            });
    }, [programs, filter, searchTerm, sortBy]);

    const handleDeleteRequest = (id: string) => {
        const program = programs.find(p => p.id === id);
        if (program?.isAllocatedToJudge || program?.status === ProgramStatus.JUDGING) {
            alert('Cannot delete: This program has been allocated to a Judge Panel. You cannot delete an active judging program.');
            return;
        }
        setDeleteConfirmId(id);
        setDeleteStatus('idle');
    };

    const handleStatusUpdate = async (id: string, newStatus: ProgramStatus) => {
        const program = programs.find(p => p.id === id);
        if (!program) return;

        if (newStatus === ProgramStatus.CANCELLED && program.isAllocatedToJudge) {
            alert('Cannot cancel: This program has been allocated to a Judge Panel. Please recall it from the judge panel first.');
            return;
        }

        if (updateProgram) {
            const updates: Partial<Program> = { status: newStatus };
            if (newStatus === ProgramStatus.PENDING) {
                updates.isAllocatedToJudge = false;
                updates.judgePanel = null as any;
            }
            const success = await updateProgram(id, updates);
            if (!success) {
                console.error('Failed to update status');
            }
        } else {
            setPrograms(p => p.map(x => x.id === id ? { ...x, status: newStatus } : x));
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmId) return;
        const program = programs.find(p => p.id === deleteConfirmId);
        const programName = program?.name || 'this program';
        setDeleteStatus('deleting');

        if (deleteProgram) {
            const success = await deleteProgram(deleteConfirmId);
            if (success) {
                setDeleteStatus('success');
                setDeleteMessage(`Program "${programName}" has been deleted successfully!`);
                setTimeout(() => {
                    setDeleteConfirmId(null);
                    setDeleteStatus('idle');
                }, 2000);
            } else {
                setDeleteStatus('error');
                setDeleteMessage('Failed to delete program from database. Please try again.');
            }
        } else {
            setPrograms(p => p.filter(x => x.id !== deleteConfirmId));
            setDeleteStatus('success');
            setDeleteMessage(`Program "${programName}" has been removed!`);
            setTimeout(() => {
                setDeleteConfirmId(null);
                setDeleteStatus('idle');
            }, 2000);
        }
    };

    const handlePublish = async (id: string) => {
        const program = programs.find(p => p.id === id);
        if (!program) return;
        const newPublishedState = !program.isPublished;
        const updates: any = { isPublished: newPublishedState };

        if (!newPublishedState && (program.status === ProgramStatus.JUDGING || program.status === ProgramStatus.COMPLETED)) {
            if (window.confirm('Recalling this program will remove it from the judge\'s panel/Green Room and reset it to PENDING. Continue?')) {
                updates.status = ProgramStatus.PENDING;
                updates.isAllocatedToJudge = false;
                updates.isResultPublished = false;
            } else {
                return; 
            }
        }

        if (updateProgram) {
            const success = await updateProgram(id, updates);
            if (!success) console.error('Failed to update publish status');
        } else {
            setPrograms(p => p.map(x => x.id === id ? { ...x, ...updates } : x));
        }
    };

    const getBase64Image = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn("Failed to convert image to base64, using original URL", e);
            return url;
        }
    };

    const generateBulkCertificates = async () => {
      if (isExporting) return;
      const participants = participantSummaries;
      if (participants.length === 0) return alert("No participants found.");
      
      setIsExporting(true);
      const festId = programs[0]?.festId;
      if (!festId) { setIsExporting(false); return; }
      
      const backgrounds = await getBackgroundSettings(festId);
      const bgId = Object.keys(backgrounds?.certificateBgs || {})[0];
      const bgUrlOriginal = bgId ? backgrounds!.certificateBgs[bgId] : undefined;
      const config = bgId ? backgrounds!.configs?.[bgId] : (backgrounds?.configs?.['blank'] || {
          contentTop: 350,
          contentLeft: 96,
          textAlign: 'left',
          textColor: '#000000',
          secondaryColor: '#ca8a04',
          layout: 'simple',
          posterSize: 'portrait',
          cardsPerPage: 9,
          bgPositionX: 50,
          bgPositionY: 50,
          bgScale: 100
      });
      
      if (!backgrounds) {
         alert("Unable to fetch configurations.");
         setIsExporting(false);
         return;
      }
  
      // Pre-fetch the image as Base64 so html-to-image doesn't hang on CORS
      setExportProgress({ current: 0, total: participants.length, label: 'Fetching Template...' });
      const bgUrl = await getBase64Image(bgUrlOriginal);

      const pdf = new jsPDF('p', 'px', [794, 1123]);
  
      for (let i = 0; i < participants.length; i++) {
        setExportProgress({ current: i + 1, total: participants.length, label: 'Certificates' });
        const rawFestId = programs[0]?.festId || 'Arts Fest';
        const festParts = rawFestId.split('-');
        const cleanFestName = (festParts.length > 1 ? festParts.slice(0, -1).join(' ') : rawFestId).toUpperCase();
        
        const pData = {
           participantName: participants[i].name,
           chestNo: participants[i].chestNumber,
           team: participants[i].teamName,
           category: cleanFestName,
           events: participants[i].programNames,
           festName: cleanFestName
        };
        
        setExportItem({ type: 'certificate', data: pData, bgUrl, config });
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow DOM to render
        
        const element = document.getElementById('export-render-container');
        if (element) {
          try {
             const imgData = await toJpeg(element, { quality: 0.8, pixelRatio: 1.5, style: { transform: 'scale(1)', transformOrigin: 'top left' } });
             if (i > 0) pdf.addPage([794, 1123], 'p');
             pdf.addImage(imgData, 'JPEG', 0, 0, 794, 1123);
          } catch (e) {
             console.error("Error generating image:", e);
          }
        }
      }
      
      pdf.save('Bulk_Certificates.pdf');
      setExportProgress(null);
      setExportItem(null);
      setIsExporting(false);
    };
  
    const generateStudentCards = async (layoutOverride: 'detailed' | 'simple') => {
      if (isExporting) return;
      const participants = participantSummaries;
      if (participants.length === 0) return alert("No participants found.");
  
      setIsExporting(true);
      const festId = programs[0]?.festId;
      if (!festId) { setIsExporting(false); return; }

      const backgrounds = await getBackgroundSettings(festId);
      const bgId = Object.keys(backgrounds?.studentCardBgs || {})[0];
      const bgUrlOriginal = bgId ? backgrounds!.studentCardBgs[bgId] : undefined;
      const baseConfig = bgId ? (backgrounds!.configs?.[bgId] || {}) : (backgrounds?.configs?.['blank'] || { cardsPerPage: 9 });
      const config = { ...baseConfig, layout: layoutOverride };
      const perPage = config.cardsPerPage || 9;
      
      const totalPages = Math.ceil(participants.length / perPage);
      
      setExportProgress({ current: 0, total: totalPages, label: 'Fetching Template...' });
      const bgUrl = bgUrlOriginal ? await getBase64Image(bgUrlOriginal) : undefined;
      
      const pdf = new jsPDF('p', 'px', [794, 1123]);
  
      for (let i = 0; i < totalPages; i++) {
        setExportProgress({ current: i + 1, total: totalPages, label: layoutOverride === 'detailed' ? 'Participation Lists' : 'Chest Cards' });
        const rawFestId = programs[0]?.festId || 'Arts Fest';
        const festParts = rawFestId.split('-');
        const cleanFestName = (festParts.length > 1 ? festParts.slice(0, -1).join(' ') : rawFestId).toUpperCase();

        const batch = participants.slice(i * perPage, (i + 1) * perPage).map(p => ({
            name: p.name,
            chestNo: p.chestNumber,
            team: p.teamName,
            category: cleanFestName,
            events: p.programNames
        }));
        setExportItem({ type: 'studentCards', data: batch, bgUrl, config, festName: cleanFestName });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const element = document.getElementById('export-render-container');
        if (element) {
          try {
             const imgData = await toJpeg(element, { quality: 0.8, pixelRatio: 1.5, style: { transform: 'scale(1)', transformOrigin: 'top left' } });
             if (i > 0) pdf.addPage([794, 1123], 'p');
             pdf.addImage(imgData, 'JPEG', 0, 0, 794, 1123);
          } catch (e) {
             console.error("Error generating image:", e);
          }
        }
      }
      
      pdf.save('Participation_Lists.pdf');
      setExportProgress(null);
      setExportItem(null);
      setIsExporting(false);
    };

    const generateProgramCertificates = async (programId: string) => {
      if (isExporting) return;
      const program = programs.find(p => p.id === programId);
      if (!program) return;
      
      const programParticipants: { name: string; chestNumber: string; teamName: string; programNames: string[] }[] = [];
      (program.teams || []).forEach(team => {
        (team.participants || []).forEach(pt => {
          programParticipants.push({
            name: pt.name,
            chestNumber: pt.chestNumber || pt.chestNumber,
            teamName: team.teamName,
            programNames: [program.name]
          });
        });
      });
      
      if (programParticipants.length === 0) return alert('No participants in this program.');

      setIsExporting(true);
      const festId = program.festId;
      if (!festId) { setIsExporting(false); return; }

      const backgrounds = await getBackgroundSettings(festId);
      const bgId = Object.keys(backgrounds?.certificateBgs || {})[0];
      const bgUrlOriginal = bgId ? backgrounds!.certificateBgs[bgId] : undefined;
      const config = bgId ? backgrounds!.configs?.[bgId] : (backgrounds?.configs?.['blank'] || {
        contentTop: 350, contentLeft: 96, textAlign: 'left', textColor: '#000000',
        secondaryColor: '#ca8a04', layout: 'simple', posterSize: 'portrait',
        cardsPerPage: 9, bgPositionX: 50, bgPositionY: 50, bgScale: 100
      });

      if (!backgrounds) {
        alert('Unable to fetch configurations.');
        setIsExporting(false);
        return;
      }

      setExportProgress({ current: 0, total: programParticipants.length, label: 'Fetching Template...' });
      const bgUrl = await getBase64Image(bgUrlOriginal);

      const pdf = new jsPDF('p', 'px', [794, 1123]);
      const rawFestId = festId;
      const festParts = rawFestId.split('-');
      const cleanFestName = (festParts.length > 1 ? festParts.slice(0, -1).join(' ') : rawFestId).toUpperCase();

      for (let i = 0; i < programParticipants.length; i++) {
        setExportProgress({ current: i + 1, total: programParticipants.length, label: `${program.name} Certificates` });
        const pData = {
          participantName: programParticipants[i].name,
          chestNo: programParticipants[i].chestNumber,
          team: programParticipants[i].teamName,
          category: program.category || 'Arts Fest',
          events: [program.name],
          festName: cleanFestName
        };

        setExportItem({ type: 'certificate', data: pData, bgUrl, config });
        await new Promise(resolve => setTimeout(resolve, 100));

        const element = document.getElementById('export-render-container');
        if (element) {
          try {
            const imgData = await toJpeg(element, { quality: 0.8, pixelRatio: 1.5, style: { transform: 'scale(1)', transformOrigin: 'top left' } });
            if (i > 0) pdf.addPage([794, 1123], 'p');
            pdf.addImage(imgData, 'JPEG', 0, 0, 794, 1123);
          } catch (e) {
            console.error('Error generating image:', e);
          }
        }
      }

      pdf.save(`${program.name}_Certificates.pdf`);
      setExportProgress(null);
      setExportItem(null);
      setIsExporting(false);
    };

    const generatePoster = async (programId: string) => {
      if (isExporting) return;
      const program = programs.find(p => p.id === programId);
      if (!program) return;

      setIsExporting(true);
      const festId = program.festId;
      if (!festId) { setIsExporting(false); return; }

      const backgrounds = await getBackgroundSettings(festId);
      const bgId = Object.keys(backgrounds?.posterBgs || {})[0];
      const bgUrlOriginal = bgId ? backgrounds!.posterBgs![bgId] : undefined;
      const config = bgId ? backgrounds!.configs?.[bgId] : (backgrounds?.configs?.['blank'] || {
        contentTop: 350, contentLeft: 96, textAlign: 'left', textColor: '#000000',
        secondaryColor: '#ca8a04', layout: 'simple', posterSize: 'portrait',
        cardsPerPage: 9, bgPositionX: 50, bgPositionY: 50, bgScale: 100
      });

      if (!bgUrlOriginal) {
        alert('No poster background uploaded yet. Please upload a poster background in the "Posters & Certificates" tab first.');
        setIsExporting(false);
        return;
      }

      // Build winner list from ranked teams/participants
      const getWinners = (): WinnerDetails[] => {
        const results: { place: 1|2|3; name: string; team: string }[] = [];
        if (program.isGroup) {
          (program.teams || [])
            .filter(t => t.rank && t.rank >= 1 && t.rank <= 3)
            .sort((a, b) => (a.rank || 99) - (b.rank || 99))
            .slice(0, 3)
            .forEach(t => results.push({ place: t.rank as 1|2|3, name: t.teamName, team: '' }));
        } else {
          const allParts: any[] = [];
          (program.teams || []).forEach(t =>
            (t.participants || []).forEach(p => allParts.push({ ...p, teamName: t.teamName }))
          );
          allParts
            .filter(p => p.rank && p.rank >= 1 && p.rank <= 3)
            .sort((a, b) => (a.rank || 99) - (b.rank || 99))
            .slice(0, 3)
            .forEach(p => results.push({ place: p.rank as 1|2|3, name: p.name, team: p.teamName }));
        }
        return results;
      };

      const winners = getWinners();
      if (winners.length === 0) {
        alert('No ranked results found for this program. Please enter scores/grades and publish results first.');
        setIsExporting(false);
        return;
      }

      setExportProgress({ current: 1, total: 1, label: `Generating ${program.name} Poster...` });
      const bgUrl = await getBase64Image(bgUrlOriginal);

      const posterSize = config?.posterSize || 'portrait';
      const width = 1080;
      const height = posterSize === 'square' ? 1080 : 1350;

      setExportItem({ type: 'poster', data: { program, winners, config, bgUrl } });
      await new Promise(resolve => setTimeout(resolve, 150));

      const element = document.getElementById('export-render-container');
      if (element) {
        try {
          const imgData = await toJpeg(element, {
            quality: 0.95,
            pixelRatio: 1,
            style: { transform: 'scale(1)', transformOrigin: 'top left' }
          });
          // Download as JPG
          const link = document.createElement('a');
          link.download = `${program.name.replace(/\s+/g, '_')}_Winner_Poster.jpg`;
          link.href = imgData;
          link.click();
        } catch (e) {
          console.error('Error generating poster:', e);
          alert('Failed to generate poster. Please try again.');
        }
      }

      setExportProgress(null);
      setExportItem(null);
      setIsExporting(false);
    };

    const generateSingleCertificate = async (participant: ParticipantSummary) => {
      if (isExporting) return;

      setIsExporting(true);
      const festId = programs[0]?.festId;
      if (!festId) { setIsExporting(false); return; }

      const backgrounds = await getBackgroundSettings(festId);
      const bgId = Object.keys(backgrounds?.certificateBgs || {})[0];
      const bgUrlOriginal = bgId ? backgrounds!.certificateBgs[bgId] : undefined;
      const config = bgId ? backgrounds!.configs?.[bgId] : (backgrounds?.configs?.['blank'] || {
        contentTop: 350, contentLeft: 96, textAlign: 'left', textColor: '#000000',
        secondaryColor: '#ca8a04', layout: 'simple', posterSize: 'portrait',
        cardsPerPage: 9, bgPositionX: 50, bgPositionY: 50, bgScale: 100
      });

      if (!backgrounds) {
        alert('Unable to fetch configurations.');
        setIsExporting(false);
        return;
      }

      setExportProgress({ current: 1, total: 1, label: 'Generating Certificate...' });
      const bgUrl = await getBase64Image(bgUrlOriginal);

      const pdf = new jsPDF('p', 'px', [794, 1123]);
      const rawFestId = festId;
      const festParts = rawFestId.split('-');
      const cleanFestName = (festParts.length > 1 ? festParts.slice(0, -1).join(' ') : rawFestId).toUpperCase();

      const pData = {
        participantName: participant.name,
        chestNo: participant.chestNumber,
        team: participant.teamName,
        category: cleanFestName,
        events: participant.programNames,
        festName: cleanFestName
      };

      setExportItem({ type: 'certificate', data: pData, bgUrl, config });
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = document.getElementById('export-render-container');
      if (element) {
        try {
          const imgData = await toJpeg(element, { quality: 0.8, pixelRatio: 1.5, style: { transform: 'scale(1)', transformOrigin: 'top left' } });
          pdf.addImage(imgData, 'JPEG', 0, 0, 794, 1123);
        } catch (e) {
          console.error('Error generating image:', e);
        }
      }

      pdf.save(`${participant.name}_Certificate.pdf`);
      setExportProgress(null);
      setExportItem(null);
      setIsExporting(false);
    };

    return (
        <>
            {/* Metrics moved to AdminPage Overview */}

            <div className="text-left">
                <div className="flex flex-col lg:flex-row gap-3 mb-6 justify-between items-center">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
                        <div className="relative flex-1 max-w-md">
                            <input 
                                type="text" 
                                placeholder="Search events..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder-slate-400 shadow-sm" 
                            />
                            <svg className="w-5 h-5 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <select 
                            value={filter} 
                            onChange={(e) => setFilter(e.target.value as any)} 
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wide text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shrink-0 shadow-sm"
                        >
                            <option value="ALL">All States</option>
                            {Object.values(ProgramStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    
                    {/* Bulk Export Actions */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 lg:justify-end shrink-0 w-full lg:w-auto">
                        <button 
                        onClick={() => generateStudentCards('detailed')}
                        disabled={isExporting}
                        className="col-span-1 flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-all shadow-sm uppercase tracking-wide"
                        >
                        <Download className="w-4 h-4 opacity-70 shrink-0" /> <span className="truncate">Participation Lists</span>
                        </button>
                        <button 
                        onClick={generateBulkCertificates}
                        disabled={isExporting}
                        className="col-span-1 flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-all shadow-sm uppercase tracking-wide"
                        >
                        <Download className="w-4 h-4 opacity-70 shrink-0" /> <span className="truncate">Bulk Certificates</span>
                        </button>
                        <button 
                        onClick={() => generateStudentCards('simple')}
                        disabled={isExporting}
                        className="col-span-2 sm:col-span-1 flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-all shadow-sm uppercase tracking-wide"
                        >
                        <Download className="w-4 h-4 opacity-70 shrink-0" /> <span className="truncate">Chest Number Cards</span>
                        </button>
                    </div>
                </div>

                {/* TABLE HEADER - Image 1 Style */}
                <div className="hidden lg:flex items-center justify-between px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 gap-4">
                    <div className="flex-1 pl-[52px]">Event</div>
                    <div className="w-[140px] text-center">Category</div>
                    <div className="w-[120px] text-center">Registrations</div>
                    <div className="w-[140px] text-center">Status</div>
                    <div className="w-[340px] text-right pr-6">Actions</div>
                </div>

                <div className="space-y-3">
                            {filteredPrograms.map(prog => (
                                <ProgramAccordion
                                    key={prog.id} 
                                    program={prog}
                                    onUpdateStatus={handleStatusUpdate}
                                    onDelete={handleDeleteRequest}
                                    onEdit={onEdit}
                                    onSelectParticipant={setSelectedParticipantName}
                                    onPublish={handlePublish}
                                    onPublishResult={async (id) => {
                                        const program = programs.find(p => p.id === id);
                                        if (!program) return;
                                        const newResultState = !program.isResultPublished;
                                        if (updateProgram) {
                                            await updateProgram(id, { isResultPublished: newResultState });
                                        } else {
                                            setPrograms(p => p.map(x => x.id === id ? { ...x, isResultPublished: newResultState } : x));
                                        }
                                    }}
                                    onRequestCancel={setCancelProgramId}
                                    onUpdateProgram={updateProgram}
                                    customScores={customScores}
                                    staffs={staffs}
                                    allPrograms={programs}
                                    onPrintCertificate={generateProgramCertificates}
                                    onDownloadPoster={generatePoster}
                                />
                            ))}
                            {filteredPrograms.length === 0 && (
                                <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-black uppercase text-slate-500 mb-1">No Events Found</h3>
                                    <p className="text-xs text-slate-400 font-medium">Try adjusting your filters or search terms.</p>
                                </div>
                            )}
                        </div>
            </div>



            {selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[380px] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="bg-indigo-600 px-6 py-12 text-white text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-2xl">
                                <span className="text-3xl font-black">{selectedParticipant.name.charAt(0)}</span>
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tight">{selectedParticipant.name}</h4>
                            <p className="text-[11px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1">
                                Chest #{selectedParticipant.chestNumber} &bull; {selectedParticipant.teamName}
                            </p>
                        </div>
                        <div className="p-8 text-left">
                            <div className="grid grid-cols-2 gap-4 mb-8 -mt-16">
                                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 text-center">
                                    <span className="block text-2xl font-black text-slate-800">{selectedParticipant.programCount}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Events</span>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 text-center">
                                    <span className="block text-2xl font-black text-emerald-600">{selectedParticipant.totalWins}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prizes</span>
                                </div>
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 pb-3 mb-4">Event History</p>
                            <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                {selectedParticipant.programNames.map((pn, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                        <span className="text-xs font-bold text-slate-700 truncate uppercase">{pn}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setSelectedParticipantName(null)} className="mt-8 w-full py-5 bg-slate-900 text-white rounded-3xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
                                Close Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirmId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[420px] p-8 text-center border border-slate-200">
                        {deleteStatus === 'idle' && (
                            <>
                                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Delete Program?</h3>
                                <p className="text-sm text-slate-600 mb-2 font-bold">{programs.find(p => p.id === deleteConfirmId)?.name}</p>
                                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                                    This will permanently delete the program from the database.<br />
                                    All participants, scores, and data will be removed.<br />
                                    <span className="text-rose-600 font-bold">This action cannot be undone!</span>
                                </p>
                                <div className="flex gap-4">
                                    <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleDeleteConfirm} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all">
                                        Delete Forever
                                    </button>
                                </div>
                            </>
                        )}
                        {deleteStatus === 'deleting' && (
                            <>
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="animate-spin w-10 h-10" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Deleting...</h3>
                                <p className="text-sm text-slate-500">Please wait while we remove the program from the database.</p>
                            </>
                        )}
                        {deleteStatus === 'success' && (
                            <>
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-emerald-900 mb-3 uppercase tracking-tight">Deleted!</h3>
                                <p className="text-sm text-slate-600">{deleteMessage}</p>
                            </>
                        )}
                        {deleteStatus === 'error' && (
                            <>
                                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-rose-900 mb-3 uppercase tracking-tight">Error!</h3>
                                <p className="text-sm text-slate-600 mb-6">{deleteMessage}</p>
                                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                                    Close
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {cancelProgramId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[360px] p-8 text-center border border-slate-200">
                        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Void Event?</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">Confirm cancellation of this program. All data remains stored for audit.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setCancelProgramId(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Dismiss</button>
                            <button onClick={() => { setPrograms(p => p.map(x => x.id === cancelProgramId ? { ...x, status: ProgramStatus.CANCELLED } : x)); setCancelProgramId(null); }} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all">Confirm Void</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Modal */}
            {exportProgress && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <h3 className="text-lg font-black text-slate-800 mb-1">Generating {exportProgress.label}...</h3>
                    <p className="text-sm font-bold text-slate-500 mb-4">Processing page {exportProgress.current} of {exportProgress.total}</p>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3 overflow-hidden shadow-inner">
                        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 relative overflow-hidden" style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}>
                        <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_1s_infinite]"></div>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 italic font-medium">Please do not close or switch tabs.</p>
                </div>
                </div>
            )}

            {/* Hidden Rendering Container for html2canvas */}
            <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1, pointerEvents: 'none', opacity: 0 }}>
                {exportItem && (
                    <div id="export-render-container" className="bg-white">
                    {exportItem.type === 'certificate' && (
                        <CertificateTemplate 
                            backgroundUrl={exportItem.bgUrl} 
                            {...exportItem.data} 
                            bgPositionX={exportItem.config?.bgPositionX}
                            bgPositionY={exportItem.config?.bgPositionY}
                            bgScale={exportItem.config?.bgScale}
                            festName={exportItem.data.festName}
                        />
                    )}
                    {exportItem.type === 'studentCards' && (
                        <StudentCardBatchTemplate 
                            students={exportItem.data} 
                            layoutType={exportItem.config?.layout as any} 
                            backgroundUrl={exportItem.config?.layout === 'detailed' ? exportItem.bgUrl : undefined}
                            cardsPerPage={exportItem.config?.cardsPerPage} 
                            bgPositionX={exportItem.config?.bgPositionX}
                            bgPositionY={exportItem.config?.bgPositionY}
                            bgScale={exportItem.config?.bgScale}
                            festName={exportItem.festName}
                        />
                    )}
                    {exportItem.type === 'poster' && (
                        <PosterTemplate
                            backgroundUrl={exportItem.data.bgUrl}
                            eventName={exportItem.data.program.name}
                            category={exportItem.data.program.category}
                            winners={exportItem.data.winners}
                            contentTop={exportItem.data.config?.contentTop}
                            contentLeft={exportItem.data.config?.contentLeft}
                            textAlign={exportItem.data.config?.textAlign}
                            textColor={exportItem.data.config?.textColor}
                            secondaryColor={exportItem.data.config?.secondaryColor}
                            posterSize={exportItem.data.config?.posterSize}
                            bgPositionX={exportItem.data.config?.bgPositionX}
                            bgPositionY={exportItem.data.config?.bgPositionY}
                            bgScale={exportItem.data.config?.bgScale}
                        />
                    )}
                    </div>
                )}
            </div>
        </>
    );
};