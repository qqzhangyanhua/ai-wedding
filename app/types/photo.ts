import type { QualityResult } from '@/types/image';

export interface PhotoWithQuality {
  dataUrl: string;
  minioUrl?: string;
  quality?: QualityResult;
}

export interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  minPhotos?: number;
}

export interface SortablePhotoProps {
  id: string;
  index: number;
  photo: PhotoWithQuality;
  onRemove: (index: number) => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (index: number) => void;
}
