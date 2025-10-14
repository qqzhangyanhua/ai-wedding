import { useState, useCallback } from 'react';
import { PhotoWithQuality } from '@/types/photo';

export function usePhotoSelection() {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelection = useCallback((index: number) => {
    setSelectedIndices(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        newSelection.add(index);
      }
      return newSelection;
    });
  }, []);

  const selectAll = useCallback((totalCount: number) => {
    setSelectedIndices(new Set(Array.from({ length: totalCount }, (_, i) => i)));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  const deleteSelected = useCallback(
    (photos: PhotoWithQuality[], onUpdate: (updated: PhotoWithQuality[]) => void) => {
      const updated = photos.filter((_, i) => !selectedIndices.has(i));
      onUpdate(updated);
      setSelectedIndices(new Set());
      setIsSelectionMode(false);
    },
    [selectedIndices]
  );

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIndices(new Set());
  }, []);

  return {
    selectedIndices,
    isSelectionMode,
    setIsSelectionMode,
    toggleSelection,
    selectAll,
    deselectAll,
    deleteSelected,
    exitSelectionMode,
  };
}
