import React, { useRef, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { AnalysisResult } from '../types';
import { ShieldAlert, ShieldCheck, Search, FileSearch, Fingerprint, Music, FileText, Image as ImageIcon, AlertTriangle, Layers, Activity, CheckCircle2, ScanLine, Target, Info, BrainCircuit, HeartPulse, Scale, BarChart3, Thermometer, Waves, Zap } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface AnalysisReportProps {
  result: AnalysisResult;
  previewUrl: string | null;
  mimeType: string;
  filename: string;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ result, previewUrl, mimeType, filename }) => {
  const isLikelyAI = result.aiProbability > 70;
  const isLikelyReal = result.aiProbability < 30;
  const isUncertain = result.aiProbability >= 30 && result.aiProbability <= 70;
  
  const reportRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanPos, setScanPos] = useState(0);
  
  const chartData = [
    { name: 'AI', value: result.aiProbability },
    { name: 'Human', value: 100 - result.aiProbability },
  ];

  let statusColor = '#3b82f6'; 
  if (isLikelyAI) statusColor = '#ef4444';
  else if (isLikelyReal) statusColor = '#10b981';

  const isVideo = mimeType.startsWith('video/');
  const isAudio = mimeType.startsWith('audio/');
  const isImage = mimeType.startsWith('image/');

  const branches = [
    { id: 'pixel', label: 'Pixel / Spectral', score: result.branchScores.pixel, icon: <Layers size={14} />, detail: isAudio ? 'FFT Spectral Entropy' : 'CNN Frequency Residuals' },
    { id: 'bio', label: 'Biological / Jitter', score: result.branchScores.bio, icon: <HeartPulse size={14} />, detail: isAudio ? 'Micro-jitter / Breath' : 'EAR Signal / Lip-Sync' },
    { id: 'physics', label: 'Physics / Flow', score: result.branchScores.physics, icon: <Activity size={14} />, detail: isAudio ? 'Phase Coherence' : 'Optical Flow / Velocity' },
    { id: 'prnu', label: 'PRNU / Residual', score: result.branchScores.prnu, icon: <Fingerprint size={14} />, detail: 'Hardware Noise Profile' },
  ];

  useEffect(() => {
    let interval: number;
    if (isScanning) {
      interval = window.setInterval(() => {
        setScanPos(prev => (prev >= 100 ? 0 : prev + 1));
      }, 30);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleDownload = async (format: 'jpeg' | 'pdf') => {
    if (!reportRef.current) return;
    const element = reportRef.current;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#020617',
        useCORS: true
      });

      if (format === 'jpeg') {
        const image = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.href = image;
        link.download = `Forensic_Report_${filename}.jpg`;
        link.click();
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        pdf.save(`Forensic_Report_${filename}.pdf`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
           <CheckCircle2 size={12} className="text-brand-success" /> FusionNet V5.0 Multi-Signal Extractors: ONLINE
        </div>
        <div className="flex bg-slate-900/80 backdrop-blur-md rounded-xl p-1 border border-slate-800 shadow-2xl">
           <button onClick={() => handleDownload('jpeg')} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black font-mono text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
             <ImageIcon size={14} /> EXPORT JPG
           </button>
           <button onClick={() => handleDownload('pdf')} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black font-mono text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
             <FileText size={14} /> EXPORT PDF
           </button>
        </div>
      </div>

      <div ref={reportRef} className="w-full bg-[#020617] rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
        <div className="p-10 border-b border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-transparent relative">
          <div className="absolute top-0 right-0 p-4">
             <div className="text-[8px] font-mono text-slate-700 uppercase tracking-[0.5em] vertical-text transform rotate-90 origin-right">CONFIDENTIAL_FORENSIC_DATA</div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter uppercase">
                <FileSearch className="text-brand-accent" size={36} />
                Forensic Dossier
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-[0.3em] font-bold">CASE ID: {filename.substring(0, 10).toUpperCase()}</span>
                <span className="w-1.5 h-1.5 bg-brand-accent/40 rounded-full"></span>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-[0.3em] font-black">FUSIONNET V5.0</span>
              </div>
            </div>
            
            <div className={`px-10 py-5 rounded-3xl border-2 flex items-center gap-5 shadow-2xl transition-all ${
              isLikelyAI ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-red-900/20' :
              isUncertain ? 'bg-brand-warning/10 border-brand-warning/30 text-brand-warning shadow-orange-900/20' :
              'bg-brand-success/10 border-brand-success/30 text-brand-success shadow-emerald-900/20'
            }`}>
              {isLikelyAI ? <ShieldAlert size={32} /> : isUncertain ? <AlertTriangle size={32} /> : <ShieldCheck size={32} />}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold opacity-60">Engine Verdict</p>
                <p className="font-black text-xl uppercase tracking-tight leading-none">
                  {result.verdict}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                   <Target size={10} className="opacity-50" />
                   <span className="text-[9px] font-mono uppercase font-bold tracking-widest">Confidence: {result.confidence}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900/40 rounded-[2rem] border border-slate-800 overflow-hidden group shadow-2xl relative">
              <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-30 relative">
                <span className="text-[11px] font-black font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ScanLine size={14} className="text-brand-accent" /> Digital Evidence
                </span>
                <button 
                  onClick={() => setIsScanning(!isScanning)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isScanning ? 'bg-brand-accent text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  {isScanning ? 'STOP SCAN' : 'RUN SCAN'}
                </button>
              </div>
              <div className="aspect-[4/5] flex items-center justify-center bg-black/60 overflow-hidden relative">
                {previewUrl ? (
                  <>
                    <div className={`absolute inset-0 transition-all duration-700 ${isScanning ? 'mix-blend-color-dodge grayscale contrast-150 opacity-40' : ''}`}>
                      {isImage && <img src={previewUrl} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />}
                      {isVideo && <video src={previewUrl} controls className="w-full h-full object-contain" />}
                      {isAudio && (
                        <div className="flex flex-col items-center justify-center h-full gap-6 p-10 text-center">
                          <div className="w-24 h-24 rounded-full bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
                            <Waves size={40} className="text-brand-accent animate-pulse" />
                          </div>
                          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Phase Coherence Check</p>
                          <audio src={previewUrl} controls className="w-full h-10 forensic-audio-player" />
                        </div>
                      )}
                    </div>
                    {isScanning && (isImage || isVideo) && (
                      <div className="absolute inset-0 pointer-events-none z-20">
                        <div 
                          className="absolute inset-x-0 h-[3px] bg-brand-accent shadow-[0_0_30px_rgba(59,130,246,1)] transition-all duration-30"
                          style={{ top: `${scanPos}%` }}
                        >
                          <div className="absolute right-6 top-4 bg-brand-accent text-white text-[9px] px-3 py-1 rounded-md font-mono font-black uppercase tracking-widest shadow-2xl">
                            {isAudio ? 'HARMONIC SCAN' : 'SPECTRAL SCAN'}: {Math.round(scanPos)}%
                          </div>
                        </div>
                        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10 pointer-events-none">
                           {[...Array(16)].map((_, i) => <div key={i} className="border border-brand-accent" />)}
                        </div>
                      </div>
                    )}
                  </>
                ) : <div className="text-slate-700 font-mono text-xs italic tracking-widest">NO_SIGNAL_INPUT</div>}
              </div>
              <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex justify-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-success"></div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">PRNU_STABLE</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">FFT_LOCKED</span>
                 </div>
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-[2rem] p-8 border border-slate-800 shadow-inner text-center">
              <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-slate-500 mb-6 font-bold">Fused AI Probability</p>
              <div className="h-48 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={chartData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="70%" 
                      outerRadius="100%" 
                      startAngle={90} 
                      endAngle={-270} 
                      dataKey="value" 
                      stroke="none" 
                      cornerRadius={12}
                    >
                      <Cell fill={statusColor} />
                      <Cell fill="#1e293b" fillOpacity={0.1} />
                      <Label 
                        value={result.aiProbability + "%"} 
                        position="center" 
                        fill={statusColor} 
                        style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'JetBrains Mono', letterSpacing: '-1px' }} 
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col gap-3">
                <div className="flex items-center justify-center gap-3 px-4 py-2 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                   <BrainCircuit size={14} className="text-brand-accent" />
                   <span className="text-[10px] font-black font-mono text-slate-300 uppercase truncate">ID: {result.attribution || 'Unknown Kernel'}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                   <Thermometer size={12} className="text-slate-600" />
                   <span className="text-[9px] font-mono text-slate-600 uppercase">Threshold: ROC_Best (0.3/0.7)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-10">
            <div>
              <h3 className="text-slate-500 font-black text-[11px] uppercase tracking-[0.5em] mb-6 flex items-center gap-3">
                <BarChart3 size={16} className="text-brand-accent" /> Multi-Modal Signal Fusion
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {branches.map((b) => (
                  <div key={b.id} className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/60 transition-all hover:border-brand-accent/40 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       {b.icon}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-xl text-slate-400 group-hover:text-brand-accent transition-colors">
                          {b.icon}
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-slate-200 uppercase tracking-tight">{b.label}</h4>
                          <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{b.detail}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-black ${b.score > 0.7 ? 'text-red-400' : b.score < 0.3 ? 'text-brand-success' : 'text-brand-accent'}`}>
                        {Math.round(b.score * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-4">
                      <div 
                        className="h-full transition-all duration-1000 ease-out" 
                        style={{ 
                          width: `${b.score * 100}%`, 
                          backgroundColor: b.score > 0.7 ? '#ef4444' : b.score < 0.3 ? '#10b981' : '#3b82f6',
                          boxShadow: `0 0 10px ${b.score > 0.7 ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-red-500/5 p-8 rounded-[2rem] border border-red-500/10 shadow-2xl">
                <h3 className="text-red-400 font-black text-[11px] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <AlertTriangle size={18} /> Forensic Anomalies
                </h3>
                <ul className="space-y-4">
                  {result.aiGeneratedParts.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-4 text-[13px] text-slate-400 font-medium leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      {p}
                    </li>
                  ))}
                  {result.aiGeneratedParts.length === 0 && <li className="text-[10px] text-slate-600 italic font-mono uppercase">Signal spectrum appears within organic bounds.</li>}
                </ul>
              </div>

              <div className="bg-brand-success/5 p-8 rounded-[2rem] border border-brand-success/10 shadow-2xl">
                <h3 className="text-brand-success font-black text-[11px] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <ShieldCheck size={18} /> Authentic Signals
                </h3>
                <ul className="space-y-4">
                  {result.humanMadeParts.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-4 text-[13px] text-slate-400 font-medium leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-success mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      {p}
                    </li>
                  ))}
                  {result.humanMadeParts.length === 0 && <li className="text-[10px] text-slate-600 italic font-mono uppercase">No conclusive hardware markers identified.</li>}
                </ul>
              </div>
            </div>

            <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative group">
              <div className="absolute top-6 right-8 text-brand-accent/20 group-hover:text-brand-accent/40 transition-colors">
                 <Scale size={40} />
              </div>
              <h3 className="text-brand-accent font-black text-[11px] uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                <Search size={18} /> Multi-Signal Reasoning
              </h3>
              <p className="text-slate-300 leading-loose text-[15px] font-light whitespace-pre-line">
                {result.reasoning}
              </p>
              <div className="mt-10 flex items-start gap-4 p-6 bg-slate-800/40 rounded-3xl border border-slate-700/40">
                 <Info size={20} className="text-brand-accent mt-1 flex-shrink-0" />
                 <p className="text-[11px] text-slate-500 font-mono leading-relaxed uppercase tracking-wide">
                   RAG_EXPLAINER: Analysis based on PRNU, FFT, and {isAudio ? 'Phase Coherence' : 'EAR'} signals. Verdict issued only if TWO signals confirm AI trajectory.
                 </p>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800">
               <h4 className="text-slate-600 font-black text-[10px] uppercase tracking-[0.5em] mb-6">Automated Conclusion</h4>
               <p className={`text-white text-xl font-medium leading-relaxed italic p-10 rounded-[2.5rem] border-2 shadow-2xl transition-all duration-700 ${
                 isLikelyAI ? 'bg-red-500/5 border-red-500/40 text-red-50' : 
                 isLikelyReal ? 'bg-brand-success/5 border-brand-success/40 text-emerald-50' : 
                 'bg-slate-800/40 border-slate-700 text-slate-200'
               }`}>
                 "{result.conclusion}"
               </p>
            </div>
          </div>
        </div>
        
        <div className="px-10 py-8 bg-black/60 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6 text-[10px] font-mono text-slate-600 uppercase tracking-[0.4em]">
           <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-success"></div>
                <span>NODE_VERIFIED</span>
             </div>
             <span>PROTOCOL: V5.0_FUSION</span>
             <span className="hidden sm:inline">|</span>
             <span>BUILD: 2025.04.12.FORENSIC</span>
           </div>
           <div className="flex items-center gap-4">
             <span className="flex items-center gap-2">
               <Activity size={12} className="text-brand-accent" />
               LATENCY: 0.85s
             </span>
             <span className="px-3 py-1 bg-slate-800/50 rounded-md border border-slate-700">CERTIFIED AUTHENTICITY INSPECTION</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisReport;