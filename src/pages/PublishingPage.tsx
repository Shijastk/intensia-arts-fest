import React, { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, Download, Trash2, Printer, LayoutTemplate, Award, Users } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { usePrograms } from '../hooks/usePrograms';
import { uploadImageToImgBB } from '../services/imageUploadService';
import { getBackgroundSettings, saveBackground, deleteBackground, BackgroundSettings, saveBackgroundConfig, TemplateConfig } from '../services/backgroundService';
import { CertificateTemplate } from '../components/generators/CertificateTemplate';
import { PosterTemplate, WinnerDetails } from '../components/generators/PosterTemplate';
import { StudentCardBatchTemplate } from '../components/generators/StudentCardBatchTemplate';

interface PublishingPageProps {
  festId: string;
}

export const PublishingPage: React.FC<PublishingPageProps> = ({ festId }) => {
  const { programs, loading: programsLoading } = usePrograms(festId);
  
  const [backgrounds, setBackgrounds] = useState<BackgroundSettings>({ 
    certificateBgs: {}, 
    posterBgs: {}, 
    studentCardBgs: {} 
  });
  const [loadingBgs, setLoadingBgs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [customizationModal, setCustomizationModal] = useState<{ isOpen: boolean, type: string, bgId: string, bgUrl: string } | null>(null);

  useEffect(() => {
    loadBackgrounds();
  }, [festId]);

  const loadBackgrounds = async () => {
    setLoadingBgs(true);
    try {
      const bgs = await getBackgroundSettings(festId);
      if (bgs) {
        // Handle legacy single-image data if present
        const migratedBgs = { ...bgs };
        if (bgs.certificateBg && !bgs.certificateBgs) {
           migratedBgs.certificateBgs = { 'legacy': bgs.certificateBg };
        }
        if (bgs.studentCardBg && !bgs.studentCardBgs) {
           migratedBgs.studentCardBgs = { 'legacy': bgs.studentCardBg };
        }
        setBackgrounds(migratedBgs);
      }
    } catch (error) {
      console.error("Failed to load background settings:", error);
    } finally {
      setLoadingBgs(false);
    }
  };

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>, type: 'certificateBgs' | 'studentCardBgs' | 'posterBgs') => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const url = await uploadImageToImgBB(file);
      const id = Date.now().toString();
      
      await saveBackground(festId, type, id, url);
      setBackgrounds(prev => ({ 
        ...prev, 
        [type]: { ...(prev[type] || {}), [id]: url } 
      }));
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceBg = async (e: React.ChangeEvent<HTMLInputElement>, type: 'certificateBgs' | 'studentCardBgs' | 'posterBgs', oldId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const url = await uploadImageToImgBB(file);
      const newId = Date.now().toString();
      
      await saveBackground(festId, type, newId, url);
      await deleteBackground(festId, type, oldId);
      
      setBackgrounds(prev => {
        const newBgs = { ...(prev[type] || {}) };
        delete newBgs[oldId];
        newBgs[newId] = url;
        return { ...prev, [type]: newBgs };
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to replace image: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBg = async (type: 'certificateBgs' | 'studentCardBgs' | 'posterBgs', id: string) => {
    if (confirm("Are you sure you want to delete this background?")) {
      await deleteBackground(festId, type, id);
      setBackgrounds(prev => {
        const newBgs = { ...(prev[type] as Record<string, string>) };
        delete newBgs[id];
        return { ...prev, [type]: newBgs };
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pt-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
        {loadingBgs ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading studio...</p>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <BackgroundsTab 
              backgrounds={backgrounds} 
              uploading={uploading} 
              onUpload={handleUploadBg} 
              onReplace={handleReplaceBg}
              onDeleteBg={handleDeleteBg}
              onCustomize={(type: string, id: string, url: string) => setCustomizationModal({ isOpen: true, type, bgId: id, bgUrl: url })}
            />
          </div>
        )}
      </div>

      {customizationModal?.isOpen && (
        <CustomizationModal 
          type={customizationModal.type}
          bgId={customizationModal.bgId}
          bgUrl={customizationModal.bgUrl}
          festId={festId}
          initialConfig={backgrounds.configs?.[customizationModal.bgId]}
          onClose={() => setCustomizationModal(null)}
          onSaveComplete={(bgId: string, newConfig: any) => {
            setBackgrounds(prev => ({ ...prev, configs: { ...prev.configs, [bgId]: newConfig } }));
          }}
        />
      )}
    </div>
  );
};


// --- TABS COMPONENTS ---

const CustomizationModal = ({ type, bgId, bgUrl, festId, initialConfig, onClose, onSaveComplete }: any) => {
  const [config, setConfig] = useState<TemplateConfig>(initialConfig || {
    contentTop: 350,
    contentLeft: 96,
    textAlign: 'left',
    textColor: '#000000',
    secondaryColor: '#ca8a04',
    layout: 'detailed',
    posterSize: 'portrait',
    cardsPerPage: 9,
    bgPositionX: 50,
    bgPositionY: 50,
    bgScale: 100
  });
  const [saving, setSaving] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);
  const [dragState, setDragState] = useState({ isDragging: false, startX: 0, startY: 0, initialBgX: 0, initialBgY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialBgX: config.bgPositionX ?? 0,
      initialBgY: config.bgPositionY ?? 0
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging) return;
    const deltaX = (e.clientX - dragState.startX) / previewScale;
    const deltaY = (e.clientY - dragState.startY) / previewScale;
    
    // Map mouse drag directly to percentage position (approx 5 pixels = 1%)
    let newX = dragState.initialBgX - (deltaX / 5);
    let newY = dragState.initialBgY - (deltaY / 5);
    
    // Clamp between 0% and 100% so we never have empty space (object-fit: cover guarantees fill)
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    setConfig({
      ...config,
      bgPositionX: newX,
      bgPositionY: newY
    });
  };

  const handleMouseUp = () => setDragState(prev => ({ ...prev, isDragging: false }));

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        const { width, height } = entries[0].contentRect;
        const targetWidth = type === 'posterBgs' ? 1080 : 794;
        const targetHeight = type === 'posterBgs' ? (config.posterSize === 'square' ? 1080 : 1350) : 1123;
        
        // padding of 60px total to leave space around
        const scaleX = (width - 60) / targetWidth;
        const scaleY = (height - 60) / targetHeight;
        
        setPreviewScale(Math.min(scaleX, scaleY, 1));
      }
    });

    if (previewContainerRef.current) {
      resizeObserver.observe(previewContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [type, config.posterSize]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBackgroundConfig(festId, bgId, config);
      onSaveComplete(bgId, config);
      alert('Customization saved successfully!');
    } catch (e) {
      alert('Failed to save customization.');
    }
    setSaving(false);
  };

  // Dummy Data for preview
  const dummyParticipant = { name: 'John Doe', participantName: 'John Doe', chestNo: '101', team: 'Creative Crew', category: 'Category A', events: ['Painting', 'Drawing'] };
  const dummyWinners = [{ place: 1, name: 'John Doe', team: 'Creative Crew' }, { place: 2, name: 'Jane Smith', team: 'Artistic Souls' }];
  const dummyStudents = Array(config.cardsPerPage || 9).fill(dummyParticipant).map((s, i) => ({ ...s, chestNo: `10${i+1}` }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <h2 className="text-lg font-black uppercase tracking-widest text-slate-800">
            Customize {type.replace('Bgs', '')} Template
          </h2>
          <div className="flex gap-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary bg-primary text-white rounded py-2 px-6 shadow-md text-xs h-auto">
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Controls Sidebar */}
          <div className="w-80 bg-white border-r border-slate-200 p-6 overflow-y-auto shrink-0 flex flex-col gap-6 custom-scrollbar">
            


            {type === 'posterBgs' && (
              <>
                <div>
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Poster Size</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setConfig({...config, posterSize: 'portrait'})}
                      className={`flex-1 py-2 text-[10px] font-black uppercase rounded border-2 ${config.posterSize !== 'square' ? 'border-[#3B3BFA] bg-indigo-50 text-[#3B3BFA]' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                    >
                      IG Portrait (4:5)
                    </button>
                    <button 
                      onClick={() => setConfig({...config, posterSize: 'square'})}
                      className={`flex-1 py-2 text-[10px] font-black uppercase rounded border-2 ${config.posterSize === 'square' ? 'border-[#3B3BFA] bg-indigo-50 text-[#3B3BFA]' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                    >
                      IG Square (1:1)
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Positioning</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase flex justify-between mb-1">
                        <span>Top Spacing</span> <span>{config.contentTop}px</span>
                      </label>
                      <input 
                        type="range" min="0" max="800" value={config.contentTop} 
                        onChange={(e) => setConfig({...config, contentTop: Number(e.target.value)})}
                        className="w-full accent-[#3B3BFA]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase flex justify-between mb-1">
                        <span>Side Spacing</span> <span>{config.contentLeft}px</span>
                      </label>
                      <input 
                        type="range" min="0" max="400" value={config.contentLeft} 
                        onChange={(e) => setConfig({...config, contentLeft: Number(e.target.value)})}
                        className="w-full accent-[#3B3BFA]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Typography & Colors</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase block mb-2">Text Alignment</label>
                      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                        {['left', 'center', 'right'].map(align => (
                          <button 
                            key={align}
                            onClick={() => setConfig({...config, textAlign: align as any})}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded ${config.textAlign === align ? 'bg-white shadow-sm text-[#3B3BFA]' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-6 pt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase">Primary</label>
                        <input 
                          type="color" 
                          value={config.textColor} 
                          onChange={(e) => setConfig({...config, textColor: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase">Accent</label>
                        <input 
                          type="color" 
                          value={config.secondaryColor} 
                          onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {type === 'studentCardBgs' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Cards per A4 Page</h3>
                  <div className="flex gap-2">
                    {[9, 12, 16].map(num => (
                      <button 
                        key={num}
                        onClick={() => setConfig({...config, cardsPerPage: num as any})}
                        className={`flex-1 py-2 text-[11px] font-black uppercase rounded border-2 ${config.cardsPerPage === num ? 'border-[#3B3BFA] bg-indigo-50 text-[#3B3BFA]' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                      >
                        {num} Cards
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Layout Style</h3>
                  <div className="flex flex-col gap-3">
                    <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${config.layout === 'simple' ? 'border-[#3B3BFA] bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                      <input type="radio" checked={config.layout === 'simple'} onChange={() => setConfig({...config, layout: 'simple'})} className="hidden" /> 
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.layout === 'simple' ? 'border-[#3B3BFA]' : 'border-slate-300'}`}>
                         {config.layout === 'simple' && <div className="w-2 h-2 rounded-full bg-[#3B3BFA]" />}
                      </div>
                      <span className="font-bold text-xs uppercase">Simple Border</span>
                    </label>
                    <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${config.layout === 'detailed' ? 'border-[#3B3BFA] bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                      <input type="radio" checked={config.layout === 'detailed'} onChange={() => setConfig({...config, layout: 'detailed'})} className="hidden" /> 
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.layout === 'detailed' ? 'border-[#3B3BFA]' : 'border-slate-300'}`}>
                         {config.layout === 'detailed' && <div className="w-2 h-2 rounded-full bg-[#3B3BFA]" />}
                      </div>
                      <span className="font-bold text-xs uppercase">Detailed Background</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {type === 'certificateBgs' && (
              <div>
                 <p className="text-xs font-bold text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
                   Certificates automatically adapt to the uploaded A4 background. Ensure your background image has appropriate empty space for the dynamically generated text.
                 </p>
              </div>
            )}

          </div>

          {/* Preview Area */}
          <div ref={previewContainerRef} className="flex-1 bg-slate-100 p-8 overflow-hidden flex items-center justify-center relative inset-shadow">
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 z-10 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Preview (Dummy Data)
            </div>

            <div 
              className={`flex items-center justify-center w-full h-full ${dragState.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {type === 'certificateBgs' && (
                <div className="shadow-2xl bg-white origin-center pointer-events-none" style={{ transform: `scale(${previewScale})` }}>
                  <CertificateTemplate 
                    backgroundUrl={bgUrl} 
                    {...dummyParticipant} 
                    bgPositionX={config.bgPositionX}
                    bgPositionY={config.bgPositionY}
                    bgScale={config.bgScale}
                  />
                </div>
              )}

              {type === 'posterBgs' && (
                <div className="shadow-2xl bg-white origin-center pointer-events-none" style={{ transform: `scale(${previewScale})` }}>
                  <PosterTemplate 
                    backgroundUrl={bgUrl} 
                    eventName="Sample Event Title" 
                    category="Category A" 
                    winners={dummyWinners as any} 
                    contentTop={config.contentTop} 
                    contentLeft={config.contentLeft} 
                    textAlign={config.textAlign} 
                    textColor={config.textColor} 
                    secondaryColor={config.secondaryColor}
                    posterSize={config.posterSize} 
                    bgPositionX={config.bgPositionX}
                    bgPositionY={config.bgPositionY}
                    bgScale={config.bgScale}
                  />
                </div>
              )}

              {type === 'studentCardBgs' && (
                <div className="shadow-2xl bg-white origin-center pointer-events-none" style={{ transform: `scale(${previewScale})` }}>
                  <StudentCardBatchTemplate 
                    students={dummyStudents} 
                    layoutType={config.layout as any} 
                    backgroundUrl={config.layout === 'detailed' ? bgUrl : undefined}
                    cardsPerPage={config.cardsPerPage} 
                    bgPositionX={config.bgPositionX}
                    bgPositionY={config.bgPositionY}
                    bgScale={config.bgScale}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BackgroundsTab = ({ backgrounds, uploading, onUpload, onReplace, onDeleteBg, onCustomize }: any) => {
  const sections = [
    { title: 'Certificates', type: 'certificateBgs', desc: 'Recommended: A4 Landscape or Portrait ', bgs: backgrounds.certificateBgs },
    { title: 'Student Cards', type: 'studentCardBgs', desc: 'Recommended: 2:3 Ratio (Vertical)', bgs: backgrounds.studentCardBgs },
    { title: 'Event Posters', type: 'posterBgs', desc: 'Recommended: 1080x1350 (IG Portrait)', bgs: backgrounds.posterBgs },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-10 gap-8">
      {sections.map(section => (
        <div key={section.type} className={`flex flex-col ${section.type === 'posterBgs' ? 'md:col-span-2 xl:col-span-6' : 'xl:col-span-2'}`}>
          <div className="mb-4 pb-3 border-b border-slate-100 flex flex-col gap-3 items-start">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">{section.title}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">{section.desc}</p>
            </div>
            {section.type !== 'posterBgs' && (
              <button 
                onClick={() => onCustomize(section.type, 'blank', '')} 
                className="text-[10px] font-black text-[#3B3BFA] hover:text-blue-700 uppercase tracking-widest flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors whitespace-nowrap shrink-0"
              >
                <LayoutTemplate className="w-3.5 h-3.5" /> Customize Blank
              </button>
            )}
          </div>
          
          <div className="w-full flex-1">
            <div className={`grid gap-3 ${section.type === 'posterBgs' ? 'grid-cols-3 sm:grid-cols-4 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-1'}`}>
              {section.type === 'posterBgs' && (
                <label className="cursor-pointer border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 bg-slate-50 hover:bg-slate-100 hover:border-[#3B3BFA] hover:text-[#3B3BFA] transition-all aspect-[3/4] w-full p-2 text-center">
                   <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                   <span className="text-[9px] font-bold uppercase tracking-widest leading-tight">Upload<br/>New</span>
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => onUpload(e, section.type)} disabled={uploading} />
                </label>
              )}
              
              {section.bgs && Object.entries(section.bgs).map(([id, url]: any) => (
                <div key={id} onClick={() => onCustomize(section.type, id, url)} className="relative group rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm hover:border-[#3B3BFA] transition-all aspect-[3/4] w-full cursor-pointer">
                  <img src={url} alt={`${section.title} bg`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onCustomize(section.type, id, url); }} className="btn-primary text-[10px] px-3 py-1.5 shadow-lg w-10/12 mb-1 font-black">
                       CUSTOMIZE
                    </button>
                    <label 
                      onClick={(e) => e.stopPropagation()} 
                      className="btn-primary cursor-pointer text-[9px] px-2 py-1 shadow-lg flex items-center justify-center gap-1 w-10/12 text-center whitespace-nowrap bg-slate-700 hover:bg-slate-800 text-white border-0"
                    >
                      Replace
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => onReplace(e, section.type, id)} disabled={uploading} />
                    </label>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteBg(section.type, id); }}
                      className="px-2 py-1 bg-rose-500 text-white rounded font-bold text-[9px] hover:bg-rose-600 shadow-lg flex items-center justify-center gap-1 transition-all w-10/12"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              
              {section.type !== 'posterBgs' && (!section.bgs || Object.keys(section.bgs).length === 0) && (
                <label className="cursor-pointer border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 bg-slate-50 hover:bg-slate-100 hover:border-[#3B3BFA] hover:text-[#3B3BFA] transition-all aspect-[3/4] w-full p-2 text-center">
                   <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                   <span className="text-[9px] font-bold uppercase tracking-widest leading-tight">Upload<br/>New</span>
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => onUpload(e, section.type)} disabled={uploading} />
                </label>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {uploading && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-[#3B3BFA] border-t-transparent rounded-full animate-spin"></div>
            <span className="font-black text-slate-900 uppercase tracking-widest text-sm">Uploading Image...</span>
          </div>
        </div>
      )}
    </div>
  );
};
