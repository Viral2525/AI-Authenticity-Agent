import React, { useCallback, useRef } from 'react';
import { Upload, FileVideo, FileAudio, FileImage, X, Layers, Plus } from 'lucide-react';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  selectedCount: number;
  onClear: () => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, selectedCount, onClear, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelect(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelect, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(Array.from(e.target.files));
    }
  };

  const triggerInput = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  if (selectedCount > 0) {
    return (
      <div 
        className={`w-full p-4 bg-brand-surface border border-slate-700 rounded-2xl flex flex-col md:flex-row items-center gap-4 transition-all ${disabled ? 'opacity-70' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-slate-800 p-3 rounded-xl text-brand-accent shadow-lg shadow-brand-accent/5">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-200 uppercase tracking-tight">
              {selectedCount} Evidence Package{selectedCount !== 1 ? 's' : ''} Staged
            </p>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Awaiting Forensic Injection</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={triggerInput}
            disabled={disabled}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Add More
          </button>
          
          {!disabled && (
            <button 
              onClick={onClear}
              title="Clear all"
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all active:scale-95"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
          accept="image/*,video/*,audio/*"
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full border-2 border-dashed rounded-[2rem] p-16 text-center transition-all duration-300 ${
        disabled 
          ? 'border-slate-800 bg-slate-900/50 cursor-not-allowed opacity-50' 
          : 'border-slate-800 bg-slate-900/20 hover:border-brand-accent/50 hover:bg-slate-900/40 cursor-pointer shadow-2xl shadow-black'
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      // Note: Removed onClick={triggerInput} to prevent double-pop-up
      // because the input below is absolute inset-0 and transparent
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        onChange={handleChange}
        disabled={disabled}
        accept="image/*,video/*,audio/*"
      />
      <div className="flex flex-col items-center gap-6">
        <div className="p-5 bg-slate-800 rounded-2xl text-brand-accent shadow-xl shadow-brand-accent/10 border border-slate-700">
          <Upload size={36} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-200 uppercase tracking-tight">
            Deploy Digital Evidence
          </h3>
          <p className="text-xs text-slate-500 mt-3 font-medium uppercase tracking-[0.2em]">
            Drag & Drop or Click to Load forensic data
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 opacity-40">
            <FileImage size={16} />
            <FileVideo size={16} />
            <FileAudio size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;