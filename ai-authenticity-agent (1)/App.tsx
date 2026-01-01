import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scan, Loader2, Sparkles, AlertCircle, FileVideo, FileAudio, FileImage, ShieldCheck, FileSearch, Plus, UploadCloud, X, History, Trash2, Calendar, PlayCircle, Music, Key, ExternalLink, RefreshCw } from 'lucide-react';
import FileUpload from './components/FileUpload';
import AnalysisReport from './components/AnalysisReport';
import { analyzeContent } from './services/geminiService';
import { MediaItem, HistoryItem, AnalysisResult } from './types';

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- IndexedDB Utility ---
const DB_NAME = 'forensic_vault';
const STORE_NAME = 'media_blobs';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const storeBlob = async (key: string, blob: Blob) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getBlob = async (key: string): Promise<Blob | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(tx.error);
  });
};

const deleteBlob = async (key: string) => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(key);
};

// --- Thumbnail Utility ---
const generateThumbnail = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    if (file.type.startsWith('audio/')) {
      resolve(''); 
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const size = 120;
          canvas.width = size;
          canvas.height = size;
          const scale = Math.max(size / img.width, size / img.height);
          const x = (size - img.width * scale) / 2;
          const y = (size - img.height * scale) / 2;
          ctx?.drawImage(img, x, y, img.width * scale, img.height * scale);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = url;
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadeddata = () => {
          video.currentTime = 0.5;
        };
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 120;
          canvas.height = 120;
          ctx?.drawImage(video, 0, 0, 120, 120);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
          video.remove();
        };
        video.muted = true;
        video.playsInline = true;
        video.src = url;
        video.load();
      }
    };
    reader.readAsDataURL(file);
  });
};

function App() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<HistoryItem | null>(null);
  const [restoredPreviewUrl, setRestoredPreviewUrl] = useState<string | null>(null);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  const [processingStep, setProcessingStep] = useState(0);
  const [currentPipelineSteps, setCurrentPipelineSteps] = useState<string[]>([]);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Check for custom API key status
  useEffect(() => {
    const checkKey = async () => {
      try {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasCustomKey(hasKey);
      } catch (e) {
        console.error("Key check failed", e);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasCustomKey(true); // Proceed assuming selection
      setQuotaExceeded(false);
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('forensic_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('forensic_history', JSON.stringify(history));
  }, [history]);

  const getPipelineSteps = (mimeType: string) => {
    const core = [
      "INITIALIZING: FusionNet V5.0 Engine...",
      "BRANCH 1: Pixel Frequency Analysis...",
      "BRANCH 2: Biological Signal Extraction...",
      "BRANCH 3: Physics/Motion Consistency...",
      "BRANCH 4: Sensor PRNU Forensic...",
      "FUSION: Cross-Branch Calibration...",
      "CALIBRATION: Temperature Scaling..."
    ];
    if (mimeType.startsWith('video/')) {
      return ["EXTRACTOR: Sampling Frames...", ...core, "POSE: Temporal Stability Check...", "BIO: EAR Time-Series Sync...", "VERDICT: Generating Dossier..."];
    }
    if (mimeType.startsWith('audio/')) {
      return ["PCM: Waveform Loading...", "FFT: Spectral Imbalance Check...", "PHASE: Residual Noise Analysis...", "JITTER: Pitch Stability Estimation...", "VERDICT: Calibrating Score..."];
    }
    return [...core, "VERDICT: Generating Report..."];
  };

  const isResultsView = hasStartedAnalysis || viewingHistoryItem !== null;
  const activeItem = mediaItems.find(item => item.id === activeMediaId);

  useEffect(() => {
    if (isAnalyzing && activeItem) {
      setCurrentPipelineSteps(getPipelineSteps(activeItem.file.type));
    }
  }, [isAnalyzing, activeItem]);

  useEffect(() => {
    let interval: number;
    if (isAnalyzing && currentPipelineSteps.length > 0) {
      setProcessingStep(0);
      interval = window.setInterval(() => {
        setProcessingStep(prev => (prev < currentPipelineSteps.length - 1 ? prev + 1 : prev));
      }, 850);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, currentPipelineSteps]);

  const handleFilesSelect = useCallback((files: File[]) => {
    const newItems: MediaItem[] = files.map(file => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'idle'
    }));
    setMediaItems(prev => {
      const updated = [...prev, ...newItems];
      if (!activeMediaId && newItems.length > 0) setActiveMediaId(newItems[0].id);
      return updated;
    });
    setViewingHistoryItem(null);
    setRestoredPreviewUrl(null);
  }, [activeMediaId]);

  const removeFile = (id: string) => {
    setMediaItems(prev => {
      const itemToRemove = prev.find(item => id === item.id);
      if (itemToRemove) URL.revokeObjectURL(itemToRemove.previewUrl);
      const remaining = prev.filter(item => item.id !== id);
      if (activeMediaId === id) setActiveMediaId(remaining.length > 0 ? remaining[0].id : null);
      return remaining;
    });
  };

  const addToHistory = async (item: MediaItem, result: AnalysisResult) => {
    const thumbnail = await generateThumbnail(item.file);
    const dataKey = `media_${generateId()}`;
    await storeBlob(dataKey, item.file);

    const historyItem: HistoryItem = {
      id: generateId(),
      filename: item.file.name,
      timestamp: Date.now(),
      result: result,
      mimeType: item.file.type,
      thumbnail,
      dataKey
    };
    setHistory(prev => [historyItem, ...prev].slice(0, 50));
  };

  const deleteHistoryItem = async (e: React.MouseEvent, id: string, dataKey?: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h.id !== id));
    if (dataKey) await deleteBlob(dataKey);
    if (viewingHistoryItem?.id === id) {
      setViewingHistoryItem(null);
      setRestoredPreviewUrl(null);
      if (mediaItems.length === 0) setHasStartedAnalysis(false);
    }
  };

  const loadHistoryItem = async (item: HistoryItem) => {
    setViewingHistoryItem(item);
    setActiveMediaId(null);
    setHasStartedAnalysis(true);
    setShowHistory(false);
    setQuotaExceeded(false);
    
    if (item.dataKey) {
      const blob = await getBlob(item.dataKey);
      if (blob) {
        if (restoredPreviewUrl) URL.revokeObjectURL(restoredPreviewUrl);
        setRestoredPreviewUrl(URL.createObjectURL(blob));
      } else {
        setRestoredPreviewUrl(null);
      }
    }
  };

  const handleGlobalDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDraggingGlobal(true);
  }, []);

  const handleGlobalDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); dragCounter.current--;
    if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDraggingGlobal(false); }
  }, []);

  const handleGlobalDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingGlobal(false); dragCounter.current = 0;
    if (isAnalyzing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFilesSelect(Array.from(e.dataTransfer.files));
  }, [isAnalyzing, handleFilesSelect]);

  const handleClearFiles = () => {
    mediaItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
    setMediaItems([]);
    setActiveMediaId(null);
    setHasStartedAnalysis(false);
    setViewingHistoryItem(null);
    setRestoredPreviewUrl(null);
    setQuotaExceeded(false);
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (isAnalyzing || mediaItems.length === 0) return;
    setHasStartedAnalysis(true);
    setIsAnalyzing(true);
    setViewingHistoryItem(null);
    setQuotaExceeded(false);
    
    const itemsToProcess = mediaItems.filter(item => item.status === 'idle' || item.status === 'error');
    setMediaItems(prev => prev.map(item => itemsToProcess.find(p => p.id === item.id) ? { ...item, status: 'analyzing' } : item));

    try {
      for (const item of itemsToProcess) {
        setActiveMediaId(item.id);
        try {
          const base64Data = await convertFileToBase64(item.file);
          const analysis = await analyzeContent(
            "Execute Pipeline V5.0. Run 4-Branch Fusion logic. Apply BCE-safe calibration. Extract PRNU residuals.",
            { mimeType: item.file.type, data: base64Data }
          );
          setMediaItems(prev => prev.map(p => p.id === item.id ? { ...p, status: 'done', result: analysis } : p));
          await addToHistory(item, analysis);
        } catch (err: any) {
          const errMsg = (err.message || "").toLowerCase();
          console.error("Forensic node reported error:", errMsg);
          
          if (errMsg.includes("quota") || errMsg.includes("exhausted") || errMsg.includes("429") || errMsg.includes("limit")) {
            setQuotaExceeded(true);
          }
          
          if (errMsg.includes("requested entity was not found")) {
            setHasCustomKey(false);
            handleOpenKeyDialog();
          }

          setMediaItems(prev => prev.map(p => p.id === item.id ? { ...p, status: 'error', error: 'Forensic failure' } : p));
          
          // If quota hit, we stop the loop to prevent spamming
          if (quotaExceeded || errMsg.includes("quota") || errMsg.includes("exhausted")) break;
        }
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFileIcon = (type: string, className = "w-5 h-5") => {
    if (type.startsWith('video/')) return <FileVideo className={className + " text-blue-400"} />;
    if (type.startsWith('audio/')) return <FileAudio className={className + " text-purple-400"} />;
    return <FileImage className={className + " text-green-400"} />;
  };

  return (
    <div 
      className="min-h-screen bg-[#020617] text-slate-200 font-sans relative overflow-x-hidden"
      onDragEnter={handleGlobalDragEnter} onDragLeave={handleGlobalDragLeave} onDragOver={(e) => e.preventDefault()} onDrop={handleGlobalDrop}
    >
      {isDraggingGlobal && (
        <div className="fixed inset-0 z-[100] bg-brand-accent/20 backdrop-blur-md flex items-center justify-center border-4 border-dashed border-brand-accent m-4 rounded-[3rem] pointer-events-none animate-in fade-in duration-300">
          <div className="bg-slate-900/90 p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6 border border-brand-accent/30">
            <div className="p-5 bg-brand-accent/10 rounded-full animate-bounce"><UploadCloud size={64} className="text-brand-accent" /></div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Inject Evidence Pipeline</h2>
            <p className="text-slate-400 font-mono text-[10px] uppercase tracking-[0.3em]">Release to initialize forensic scan</p>
          </div>
        </div>
      )}

      {/* History Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-[60] shadow-2xl transition-transform duration-500 ease-in-out ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History size={20} className="text-brand-accent" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Scan Vault</h3>
            </div>
            <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                <ShieldCheck size={48} className="mb-4" />
                <p className="text-[10px] font-mono uppercase tracking-widest">Vault Empty</p>
              </div>
            ) : (
              history.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => loadHistoryItem(item)}
                  className={`group p-3 rounded-2xl border transition-all cursor-pointer relative flex gap-3 ${viewingHistoryItem?.id === item.id ? 'bg-brand-accent/10 border-brand-accent' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60'}`}
                >
                  <div className="w-16 h-16 bg-black rounded-lg overflow-hidden flex-shrink-0 border border-slate-700/50 relative">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} className="w-full h-full object-cover" alt="" />
                    ) : item.mimeType.startsWith('video/') ? (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500/10"><FileVideo size={20} className="text-blue-400" /></div>
                    ) : item.mimeType.startsWith('audio/') ? (
                      <div className="w-full h-full flex items-center justify-center bg-purple-500/10"><Music size={20} className="text-purple-400" /></div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-500/10"><FileImage size={20} className="text-green-400" /></div>
                    )}
                    {item.mimeType.startsWith('video/') && <PlayCircle size={14} className="absolute bottom-1 right-1 text-white shadow-lg" />}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[9px] font-black text-white uppercase truncate flex-1">{item.filename}</p>
                      <button 
                        onClick={(e) => deleteHistoryItem(e, item.id, item.dataKey)}
                        className="p-1 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      ><Trash2 size={10} /></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                         <div className={`w-1 h-1 rounded-full ${item.result.aiProbability >= 65 ? 'bg-red-500' : item.result.aiProbability < 35 ? 'bg-green-500' : 'bg-blue-500'}`} />
                         <span className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">{item.result.aiProbability}% AI</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Calendar size={8} />
                        <span className="text-[8px] font-mono">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <header className="border-b border-slate-800 bg-[#020617]/90 backdrop-blur-xl sticky top-0 z-50 h-20 flex items-center px-8 justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => !isAnalyzing && window.location.reload()}>
            <div className="bg-brand-accent p-2 rounded-xl group-hover:scale-105 transition-transform"><Scan size={24} className="text-white" /></div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase">AI AUTHENTICITY AGENT</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleOpenKeyDialog}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hasCustomKey ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}
            >
              <Key size={14} /> {hasCustomKey ? 'PROFESSIONAL KEY ACTIVE' : 'CONFIGURE API KEY'}
            </button>
            <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 hover:text-white hover:border-slate-700 transition-all">
              <History size={14} /> HISTORY ({history.length})
            </button>
          </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {quotaExceeded && (
          <div className="mb-10 p-6 bg-red-500/10 border border-red-500/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500 shadow-2xl shadow-red-500/5">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-red-500 rounded-2xl text-white shadow-xl shadow-red-500/20">
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 className="text-base font-black text-red-100 uppercase tracking-widest leading-none mb-2">Resource Exhaustion Protocol</h3>
                <p className="text-xs text-red-400 font-medium leading-relaxed max-w-lg">The shared forensic engine has reached its limit. Switch to a personal <span className="text-red-200">Gemini Professional API Key</span> to restore high-priority scanning capability.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black text-slate-400 hover:text-white transition-colors"
              >
                <ExternalLink size={14} /> BILLING DOCS
              </a>
              <button 
                onClick={handleOpenKeyDialog}
                className="px-8 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all"
              >
                UPGRADE TO PROFESSIONAL KEY
              </button>
            </div>
          </div>
        )}

        {!isResultsView ? (
          <div className="max-w-4xl mx-auto py-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-6xl font-black text-white mb-8 tracking-tighter leading-tight uppercase">Court-Safe <span className="text-brand-accent">Forensic</span><br/>AI Detection</h2>
            <p className="text-slate-500 max-w-xl mx-auto mb-14 text-sm font-medium uppercase tracking-[0.2em] leading-relaxed">Verify digital authenticity using V5.0 FusionNet 4-Branch architectures.</p>
            <div className="bg-slate-900/30 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-8">
              <FileUpload onFilesSelect={handleFilesSelect} selectedCount={mediaItems.length} onClear={handleClearFiles} disabled={isAnalyzing} />
              {mediaItems.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-in zoom-in-95 duration-300">
                  {mediaItems.map(item => (
                    <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-700 bg-black group shadow-lg">
                      {item.file.type.startsWith('image/') ? <img src={item.previewUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" /> : <div className="w-full h-full flex items-center justify-center bg-slate-800/50">{getFileIcon(item.file.type, "w-10 h-10")}</div>}
                      <button onClick={(e) => { e.stopPropagation(); removeFile(item.id); }} className="absolute top-1 right-1 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"><X size={14} /></button>
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black to-transparent z-10"><p className="text-[9px] font-black text-white truncate uppercase tracking-tighter">{item.file.name}</p></div>
                    </div>
                  ))}
                </div>
              )}
              <button 
                onClick={handleAnalyze} 
                disabled={mediaItems.length === 0 || isAnalyzing || quotaExceeded} 
                className={`w-full py-6 rounded-3xl font-black uppercase text-sm tracking-[0.2em] transition-all disabled:opacity-50 ${quotaExceeded ? 'bg-slate-800 text-red-400 border border-red-500/20' : 'bg-white text-slate-900 shadow-2xl hover:bg-slate-100 active:scale-[0.98]'}`}
              >
                {quotaExceeded ? "QUOTA EXCEEDED - KEY REQUIRED" : isAnalyzing ? "Initializing FusionNet V5.0..." : `Run 4-Branch Forensic Suite (${mediaItems.length} Files)`}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-full gap-10 animate-in fade-in duration-500">
            <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-6">
              <button onClick={() => hiddenInputRef.current?.click()} disabled={isAnalyzing} className="w-full py-8 border-2 border-dashed border-slate-800 rounded-3xl text-slate-400 uppercase font-black text-xs hover:border-brand-accent/50 hover:bg-slate-900/30 transition-all group disabled:opacity-50">
                <Plus size={24} className="mx-auto mb-2 text-brand-accent group-hover:scale-110 transition-transform" /> Inject Evidence
              </button>
              <input ref={hiddenInputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFilesSelect(Array.from(e.target.files))} />
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[calc(100vh-320px)]">
                {mediaItems.map(item => (
                  <button key={item.id} onClick={() => { setActiveMediaId(item.id); setViewingHistoryItem(null); }} className={"w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 " + (activeMediaId === item.id ? "bg-slate-900 border-brand-accent shadow-xl" : "bg-slate-900/20 border-slate-800 hover:bg-slate-900/40")}>
                    <div className="w-14 h-14 bg-black rounded-xl overflow-hidden flex-shrink-0 border border-slate-800 relative group">
                      {item.file.type.startsWith('image/') ? <img src={item.previewUrl} className="w-full h-full object-cover" alt="" /> : getFileIcon(item.file.type, "w-full h-full p-3")}
                      {!isAnalyzing && <div onClick={(e) => { e.stopPropagation(); removeFile(item.id); }} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={20} className="text-white" /></div>}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-[11px] font-black uppercase text-white truncate">{item.file.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'done' ? 'bg-brand-success' : item.status === 'analyzing' ? 'bg-brand-accent animate-pulse' : item.status === 'error' ? 'bg-red-500' : 'bg-slate-600'}`} />
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{item.status}</span>
                      </div>
                    </div>
                  </button>
                ))}
                {viewingHistoryItem && mediaItems.length === 0 && (
                  <div className="p-4 bg-slate-900 border border-brand-accent rounded-2xl flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 relative overflow-hidden">
                      {viewingHistoryItem.thumbnail ? <img src={viewingHistoryItem.thumbnail} className="w-full h-full object-cover" alt="" /> : getFileIcon(viewingHistoryItem.mimeType)}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-[11px] font-black uppercase text-white truncate">{viewingHistoryItem.filename}</p>
                      <span className="text-[9px] font-mono text-brand-accent uppercase tracking-widest">Viewing Archive</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
               {activeItem?.status === 'analyzing' ? (
                 <div className="h-full flex flex-col items-center justify-center p-16 text-center bg-slate-900/20 rounded-[3rem] border border-slate-800 backdrop-blur-sm shadow-inner">
                    <div className="relative mb-12"><Loader2 size={84} className="text-brand-accent animate-spin relative z-10" /><div className="absolute inset-0 bg-brand-accent/20 blur-2xl animate-pulse"></div></div>
                    <p className="text-brand-accent font-mono text-sm uppercase tracking-[0.5em] font-black">{currentPipelineSteps[processingStep] || "Processing..."}</p>
                    <div className="mt-8 w-64 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto"><div className="h-full bg-brand-accent transition-all duration-[850ms]" style={{ width: `${((processingStep + 1) / currentPipelineSteps.length) * 100}%` }}></div></div>
                 </div>
               ) : activeItem?.status === 'done' ? (
                 <AnalysisReport result={activeItem.result!} previewUrl={activeItem.previewUrl} mimeType={activeItem.file.type} filename={activeItem.file.name} />
               ) : viewingHistoryItem ? (
                 <AnalysisReport result={viewingHistoryItem.result} previewUrl={restoredPreviewUrl} mimeType={viewingHistoryItem.mimeType} filename={viewingHistoryItem.filename} />
               ) : activeItem?.status === 'error' ? (
                 <div className="h-full flex flex-col items-center justify-center p-16 text-center bg-red-500/5 rounded-[3rem] border border-red-500/20">
                   <AlertCircle size={64} className="text-red-500 mb-6 animate-pulse" />
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Pipeline Critical Failure</h3>
                   <p className="text-slate-400 max-w-md mx-auto mb-8 font-mono text-[11px] uppercase tracking-widest leading-relaxed">
                     Forensic extraction failed for node {activeItem.file.name}. 
                     {quotaExceeded ? " Signal strength insufficient due to shared quota limits." : " Cross-branch verification could not be completed."}
                   </p>
                   {quotaExceeded && (
                     <button onClick={handleOpenKeyDialog} className="flex items-center gap-3 px-8 py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:scale-[1.02] transition-all active:scale-[0.98]">
                       <Key size={16} /> Switch to Professional Engine
                     </button>
                   )}
                   <button onClick={handleAnalyze} className="mt-4 flex items-center gap-3 px-8 py-4 bg-white/10 text-white border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                     <RefreshCw size={16} /> Retry Extraction
                   </button>
                 </div>
               ) : (
                 <div className="h-full border-2 border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-slate-700 uppercase font-black text-sm bg-slate-900/10">
                   <FileSearch size={48} className="mb-4 opacity-10" />
                   <span>Awaiting Scan sequence</span>
                   {activeItem?.status === 'idle' && !isAnalyzing && (
                     <button 
                       onClick={handleAnalyze} 
                       disabled={quotaExceeded}
                       className="mt-6 px-10 py-4 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase shadow-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                     >
                       {quotaExceeded ? "Quota Locked" : "Initiate Forensic Process"}
                     </button>
                   )}
                 </div>
               )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;