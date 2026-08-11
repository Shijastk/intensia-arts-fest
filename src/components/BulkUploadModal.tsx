import React, { useState, useRef, useCallback } from 'react';
import { Program, ProgramStatus } from '../types';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle2, Users, Calendar } from 'lucide-react';

interface BulkUploadModalProps {
  show: boolean;
  onClose: () => void;
  addProgram: (data: Omit<Program, 'id' | 'festId'>) => Promise<boolean>;
  programs?: Program[];
  updateProgram?: (id: string, updates: Partial<Program>) => Promise<boolean>;
}

type TabType = 'programs' | 'students';

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ show, onClose, addProgram, programs, updateProgram }) => {
  const [activeTab, setActiveTab] = useState<TabType>('programs');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processProgramsFile = (results: Papa.ParseResult<any>) => {
    if (results.errors.length > 0) {
      setError('Error parsing CSV file. Please check the format.');
      return;
    }
    const validData = results.data.map((row: any) => {
      const isGroup = String(row.isGroup).toLowerCase() === 'true';
      return {
        name: row.name || '',
        category: row.category || '',
        zone: row.zone || '',
        duration: parseInt(row.duration) || 30,
        isGroup: isGroup,
        participantsCount: parseInt(row.participantsCount) || (isGroup ? 0 : 1),
        groupCount: parseInt(row.groupCount) || (isGroup ? 1 : 0),
        membersPerGroup: parseInt(row.membersPerGroup) || (isGroup ? 2 : 0),
        description: row.description || '',
        status: ProgramStatus.PENDING,
        teams: []
      };
    }).filter(item => item.name && item.category);

    if (validData.length === 0) setError('No valid programs found in the CSV.');
    else setParsedData(validData);
  };

  const processStudentsFile = (results: Papa.ParseResult<any>) => {
    if (results.errors.length > 0) {
      setError('Error parsing CSV file. Please check the format.');
      return;
    }
    const validData = results.data.map((row: any) => {
      return {
        participantName: row.ParticipantName || row.participantName || row.Name || row.name || '',
        collegeName: row.CollegeName || row.collegeName || row.TeamName || row.teamName || row.College || '',
        programName: row.ProgramName || row.programName || row.EventName || row.eventName || '',
        role: row.Role || row.role || ''
      };
    }).filter(item => item.participantName && item.collegeName && item.programName);

    if (validData.length === 0) setError('No valid data found. Ensure columns match: ParticipantName, CollegeName, ProgramName');
    else setParsedData(validData);
  };

  const processFile = (file: File) => {
    setError(null);
    setSuccessCount(0);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (activeTab === 'programs') {
          processProgramsFile(results);
        } else {
          processStudentsFile(results);
        }
      },
      error: (error: any) => {
        setError(error.message);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      processFile(file);
    } else {
      setError('Please upload a valid CSV file.');
    }
  }, [isUploading, activeTab]);

  const generatePredictableChestNumber = (collegeIndex: number, participantIndex: number) => {
    const base = (collegeIndex + 1) * 1000;
    return (base + participantIndex).toString();
  };

  const uploadPrograms = async () => {
    try {
      for (const item of parsedData) {
        await addProgram(item);
      }
      setSuccessCount(parsedData.length);
      setParsedData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => {
        onClose();
        setSuccessCount(0);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload some programs.');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadStudents = async () => {
    if (!programs || !updateProgram) return;
    try {
      const groupedByProgram = parsedData.reduce((acc, row) => {
        const pName = row.programName.toLowerCase().trim();
        if (!acc[pName]) acc[pName] = [];
        acc[pName].push(row);
        return acc;
      }, {} as Record<string, any[]>);

      let totalUploaded = 0;
      let collegeIndexMap = new Map<string, number>();
      let collegeIndexCounter = 0;

      parsedData.forEach(row => {
        const cName = row.collegeName.toLowerCase().trim();
        if (!collegeIndexMap.has(cName)) {
          collegeIndexMap.set(cName, collegeIndexCounter++);
        }
      });

      const collegeParticipantCounter = new Map<string, number>();

      for (const [pNameLower, students] of Object.entries(groupedByProgram)) {
        const matchingProgram = programs.find(p => p.name.toLowerCase().trim() === pNameLower);
        if (!matchingProgram) {
          console.warn(`Program not found for name: ${students[0].programName}`);
          continue;
        }

        const updatedTeams = JSON.parse(JSON.stringify(matchingProgram.teams || []));

        students.forEach(student => {
          const cNameLower = student.collegeName.toLowerCase().trim();
          let team = updatedTeams.find((t: any) => t.teamName.toLowerCase().trim() === cNameLower);
          if (!team) {
            team = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              teamName: student.collegeName,
              participants: []
            };
            updatedTeams.push(team);
          }

          const cIndex = collegeIndexMap.get(cNameLower) || 0;
          const pIndex = (collegeParticipantCounter.get(cNameLower) || 0) + 1;
          collegeParticipantCounter.set(cNameLower, pIndex);
          const chestNumber = generatePredictableChestNumber(cIndex, pIndex);

          team.participants.push({
            name: student.participantName,
            chestNumber,
            role: student.role || undefined
          });
          totalUploaded++;
        });

        await updateProgram(matchingProgram.id, { teams: updatedTeams });
      }

      setSuccessCount(totalUploaded);
      setParsedData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => {
        onClose();
        setSuccessCount(0);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload some students.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (parsedData.length === 0) return;
    setIsUploading(true);
    setError(null);
    if (activeTab === 'programs') {
      await uploadPrograms();
    } else {
      await uploadStudents();
    }
  };

  const downloadTemplate = () => {
    if (activeTab === 'programs') {
      const templateData = [
        {
          name: 'Classical Dance', category: 'Arts', zone: 'North', duration: '15',
          isGroup: 'false', participantsCount: '1', groupCount: '0', membersPerGroup: '0', description: 'Classical solo performance'
        }
      ];
      const csv = Papa.unparse(templateData);
      triggerDownload(csv, 'program_upload_template.csv');
    } else {
      const templateData = [
        { ParticipantName: 'John Doe', CollegeName: 'ABC Arts College', ProgramName: 'Group Song', Role: 'Lead Singer' }
      ];
      const csv = Papa.unparse(templateData);
      triggerDownload(csv, 'student_upload_template.csv');
    }
  };

  const triggerDownload = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    if (!isUploading) {
      setParsedData([]);
      setError(null);
      setSuccessCount(0);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onClose();
    }
  };

  const handleTabSwitch = (tab: TabType) => {
    if (isUploading) return;
    setActiveTab(tab);
    setParsedData([]);
    setError(null);
    setSuccessCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const programsPrompt = `CRITICAL INSTRUCTION: Do NOT generate visual cards, image widgets, HTML previews, or UI components. Output ONLY a real downloadable .csv file.

Task: Convert all event/item details from the attached file/image into a downloadable .csv file using Python code execution.

CSV Schema (Columns):
1. name (Required: string) - The exact item/event name written in the file.
2. category (Required: string) - The category or section header written in the file.
3. zone (Optional: string) - Zone if mentioned; leave blank if not.
4. duration (Optional: number) - Duration in minutes. Default to 30.
5. isGroup (Required: boolean) - Must be 'true' or 'false'.
6. participantsCount (Optional: number) - Total count if mentioned.
7. groupCount (Optional: number) - Required if isGroup is true; leave blank otherwise.
8. membersPerGroup (Optional: number) - Required if isGroup is true; leave blank otherwise.
9. description (Optional: string) - Short description ("[Category] - [Name]").

Rules:
1. Extract all text dynamically as written in the attachment.
2. Write and execute code to generate a true downloadable .csv file.
3. DO NOT output image elements or graphical table cards.`;

  const studentsPrompt = `CRITICAL INSTRUCTION: Do NOT generate visual cards, image widgets, HTML previews, or UI components. Output ONLY a real downloadable .csv file.

Task: Convert all student/participant details from the attached file/image into a downloadable .csv file using Python code execution.

CSV Schema (Columns):
1. ParticipantName (Required: string) - The exact student name written in the file.
2. CollegeName (Required: string) - The college/team name they belong to.
3. ProgramName (Required: string) - The exact event/program name they are participating in.
4. Role (Optional: string) - Role of the student if mentioned (e.g., Lead, Chorus).

Rules:
1. Extract all text dynamically as written in the attachment.
2. Write and execute code to generate a true downloadable .csv file.
3. DO NOT output image elements or graphical table cards.`;

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className={`bg-white rounded-xl w-full max-w-2xl shadow-2xl border flex flex-col max-h-[90vh] transition-all relative
          ${isDragging ? (activeTab === 'programs' ? 'border-indigo-500 scale-[1.02] shadow-indigo-500/20' : 'border-emerald-500 scale-[1.02] shadow-emerald-500/20') : 'border-slate-200'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 rounded-xl border-2 border-dashed backdrop-blur-[2px]
            ${activeTab === 'programs' ? 'border-indigo-400' : 'border-emerald-400'}`}>
            <UploadCloud className={`w-16 h-16 animate-bounce mb-4 ${activeTab === 'programs' ? 'text-indigo-500' : 'text-emerald-500'}`} />
            <p className={`text-xl font-black uppercase tracking-widest ${activeTab === 'programs' ? 'text-indigo-600' : 'text-emerald-600'}`}>Drop CSV Here</p>
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
            Bulk Upload Dashboard
          </h3>
          <button type="button" onClick={handleClose} disabled={isUploading} className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none disabled:opacity-50">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => handleTabSwitch('programs')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'programs' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Upload Programs
          </button>
          <button 
            onClick={() => handleTabSwitch('students')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'students' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Upload Students
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* AI Helper Banner */}
          <div className={`border rounded-xl p-4 shadow-sm relative overflow-hidden transition-colors
            ${activeTab === 'programs' ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100/50' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100/50'}`}>
            <div className="absolute -top-4 -right-4 p-4 opacity-10 pointer-events-none transform rotate-12">
              <UploadCloud className={`w-24 h-24 ${activeTab === 'programs' ? 'text-indigo-600' : 'text-emerald-600'}`} />
            </div>
            <div className="flex gap-3 relative z-10">
              <div className={`shrink-0 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border
                ${activeTab === 'programs' ? 'border-indigo-100' : 'border-emerald-100'}`}>
                <span className="font-black text-sm">✨</span>
              </div>
              <div>
                <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight mb-1">No CSV? Use AI!</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed max-w-md">
                  Take a photo of your hand-written or printed {activeTab === 'programs' ? 'programs' : 'student'} list, copy our prompt, and paste both into Gemini or ChatGPT to get a ready-to-upload CSV file.
                </p>
                <button
                  onClick={() => {
                    const promptToCopy = activeTab === 'programs' ? programsPrompt : studentsPrompt;
                    navigator.clipboard.writeText(promptToCopy);
                    alert("AI Prompt copied to clipboard! Paste it into Gemini or ChatGPT.");
                  }}
                  className={`mt-3 px-3 py-1.5 bg-white border rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-1.5 w-fit
                    ${activeTab === 'programs' ? 'text-indigo-600 border-indigo-200 hover:border-indigo-400 hover:text-indigo-700' : 'text-emerald-600 border-emerald-200 hover:border-emerald-400 hover:text-emerald-700'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  Copy Prompt
                </button>
              </div>
            </div>
          </div>

          {successCount > 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <div>
                <h4 className="text-sm font-bold text-emerald-800">Success!</h4>
                <p className="text-xs text-emerald-600">Successfully uploaded {successCount} {activeTab === 'programs' ? 'programs' : 'students'}.</p>
              </div>
            </div>
          )}

          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-lg border-2 border-dashed transition-colors
            ${isDragging ? (activeTab === 'programs' ? 'border-indigo-400 bg-indigo-50' : 'border-emerald-400 bg-emerald-50') : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
          >
            <div>
              <p className="text-sm text-slate-700 font-bold">Drag and drop your CSV file here</p>
              <p className="text-xs text-slate-500 mt-1">Or click the button to browse your files.</p>
              <button onClick={downloadTemplate} className={`text-[10px] font-bold uppercase mt-2 inline-block ${activeTab === 'programs' ? 'text-indigo-600 hover:text-indigo-800' : 'text-emerald-600 hover:text-emerald-800'}`}>Download Template</button>
            </div>
            <label className={`cursor-pointer bg-white px-5 py-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors shadow-sm whitespace-nowrap flex items-center gap-2
              ${activeTab === 'programs' ? 'hover:border-indigo-400 hover:text-indigo-600' : 'hover:border-emerald-400 hover:text-emerald-600'}`}>
              <UploadCloud className="w-4 h-4" />
              <span>Choose CSV File</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
                ref={fileInputRef}
                disabled={isUploading}
              />
            </label>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
              <p className="text-xs text-rose-600 font-medium">{error}</p>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="mt-4 border border-slate-100 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-slate-500">Preview ({parsedData.length} valid rows)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
                    <tr>
                      {activeTab === 'programs' ? (
                        <>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Duration</th>
                        </>
                      ) : (
                        <>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">College/Team</th>
                          <th className="px-3 py-2">Program</th>
                          <th className="px-3 py-2">Role</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600 font-medium">
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        {activeTab === 'programs' ? (
                          <>
                            <td className="px-3 py-2 font-bold text-slate-800">{row.name}</td>
                            <td className="px-3 py-2">{row.category}</td>
                            <td className="px-3 py-2">{row.isGroup ? 'Group' : 'Solo'}</td>
                            <td className="px-3 py-2">{row.duration} min</td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 font-bold text-slate-800">{row.participantName}</td>
                            <td className="px-3 py-2">{row.collegeName}</td>
                            <td className="px-3 py-2">{row.programName}</td>
                            <td className="px-3 py-2">{row.role || '-'}</td>
                          </>
                        )}
                      </tr>
                    ))}
                    {parsedData.length > 5 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-center text-slate-400 italic">
                          ... and {parsedData.length - 5} more items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex gap-3 justify-end">
          <button type="button" onClick={handleClose} disabled={isUploading} className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50">Cancel</button>
          <button 
            type="button" 
            onClick={handleConfirmUpload} 
            disabled={parsedData.length === 0 || isUploading}
            className={`px-5 py-2 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2
              ${activeTab === 'programs' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              `Upload ${parsedData.length > 0 ? parsedData.length : ''} ${activeTab === 'programs' ? 'Programs' : 'Students'}`
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
