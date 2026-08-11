import React, { useState, useRef, useCallback } from 'react';
import { Program, ProgramStatus } from '../types';
import Papa from 'papaparse';
import { UploadCloud } from 'lucide-react';

interface BulkUploadModalProps {
  show: boolean;
  onClose: () => void;
  addProgram: (data: Omit<Program, 'id' | 'festId'>) => Promise<boolean>;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ show, onClose, addProgram }) => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
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

        setParsedData(validData);
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
  }, [isUploading]);

  const handleConfirmUpload = async () => {
    if (parsedData.length === 0) return;
    setIsUploading(true);

    try {
      for (const item of parsedData) {
        await addProgram(item);
      }
      alert(`Successfully uploaded ${parsedData.length} programs!`);
      setParsedData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload some programs.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        name: 'Classical Dance',
        category: 'Arts',
        zone: 'North',
        duration: '15',
        isGroup: 'false',
        participantsCount: '1',
        groupCount: '0',
        membersPerGroup: '0',
        description: 'Classical solo performance'
      },
      {
        name: 'Group Song',
        category: 'Music',
        zone: 'South',
        duration: '20',
        isGroup: 'true',
        participantsCount: '0',
        groupCount: '5',
        membersPerGroup: '6',
        description: 'Group singing competition'
      }
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'program_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    setParsedData([]);
    setError(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className={`bg-white rounded-xl w-full max-w-2xl shadow-2xl border flex flex-col max-h-[90vh] transition-all relative
          ${isDragging ? 'border-indigo-500 scale-[1.02] shadow-indigo-500/20' : 'border-slate-200'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-indigo-50/90 rounded-xl border-2 border-dashed border-indigo-400 backdrop-blur-[2px]">
            <UploadCloud className="w-16 h-16 text-indigo-500 animate-bounce mb-4" />
            <p className="text-xl font-black text-indigo-600 uppercase tracking-widest">Drop CSV Here</p>
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
            Bulk Upload Programs
          </h3>
          <button type="button" onClick={handleClose} disabled={isUploading} className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none disabled:opacity-50">✕</button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* AI Helper Banner */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute -top-4 -right-4 p-4 opacity-10 pointer-events-none transform rotate-12">
              <UploadCloud className="w-24 h-24 text-indigo-600" />
            </div>
            <div className="flex gap-3 relative z-10">
              <div className="shrink-0 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-indigo-100">
                <span className="text-indigo-600 font-black text-sm">✨</span>
              </div>
              <div>
                <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight mb-1">No CSV? Use AI!</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed max-w-md">
                  Take a photo of your hand-written or printed list, copy our prompt, and paste both into Gemini or ChatGPT to get a ready-to-upload CSV file.
                </p>
                <button
                  onClick={() => {
                    const prompt = "Please convert the attached photo of the programs list into a CSV format with the following exact columns: name, category, zone, duration, isGroup, participantsCount, groupCount, membersPerGroup, description. Follow these rules: duration should be a number in minutes. isGroup should be true or false. Return ONLY the raw CSV text, no markdown formatting.";
                    navigator.clipboard.writeText(prompt);
                    alert("AI Prompt copied to clipboard! Paste it into Gemini or ChatGPT.");
                  }}
                  className="mt-3 px-3 py-1.5 bg-white text-indigo-600 border border-indigo-200 hover:border-indigo-400 hover:text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-1.5 w-fit"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  Copy Prompt
                </button>
              </div>
            </div>
          </div>

          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-lg border-2 border-dashed transition-colors
            ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
          >
            <div>
              <p className="text-sm text-slate-700 font-bold">Drag and drop your CSV file here</p>
              <p className="text-xs text-slate-500 mt-1">Or click the button to browse your files.</p>
              <button onClick={downloadTemplate} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase mt-2 inline-block">Download Template</button>
            </div>
            <label className="cursor-pointer bg-white px-5 py-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors shadow-sm whitespace-nowrap flex items-center gap-2">
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
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600 font-medium">
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-bold text-slate-800">{row.name}</td>
                        <td className="px-3 py-2">{row.category}</td>
                        <td className="px-3 py-2">{row.isGroup ? 'Group' : 'Solo'}</td>
                        <td className="px-3 py-2">{row.duration} min</td>
                      </tr>
                    ))}
                    {parsedData.length > 5 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-center text-slate-400 italic">
                          ... and {parsedData.length - 5} more programs
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
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              `Upload ${parsedData.length > 0 ? parsedData.length : ''} Programs`
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
