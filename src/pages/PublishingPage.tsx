import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import { uploadImageToImgBB } from '../services/imageUploadService';
import { getBackgroundSettings, saveBackground, deleteBackground, BackgroundSettings, BackgroundType, saveBackgroundConfig, setActiveBackground, TemplateConfig } from '../services/backgroundService';
import {
  BG_SCALE_MAX,
  BG_SCALE_MIN,
  CURRENT_CONFIG_VERSION,
  DEFAULT_CERT_BODY_TEMPLATE,
  FONT_OPTIONS,
  PLACEHOLDER_KEYS,
  UPLOAD_ACCEPT,
  aspectRatioWarning,
  getTemplateSize,
  loadImage,
  mergeTemplateConfig,
  pickTemplate,
  validateUploadFile,
} from '../services/exportService';
import { CertificateTemplate } from '../components/generators/CertificateTemplate';
import { PosterTemplate } from '../components/generators/PosterTemplate';
import { StudentCardBatchTemplate } from '../components/generators/StudentCardBatchTemplate';
import { appDialog } from '../components/ui/AppDialog';

/**
 * Validates an image before upload: PNG/JPEG/WebP only, max 7 MB, and asks for confirmation
 * when its aspect ratio is far from the template's. Returns false when the upload should stop.
 */
const checkUploadFile = async (file: File, type: BackgroundType): Promise<boolean> => {
  const error = validateUploadFile(file);
  if (error) {
    await appDialog.alert(error, { title: 'Unsupported image', variant: 'warning' });
    return false;
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const { width, height } = await loadImage(objectUrl);
    const warning = aspectRatioWarning(type, width, height);
    if (warning) return await appDialog.confirm(warning, { title: 'Image size mismatch', variant: 'warning', confirmText: 'Upload anyway' });
    return true;
  } catch {
    await appDialog.alert('This file could not be read as an image.', { title: 'Unsupported image', variant: 'warning' });
    return false;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

interface PublishingPageProps {
  festId: string;
}

export const PublishingPage: React.FC<PublishingPageProps> = ({ festId }) => {
  const [backgrounds, setBackgrounds] = useState<BackgroundSettings>({ 
    certificateBgs: {}, 
    posterBgs: {}, 
    studentCardBgs: {} 
  });
  const [loadingBgs, setLoadingBgs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [customizationModal, setCustomizationModal] = useState<{ isOpen: boolean, type: BackgroundType, bgId: string, bgUrl: string } | null>(null);

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

  const markActive = async (type: BackgroundType, id: string) => {
    await setActiveBackground(festId, type, id);
    setBackgrounds(prev => ({ ...prev, active: { ...(prev.active || {}), [type]: id } }));
  };

  const handleSetActive = async (type: BackgroundType, id: string) => {
    try {
      await markActive(type, id);
    } catch (error: any) {
      appDialog.alert(`Failed to select this background: ${error.message || 'Unknown error'}`, { variant: 'danger' });
    }
  };

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>, type: BackgroundType) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    e.target.value = '';
    if (!(await checkUploadFile(file, type))) return;
    setUploading(true);
    try {
      const url = await uploadImageToImgBB(file, festId);
      const id = Date.now().toString();
      const isFirst = Object.keys(backgrounds[type] || {}).length === 0 || !backgrounds.active?.[type];
      
      await saveBackground(festId, type, id, url);
      setBackgrounds(prev => ({ 
        ...prev, 
        [type]: { ...(prev[type] || {}), [id]: url } 
      }));
      // The first upload of a type becomes the export background automatically.
      if (isFirst) await markActive(type, id);
    } catch (error: any) {
      console.error("Upload error:", error);
      appDialog.alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Replacing keeps the same id, so the saved customisation and the export selection survive.
  const handleReplaceBg = async (e: React.ChangeEvent<HTMLInputElement>, type: BackgroundType, id: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    e.target.value = '';
    if (!(await checkUploadFile(file, type))) return;
    setUploading(true);
    try {
      const url = await uploadImageToImgBB(file, festId);
      await saveBackground(festId, type, id, url);
      setBackgrounds(prev => ({ ...prev, [type]: { ...(prev[type] || {}), [id]: url } }));
    } catch (error: any) {
      console.error("Upload error:", error);
      appDialog.alert(`Failed to replace image: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBg = async (type: BackgroundType, id: string) => {
    if (await appDialog.confirm("Are you sure you want to delete this background?", { variant: 'danger', title: 'Delete background', confirmText: 'Delete' })) {
      await deleteBackground(festId, type, id);
      setBackgrounds(prev => {
        const newBgs = { ...(prev[type] as Record<string, string>) };
        delete newBgs[id];
        const configs = { ...(prev.configs || {}) };
        delete configs[id];
        const active = { ...(prev.active || {}) };
        if (active[type] === id) delete active[type];
        return { ...prev, [type]: newBgs, configs, active };
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
              onSetActive={handleSetActive}
              onCustomize={(type: BackgroundType, id: string, url: string) => setCustomizationModal({ isOpen: true, type, bgId: id, bgUrl: url })}
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
          onSaveComplete={(bgId: string, newConfig: TemplateConfig) => {
            setBackgrounds(prev => ({
              ...prev,
              configs: { ...prev.configs, [bgId]: newConfig },
              // Saving a customisation also makes it the export background.
              active: bgId !== 'blank' ? { ...(prev.active || {}), [customizationModal.type]: bgId } : prev.active,
            }));
          }}
        />
      )}
    </div>
  );
};


// --- TABS COMPONENTS ---

const sectionTitle = "text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4";
const fieldLabel = "text-[10px] font-bold text-slate-700 uppercase flex justify-between mb-1";

const RangeField = ({ label, value, min, max, step = 1, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) => (
  <div>
    <label className={fieldLabel}>
      <span>{label}</span> <span>{Number.isInteger(value) ? value : value.toFixed(step < 0.1 ? 2 : 1)}{unit}</span>
    </label>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#3B3BFA]" />
  </div>
);

const FontSelect = ({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) => (
  <div>
    <label className={fieldLabel}><span>{label}</span></label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white" style={{ fontFamily: FONT_OPTIONS.find(f => f.family === value)?.stack }}>
      {FONT_OPTIONS.map(f => <option key={f.family} value={f.family} style={{ fontFamily: f.stack }}>{f.family}</option>)}
    </select>
  </div>
);

interface CustomizationModalProps {
  type: BackgroundType;
  bgId: string;
  bgUrl: string;
  festId: string;
  initialConfig?: TemplateConfig;
  onClose: () => void;
  onSaveComplete: (bgId: string, config: TemplateConfig) => void;
}

const CustomizationModal = ({ type, bgId, bgUrl, festId, initialConfig, onClose, onSaveComplete }: CustomizationModalProps) => {
  // Saved configs may predate newer fields: always merge over the per-type defaults.
  const [config, setConfig] = useState<TemplateConfig>(() => mergeTemplateConfig(type, initialConfig));
  const [saving, setSaving] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);
  const [dragState, setDragState] = useState({ isDragging: false, startX: 0, startY: 0, initialBgX: 0, initialBgY: 0 });
  const update = (patch: Partial<TemplateConfig>) => setConfig(prev => ({ ...prev, ...patch }));

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

    // Clamp between 0% and 100% (same meaning as CSS background-position)
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    update({ bgPositionX: newX, bgPositionY: newY });
  };

  const handleMouseUp = () => setDragState(prev => ({ ...prev, isDragging: false }));

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        const { width, height } = entries[0].contentRect;
        const target = getTemplateSize(type, config);

        // padding of 60px total to leave space around
        const scaleX = (width - 60) / target.width;
        const scaleY = (height - 60) / target.height;

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
      // RTDB rejects undefined values; configVersion marks configs that carry layout fields.
      const toSave: TemplateConfig = JSON.parse(JSON.stringify({ ...config, configVersion: CURRENT_CONFIG_VERSION }));
      await saveBackgroundConfig(festId, bgId, toSave);
      // The background you just customised is the one exports should use.
      if (bgId !== 'blank') await setActiveBackground(festId, type, bgId);
      onSaveComplete(bgId, toSave);
      appDialog.alert('Customization saved. Exports will use this background.', { variant: 'success', title: 'Saved' });
    } catch (e) {
      appDialog.alert('Failed to save customization.', { variant: 'danger' });
    }
    setSaving(false);
  };

  // Dummy Data for preview
  const dummyParticipant = { name: 'John Doe', participantName: 'John Doe', chestNo: '101', team: 'Creative Crew', category: 'Category A', events: ['Painting', 'Drawing'] };
  const dummyWinners = [{ id: 'w1', place: 1 as const, name: 'John Doe', team: 'Creative Crew' }, { id: 'w2', place: 2 as const, name: 'Jane Smith', team: 'Artistic Souls' }];
  const dummyStudents = Array(config.cardsPerPage || 9).fill(dummyParticipant).map((s, i) => ({ ...s, chestNo: `10${i+1}` }));
  const hasLayoutControls = type === 'posterBgs' || type === 'certificateBgs';
  const isCert = type === 'certificateBgs';

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
              <div>
                <h3 className={sectionTitle}>Poster Size</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => update({ posterSize: 'portrait' })}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded border-2 ${config.posterSize !== 'square' ? 'border-[#3B3BFA] bg-indigo-50 text-[#3B3BFA]' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                  >
                    IG Portrait (4:5)
                  </button>
                  <button
                    onClick={() => update({ posterSize: 'square' })}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded border-2 ${config.posterSize === 'square' ? 'border-[#3B3BFA] bg-indigo-50 text-[#3B3BFA]' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                  >
                    IG Square (1:1)
                  </button>
                </div>
              </div>
            )}

            {bgUrl && (
              <div className={type === 'posterBgs' ? 'pt-4 border-t border-slate-100' : ''}>
                <h3 className={sectionTitle}>Background</h3>
                <div className="space-y-3">
                  <RangeField label="Zoom" value={config.bgScale ?? 100} min={BG_SCALE_MIN} max={BG_SCALE_MAX} unit="%" onChange={(v) => update({ bgScale: v })} />
                  <p className="text-[10px] font-bold text-slate-400">100% fills the page. Drag the preview to reposition.</p>
                  <button onClick={() => update({ bgScale: 100, bgPositionX: 50, bgPositionY: 50 })} className="text-[10px] font-black uppercase text-[#3B3BFA] hover:underline">Reset background</button>
                </div>
              </div>
            )}

            {hasLayoutControls && (
              <>
                <div className="pt-4 border-t border-slate-100">
                  <h3 className={sectionTitle}>Positioning</h3>
                  <div className="space-y-4">
                    <RangeField label="Top Spacing" value={config.contentTop ?? 0} min={0} max={800} unit="px" onChange={(v) => update({ contentTop: v })} />
                    <RangeField label="Side Spacing" value={config.contentLeft ?? 0} min={0} max={400} unit="px" onChange={(v) => update({ contentLeft: v })} />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className={sectionTitle}>Typography & Colors</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase block mb-2">Text Alignment</label>
                      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                        {(['left', 'center', 'right'] as const).map(align => (
                          <button
                            key={align}
                            onClick={() => update({ textAlign: align })}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded ${config.textAlign === align ? 'bg-white shadow-sm text-[#3B3BFA]' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>

                    <FontSelect label={isCert ? 'Name Font' : 'Title Font'} value={config.fontFamily} onChange={(v) => update({ fontFamily: v })} />
                    <FontSelect label="Body Font" value={config.bodyFontFamily} onChange={(v) => update({ bodyFontFamily: v })} />
                    <RangeField label={isCert ? 'Name Size' : 'Title Size'} value={config.titleFontSize ?? 48} min={20} max={120} unit="px" onChange={(v) => update({ titleFontSize: v })} />
                    <RangeField label={isCert ? 'Body Size' : 'Winner Name Size'} value={config.bodyFontSize ?? 18} min={10} max={60} unit="px" onChange={(v) => update({ bodyFontSize: v })} />
                    <RangeField label={isCert ? 'Name Weight' : 'Title Weight'} value={config.fontWeight ?? 700} min={400} max={900} step={100} onChange={(v) => update({ fontWeight: v })} />
                    <RangeField label="Letter Spacing" value={config.letterSpacing ?? 0} min={-0.05} max={0.3} step={0.01} unit="em" onChange={(v) => update({ letterSpacing: v })} />
                    <RangeField label="Line Height" value={config.lineHeight ?? 1.5} min={1} max={2.5} step={0.05} onChange={(v) => update({ lineHeight: v })} />

                    <div className="flex gap-6 pt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase">{isCert ? 'Body' : 'Primary'}</label>
                        <input
                          type="color"
                          value={config.textColor ?? (isCert ? '#374151' : '#000000')}
                          onChange={(e) => update({ textColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase">{isCert ? 'Name' : 'Accent'}</label>
                        <input
                          type="color"
                          value={config.secondaryColor}
                          onChange={(e) => update({ secondaryColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {isCert && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className={sectionTitle}>Certificate Text</h3>
                <div>
                  <label className={fieldLabel}><span>Venue</span></label>
                  <input type="text" value={config.festVenue ?? ''} onChange={(e) => update({ festVenue: e.target.value })} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700" />
                </div>
                <div>
                  <label className={fieldLabel}><span>Dates</span></label>
                  <input type="text" value={config.festDates ?? ''} onChange={(e) => update({ festDates: e.target.value })} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700" />
                </div>
                <div>
                  <label className={fieldLabel}><span>Sentence</span>
                    <button onClick={() => update({ bodyTemplate: DEFAULT_CERT_BODY_TEMPLATE })} className="text-[9px] font-black text-[#3B3BFA] hover:underline">Reset</button>
                  </label>
                  <textarea rows={5} value={config.bodyTemplate ?? ''} onChange={(e) => update({ bodyTemplate: e.target.value })} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono" />
                  <p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed">
                    Placeholders: {PLACEHOLDER_KEYS.map(k => `{${k}}`).join(' ')}. Use **text** for bold, ##text## for bold in the strong colour, and a new line for a line break. {'{position}'} / {'{grade}'} are filled only for published results.
                  </p>
                </div>
              </div>
            )}

            {type === 'studentCardBgs' && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div>
                  <h3 className={sectionTitle}>Cards per A4 Page</h3>
                  <div className="flex gap-2">
                    {([9, 12, 16] as const).map(num => (
                      <button
                        key={num}
                        onClick={() => update({ cardsPerPage: num })}
                        className={`flex-1 py-2 text-[11px] font-black uppercase rounded border-2 ${config.cardsPerPage === num ? 'border-[#3B3BFA] bg-indigo-50 text-[#3B3BFA]' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                      >
                        {num} Cards
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className={sectionTitle}>Layout Style</h3>
                  <div className="flex flex-col gap-3">
                    <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${config.layout === 'simple' ? 'border-[#3B3BFA] bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                      <input type="radio" checked={config.layout === 'simple'} onChange={() => update({ layout: 'simple' })} className="hidden" />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.layout === 'simple' ? 'border-[#3B3BFA]' : 'border-slate-300'}`}>
                         {config.layout === 'simple' && <div className="w-2 h-2 rounded-full bg-[#3B3BFA]" />}
                      </div>
                      <span className="font-bold text-xs uppercase">Simple Border</span>
                    </label>
                    <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${config.layout === 'detailed' ? 'border-[#3B3BFA] bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                      <input type="radio" checked={config.layout === 'detailed'} onChange={() => update({ layout: 'detailed' })} className="hidden" />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.layout === 'detailed' ? 'border-[#3B3BFA]' : 'border-slate-300'}`}>
                         {config.layout === 'detailed' && <div className="w-2 h-2 rounded-full bg-[#3B3BFA]" />}
                      </div>
                      <span className="font-bold text-xs uppercase">Detailed Background</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Preview Area — the same template components and props the exports render */}
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
                    festName="ARTS FEST"
                    position="1st Place"
                    grade="A"
                    config={config}
                  />
                </div>
              )}

              {type === 'posterBgs' && (
                <div className="shadow-2xl bg-white origin-center pointer-events-none" style={{ transform: `scale(${previewScale})` }}>
                  <PosterTemplate
                    backgroundUrl={bgUrl}
                    eventName="Sample Event Title"
                    category="Category A"
                    winners={dummyWinners}
                    config={config}
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

const BackgroundsTab = ({ backgrounds, uploading, onUpload, onReplace, onDeleteBg, onCustomize, onSetActive }: any) => {
  const sections: { title: string; type: BackgroundType; desc: string; bgs?: Record<string, string> }[] = [
    { title: 'Certificates', type: 'certificateBgs', desc: 'Recommended: A4 Portrait (794x1123)', bgs: backgrounds.certificateBgs },
    { title: 'Student Cards', type: 'studentCardBgs', desc: 'Recommended: 2:3 Ratio (Vertical)', bgs: backgrounds.studentCardBgs },
    { title: 'Event Posters', type: 'posterBgs', desc: 'Recommended: 1080x1350 (IG Portrait)', bgs: backgrounds.posterBgs },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-10 gap-8">
      {sections.map(section => {
        // The background exports will use (explicit choice, else the newest upload).
        const exportId = pickTemplate(backgrounds, section.type).id;
        return (
        <div key={section.type} className={`flex flex-col ${section.type === 'posterBgs' ? 'md:col-span-2 xl:col-span-6' : 'xl:col-span-2'}`}>
          <div className="mb-4 pb-3 border-b border-slate-100 flex flex-col gap-3 items-start">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">{section.title}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">{section.desc}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight mt-1">PNG, JPEG or WebP, max 7 MB</p>
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
                   <input type="file" className="hidden" accept={UPLOAD_ACCEPT} onChange={(e) => onUpload(e, section.type)} disabled={uploading} />
                </label>
              )}

              {section.bgs && Object.entries(section.bgs).map(([id, url]: any) => {
                const isExport = id === exportId;
                return (
                <div key={id} onClick={() => onCustomize(section.type, id, url)} className={`relative group rounded-xl overflow-hidden border-2 shadow-sm hover:border-[#3B3BFA] transition-all aspect-[3/4] w-full cursor-pointer ${isExport ? 'border-emerald-500' : 'border-slate-200'}`}>
                  <img src={url} alt={`${section.title} bg`} className="w-full h-full object-cover" />
                  {isExport && (
                    <span className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest shadow">Used for exports</span>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onCustomize(section.type, id, url); }} className="btn-primary text-[10px] px-3 py-1.5 shadow-lg w-10/12 mb-1 font-black">
                       CUSTOMIZE
                    </button>
                    {!isExport && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onSetActive(section.type, id); }}
                        className="px-2 py-1 bg-emerald-500 text-white rounded font-bold text-[9px] hover:bg-emerald-600 shadow-lg w-10/12"
                      >
                        Use for exports
                      </button>
                    )}
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="btn-primary cursor-pointer text-[9px] px-2 py-1 shadow-lg flex items-center justify-center gap-1 w-10/12 text-center whitespace-nowrap bg-slate-700 hover:bg-slate-800 text-white border-0"
                    >
                      Replace
                      <input type="file" className="hidden" accept={UPLOAD_ACCEPT} onChange={(e) => onReplace(e, section.type, id)} disabled={uploading} />
                    </label>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteBg(section.type, id); }}
                      className="px-2 py-1 bg-rose-500 text-white rounded font-bold text-[9px] hover:bg-rose-600 shadow-lg flex items-center justify-center gap-1 transition-all w-10/12"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                );
              })}

              {section.type !== 'posterBgs' && (!section.bgs || Object.keys(section.bgs).length === 0) && (
                <label className="cursor-pointer border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 bg-slate-50 hover:bg-slate-100 hover:border-[#3B3BFA] hover:text-[#3B3BFA] transition-all aspect-[3/4] w-full p-2 text-center">
                   <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                   <span className="text-[9px] font-bold uppercase tracking-widest leading-tight">Upload<br/>New</span>
                   <input type="file" className="hidden" accept={UPLOAD_ACCEPT} onChange={(e) => onUpload(e, section.type)} disabled={uploading} />
                </label>
              )}
            </div>
          </div>
        </div>
        );
      })}

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
