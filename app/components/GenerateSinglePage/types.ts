export interface ImageGenerationSettings {
  facePreservation: 'high' | 'medium' | 'low';
  creativityLevel: 'conservative' | 'balanced' | 'creative';
}

export interface ImageUploadState {
  originalImage: string | null;
  originalImageFile: File | null;
  uploadedImageUrl: string | null;
  isDragging: boolean;
  isValidatingImage: boolean;
}

export interface GenerationState {
  isGenerating: boolean;
  generatedImage: string | null;
  streamingContent: string;
}

export interface PreviewState {
  previewImage: string | null;
  previewTitle: string;
}
