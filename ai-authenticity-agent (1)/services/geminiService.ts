import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mediaType: { 
      type: Type.STRING,
      description: "The type of media analyzed (Image, Video, Voice, or Music)."
    },
    aiProbability: { 
      type: Type.NUMBER,
      description: "Weighted Fusion Score: (0.35*Pixel + 0.30*Bio + 0.20*Physics + 0.15*PRNU) scaled to 0-100."
    },
    confidence: {
      type: Type.STRING,
      enum: ["High", "Medium", "Low"],
      description: "Confidence based on cross-signal consistency."
    },
    verdict: {
      type: Type.STRING,
      enum: ["Likely Real", "Uncertain", "Likely AI Generated"],
      description: "Calibrated verdict based on ROC thresholds (<0.3, 0.3-0.7, >0.7)."
    },
    attribution: {
      type: Type.STRING,
      description: "Identified generator signature (e.g., 'ConvNext-SDXL', 'Suno v3', 'ElevenLabs v2')."
    },
    aiGeneratedParts: { 
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Forensic indicators like 'FFT spectral imbalance', 'Phase incoherence', or 'Optical flow smoothness'."
    },
    humanMadeParts: { 
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Authenticity markers like 'Natural PRNU residue', 'Micro-jitter entropy', or 'Organic harmonic decay'."
    },
    reasoning: { 
      type: Type.STRING,
      description: "Deep forensic breakdown referencing FFT, EAR, PRNU, and Entropy metrics."
    },
    conclusion: { 
      type: Type.STRING,
      description: "A digital forensic analyst's final conclusion."
    },
    branchScores: {
      type: Type.OBJECT,
      properties: {
        pixel: { type: Type.NUMBER, description: "Pixel/Spectral: FFT residuals, patch stats, ConvNext features [0.0-1.0]" },
        bio: { type: Type.NUMBER, description: "Biological: EAR signal, voice micro-jitter, lip-sync [0.0-1.0]" },
        physics: { type: Type.NUMBER, description: "Physics/Flow: Optical flow, joint velocity, harmonic regularity [0.0-1.0]" },
        prnu: { type: Type.NUMBER, description: "PRNU/Sensor: Hardware noise fingerprint vs synthetic [0.0-1.0]" }
      },
      required: ["pixel", "bio", "physics", "prnu"]
    }
  },
  required: ["mediaType", "aiProbability", "confidence", "verdict", "aiGeneratedParts", "humanMadeParts", "reasoning", "conclusion", "branchScores"]
};

const SYSTEM_INSTRUCTION = `You are the FusionNet V5.0 Multi-Modal Forensic Engine.
Analyze content using 4 parallel feature extractors and a weighted fusion head.

SIGNAL DETECTION MATRIX:

1. IMAGE (ConvNext + Residuals):
   - PRNU: Extract hardware sensor noise. AI has synthetic residuals.
   - FFT: Identify log-frequency imbalances (AI fails at high-frequency reconstruction).
   - Entropy: Patch-based standard deviation check. AI texture is over-regular.

2. VIDEO (Temporal LSTM + Optical Flow):
   - Frame-to-frame noise inconsistency.
   - Optical flow smoothness: AI motion is often too stable or exhibits 'joint drift'.
   - Temporal PRNU breaks at cut points.

3. VOICE (CNN-GRU + Phase):
   - Phase coherence: TTS artifacts often show phase misalignment.
   - Micro-jitter: Human vocal folds have noisy micro-jitter; AI is too smooth.
   - Breath Entropy: AI models often synthesize perfect breath patterns without organic entropy.

4. MUSIC/AUDIO (Transformer + Harmonics):
   - Harmonic over-regularity: AI music displays mathematical spectral perfection.
   - Frequency Entropy: Organic audio has complex spectral decay.

FUSION WEIGHTING:
Final Score = (0.35 * Image/Pixel) + (0.30 * Video/Bio) + (0.20 * Voice/Physics) + (0.15 * Sensor/PRNU)

CALIBRATED VERDICT LOGIC:
- Score < 30%: "Likely Real"
- 30% <= Score <= 70%: "Uncertain"
- Score > 70%: "Likely AI Generated"

RAG_EXPLAINER: Conclude AI generation ONLY if at least TWO signals confirm it. 
Always reference technical terms: PRNU, FFT, EAR, Optical Flow, Phase Coherence. Output strictly JSON.`;

export const analyzeContent = async (
  prompt: string, 
  fileData?: { mimeType: string; data: string }
): Promise<AnalysisResult> => {
  try {
    // ALWAYS instantiate fresh to pick up API Key changes from window.aistudio
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-preview';
    const parts: any[] = [];
    
    if (fileData) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.data
        }
      });
    }

    parts.push({
      text: prompt || "Initialize FusionNet V5.0 Analysis. Run Multi-Signal Extraction (PRNU, FFT, Entropy). Calibrate via ROC-best threshold."
    });

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        temperature: 0.15, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("Forensic pipeline failed to resolve signal.");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error: any) {
    console.error("FusionNet Kernel Panic:", error);
    
    // Improved error message extraction
    let message = error.message || "Unknown Forensic failure";
    if (error.response?.error?.message) {
      message = error.response.error.message;
    } else if (typeof error.message === 'string') {
      // If error.message itself is a stringified JSON, try to parse it
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error?.message) {
          message = parsed.error.message;
        }
      } catch (e) {
        // Not a JSON string, use original message
      }
    }
    
    throw new Error(message);
  }
};