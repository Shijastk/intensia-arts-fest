import React, { useState, useMemo, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Program, Settings } from '../types';
import { detectBatchClashes, ClashDetail, calculateCascadingTimes, resolveTimeEdit, ScheduleUpdate, cascadeFromEdit, CascadeMode, CascadeResult, getStagePrograms } from '../utils/scheduleCalculator';
import { parseScheduleTime, compareScheduleTimes, formatTime, formatDate, toDateTimeLocalValue } from '../utils/timeUtils';
import { programService } from '../services/programService';
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  TouchSensor, 
  MouseSensor, 
  useSensor, 
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { appDialog } from './ui/AppDialog';

const DEFAULT_STAGES = ['Main Stage', 'Stage 2', 'Stage 3'];

interface ScheduleManagerProps {
  programs: Program[];
  updateProgram: (id: string, updates: Partial<Program>) => Promise<boolean>;
  festId?: string;
  settings?: Partial<Settings>;
  updateSettings?: (updates: Partial<Settings>) => Promise<boolean>;
}

// -------------------------------------------------------------
// UI COMPONENTS
// -------------------------------------------------------------

const DraggableProgram: React.FC<{ program: Program, onManualAdd?: (p: Program) => void }> = ({ program, onManualAdd }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: program.id,
    data: { type: 'UnscheduledProgram', program }
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`p-3 bg-white rounded-lg border ${isDragging ? 'opacity-50 border-indigo-400' : 'border-slate-200 hover:border-indigo-300'} shadow-sm transition-colors cursor-grab flex justify-between items-center`}
    >
      <div className="flex-1">
        <h4 className="text-xs font-black text-slate-900 leading-tight uppercase">{program.name}</h4>
        <div className="flex gap-2 items-center mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{program.duration || 30}m</p>
        </div>
      </div>
      {onManualAdd && (
        <button
          onClick={(e) => { e.stopPropagation(); onManualAdd(program); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 ml-2 shrink-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors no-print-btn"
          title="Assign to Stage manually"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
        </button>
      )}
    </div>
  );
};

const SortableProgramCard = ({ program, formatTime, onUnschedule, onEditTime }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: program.id,
    data: { type: 'SortableProgram', program }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:border-indigo-300 transition-colors relative overflow-hidden group cursor-grab active:cursor-grabbing"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
      <h4 className="text-xs font-black text-slate-900 ml-1.5 uppercase pr-20 lg:pr-12">{program.name}</h4>
      <div className="flex justify-between items-center mt-2 ml-1.5 text-[9px] font-bold text-slate-600 uppercase">
        <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-1 rounded border border-slate-100">
          {formatTime(program.startTime)} - {formatTime(program.endTime)}
        </span>
        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-1 rounded border border-indigo-100">{program.duration || 30}m</span>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onEditTime(program); }} 
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-1 right-10 lg:top-1.5 lg:right-8 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-indigo-500 hover:text-indigo-700 bg-indigo-50 rounded p-2 lg:p-1 transition-all no-print-btn" 
        title="Edit Time"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onUnschedule(program.id); }} 
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking unschedule
        className="absolute top-1 right-1 lg:top-1.5 lg:right-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-rose-500 hover:text-rose-700 bg-rose-50 rounded p-2 lg:p-1 transition-all no-print-btn" 
        title="Unschedule"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    </div>
  );
};

const DroppableVenue = ({ venue, programs, onUnschedule, formatTime, onEditTime }: any) => {
  const { isOver, setNodeRef } = useDroppable({
    id: venue,
    data: { type: 'Venue', venue }
  });

  return (
    <div ref={setNodeRef} className={`w-[calc(100vw-6.5rem)] sm:w-80 flex-shrink-0 flex flex-col rounded-xl transition-all duration-300 border ${isOver ? 'border-indigo-500 shadow-lg' : 'border-slate-200 shadow-sm'}`}>
      <div className={`bg-slate-50 text-slate-800 text-xs font-black uppercase tracking-widest py-3 px-4 rounded-t-xl border-b border-slate-200 flex justify-between items-center ${isOver ? 'bg-indigo-50 text-indigo-900 border-indigo-200' : ''}`}>
        {venue}
        <span className={`px-2 py-0.5 rounded text-[9px] ${isOver ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-600'}`}>{programs.length}</span>
      </div>
      <div className={`bg-white rounded-b-xl p-3 flex-1 min-h-[300px] sm:min-h-[500px] flex flex-col gap-2 relative ${isOver ? 'bg-indigo-50/10' : ''}`}>
        <SortableContext items={programs.map((p: any) => p.id)} strategy={verticalListSortingStrategy}>
          {programs.map((p: any) => (
            <SortableProgramCard 
              key={p.id} 
              program={p} 
              formatTime={formatTime} 
              onUnschedule={onUnschedule} 
              onEditTime={onEditTime}
            />
          ))}
        </SortableContext>
        
        {programs.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
            <span className="text-[10px] font-bold uppercase tracking-widest">Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({ programs, updateProgram, festId, settings, updateSettings }) => {
  const [clashWarning, setClashWarning] = useState<{ clashes: ClashDetail[], updatesToSave: ScheduleUpdate[] } | null>(null);
  const [activeDragProgram, setActiveDragProgram] = useState<Program | null>(null);
  const [manualAssignProgram, setManualAssignProgram] = useState<Program | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Custom Stages Feature (persisted in fest settings.stages; local state is the fallback/optimistic copy)
  const [customStages, setCustomStages] = useState<string[]>([]);
  const [newStageName, setNewStageName] = useState('');

  // Time Edit Feature
  const [timeEditProgram, setTimeEditProgram] = useState<Program | null>(null);

  // Cascading time change: preview of the whole stage before anything is saved.
  const [cascadePreview, setCascadePreview] = useState<{
    program: Program;
    editedUpdates: Partial<Program>;
    mode: CascadeMode;
    result: CascadeResult;
    clashes: ClashDetail[];
  } | null>(null);
  const [isSavingCascade, setIsSavingCascade] = useState(false);
  const previewListRef = useRef<HTMLDivElement>(null);
  // On small screens the edited program is often below the fold: bring it into view.
  useEffect(() => {
    previewListRef.current?.querySelector('[data-preview-row="edited"]')?.scrollIntoView({ block: 'center' });
  }, [cascadePreview?.program.id]);

  // Baseline Time for new venues
  const [pendingBaselineDrop, setPendingBaselineDrop] = useState<{
    venueProgramsBefore: Program[],
    newOrderedVenuePrograms: Program[],
    targetVenue: string,
    activeId: string,
  } | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // MouseSensor + TouchSensor (not PointerSensor): a pointer sensor also fires for touch and
  // hijacks vertical scrolling on phones. Touch drags start after a 250ms long-press.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  const resolvedFestId = festId || programs[0]?.festId;

  const unscheduledPrograms = useMemo(() => {
    let list = programs.filter(p => !p.startTime);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(term) || (p.category && p.category.toLowerCase().includes(term)));
    }
    return list;
  }, [programs, searchTerm]);
  const scheduledPrograms = useMemo(
    () => programs.filter(p => !!p.startTime).sort((a, b) => compareScheduleTimes(a.startTime, b.startTime)),
    [programs]
  );

  // RTDB may hand arrays back as objects with numeric keys; accept both.
  const savedStages = useMemo(() => {
    const raw: unknown = settings?.stages;
    const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw as Record<string, unknown>) : [];
    return list.filter((s): s is string => typeof s === 'string' && !!s.trim());
  }, [settings?.stages]);

  // Union of (defaults when nothing is saved) + saved stages + locally added + venues in use.
  const uniqueVenues = useMemo(() => {
    const v = new Set<string>();
    (savedStages.length > 0 ? savedStages : DEFAULT_STAGES).forEach(s => v.add(s));
    customStages.forEach(s => v.add(s));
    scheduledPrograms.forEach(p => { if (p.venue) v.add(p.venue); });
    return Array.from(v);
  }, [savedStages, customStages, scheduledPrograms]);

  const persistStages = async (added: string[]) => {
    const next = Array.from(new Set([...uniqueVenues, ...added]));
    setCustomStages(prev => Array.from(new Set([...prev, ...added])));
    if (!updateSettings) return;
    try {
      const ok = await updateSettings({ stages: next });
      if (ok === false) throw new Error('updateSettings returned false');
    } catch (err) {
      console.error('Failed to save stages:', err);
      appDialog.alert('The stage was added on this screen but could not be saved. It may disappear after a reload.', { title: 'Stage not saved', variant: 'danger' });
    }
  };

  const handleAddStage = async () => {
    const name = newStageName.trim();
    if (name && !uniqueVenues.includes(name)) {
      setNewStageName('');
      await persistStages([name]);
    }
  };

  const handleAutoGenerateStages = async () => {
    const num = parseInt((await appDialog.prompt("How many stages do you want to generate?", "3", { title: "Generate stages", confirmText: "Generate" })) || "0", 10);
    if (!isNaN(num) && num > 0) {
      await persistStages(Array.from({ length: num }, (_, i) => `Stage ${i + 1}`));
    }
  };

  /** Save all updates with ONE multi-path write. */
  const saveBatch = async (batchUpdates: ScheduleUpdate[]): Promise<boolean> => {
    if (batchUpdates.length === 0) return true;
    try {
      if (!resolvedFestId) throw new Error('No fest id available');
      await programService.batchUpdatePrograms(resolvedFestId, batchUpdates);
      return true;
    } catch (err) {
      console.error('Schedule save failed:', err);
      appDialog.alert('The schedule change could not be saved. Nothing was changed - please try again.', { title: 'Save failed', variant: 'danger' });
      return false;
    }
  };

  /** Check every changed program for venue overlaps / participant clashes, then save or warn. */
  const processBatchUpdates = async (batchUpdates: ScheduleUpdate[]) => {
    if (batchUpdates.length === 0) return;
    const clashes = detectBatchClashes(batchUpdates, programs);
    if (clashes.length > 0) {
      setClashWarning({ clashes, updatesToSave: batchUpdates });
      return; // Pause until the user decides
    }
    await saveBatch(batchUpdates);
  };

  const scheduleIntoVenue = async (venueProgramsBefore: Program[], newOrderedVenuePrograms: Program[], targetVenue: string, activeId: string) => {
    const batchUpdates = calculateCascadingTimes({ before: venueProgramsBefore, after: newOrderedVenuePrograms, movedId: activeId, venue: targetVenue });
    if (!batchUpdates) {
      // Empty venue: ask for the first start time
      setPendingBaselineDrop({ venueProgramsBefore, newOrderedVenuePrograms, targetVenue, activeId });
      return;
    }
    await processBatchUpdates(batchUpdates);
  };

  const handleManualAdd = async (program: Program, targetVenue: string) => {
    const currentVenuePrograms = scheduledPrograms.filter(p => p.venue === targetVenue && p.id !== program.id);
    await scheduleIntoVenue(currentVenuePrograms, [...currentVenuePrograms, program], targetVenue, program.id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const program = programs.find(p => p.id === active.id);
    if (program) setActiveDragProgram(program);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragProgram(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return; // dropped on itself: nothing to do

    const activeId = active.id as string;
    const activeProgram = programs.find(p => p.id === activeId);
    if (!activeProgram) return;

    const overType = over.data.current?.type;
    let targetVenue = '';
    if (overType === 'Venue') {
      // Dropped on a venue column (empty area): append to the end
      targetVenue = over.id as string;
    } else if (overType === 'SortableProgram') {
      targetVenue = (over.data.current!.program as Program).venue as string;
    } else {
      return; // Dropped somewhere else
    }

    const currentVenuePrograms = scheduledPrograms.filter(p => p.venue === targetVenue);
    let newOrderedVenuePrograms: Program[];
    if (overType === 'Venue') {
      newOrderedVenuePrograms = [...currentVenuePrograms.filter(p => p.id !== activeId), activeProgram];
    } else {
      const overId = (over.data.current!.program as Program).id;
      const activeIndex = currentVenuePrograms.findIndex(p => p.id === activeId);
      const overIndex = currentVenuePrograms.findIndex(p => p.id === overId);
      if (overIndex === -1) return;
      if (activeIndex !== -1) {
        // Re-ordering within the SAME venue
        newOrderedVenuePrograms = arrayMove(currentVenuePrograms, activeIndex, overIndex);
      } else {
        // Moving from Unscheduled OR from a DIFFERENT venue: insert at the drop position
        newOrderedVenuePrograms = [...currentVenuePrograms];
        newOrderedVenuePrograms.splice(overIndex, 0, activeProgram);
      }
    }

    // If the order did not change, calculateCascadingTimes returns [] and nothing is written.
    await scheduleIntoVenue(currentVenuePrograms, newOrderedVenuePrograms, targetVenue, activeId);
  };

  const handleIgnoreWarningAndSave = async () => {
    if (!clashWarning) return;
    const toSave = clashWarning.updatesToSave;
    setClashWarning(null);
    await saveBatch(toSave);
  };

  const handleUnschedule = (id: string) => saveBatch([{ id, updates: { startTime: '', endTime: '', venue: '' } }]);

  const handleSaveTimeEdit = async () => {
    if (!timeEditProgram) return;
    const result = resolveTimeEdit(timeEditProgram, {
      start: (document.getElementById('timeEditStart') as HTMLInputElement).value,
      end: (document.getElementById('timeEditEnd') as HTMLInputElement).value,
      duration: (document.getElementById('timeEditDuration') as HTMLInputElement).value,
    });
    if ('error' in result) {
      appDialog.alert(result.error, { title: 'Check the time', variant: 'warning' });
      return;
    }
    // Later programs on the same stage move with it; show the proposed stage before saving.
    setTimeEditProgram(null);
    setCascadePreview(buildCascadePreview(timeEditProgram, result.updates, 'keepBreaks'));
  };

  const buildCascadePreview = (program: Program, editedUpdates: Partial<Program>, mode: CascadeMode) => {
    const result = cascadeFromEdit({ stagePrograms: getStagePrograms(programs, program.venue || ''), editedId: program.id, editedUpdates, mode });
    return { program, editedUpdates, mode, result, clashes: detectBatchClashes(result.updates, programs) };
  };

  const handleConfirmCascade = async () => {
    if (!cascadePreview || isSavingCascade) return;
    setIsSavingCascade(true);
    // One multi-path write: either every affected program moves or none does.
    const ok = await saveBatch(cascadePreview.result.updates);
    setIsSavingCascade(false);
    if (!ok) return; // saveBatch already explained the failure; the preview stays open
    const count = cascadePreview.result.updates.length;
    setCascadePreview(null);
    appDialog.alert(`${count} program${count === 1 ? '' : 's'} on ${cascadePreview.program.venue} updated.`, { variant: 'success', title: 'Schedule updated' });
  };

  const downloadPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF('landscape');
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(59, 59, 250); // Indigo
      doc.text("Intensia Arts Fest - Schedule", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
      
      let startY = 40;

      for (const venue of uniqueVenues) {
        const venuePrograms = scheduledPrograms.filter(p => p.venue === venue);
        if (venuePrograms.length === 0) continue;

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Venue: ${venue}`, 14, startY);
        
        const tableData = venuePrograms.map(p => [
          p.name,
          p.category || 'N/A',
          formatTime(p.startTime),
          formatTime(p.endTime),
          `${p.duration || 30} mins`
        ]);

        autoTable(doc, {
          startY: startY + 5,
          head: [['Program Name', 'Category', 'Start Time', 'End Time', 'Duration']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 59, 250] }, // matches #3B3BFA
          margin: { bottom: 20 },
        });

        startY = (doc as any).lastAutoTable.finalY + 15;
        
        // Add new page if space is low
        if (startY > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          startY = 20;
        }
      }

      doc.save(`Intensia_Schedule_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      appDialog.alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Dynamic CSS for PDF hiding elements */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body * { visibility: hidden !important; }
          #printable-timeline, #printable-timeline * { visibility: visible !important; }
          #printable-timeline {
            position: absolute;
            left: 0;
            top: 0;
            width: max-content;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          .no-print-btn { display: none !important; }
          .custom-scrollbar { overflow: visible !important; }
        }
      `}</style>
      
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col lg:flex-row gap-4 p-2 sm:p-4 font-sans bg-slate-50 min-h-screen">
          
          {/* Sidebar: Unscheduled List */}
          <div className="w-full lg:w-[320px] shrink-0">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[45vh] lg:max-h-[85vh]">
              <div className="flex justify-between items-center mb-3 shrink-0">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Unscheduled</h3>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black border border-slate-200">{unscheduledPrograms.length}</span>
              </div>
              
              <div className="mb-3 shrink-0 relative">
                <input 
                  type="text" 
                  placeholder="Search programs..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-xs font-bold outline-none focus:border-indigo-600 transition-colors"
                />
              </div>
              
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3 shrink-0">Drag & Drop onto a stage to schedule</p>
              
              <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1">
                {unscheduledPrograms.map(p => (
                  <DraggableProgram key={p.id} program={p} onManualAdd={setManualAssignProgram} />
                ))}
                {unscheduledPrograms.length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 mb-2 border border-emerald-100">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">All Scheduled!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Area: Timeline View */}
          <div className="flex-1 min-w-0 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:overflow-hidden lg:max-h-[85vh]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
              <div className="w-full sm:w-auto">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Schedule Timeline</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <input 
                    type="text"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="New stage name..."
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-base sm:text-[10px] font-bold text-slate-700 outline-none flex-1 min-w-[8rem] sm:flex-none sm:w-32"
                  />
                  <button onClick={handleAddStage} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-black uppercase transition-all">
                    + Add Stage
                  </button>
                  <button onClick={handleAutoGenerateStages} className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-[10px] font-black uppercase transition-all whitespace-nowrap sm:ml-1">
                    Auto Create Stages
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center shadow-sm">
                  {scheduledPrograms.length} Scheduled
                </span>
                <button 
                  onClick={downloadPDF}
                  disabled={isExporting}
                  className="text-[10px] font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {isExporting ? (
                    <span className="animate-spin w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full"></span>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  )}
                  {isExporting ? 'Exporting...' : 'Export PDF'}
                </button>
              </div>
            </div>

            <div id="printable-timeline" className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar pb-2 max-h-[75vh] lg:max-h-none" ref={timelineRef}>
              <div className="flex gap-4 min-w-max p-1">
                {uniqueVenues.map(venue => (
                  <DroppableVenue 
                    key={venue} 
                    venue={venue} 
                    programs={scheduledPrograms.filter(p => p.venue === venue)} 
                    onUnschedule={handleUnschedule}
                    formatTime={formatTime}
                    onEditTime={setTimeEditProgram}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Clash Warning Modal */}
          {clashWarning && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h4 className="text-sm font-black text-rose-600 uppercase flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Clash Detected
                  </h4>
                  <button onClick={() => setClashWarning(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
                </div>
                <div className="p-5">
                  <p className="text-[11px] text-slate-600 font-bold mb-4 uppercase tracking-wider">The following schedule conflicts were found:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {clashWarning.clashes.map((c, i) => (
                      <div key={i} className="flex flex-col bg-slate-50 p-2.5 rounded border border-slate-200">
                        <span className="text-[10px] font-black text-slate-800 uppercase">
                          {c.type === 'venue' ? `Stage overlap${c.venue ? ` on ${c.venue}` : ''}` : `${c.participantName} (Chest: ${c.chestNumber})`}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold mt-1">{c.programName ? `${c.programName} conflicts` : 'Conflicts'} with <strong className="text-rose-500">{c.conflictingProgramName}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 justify-end">
                  <button 
                    onClick={() => setClashWarning(null)} 
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleIgnoreWarningAndSave}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Ignore & Save
                  </button>
                </div>
              </div>
            </div>
          )}

          
          {/* Manual Assign Modal */}
          {manualAssignProgram && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h4 className="text-sm font-black text-slate-900 uppercase">Assign "{manualAssignProgram.name}"</h4>
                  <button onClick={() => setManualAssignProgram(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                </div>
                <div className="p-5">
                  <p className="text-[11px] text-slate-600 font-bold mb-4 uppercase tracking-wider">Select a stage to append this event:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {uniqueVenues.map(venue => (
                      <button 
                        key={venue}
                        onClick={() => {
                          handleManualAdd(manualAssignProgram, venue);
                          setManualAssignProgram(null);
                        }}
                        className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-lg text-sm font-bold transition-colors"
                      >
                        {venue}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Edit Modal */}
          {timeEditProgram && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h4 className="text-sm font-black text-slate-900 uppercase">Edit Schedule Time</h4>
                  <button onClick={() => setTimeEditProgram(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">{timeEditProgram.name} • {timeEditProgram.venue}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">Start Time</label>
                      <input 
                        type="datetime-local" 
                        id="timeEditStart"
                        defaultValue={toDateTimeLocalValue(timeEditProgram.startTime)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-base sm:text-xs font-bold text-slate-800 outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">End Time</label>
                      <input 
                        type="datetime-local" 
                        id="timeEditEnd"
                        defaultValue={toDateTimeLocalValue(timeEditProgram.endTime)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-base sm:text-xs font-bold text-slate-800 outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">Duration (minutes)</label>
                      <input 
                        type="number" 
                        id="timeEditDuration"
                        defaultValue={timeEditProgram.duration || 30}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-base sm:text-xs font-bold text-slate-800 outline-none focus:border-indigo-500" 
                        min="1"
                      />
                    </div>
                    <p className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 leading-relaxed">
                      Programs after this one on {timeEditProgram.venue} will move with it. You will see the new timetable before anything is saved.
                    </p>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 justify-end">
                  <button 
                    onClick={() => setTimeEditProgram(null)} 
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveTimeEdit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Preview Changes
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Cascade Preview Modal */}
          {cascadePreview && (() => {
            const { program, result, clashes, mode } = cascadePreview;
            const affected = result.rows.filter(r => r.changed).length;
            const sameDay = (a: string, b: string) => formatDate(a) === formatDate(b);
            return (
              <div className="fixed inset-0 z-[260] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Preview schedule change">
                <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-start gap-3 bg-slate-50">
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 uppercase">Preview New Timetable</h4>
                      <p className="text-[11px] font-bold text-slate-500 mt-1 truncate">{program.venue} · {affected} program{affected === 1 ? '' : 's'} will change</p>
                    </div>
                    <button onClick={() => setCascadePreview(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1" aria-label="Cancel">✕</button>
                  </div>

                  {result.hasBreaks && (
                    <div className="px-4 pt-3">
                      <div className="flex rounded-lg bg-slate-100 p-1 text-[11px] font-black uppercase">
                        {(['keepBreaks', 'backToBack'] as CascadeMode[]).map(m => (
                          <button
                            key={m}
                            onClick={() => setCascadePreview(buildCascadePreview(program, cascadePreview.editedUpdates, m))}
                            className={`flex-1 py-2 rounded-md transition-all ${mode === m ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                          >
                            {m === 'keepBreaks' ? 'Keep breaks' : 'Remove breaks'}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold mt-1.5">This stage has breaks between programs. "Keep breaks" keeps each gap the same length.</p>
                    </div>
                  )}

                  <div ref={previewListRef} className="p-4 overflow-y-auto flex-1 space-y-1.5">
                    {result.rows.map(r => (
                      <div
                        key={r.id}
                        data-preview-row={r.isEdited ? 'edited' : r.changed ? 'moves' : 'unchanged'}
                        className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${r.isEdited ? 'border-indigo-300 bg-indigo-50' : r.changed ? 'border-amber-200 bg-amber-50/60' : 'border-slate-100 bg-white opacity-70'}`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 uppercase truncate">{r.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">
                            {r.duration} min{r.isEdited ? ' · edited' : r.changed ? ' · moves' : ' · unchanged'}
                          </p>
                        </div>
                        <div className="text-right shrink-0 text-[11px] font-bold leading-tight">
                          {r.changed ? (
                            <>
                              <p className="text-slate-400 line-through">{formatTime(r.oldStart)} – {formatTime(r.oldEnd)}</p>
                              <p className={r.isEdited ? 'text-indigo-700' : 'text-amber-700'}>
                                {formatTime(r.newStart)} – {formatTime(r.newEnd)}
                                {!sameDay(r.newStart, r.oldStart) && <span className="block text-[9px] uppercase">{formatDate(r.newStart)}</span>}
                              </p>
                            </>
                          ) : (
                            <p className="text-slate-600">{formatTime(r.oldStart)} – {formatTime(r.oldEnd)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {clashes.length > 0 && (
                    <div className="mx-4 mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 max-h-36 overflow-y-auto">
                      <p className="text-[11px] font-black text-rose-700 uppercase mb-1.5">{clashes.length} conflict{clashes.length === 1 ? '' : 's'} with this timetable</p>
                      {clashes.map((c, i) => (
                        <p key={i} className="text-[11px] font-bold text-rose-700">
                          {c.type === 'venue' ? `Stage overlap: ${c.programName} ↔ ${c.conflictingProgramName}` : `${c.participantName} (#${c.chestNumber}): ${c.programName} ↔ ${c.conflictingProgramName}`}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 justify-end">
                    <button
                      onClick={() => setCascadePreview(null)}
                      className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-black uppercase tracking-wider transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmCascade}
                      disabled={isSavingCascade}
                      className={`px-4 py-2.5 text-white rounded text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-60 ${clashes.length > 0 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                      {isSavingCascade ? 'Saving…' : clashes.length > 0 ? `Save anyway (${result.updates.length})` : `Save ${result.updates.length} change${result.updates.length === 1 ? '' : 's'}`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Baseline Time Modal for New Venue */}
          {pendingBaselineDrop && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h4 className="text-sm font-black text-slate-900 uppercase">Set Venue Start Time</h4>
                  <button onClick={() => setPendingBaselineDrop(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">First program in {pendingBaselineDrop.targetVenue}</p>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">When does the first program start?</label>
                    <input 
                      type="datetime-local" 
                      id="baselineStart"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-base sm:text-xs font-bold text-slate-800 outline-none focus:border-indigo-500" 
                    />
                  </div>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 justify-end">
                  <button 
                    onClick={() => setPendingBaselineDrop(null)} 
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      const startInput = (document.getElementById('baselineStart') as HTMLInputElement).value;
                      const explicitStart = parseScheduleTime(startInput);
                      if (explicitStart) {
                        const pending = pendingBaselineDrop;
                        setPendingBaselineDrop(null);
                        const batchUpdates = calculateCascadingTimes({
                          before: pending.venueProgramsBefore,
                          after: pending.newOrderedVenuePrograms,
                          movedId: pending.activeId,
                          venue: pending.targetVenue,
                          baseline: explicitStart,
                        });
                        if (batchUpdates) await processBatchUpdates(batchUpdates);
                      } else {
                        appDialog.alert("Please select a date and time", { title: 'Start time needed', variant: 'warning' });
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Start Schedule
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Visual overlay for dragging */}
        <DragOverlay>
          {activeDragProgram ? (
            <div className="bg-white border border-indigo-500 shadow-2xl rounded-lg p-3 w-72 opacity-90 rotate-2">
              <h4 className="text-xs font-black text-slate-900 ml-1.5 uppercase">{activeDragProgram.name}</h4>
              <div className="flex gap-2 items-center mt-1">
                <span className="bg-indigo-50 text-indigo-700 px-1.5 py-1 rounded border border-indigo-100 text-[9px] font-bold uppercase">{activeDragProgram.duration || 30}m</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>

      </DndContext>
    </>
  );
};
