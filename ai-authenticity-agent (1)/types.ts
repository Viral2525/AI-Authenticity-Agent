export enum AnalysisType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO'
}

export interface AnalysisResult {
  mediaType: string;
  aiProbability: number; // Final Fusion Score (0-100)
  confidence: 'High' | 'Medium' | 'Low';
  verdict: 'Likely Real' | 'Uncertain' | 'Likely AI Generated';
  aiGeneratedParts: string[];
  humanMadeParts: string[];
  reasoning: string;
  conclusion: string;
  attribution?: string; 
  branchScores: {
    pixel: number;    // Branch 1: CNN-based (Diffusion, GAN artifacts, FFT imbalances)
    bio: number;      // Branch 2: LSTM-based (EAR signal, blink frequency, lip-sync)
    physics: number;  // Branch 3: Transformer-based (Joint velocity, pose drift)
    prnu: number;     // Branch 4: Forensic-based (Sensor fingerprint, synthetic noise)
  };
}

export interface MediaItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'analyzing' | 'done' | 'error';
  result?: AnalysisResult;
  error?: string;
}

export interface HistoryItem {
  id: string;
  filename: string;
  timestamp: number;
  result: AnalysisResult;
  mimeType: string;
  thumbnail?: string; 
  dataKey?: string; 
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: AnalysisResult | null;
}