import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Program } from '../types';
import { detectClashes, ClashDetail } from '../utils/scheduleCalculator';
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  TouchSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const parseToValidDate = (timeStr?: string): Date | null => {
  if (!timeStr) return null;
  let d = new Date(timeStr);
  if (!isNaN(d.getTime())) return d;
  
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  }
  return null;
};

interface ScheduleManagerProps {
  programs: Program[];
  updateProgram: (id: string, updates: Partial<Program>) => Promise<boolean>;
}

// -------------------------------------------------------------
// UI COMPONENTS
// -------------------------------------------------------------

const DraggableProgram: React.FC<{ program: Program }> = ({ program }) => {
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
      <div>
        <h4 className="text-xs font-black text-slate-900 leading-tight uppercase">{program.name}</h4>
        <div className="flex gap-2 items-center mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{program.duration || 30}m</p>
        </div>
      </div>
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
      <h4 className="text-xs font-black text-slate-900 ml-1.5 uppercase">{program.name}</h4>
      <div className="flex justify-between items-center mt-2 ml-1.5 text-[9px] font-bold text-slate-600 uppercase">
        <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-1 rounded border border-slate-100">
          {formatTime(program.startTime)} - {formatTime(program.endTime)}
        </span>
        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-1 rounded border border-indigo-100">{program.duration || 30}m</span>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onEditTime(program); }} 
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-1.5 right-8 opacity-0 group-hover:opacity-100 text-indigo-500 hover:text-indigo-700 bg-indigo-50 rounded p-1 transition-all no-print-btn" 
        title="Edit Time"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onUnschedule(program.id); }} 
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking unschedule
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 bg-rose-50 rounded p-1 transition-all no-print-btn" 
        title="Unschedule"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    </div>
  );
};

const DroppableVenue = ({ venue, programs, updateProgram, formatTime, onEditTime }: any) => {
  const { isOver, setNodeRef } = useDroppable({
    id: venue,
    data: { type: 'Venue', venue }
  });

  return (
    <div ref={setNodeRef} className={`w-80 flex-shrink-0 flex flex-col rounded-xl transition-all duration-300 border ${isOver ? 'border-indigo-500 shadow-lg' : 'border-slate-200 shadow-sm'}`}>
      <div className={`bg-slate-50 text-slate-800 text-xs font-black uppercase tracking-widest py-3 px-4 rounded-t-xl border-b border-slate-200 flex justify-between items-center ${isOver ? 'bg-indigo-50 text-indigo-900 border-indigo-200' : ''}`}>
        {venue}
        <span className={`px-2 py-0.5 rounded text-[9px] ${isOver ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-600'}`}>{programs.length}</span>
      </div>
      <div className={`bg-white rounded-b-xl p-3 flex-1 min-h-[500px] flex flex-col gap-2 relative ${isOver ? 'bg-indigo-50/10' : ''}`}>
        <SortableContext items={programs.map((p: any) => p.id)} strategy={verticalListSortingStrategy}>
          {programs.map((p: any) => (
            <SortableProgramCard 
              key={p.id} 
              program={p} 
              formatTime={formatTime} 
              onUnschedule={(id: string) => updateProgram(id, { startTime: '', endTime: '', venue: '' })} 
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

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({ programs, updateProgram }) => {
  const [clashWarning, setClashWarning] = useState<{ targetId: string, clashes: ClashDetail[], pendingUpdate: Partial<Program>, updatesToSave: {id: string, updates: Partial<Program>}[] } | null>(null);
  const [activeDragProgram, setActiveDragProgram] = useState<Program | null>(null);
  
  // Custom Stages Feature
  const [customStages, setCustomStages] = useState<string[]>([]);
  const [newStageName, setNewStageName] = useState('');
  
  // Time Edit Feature
  const [timeEditProgram, setTimeEditProgram] = useState<Program | null>(null);

  // Baseline Time for new venues
  const [pendingBaselineDrop, setPendingBaselineDrop] = useState<{
    newOrderedVenuePrograms: Program[],
    targetVenue: string,
    activeId: string,
    activeProgram: Program
  } | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const unscheduledPrograms = useMemo(() => programs.filter(p => !p.startTime), [programs]);
  const scheduledPrograms = useMemo(() => programs.filter(p => !!p.startTime).sort((a,b) => {
    const da = parseToValidDate(a.startTime);
    const db = parseToValidDate(b.startTime);
    return (da?.getTime() || 0) - (db?.getTime() || 0);
  }), [programs]);

  const uniqueVenues = useMemo(() => {
    const v = new Set(scheduledPrograms.map(p => p.venue).filter(Boolean) as string[]);
    customStages.forEach(stage => v.add(stage));
    if (v.size === 0) return ['Main Stage', 'Stage 2', 'Stage 3'];
    return Array.from(v);
  }, [scheduledPrograms, customStages]);

  const handleAddStage = () => {
    if (newStageName.trim() && !uniqueVenues.includes(newStageName.trim())) {
      setCustomStages(prev => [...prev, newStageName.trim()]);
      setNewStageName('');
    }
  };

  const handleAutoGenerateStages = () => {
    const num = parseInt(window.prompt("How many stages do you want to generate?", "3") || "0", 10);
    if (!isNaN(num) && num > 0) {
      const newStages = Array.from({ length: num }, (_, i) => `Stage ${i + 1}`);
      setCustomStages(prev => {
        const set = new Set([...prev, ...newStages]);
        return Array.from(set);
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const program = programs.find(p => p.id === active.id);
    if (program) setActiveDragProgram(program);
  };

  const calculateCascadingTimes = (orderedPrograms: Program[], targetVenue: string, explicitStartTime?: Date) => {
    let currentTime = explicitStartTime;
    if (!currentTime) {
      const firstScheduled = orderedPrograms.find(p => p.startTime);
      if (firstScheduled) {
        currentTime = parseToValidDate(firstScheduled.startTime!);
        if (!currentTime) return null;
      } else {
        return null; // Need baseline time from user
      }
    }

    const updates: { id: string, updates: Partial<Program> }[] = [];

    orderedPrograms.forEach(p => {
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const localStart = (new Date(currentTime!.getTime() - tzoffset)).toISOString().slice(0, -1);
      
      const endObj = new Date(currentTime!.getTime() + (p.duration || 30) * 60 * 1000);
      const localEnd = (new Date(endObj.getTime() - tzoffset)).toISOString().slice(0, -1);
      
      updates.push({
        id: p.id,
        updates: { startTime: localStart, endTime: localEnd, venue: targetVenue }
      });

      currentTime = endObj; // Next program starts exactly when this ends
    });

    return updates;
  };

  const processBatchUpdates = async (batchUpdates: { id: string, updates: Partial<Program> }[], activeId: string, activeProgram: Program, targetVenue: string) => {
    // Check clashes ONLY for the actively dragged item to avoid spamming the user
    const targetUpdate = batchUpdates.find(u => u.id === activeId);
    if (targetUpdate) {
      // Temporarily mock the program state for clash calculation
      const tempPrograms = programs.map(p => {
        const up = batchUpdates.find(b => b.id === p.id);
        return up ? { ...p, ...up.updates } : p;
      });
      
      const clashes = detectClashes(
        {...activeProgram, ...targetUpdate.updates}, 
        targetUpdate.updates.startTime!, 
        targetVenue, 
        tempPrograms
      );

      if (clashes.length > 0) {
        setClashWarning({ 
          targetId: activeId, 
          clashes, 
          pendingUpdate: targetUpdate.updates,
          updatesToSave: batchUpdates // Need to save ALL if they approve
        });
        return; // Pause execution
      }
    }

    // No clashes (or ignored), save all updates
    const updatePromises = batchUpdates.map(u => updateProgram(u.id, u.updates));
    await Promise.all(updatePromises);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragProgram(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const activeProgram = programs.find(p => p.id === activeId);
    if (!activeProgram) return;

    let targetVenue = '';
    let newOrderedVenuePrograms: Program[] = [];

    // Case 1: Dropped over an empty Venue column
    if (over.data.current?.type === 'Venue') {
      targetVenue = over.id as string;
      const currentVenuePrograms = scheduledPrograms.filter(p => p.venue === targetVenue && p.id !== activeId);
      newOrderedVenuePrograms = [...currentVenuePrograms, activeProgram];
    } 
    // Case 2: Dropped over an existing SortableProgram
    else if (over.data.current?.type === 'SortableProgram') {
      const overProgram = over.data.current.program as Program;
      targetVenue = overProgram.venue as string;
      
      const currentVenuePrograms = scheduledPrograms.filter(p => p.venue === targetVenue);
      const activeIndex = currentVenuePrograms.findIndex(p => p.id === activeId);
      const overIndex = currentVenuePrograms.findIndex(p => p.id === overProgram.id);

      if (activeIndex !== -1) {
        // Re-ordering within the SAME venue
        newOrderedVenuePrograms = arrayMove(currentVenuePrograms, activeIndex, overIndex);
      } else {
        // Moving from Unscheduled OR from a DIFFERENT venue
        const otherPrograms = currentVenuePrograms.filter(p => p.id !== activeId);
        otherPrograms.splice(overIndex, 0, activeProgram); // Insert at new position
        newOrderedVenuePrograms = otherPrograms;
      }
    } else {
      return; // Dropped somewhere else
    }

    // Recalculate times for the entire affected venue
    const batchUpdates = calculateCascadingTimes(newOrderedVenuePrograms, targetVenue);
    
    if (!batchUpdates) {
      // Need baseline!
      setPendingBaselineDrop({
        newOrderedVenuePrograms,
        targetVenue,
        activeId,
        activeProgram
      });
      return;
    }

    await processBatchUpdates(batchUpdates, activeId, activeProgram, targetVenue);
  };

  const handleIgnoreWarningAndSave = async () => {
    if (!clashWarning) return;
    const updatePromises = clashWarning.updatesToSave.map(u => updateProgram(u.id, u.updates));
    await Promise.all(updatePromises);
    setClashWarning(null);
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const d = new Date(timeStr);
    return isNaN(d.getTime()) ? timeStr : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      alert("Failed to generate PDF. Check console for details.");
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
        <div className="flex flex-col lg:flex-row gap-4 p-4 font-sans bg-slate-50 min-h-screen">
          
          {/* Sidebar: Unscheduled List */}
          <div className="w-full lg:w-[320px] shrink-0">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Unscheduled</h3>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black border border-slate-200">{unscheduledPrograms.length}</span>
              </div>
              
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3 shrink-0">Drag & Drop onto a stage to schedule</p>
              
              <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1">
                {unscheduledPrograms.map(p => (
                  <DraggableProgram key={p.id} program={p} />
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
          <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden max-h-[85vh]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Schedule Timeline</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <input 
                    type="text"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="New stage name..."
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-700 outline-none w-32"
                  />
                  <button onClick={handleAddStage} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-black uppercase transition-all">
                    + Add Stage
                  </button>
                  <button onClick={handleAutoGenerateStages} className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-[10px] font-black uppercase transition-all whitespace-nowrap ml-1">
                    Auto Create Stages
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2">
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

            <div id="printable-timeline" className="flex-1 overflow-x-auto custom-scrollbar pb-2" ref={timelineRef}>
              <div className="flex gap-4 min-w-max p-1">
                {uniqueVenues.map(venue => (
                  <DroppableVenue 
                    key={venue} 
                    venue={venue} 
                    programs={scheduledPrograms.filter(p => p.venue === venue)} 
                    updateProgram={updateProgram}
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
                  <p className="text-[11px] text-slate-600 font-bold mb-4 uppercase tracking-wider">The following participants have overlapping schedules:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {clashWarning.clashes.map((c, i) => (
                      <div key={i} className="flex flex-col bg-slate-50 p-2.5 rounded border border-slate-200">
                        <span className="text-[10px] font-black text-slate-800 uppercase">{c.participantName} (Chest: {c.chestNumber})</span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold mt-1">Conflicts with <strong className="text-rose-500">{c.conflictingProgramName}</strong></span>
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
                        defaultValue={(() => {
                          const d = parseToValidDate(timeEditProgram.startTime);
                          if (!d) return '';
                          return new Date(d.getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                        })()}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800 outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">End Time</label>
                      <input 
                        type="datetime-local" 
                        id="timeEditEnd"
                        defaultValue={(() => {
                          const d = parseToValidDate(timeEditProgram.endTime);
                          if (!d) return '';
                          return new Date(d.getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                        })()}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800 outline-none focus:border-indigo-500" 
                      />
                    </div>
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
                    onClick={async () => {
                      const startInput = (document.getElementById('timeEditStart') as HTMLInputElement).value;
                      const endInput = (document.getElementById('timeEditEnd') as HTMLInputElement).value;
                      
                      if (startInput && endInput) {
                        const newStart = new Date(startInput).toISOString();
                        const newEnd = new Date(endInput).toISOString();
                        await updateProgram(timeEditProgram.id, { startTime: newStart, endTime: newEnd });
                      }
                      setTimeEditProgram(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Save Time
                  </button>
                </div>
              </div>
            </div>
          )}
          
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800 outline-none focus:border-indigo-500" 
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
                    onClick={() => {
                      const startInput = (document.getElementById('baselineStart') as HTMLInputElement).value;
                      if (startInput) {
                        const explicitStart = new Date(startInput);
                        const batchUpdates = calculateCascadingTimes(
                          pendingBaselineDrop.newOrderedVenuePrograms, 
                          pendingBaselineDrop.targetVenue, 
                          explicitStart
                        );
                        if (batchUpdates) {
                          processBatchUpdates(
                            batchUpdates, 
                            pendingBaselineDrop.activeId, 
                            pendingBaselineDrop.activeProgram, 
                            pendingBaselineDrop.targetVenue
                          );
                        }
                        setPendingBaselineDrop(null);
                      } else {
                        alert("Please select a date and time");
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
