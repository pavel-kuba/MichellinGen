export enum ModelType {
  NANO_BANANA = 'NANO_BANANA',
  NANO_BANANA_PRO = 'NANO_BANANA_PRO',
}

export interface GenerationResult {
  id: string; // Add ID for list rendering
  type: ModelType;
  status: 'idle' | 'loading' | 'success' | 'error';
  imageUrl?: string;
  error?: string;
  label: string;
  modelName: string;
  description: string;
  
  // Step-by-step guide fields
  guideStatus?: 'idle' | 'loading' | 'success' | 'error';
  guideUrl?: string; // The 2x2 grid image
  guideError?: string;
}

export interface UploadedFile {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  inputImage: string; // Preview URL
  nanoResults: GenerationResult[];
  proResults: GenerationResult[];
}