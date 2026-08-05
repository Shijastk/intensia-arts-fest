import React, { useState, useRef, useEffect } from 'react';
import { Program } from '../types';

interface ProgramAutocompleteProps {
  availablePrograms: (Program & { limit: number; currentCount: number; isFull: boolean })[];
  selectedProgramIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabledProgramIds?: string[]; // Programs the user is already in (should not be selectable)
}

export const ProgramAutocomplete: React.FC<ProgramAutocompleteProps> = ({
  availablePrograms,
  selectedProgramIds,
  onChange,
  disabledProgramIds = []
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPrograms = availablePrograms.filter(p => {
    // Exclude already selected
    if (selectedProgramIds.includes(p.id)) return false;
    // Exclude permanently disabled (already registered previously)
    if (disabledProgramIds.includes(p.id)) return false;
    
    // Search match
    const searchStr = `${p.name} ${p.category}`.toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });

  const displayPrograms = query.trim() === '' ? filteredPrograms.slice(0, 4) : filteredPrograms;

  const handleSelect = (id: string) => {
    onChange([...selectedProgramIds, id]);
    setQuery('');
    setIsOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange(selectedProgramIds.filter(pid => pid !== id));
  };

  const selectedProgramsList = availablePrograms.filter(p => selectedProgramIds.includes(p.id));

  return (
    <div className="flex flex-col gap-2" ref={wrapperRef}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search programs to add..."
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600 transition-colors"
        />
        
        {/* Dropdown Results */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {displayPrograms.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 text-center">No programs found</div>
            ) : (
              <>
                {query.trim() === '' && filteredPrograms.length > 0 && (
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Suggested Programs
                  </div>
                )}
                {displayPrograms.map(p => {
                  const disabled = p.isFull || p.status !== 'PENDING';
                  return (
                    <div
                      key={p.id}
                      onClick={() => !disabled && handleSelect(p.id)}
                      className={`px-3 py-2 text-xs border-b border-slate-100 last:border-0 ${
                        disabled 
                          ? 'opacity-50 cursor-not-allowed bg-slate-50' 
                          : 'cursor-pointer hover:bg-indigo-50 hover:text-indigo-700'
                      }`}
                    >
                      <div className="font-bold flex justify-between items-center">
                        <span>{p.name}</span>
                        {p.isFull && <span className="text-[9px] bg-rose-100 text-rose-600 px-1.5 rounded uppercase">Full</span>}
                        {p.status !== 'PENDING' && !p.isFull && <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 rounded uppercase">{p.status}</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.category}</div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Selected Chips */}
      {selectedProgramsList.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {selectedProgramsList.map(p => (
            <div key={p.id} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold">
              <span>{p.name}</span>
              <button 
                type="button"
                onClick={() => handleRemove(p.id)}
                className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-indigo-200 hover:bg-rose-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
